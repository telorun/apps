#!/usr/bin/env node
// Push every app, and every library an app imports, to the destination the
// release model gives it: `oci://ghcr.io/telorun/apps/<directory name>`, and
// beneath an app's own ref for a module nested inside it.
//
// SEPARATE FROM VERSIONING, deliberately. `telo release` owns module identity,
// ordering, destinations and drift; this only decides what to push and pushes it.
// A second implementation of the release planner here would drift from it
// silently.
//
// A module is pushed when EITHER gate fires:
//   (a) its own metadata.version moved in HEAD^..HEAD — the normal release path, a
//       local git check needing no registry round-trip; and
//   (b) its current metadata.version is not yet published at its OCI repo — a
//       per-version presence check that catches a newly added app whose version
//       was seeded outside this commit, and re-tries any version a prior run failed
//       to push. An unchanged, already-published version is never re-pushed, so an
//       ordinary main push (typo fix, docs edit) republishes nothing.
//
// Both gates are idempotent, which is what makes this safe on every push to main
// rather than only on a release commit: a failed push heals on the next one.
//
// Usage: node scripts/publish-apps.mjs [--dry-run]
//   --dry-run          run both gates and `telo publish --dry-run` for what they
//                      queue; pushes nothing and needs no switch.
// Env:
//   TELO_OCI_REGISTRY  the SWITCH, not the destination: unset skips the pass, so a
//                      fork or a local run never pushes off ambient Docker
//                      credentials. Destinations come from `telo release order`,
//                      which reads `release.registry` in telo-workspace.yaml.
//   TELO_BIN           telo CLI binary (default: `telo` on PATH)

import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TELO = process.env.TELO_BIN ?? "telo";

