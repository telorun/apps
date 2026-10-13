---
name: listing-review
description: Read-only check of whether one application or library is ready to be published and listed in the marketplace — that it runs or imports as obtained, and that its manifest, contract and README say exactly what it does and needs.
argument-hint: Member directory (<domain>/<member>) or name
---

Do NOT modify any files. This is a read-only review of one app as someone who finds it in the marketplace will meet it: they have the published artifact, its listing, and nothing else.

The user supplies an application or library as `$ARGUMENTS`. If it is empty, or names a domain without saying which member, ask before proceeding. Review every directory the member cannot run without — the sibling libraries it imports, its web UI. Where a check below speaks of an app and the subject is a library, read it for the library: its inputs are its `variables`, `secrets` and `resources` (none binds `env:`), and its surface is what it exports.

Read `CLAUDE.md` first. Run `telo check` on each manifest, the app's test suite, `telo release check` and the publish dry run, and quote what they print; running them is not modifying anything.

## What to check

**1. Runs as obtained — blocking.**

- Every import is a pinned published ref (`oci://…@VERSION#sha256-…`) or a relative path to a library inside this repo. A path that leaves the repo is a finding, in the app, its libraries, its tests and its suite.
- Every module imported from outside is actually published at the version named.
- Every file the app reads either ships with it (`!module-path`, `!include-text`, `!include-bytes`) or is a declared `Telo.HostPath` input the operator supplies. An input whose only possible value is something built from this repo — a UI build directory, a fixture — is a finding: the artifact must carry it.
- No default assumes the working directory is this repo's root.
- No controller, script or UI reads an environment variable the manifest does not declare.
- `requires:` names a floor when the manifest uses syntax an older telo refuses, and nothing newer than what is released.
- `telo release check` is clean, and `node scripts/publish-modules.mjs --dry-run` queues the member and every sibling it imports for the ref expected (`oci://ghcr.io/telorun/solutions/<domain>/<member>`) and passes each. Neither pushes anything.

**2. The listing.**

- `metadata.description` — says what the app does in terms of the problem it solves, in the words a searcher would type; one paragraph of roughly 40–60 words; no kind or module names, no design history; states the trust model when the app has no authentication of its own.
- `metadata.categories`, `license`, `version` and `repository` are present; `license` is `MIT` and `repository` names this repo.
- `metadata.name` is PascalCase and says what the member is: the domain followed by its role.
- A library exports only what an importer is meant to use, and each exported kind carries a description of its own.

**3. The contract.**

- Every `variables`, `secrets` and `ports` entry binds `env:`, has a `type:` and a `description:`, and a `default:` wherever one can be right. An entry bound by `arg:` alone has a default.
- A credential is a `secrets:` entry, never a variable, and has no default.
- Every input is read by something; nothing the app needs is hardcoded where an operator would have to change it — a host, a port, a path, a URL.
- A missing or malformed input is refused at boot with its name.
- A library: every `variables`, `secrets` and `resources` entry has a `description:` and a `type:` or `kind:`; every exported operation declares its `inputType`, `outputType` and the codes it throws.

**4. The README.**

- It states what the app is, how to run it, its trust model, its surface and how to run its tests.
- Its environment table and the manifest agree entry for entry: names, defaults, meanings. A library's README lists every input an importer supplies and every export, and agrees with the manifest the same way.
- Its routes, bodies, error codes and statuses are the ones the manifest declares.
- Its commands work for someone without a checkout. A command that only runs from this repo belongs under development, not under running.

**5. Tests.**

- The suite exists and passes on a clean checkout with nothing running.
- Each test has its own port and its own scratch files.

**6. Security.**

- No secret reaches a log, a response body or a default.
- Inbound bodies and queries are validated against a closed schema.
- What the README says a caller cannot do is something the manifest actually refuses.

## Report

Lead with the verdict: `ready`, `ready with non-blocking findings`, or `not ready`. Any finding under *Runs as obtained* makes it `not ready`.

Then the findings, most severe first. Each: the file and lines, what is wrong in one sentence, what someone who obtained the app would hit, and the fix. Group findings that share one cause — forty imports of the same kind are one finding with a count.

Say what you ran and what it printed, and separate what you verified from what you inferred. Do not list what is sound.
