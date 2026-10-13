# Claude

Use `telo check ./<domain>/<member>/telo.yaml` to validate a manifest and `telo run ./<domain>/<member>/telo.yaml` to run an application.
Use `telo ./<domain>/<member>/test-suite.yaml` to run a member's tests — each application and library carries its own suite, which discovers its `tests/*.yaml`. Run every command from the repo root.
Tests live in the member they test: `<domain>/<member>/tests/*.yaml`.
Test fixtures go in `__fixtures__/` subdirectories (excluded from test discovery).
Prefer `Assert.Equals` (deep-equals `actual` against an `expected` literal) for asserting outputs in manifest tests — not `Assert.Schema`. It reads as a plain expected value and compares the whole result at once.
Implementation plans should live in the member they affect the most, eg. `<domain>/<member>/plans/some-plan.md`.
Plans MUST NOT have any open decisions, all open decisions must be resolved before plan is written.
**Never cite a plan path from this file.** A plan is deleted the moment its work ships, so a path here becomes a dangling reference nothing catches — and a plan is a record of how a decision was reached, which is exactly what this file must not depend on. State the decision itself instead.

Follow this strictly:

- **Do not create, edit, or delete any file until the user's latest message clearly authorizes the specific change you are about to make.** Authorization is a direct instruction to act now — to write, change, or remove something concrete. It is NOT: a question ("would X work?", "is this better?"), a critique or correction of a proposal, a request to compare or weigh options, or general discussion — none of these grant permission, no matter how positive. Agreeing that an idea is good is not the same as asking for it to be done. When the intent for you to act *now* is anything less than unambiguous, stay in proposal mode and ask: "Apply this?" This gate overrides Auto Mode and any "execute immediately" directive.
- **NEVER run `git commit`, `git commit --amend`, `git push`, or any other command that creates, rewrites, or publishes a commit — not even to make a check pass or "fix" state.** No session ever merges a pull request.
- never add underscores to unused function arguments
- never look at commit history
- never use git stash
- never fix linting problems, and never mention it
- keep code comments very concise and add them only when necessary; prefer self-documenting manifests and the member's README
- if you cannot implement a feature in a way it was established or planned to be implemented, propose a new approach and ask for approval before implementing it
- never implement logic that swallows errors
- telo manifests MUST be type safe
- in telo manifests, CEL is ALWAYS written behind a tag: a computed value of any type with `!cel "..."`, text with values embedded in it with `!interpolate "http://localhost:${{ ports.http }}"`. A plain string holding `${{` is never a value — it is the deprecated untagged spelling, which `telo migrate` rewrites and which is refused wherever it survives.
- in telo manifests, declare a resource INLINE at its use site when it is used exactly once — `invoke: { kind: Some.Kind, ...config }`, with no `metadata.name`. Give a resource its own top-level document only when something needs to name it: it is referenced more than once, listed in `targets:`, or exported. The exception is a router (`Http.Api`) mounted on a server — keep it named, because that is what makes it independently testable.
- `JS.Script` is **deprecated**. Do not write a new one, and do not propose one. Value shaping, branching and iteration are the `run` module's step grammar with CEL; reaching an API nothing exposes is what a new resource kind is for — and that kind is built in `../telo` or `../integrations`, not here.
- never use `cat` nor `sed` to read files — read them directly
- never use `AskUserQuestion` tool, ask questions directly
- never do major upgrades of modules nor packages
- never modify files in `dist` directories
- never make architectural decisions alone (domain, app and library boundaries, dependency direction, where code lives), propose best fit and ask to choose from options
- UI primitives must use Radix (`radix-ui` package, wrapped as shadcn components under `src/components/ui/*`); if a needed component isn't wrapped yet, install it via shadcn before rolling your own
- Icons must come from `lucide-react`. No inline `<svg>` paths.
- When working on a plan, when a decision is made then remove the decision section entirely, not just mark it as decided. The plan should reflect the current state of the world, not a history of how we got here.
- never add frontmatter or rendering-tool annotations to a `README.md`; it is plain Markdown
- keep your communication very concise and to the point; avoid unnecessary preambles, or apologies. Focus on the task at hand and the specific changes being made. If you need to explain a complex decision, do so.
- Avoid putting code into generic `utils.ts`, `types.ts`, `helpers.ts` files. Drive the filename from the specific domain or feature it serves.

## Communicating — plans, reviews, and every answer

Everything written for the user — a plan, a review, a chat reply, a commit body — is read by someone deciding whether the work is RIGHT, not by someone looking up where to type. Every rule below follows from that one sentence.