// stderr is piped, not inherited, so a caller reporting a failure has the child's
// own words rather than "Command failed".
function capture(bin, args) {
  return execFileSync(bin, args, { encoding: "utf8", cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function firstLine(err) {
  const text = `${err?.stderr ?? ""}`.trim() || (err instanceof Error ? err.message : String(err));
  return text.split("\n")[0];
}

// metadata.version of the first YAML document, read from the file's content at a git
// ref. Scoped to everything before the first `---` and to the `metadata:` block so a
// nested field named `version` can't match. Null when the file is absent at that ref
// (a newly added app) or declares no metadata.version.
function manifestVersionAt(ref, yamlPath) {
  let content;
  try {
    content = capture("git", ["show", `${ref}:${yamlPath}`]);
  } catch {
    return null;
  }
  const docEnd = content.search(/^---\s*$/m);
  const firstDoc = docEnd === -1 ? content : content.slice(0, docEnd);
  const metaMatch = firstDoc.match(/^metadata:\s*\n((?:[ \t]+.*\n?)+)/m);
  if (!metaMatch) return null;
  const versionMatch = metaMatch[1].match(/^[ \t]+version:[ \t]*["']?(\d+\.\d+\.\d+)["']?[ \t]*$/m);
  return versionMatch ? versionMatch[1] : null;
}

// Versions already published at an OCI repo. A repo that does not exist yet lists as
// `[]` (exit 0); "not found" (some transports, exit 1) is likewise a real "no
// versions". Any other failure throws, so a flaky or auth-broken query fails loudly
// instead of silently reading as "already published".
function ociVersions(destination) {
  let out;
  try {
    out = capture(TELO, ["module", "versions", destination, "--json"]);
  } catch (err) {
    const text = `${err.stderr ?? ""}${err.stdout ?? ""}${err.message ?? ""}`;
    if (/not found/i.test(text)) return [];
    throw err;
  }
  const parsed = JSON.parse(out);
  if (!Array.isArray(parsed)) {
    throw new Error(`unexpected 'module versions' output for ${destination}: ${out}`);
  }
  return parsed;
}

const dryRun = process.argv.includes("--dry-run");
if (!dryRun && !process.env.TELO_OCI_REGISTRY) {
  console.log("TELO_OCI_REGISTRY unset — skipping the publish pass.");
  process.exit(0);
}

// The set, the order and each destination come from the release model, so the
// import graph is never re-derived here: a dependency is listed before its
// dependents, which is what a relative import needs to resolve at the destination.
let plan;
try {
  plan = JSON.parse(capture(TELO, ["release", "order", "-o", "json"]));
} catch (err) {
  // A refused plan exits non-zero with its reason on stderr and `{ ok: false }` on
  // stdout; the reason is what is worth printing.
  console.error("`telo release order` produced no plan — nothing was pushed:");
  console.error(`  ${`${err.stderr ?? ""}`.trim() || (err instanceof Error ? err.message : String(err))}`);
  process.exit(1);
}
if (!plan.ok) {
  console.error("`telo release order` produced no plan — nothing was pushed:");
  for (const d of plan.diagnostics ?? []) console.error(`  ${d.code}  ${d.message}`);
  process.exit(1);
}
const modules = plan.order.map((entry) => ({
  key: entry.key,
  manifest: `${entry.key}/telo.yaml`,
  destination: entry.destination,
  imports: entry.imports ?? [],
}));

const queued = new Set();

// (a) version-moved gate.
let changed = new Set();
try {
  changed = new Set(capture("git", ["diff", "--name-only", "HEAD^", "HEAD"]).split("\n").filter(Boolean));
} catch {
  console.log("No prior commit to diff against — version-move gate skipped (presence gate still runs).");
}
for (const m of modules) {
  if (!changed.has(m.manifest)) continue;
  const before = manifestVersionAt("HEAD^", m.manifest);
  const after = manifestVersionAt("HEAD", m.manifest);
  if (!after) {
    console.log(`  skip ${m.manifest}: no metadata.version`);
    continue;
  }
  if (before === after) {
    console.log(`  skip ${m.manifest}: metadata.version unchanged (${after}) — presence gate still applies`);
    continue;
  }
  queued.add(m.key);
}

// Presence checks that could not ANSWER — a broken credential, an unreachable
// registry. Distinct from "no versions published", which is a real answer.
const unanswered = [];

// (b) version-absent gate, over every module not already queued by (a).
for (const m of modules) {
  if (queued.has(m.key)) continue;
  const version = manifestVersionAt("HEAD", m.manifest);
  if (!version) continue;
  let published;
  try {
    published = ociVersions(m.destination);
  } catch (err) {
    // NOT skipped silently. A check that could not answer must never read as
    // "already published" — this job is the only publish path, so swallowing it
    // stops apps publishing indefinitely behind green CI.
    unanswered.push(`${m.key}: ${firstLine(err)}`);
    continue;
  }
  if (!published.includes(version)) {
    console.log(`  queue ${m.key}: ${version} not yet published (have: ${published.join(", ") || "none"})`);
    queued.add(m.key);
  }
}

if (unanswered.length > 0) {
  console.error(
    `\n${unanswered.length} module${unanswered.length === 1 ? "" : "s"} could not be checked ` +
      "against the registry — their publish state is UNKNOWN, not up to date:",
  );
  for (const line of unanswered) console.error(`  ${line}`);
}

// `modules` is already in dependency order, so filtering preserves it.
const publishOrder = modules.filter((m) => queued.has(m.key));
if (publishOrder.length === 0) {
  if (unanswered.length > 0) {
    console.error("\nNothing was queued, but the registry could not be reached. Failing.");
    process.exit(1);
  }
  console.log("Every app is already published at its current version — nothing to push.");
  process.exit(0);
}

console.log(`\n${dryRun ? "Would push" : "Pushing"} ${publishOrder.length} module(s):`);
for (const m of publishOrder) console.log(`  ${m.key} → ${m.destination}`);
console.log("");

// Stage the `sources:` of what this pass reads before any push: the queued modules
// and every in-repo module they import, transitively. Publish reads staged files
// off disk and never fetches one itself. A module declaring no sources stages
// nothing. A staging failure fails the job before anything is pushed.
const importsOf = new Map(modules.map((m) => [m.key, m.imports]));
const closure = new Set();
const pending = publishOrder.map((m) => m.key);
while (pending.length > 0) {
  const key = pending.pop();
  if (closure.has(key)) continue;
  closure.add(key);
  pending.push(...(importsOf.get(key) ?? []));
}
try {
  execFileSync(TELO, ["release", "stage", ...[...closure].flatMap((key) => ["--module", key])], {
    stdio: "inherit",
    cwd: ROOT,
  });
} catch (err) {
  console.error(`\nStaging the workspace's sources failed — nothing was pushed. ${firstLine(err)}`);
  process.exit(1);
}

// Failures are collected rather than thrown so one module can't abort the rest; a
// failed push leaves its version absent from the registry, so gate (b) retries it.
// A dependent of a module that failed is still attempted: publish refuses it when
// its import does not resolve at the destination, and says so.
const failures = [];
for (const m of publishOrder) {
  try {
    execFileSync(TELO, ["publish", ...(dryRun ? ["--dry-run"] : []), m.destination, join(ROOT, m.manifest)], {
      stdio: "inherit",
      cwd: ROOT,
    });
  } catch (err) {
    failures.push({ key: m.key, destination: m.destination, message: firstLine(err) });
    console.error(`\n  push failed for ${m.key} — continuing with the remaining modules.`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} push(es) failed:`);
  for (const f of failures) {
    console.error(`  ${f.key} → ${f.destination}`);
    if (f.message) console.error(`    ${f.message}`);
  }
  process.exit(1);
}

// A successful push pass does not clear an unanswered presence check: the modules
// it could not reach were never evaluated, so their state is still unknown.
if (unanswered.length > 0) {
  console.error(
    `\nPushed what could be evaluated, but ${unanswered.length} presence check(s) never ` +
      "answered — see above. Failing so this does not read as a clean run.",
  );
  process.exit(1);
}
