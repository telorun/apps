---
name: new-app
description: Start a new ready-made Telo application in this repo. Settles what the app does and its contract with the user, finds the published kinds it is composed from, and writes the manifest, README, tests and test suite only after explicit approval.
argument-hint: What the app does (optional)
---

Start a new app with the user. Write nothing until the user explicitly approves the proposal of Step 3.

A new app is delivered whole: a manifest that runs as obtained, its contract, its README, its tests. Not a skeleton to fill in later.

## Step 1 — Know what the app is

A bare invocation or a one-word topic is not enough. Ask what the app does, who runs it, who calls it, and what problem it solves. Do not scan anything before you have a workable description.

When the description is really a feature of an app that already exists here, say so and stop — that is `/plan`, not a new app. When it is something to import and compose instead of something to run, that is `/new-library`.

## Step 2 — Find what it is composed from (silent)

- Read `CLAUDE.md`, then the app in this repo nearest to the one asked for, for the conventions in use.
- Find every kind the app needs through the Telo hub — `telo search "<phrase>"` or the hub's `search_resources`, unfiltered first — and read each module's manifest (`telo module manifest <ref>` or `get_module_manifest`). Its `Telo.Definition` schemas are the exact field shapes; never infer a field from a kind's name.
- Record each module's exact published version. The import pin is written by `telo upgrade <file>`, never by hand.
- **A capability nothing published provides is not built here.** Name it — what kind is missing, and whether it belongs to the standard library (`../telo`) or to a connector (`../integrations`) — and tell the user the app waits on it. Never reach for `JS.Script`, and never write an app-local stand-in for something a second app would want.

## Step 3 — Propose, in the conversation

State the app as someone running it will meet it. No YAML, no file paths.

- **Name** — the domain it belongs to (an existing one, or a new directory at the repo root), the member directory inside it (kebab-case, named for its role, never repeating the domain) and `metadata.name` (PascalCase: the domain followed by the role). When the app is several artifacts — a server, a second application working with it, a library holding the domain's data and operations, a library pinning the contract between two applications, a web UI — name each and say why it is its own member.
- **Listing** — the `description` (one paragraph, the problem it solves, the words a searcher would type), `categories`, `license`.
- **Contract** — every `variables`, `secrets` and `ports` entry: its env var, type, default, and one line on what it means. Say which have no default and why none can be right.
- **Surface** — routes with their bodies and answers, error codes with their statuses, commands, files it writes.
- **Data** — what is persisted, where, and whether anything is ever deleted.
- **Trust model** — who may reach it, what is authenticated and what is not.
- **Composition** — the published modules it imports, each with its version, and anything from Step 2 that is missing.
- **Verify** — the behaviours the tests will prove, one line each.

Every choice between shapes is put to the user with a recommendation; none is made alone. End with "Apply this?" and wait for an explicit yes. A correction is folded in and the full proposal shown again.

## Step 4 — Write

In the app's own directory inside its domain (`<domain>/<member>/`):

- `telo.yaml` — the `Telo.Application`, following every manifest rule in `CLAUDE.md`. `metadata.repository` is `https://github.com/telorun/solutions` and `metadata.license` is `MIT`.
- `README.md` — what the app is, how to run it with a table of every environment variable, its trust model, its surface, how to run its tests.
- `tests/*.yaml` — one application per subject area, each with its own port and scratch files; fixtures under `tests/__fixtures__/`.
- `test-suite.yaml` — the suite that discovers `tests/*.yaml` and excludes `**/__fixtures__/**`.
- `.gitignore` — whatever the tests write.

Pin every import with `telo upgrade`.

What a second application of the domain would need — its tables, its operations, its shared types — goes into a sibling library the app imports by relative path, not into the app's manifest. When the domain is new, add its entry to `telo-workspace.yaml`: its path and the registry base beneath it. A new app needs no release fragment: its first version is published because it is not yet at the registry.

## Step 5 — Verify, then report

Run each and read its output:

1. `telo check` on every manifest written.
2. The app's test suite.
3. **Runs as obtained** — start the app from a directory outside this repo, supplying only inputs its manifest declares, and exercise its surface once. Then start it with a required input missing and confirm the refusal names that input.
4. **Publishes** — `telo release check`, then `node scripts/publish-modules.mjs --dry-run`: the app and every sibling it imports are queued for the ref expected, and each passes. Nothing is pushed.

Report what was written, the commands with their real results, and anything not verified — said as not verified. A failure is reported as a failure, with its output.