- **No code, unless the code IS the answer.** Not a snippet, not a signature, not a diff, to illustrate a change. A change that cannot be stated as behaviour is not understood well enough to describe. (Answering "what does this resource do" or showing a one-line command a user must type is the exception; illustrating a design is never one.)
- **No source paths, no resource names, no line links** in a plan or a design discussion. Where a document lives and what a resource is called are not decisions — they are lookups, they cost a line each, and they are wrong the moment a file moves. A bug report is the exception: there, the location is the finding.
- **But name every OBSERVABLE artifact exactly.** Env vars, the `variables` / `secrets` / `ports` keys that bind them, HTTP routes and their wire fields, error codes, diagnostic codes, on-disk files an app writes, the kinds and instances a library exports, CLI commands. These ARE the behaviour: they are what someone running the app or importing the library sees, what an upgrade breaks, and what a reviewer checks the implementation against.
- **Before / After / Verify.** What happens today, what should happen instead, and how you would know it worked. A claim with no verify is a wish.
- **State a constraint once.** One sentence for why the losing option loses, only where a reader would otherwise re-propose it. Never restate the same rationale in the summary, the body and the conclusion. A "not in scope" section is usually a list of things that are not tasks — cut it unless its absence reads as an oversight.
- **Lead with the finding.** The answer, the verdict, the number — then the reasoning, once. Never narrate what you are about to do, never re-explain a decision the user has already made, and never open with a summary of the question.
- **Separate what you verified from what you believe.** Say which you did. When something is unverified, say so in the same breath as the claim rather than in a caveat at the end.
- **Report a failure as a failure**, with the output and the reason, in the same message that reports the rest.
- **Answer a review point by point, and concede plainly.** Say which points are valid, fix those, and give the measurement for any you decline. "You're right" is a whole sentence; do not pad it, and do not defend a decision the evidence has just overturned.
- Always prefer answering over editing.

## What this is

Business domains built on Telo by the Telo team, each delivered as libraries (`kind: Telo.Library`) to compose into an application and as ready-made applications (`kind: Telo.Application`) to run as they are. Each is published as an artifact with `telo publish` and listed in the Telo marketplace, which hosts nothing: a listing is a link to the published module — its location ref, version and integrity pin. Someone who finds an application there runs it, configuring it only through the inputs its manifest declares; someone who finds a library imports it by that ref.

Telo itself is a declarative runtime: YAML manifests describe desired state, the kernel resolves resource dependencies, and one controller implements each resource kind. A module here is manifests composed from published kinds, plus what those cannot be — a web UI, test fixtures.

## Architecture

- **The domain is the unit.** A domain is one directory holding everything that belongs to it: its libraries, its applications, a web UI. Its members change together and are released from one place.
- **What belongs here is business, not plumbing.** A domain's own vocabulary — its schema, its operations, its rules, its wire protocol — lives here, as a library. A technical capability — a transport, a codec, a store, a scheduler — is a standard-library module in `../telo`; a connector to an external service is a library in `../integrations`. Both are built and released there and imported here. The test: would a module outside this domain want it for a reason that has nothing to do with this domain?
- **A library is the domain; an application is one way to run it.** What a second application of the same domain would need — tables, operations, shared types — is a library the applications import, never a block of one application's manifest. An application adds what is its alone: the transport it exposes, its targets, its inputs bound to the environment.
- **A member is self-contained.** Everything it needs is in its own directory, in a sibling member it imports by relative path, or in a published module it imports by a pinned ref. Nothing reaches into a checkout of `../telo` or any other repo — not an import, not a file path, not a default that assumes the working directory is this repo's root.
- **Domains do not reach into each other.** One domain uses another through what that domain's libraries export, imported like any other module. Never a file of another domain, never a resource it does not export.
- **The manifest is the listing.** What a listing shows comes from the member's own `telo.yaml` — `metadata.description`, `categories`, `license`, and its contract: an application's `variables`, `secrets` and `ports`; a library's `variables`, `secrets`, `resources` and `exports` — beside its README. Nothing about a member is described anywhere else.
- **The declared contract is the only configuration.** Every input of an application is a `variables:`, `secrets:` or `ports:` entry bound to `env:` (an `arg:` may sit beside it). Runners, Studio and Telo Cloud supply inputs through env only, so an input bound by `arg:` alone needs a `default:`. A library reads no environment: its inputs are its `variables:`, `secrets:` and `resources:`, supplied by its importer. No controller, script or UI reads an environment variable the manifest does not declare.
- **A member does not know it is listed.** Nothing here depends on the marketplace, Studio or Telo Cloud; they consume what is published.

## Core goals

