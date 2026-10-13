---
name: new-library
description: Start a new Telo library in this repo — a business domain's data, operations, types or wire contract, to be imported and composed. Settles what it exports and what it requires from its importer, finds the published kinds it is composed from, and writes the manifest, README, tests and test suite only after explicit approval.
argument-hint: What the library is for (optional)
---

Start a new library with the user. Write nothing until the user explicitly approves the proposal of Step 3.

A new library is delivered whole: a manifest that imports as obtained, its contract, its README, its tests. Not a skeleton to fill in later.

## Step 1 — Know what the library is

A bare invocation or a one-word topic is not enough. Ask which domain it belongs to, what an importer does with it, and which applications — here or elsewhere — will import it. Do not scan anything before you have a workable description.

Say so and stop when the description is really one of these:

- **A technical capability** — a transport, a codec, a store, a scheduler, anything a module outside the domain would want for a reason that has nothing to do with the domain. That is a standard-library module in `../telo`.
- **A connector to an external service.** That is a library in `../integrations`.
- **Something to run, not import.** That is `/new-app`.
- **A change to a library that already exists here.** That is `/plan`.

## Step 2 — Find what it is composed from (silent)

- Read `CLAUDE.md`, then the library in this repo nearest to the one asked for, for the conventions in use.
- Find every kind the library needs through the Telo hub — `telo search "<phrase>"` or the hub's `search_resources`, unfiltered first — and read each module's manifest (`telo module manifest <ref>` or `get_module_manifest`). Its `Telo.Definition` schemas are the exact field shapes; never infer a field from a kind's name.
- Record each module's exact published version. The import pin is written by `telo upgrade <file>`, never by hand.
- **A capability nothing published provides is not built here.** Name it — what kind is missing, and whether it belongs to the standard library (`../telo`) or to a connector (`../integrations`) — and tell the user the library waits on it. Never reach for `JS.Script`.

## Step 3 — Propose, in the conversation

State the library as someone importing it will meet it. No YAML, no file paths.

- **Name** — the domain it belongs to (an existing one, or a new directory at the repo root), the member directory inside it (kebab-case, named for its role, never repeating the domain) and `metadata.name` (PascalCase: the domain followed by the role).
- **Listing** — the `description` (one paragraph, the problem it solves, the words a searcher would type), `categories`, `license`.
- **Inputs** — every `variables` and `secrets` entry with its type and one line on what it means, and every `resources` entry with the kind it must be. Say what the importer keeps ownership of: a library borrows the resources it is handed and reads no environment.
- **Exports** — every exported kind and every exported instance: what it does, its inputs, its outputs, the codes it throws. Say what is deliberately not exported.
- **Data** — what is persisted, in which of the importer's resources, and whether anything is ever deleted.
- **Lifecycle** — one instance per import, or one shared by the whole application, and why.
- **Composition** — the published modules and sibling libraries it imports, each with its version, and anything from Step 2 that is missing.
- **Verify** — the behaviours the tests will prove, one line each.

Every choice between shapes is put to the user with a recommendation; none is made alone. End with "Apply this?" and wait for an explicit yes. A correction is folded in and the full proposal shown again.

## Step 4 — Write

In the library's own directory inside its domain (`<domain>/<member>/`):

- `telo.yaml` — the `Telo.Library`, following every manifest rule in `CLAUDE.md`. `metadata.repository` is `https://github.com/telorun/solutions` and `metadata.license` is `MIT`. Every exported kind carries a description of its own.
- `README.md` — what the library is for, how to import it with every input an importer supplies, every export with its inputs, outputs and codes, what it persists, how to run its tests.
- `tests/*.yaml` — one application per subject area, importing the library by relative path, declaring the resources it requires and invoking its exports; each with its own scratch files; fixtures under `tests/__fixtures__/`.
- `test-suite.yaml` — the suite that discovers `tests/*.yaml` and excludes `**/__fixtures__/**`.
- `.gitignore` — whatever the tests write.

Pin every import from outside this repo with `telo upgrade`; a sibling member is imported by relative path.

When the domain is new, add its entry to `telo-workspace.yaml`: its path and the registry base beneath it. A new library needs no release fragment: its first version is published because it is not yet at the registry.

## Step 5 — Verify, then report

Run each and read its output:

1. `telo check` on every manifest written.
2. The library's test suite.
3. **Imports as obtained** — the tests supply nothing the manifest does not declare as an input, and an import with a required input missing is refused naming that input (`Assert.Manifest` over a fixture).
4. **Publishes** — `telo release check`, then `node scripts/publish-modules.mjs --dry-run`: the library and every sibling it imports are queued for the ref expected (`oci://ghcr.io/telorun/solutions/<domain>/<member>`), and each passes. Nothing is pushed.

Report what was written, the commands with their real results, and anything not verified — said as not verified. A failure is reported as a failure, with its output.
