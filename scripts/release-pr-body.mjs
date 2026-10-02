#!/usr/bin/env node
// Renders the Version PR's body from a release plan.
//
// WHY THE BODY IS GENERATED RATHER THAN STATIC. Merging this PR publishes every
// app it lists. A body that says "versions moved" describes the mechanism and
// hides the decision; what a reviewer needs is every app that will publish, the
// version it moves to, and the changelog entries that will ship with it. All of
// that is already in the plan, so restating it here costs nothing and leaves
// nothing to be taken on trust.
//
// The plan MUST be captured before `telo release apply`, which consumes the
// fragments the entries come from.
//
// Usage: node scripts/release-pr-body.mjs <plan.json> [> body.md]

import { readFileSync } from "node:fs";

const KIND_ORDER = ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"];

/** GitHub rejects a PR body over 65536 characters, and the whole point of this
 *  body is that merging publishes what it lists — a request that 422s leaves the
 *  release PR with no body at all. The headroom is for the trailer
 *  `create-pull-request` appends. */
const MAX_BODY = 60_000;

/** Longest a single changelog entry may run before it is cut. Applied only when
 *  the full body does not fit. */
const MAX_ENTRY = 600;

function bulletsFor(entries, entryLimit) {
  const lines = [];
  for (const kind of KIND_ORDER) {
    for (const entry of entries.filter((e) => e.kind === kind)) {
      // One line per entry: a body spanning several lines breaks the list, and
      // these are changelog sentences rather than prose blocks.
      const text = entry.body.replace(/\s+/g, " ").trim();
      const shown =
        entryLimit && text.length > entryLimit
          ? `${text.slice(0, entryLimit).trimEnd()}… _(trimmed — full text in the app's CHANGELOG)_`
          : text;
      lines.push(`  - **${kind}** — ${shown}`);
    }
  }
  return lines;
}

function build(plan, entryLimit) {
  const modules = plan.modules ?? [];
  const declared = modules.filter((m) => (m.entries ?? []).length > 0);
  const inferred = modules.filter((m) => (m.entries ?? []).length === 0);

  const out = [
    `Merging this publishes **${modules.length} artifact${modules.length === 1 ? "" : "s"}** to ` +
      "`oci://ghcr.io/telorun/apps` — " +
      `${declared.length} with a declared change, ${inferred.length} whose payload moved underneath ` +
      "them. Versions, changelogs and `.changes/ledger.yaml` were written by `telo release apply`.",
    "",
  ];

  if (declared.length > 0) {
    out.push("## Declared changes", "");
    for (const module of declared) {
      out.push(`**\`${module.key}\`** &nbsp; ${module.from} → ${module.to} _(${module.level})_`);
      out.push(...bulletsFor(module.entries, entryLimit));
      out.push("");
    }
  }

  if (inferred.length > 0) {
    out.push(
      "## Republished with no declared change",
      "",
      "Their payload moved without anyone describing a change — a library they import was " +
        "released, or a pin moved. A patch each; listed so a republish is never silent.",
      "",
      "| Artifact | Version | Why |",
      "| --- | --- | --- |",
    );
    for (const module of inferred) {
      const why = [...new Set(module.reasons ?? [])].filter((r) => r !== "unattributed");
      out.push(`| \`${module.key}\` | ${module.from} → ${module.to} | ${why.join(", ") || "payload changed"} |`);
    }
    out.push("");
  }

  const diagnostics = plan.diagnostics ?? [];
  if (diagnostics.length > 0) {
    out.push("## Diagnostics", "");
    for (const d of diagnostics) out.push(`- ${typeof d === "string" ? d : JSON.stringify(d)}`);
    out.push("");
  }

  return out.join("\n");
}

// Degrade in stated stages rather than truncating mid-sentence: full entries, then
// trimmed ones, then a cut on a line boundary that says it was cut.
function render(plan) {
  if ((plan.modules ?? []).length === 0) {
    return "No version moved — every app matches the ledger.\n";
  }
  for (const entryLimit of [0, MAX_ENTRY, 200]) {
    const body = build(plan, entryLimit);
    if (body.length <= MAX_BODY) return body;
  }
  const body = build(plan, 200);
  const notice =
    "\n\n> **Trimmed to fit GitHub's body limit.** The rest is in `.changes/ledger.yaml` and " +
    "each app's CHANGELOG in this PR's diff.\n";
  const room = MAX_BODY - notice.length;
  const cut = body.slice(0, room);
  const lastBreak = cut.lastIndexOf("\n");
  return (lastBreak > room / 2 ? cut.slice(0, lastBreak) : cut).trimEnd() + notice;
}

const path = process.argv[2];
if (!path) {
  process.stderr.write("usage: release-pr-body.mjs <plan.json>\n");
  process.exit(2);
}
process.stdout.write(render(JSON.parse(readFileSync(path, "utf8"))));