- **Runs as obtained** — someone who gets an application from its listing runs it with nothing but the inputs its manifest declares, and someone who imports a library needs nothing but that import and the inputs it declares: no checkout, no build step the artifact does not carry, no undeclared environment variable or file.
- **An honest contract** — the listing metadata and the declared inputs and exports say exactly what the member does and needs. Every input is typed and described, has a default wherever one can be right, and is refused at boot with its name when it is missing or wrong. A library exports only what an importer is meant to use, and every exported operation declares its `inputType`, `outputType` and the codes it throws.
- **Static analysis** — manifests are type-safe and clean under `telo check`; behaviour is declared resources and CEL, never opaque code.
- **Security** — the README states the trust model in plain words. Secrets enter only through `secrets:` and never reach a log, a response or a `variables:` default. An inbound surface validates what it accepts.
- **Scalability** — an application behaves as one application across replicas where its design allows more than one, keeps memory bounded, and pages or streams whatever can grow without limit. A library does not decide this for its importer: it keeps no state outside the resources it is handed.
- **Developer friendly** — errors must not be swallowed. A client's mistake is answered with a code and a message naming what to fix; a misconfiguration names the input.

## Repo layout

Domains sit at the repo root, one directory each, kebab-case. A domain's members sit directly inside it, one directory each, named for their role in the domain — never repeating the domain's name.

- `<domain>/<member>/telo.yaml` — a `Telo.Application` or a `Telo.Library`.
- `<domain>/<member>/README.md` — the member's documentation.
- `<domain>/<member>/tests/*.yaml` — its tests; `<domain>/<member>/tests/__fixtures__/` their fixtures.
- `<domain>/<member>/test-suite.yaml` — the suite that runs them.
- `<domain>/<member>/plans/*.md` — implementation plans for that member.
- `telo-workspace.yaml` — the release anchor; `.changes/` its pending fragments and ledger.
- `scripts/` — what the workflows in `.github/workflows/` run: the publish pass and the version pull request's body.

`plan-approval` is the reference: a library holding the domain's data and operations (`plans`), a library pinning the contract between two applications (`runner-protocol`), the applications (`server`, `runner`, the one-shot `demo`), and a web UI (`web`). A web UI is a private package (React, Vite, Tailwind, Radix/shadcn, `lucide-react`), never published to npm, installed and built in its own directory (`pnpm --dir <domain>/web install`).

## Authoring a manifest

- **Discover, never guess.** Find a kind through the Telo hub (`telo search "<phrase>"`, or the hub's `search_resources`) and read its module's manifest (`telo module manifest <ref>`, or `get_module_manifest`) before writing a resource of it. Its `Telo.Definition` schemas are the exact field shapes. Also: `https://telo.run/llms.txt` (guide and kind reference), `https://telo.run/examples.md`, `https://telo.run/cel.md`; `telo cel functions` lists what the runtime registers.
- **Imports.** A module from outside this repo is `oci://ghcr.io/telorun/<name>@VERSION#sha256-…` — an exact version, pinned by its integrity digest. Never hand-write or derive a digest: `telo upgrade <file>` pins an import in place. A member of this repo is imported by relative path (`../plans`), with no trailing slash and no `/telo.yaml`; it canonicalizes to that member's published ref.
- **Names.** `metadata.name` is the domain followed by the member's role (`PlanApprovalRunner`). Case encodes what a name denotes — `PascalCase` for types (`metadata.name` of an Application or Library, kinds, import aliases), `camelCase` for values (resource instances, steps, `variables` / `secrets` / `ports` keys). A name contains no dot.
- **References** are `!ref <name>` or `!ref <Alias>.<name>` only. A plain object at a reference slot is an inline definition.
- **CEL.** `!cel` yields a typed value; `!interpolate` is text with `${{ expr }}` holes and always a string. A CEL integer needs no cast. Dereferencing a nullable value without a guard is `CEL_NULLABLE_ACCESS`.
- **Host paths.** A path on the machine running the app is a `variables:` entry with `x-telo-type: Telo.HostPath`; its env value or `default:` is resolved against the working directory at load. A file that ships with the member is named with `!module-path`, `!include-text` or `!include-bytes` — never by a path relative to where the app happens to be run.
- **`requires:`.** A member that uses syntax an older telo refuses declares `requires: telo: ">=<the release that carries it>"`, with a comment naming what needs it. Verify by execution: strip the block, run the previous published CLI (`npx @telorun/cli@<previous> check <manifest>`) and confirm it rejects.

## Listing metadata — MANDATORY

`metadata` on a member's `Telo.Application` or `Telo.Library` is what a listing shows. It is read by someone who does not yet know the member exists.

- `description` — what it does, in terms of the problem it solves and in the words a searcher would type. One paragraph, roughly 40–60 words. No kind names, no module names, no design history. An application states its trust model in a clause when it has none of its own (an unauthenticated app says so). A kind a library exports carries a description of its own: the operation and its contract — inputs, outputs, and what a failure means — in two or three sentences.
- `categories` — an unordered list of display labels. Reuse one when it fits: `AI`, `Compute`, `Configuration`, `Coordination`, `Data`, `Observability`, `Performance`, `Reliability`, `Scheduling`, `Storage`, `Streaming`, `Testing`, `Transport`, `Visualization`.
- `license: MIT` — every application, library and package in this repo is MIT, under the root `LICENSE` — plus `version` and `repository: https://github.com/telorun/solutions`.
- Every `variables` / `secrets` / `ports` entry of an application is a field of the form someone fills in to run it: name it for the operator, give it a `description:`, a `type:`, and a `default:` wherever one can be right. Every `variables` / `secrets` / `resources` entry of a library is what its importer must supply: name it for the author, with a `description:` and a `type:` or `kind:`.

## Documentation — MANDATORY

**Every change to a member includes its README.** The README and the manifest must agree — an input or an export in one and not the other is a defect.

- **An application's** covers: what it is; how to run it, with a table of every environment variable, its default and its meaning; its trust model; its surface (routes with their bodies and answers, error codes with their statuses, files it writes); and how to run its tests.
- **A library's** covers: what it is for; how to import it, with every input an importer supplies; every exported kind and instance with its inputs, its outputs and the codes it throws; what it persists and where; and how to run its tests.

## Tests

- A test is a `Telo.Application`. An application is stood up with `App.Instance` in a `Run.Sequence`'s `with:` and called; a one-shot application is checked with `Assert.Manifest`; one that prompts for input is driven as a conversation. A library is imported by relative path and its exports invoked directly, with the resources it requires declared by the test.
- A library that only an application of its domain exercises may be covered by that application's suite; one meant to be imported on its own carries a suite of its own.
- A suite must pass on a clean checkout with nothing running and no network beyond fetching the modules it imports.
- Tests run in parallel: give each its own port and its own scratch directory or database file, and identify any row it writes per run (`uuidv4()`).
- Assert what crossed the wire, written out literally — the status, the body, the code.
- `Assert.Manifest` pins that an invalid configuration IS refused; point it at a fixture under `__fixtures__/`.

## Versioning & releases — MANDATORY

Everything here is intentionally pre-1.0: a breaking change ships as a **minor**, on purpose.

- **`telo release` owns every version.** Never hand-edit `metadata.version`. The release workspace is the repo root (`telo-workspace.yaml`); a module is any directory it names that holds a `telo.yaml` carrying a `metadata.version` — every application and library of every domain.
- **Every change to a published file ships a fragment in the same change.** Write it with `telo release add --module <domain>/<member> --kind Fixed --body "…"` (`.changes/pending/*.yaml` — one file, several modules, one body). **Never write or edit a fragment by hand** — to change one, delete it and run the command again. `Added` / `Deprecated` are a minor, `Fixed` / `Security` a patch; `Changed` / `Removed` induce a major and `telo release check` rejects them, so a breaking change is written as `Added` with the break described in the body. Edits to tests, a README or a plan need no fragment.
- **Where a member publishes:** `oci://ghcr.io/telorun/solutions/<domain>/<member>` (`oci://ghcr.io/telorun/solutions/plan-approval/server`). **A new domain needs its own entry in `telo-workspace.yaml`** — its path and the registry base beneath it; a directory no entry names is not a module and is never published. A web UI package is not a module and is not published.
- **A release propagates.** A member that imports a sibling by relative path is republished when that sibling's version moves, as a patch with no fragment of its own.
- **CI does the rest.** On every push to `main`, one job opens or updates the `chore(release): version modules` pull request — versions, changelogs and `.changes/ledger.yaml`, written by `telo release apply` — and another pushes every module whose version moved in that commit or is absent from the registry, a dependency before its dependents. Merging the version pull request is what publishes. A new member needs no fragment for its first version: it is pushed because that version is not yet at the registry.
- **Verify before finishing:** `telo release check` (CI's gate), `telo release status` (the plan), `node scripts/publish-modules.mjs --dry-run` (what would be pushed, and whether each artifact passes publish's own checks — nothing is pushed).

## Sibling repos

- `../telo` — the runtime, the CLI, the standard library (`modules/`) and the hub. A missing generic kind or a runtime defect is fixed there, not worked around here.
- `../integrations` — connector libraries wrapping external services as Telo kinds.
- `../marketplace` — the storefront where these applications and libraries are listed.

## Keep CLAUDE.md up to date

Sync this file after any significant architectural change. Architecture and rationale specific to one domain belong in a nested `CLAUDE.md` in that domain; this file keeps only what applies across the repo.
