---
name: code-review
description: Read-only code review for staged changes or current branch.
---

Perform a read-only code review for staged changes or the current branch. Do NOT modify any files.

Determine whether the implementation is sound, sustainable long-term, and aligned with this repo's core goals:

- **Runs as obtained — THE SINGLE MOST IMPORTANT GOAL IN THIS REPO** — someone who gets the app from its marketplace listing has only the published artifact and the inputs its manifest declares. The change must not add an import that is neither a pinned published ref nor an in-repo relative path, a file or a default that only a checkout satisfies, a build step the artifact does not carry, or an environment variable that no `variables` / `secrets` / `ports` entry declares. This is NON-NEGOTIABLE and OVERRIDES every other consideration, including the "ignore plan deviations" rule below. A gap here is ALWAYS a top-priority blocking finding, even when it was a documented, intentional deferral. This concerns what the change introduces; a gap that predates the change is listed separately as pre-existing and is not blocking.
- **An honest contract** — the listing metadata (`metadata.description`, `categories`, `license`) and the `variables` / `secrets` / `ports` entries say exactly what the app does and needs. Every input is typed and described, has a default wherever one can be right, and is refused at boot by name when missing or wrong.
- **Static analysis** — manifests are type-safe and clean under `telo check`; behaviour is declared resources and CEL, never opaque code.
- **Boundaries** — an app composes published kinds. A capability a second app would want is a standard-library module in `../telo` or a connector in `../integrations`, never built inside an app.
- **Security** — the README states the trust model; secrets enter only through `secrets:` and never reach a log, a response or a default; an inbound surface validates what it accepts.
- **Scalability** — correct on more than one replica where the design allows it, bounded memory, paging or streaming for whatever can grow without limit.
- **Developer friendly** — Errors must not be swallowed. A client's mistake is answered with a code and a message naming what to fix; a misconfiguration names the input.

Focus on:

- architecture and design of the manifests and code
- the split between the application and its libraries; cohesion and coupling, including between sibling apps of one product
- adherence to the core goals
- check every import: a module from outside this repo must be `oci://…@VERSION#sha256-…`; a library in this repo a relative path with no trailing slash.
- check every path: a file the app reads must ship with it (`!module-path`, `!include-text`, `!include-bytes`) or be a declared `Telo.HostPath` input; no default may assume the working directory is this repo.
- check that the README and the manifest agree: every environment variable, default, route, error code and status in one is in the other.
- check that `metadata.description` still describes the app after the change, in the words a searcher would type.
- check if the implementation uses `JS.Script`; if yes, propose an existing published kind or the shape of a new one. Using `JS.Script` is forbidden.
- check if the change builds app-locally something a published kind already does, or something a second app would want.
- check if a route, an input type or an output type keeps its schema open with `additionalProperties: true` for no reason.
- check that state changes which must happen together share a transaction, and for races between concurrent requests.
- check that a persisted shape the change alters carries a migration for data an installed app already holds.
- check that a list, a history or a result set that can grow without limit is paged, not read whole.
- check if a fix is treating the cause of the problem instead of just the symptom, and is not a hacky workaround.
- check if a named resource is used exactly once (it should be inline), or one resource carries several responsibilities and should be split.
- check each test has its own port and scratch files, and asserts what crossed the wire literally.
- in a web package: check that UI primitives are Radix/shadcn wrappers and icons come from `lucide-react`, and that it calls only the app's own public routes.
- check if the change is larger than the feature: fixes to pre-existing issues the feature only passes through, the same fix applied to sibling apps, tests proving a behaviour another test already proves, or tests of machinery a published module owns. Recommend removal, not more coverage.

Ignore any deviations from the implementation plan or spec, as long as the implementation is sound and meets the core goals. EXCEPTION: never ignore a gap in running as obtained — see the goal above. It is always a blocking finding even if the plan sanctioned it.

Detect if implementer was struggling with making the implementation natural/simple and decided to hack around.

Ground your feedback in specific file paths and line ranges. Provide actionable recommendations for improvement, and prioritize them based on impact.

Make sure there is no major version bump of any module or dependency.

Ignore any file changes that are not coherent with the overall feature or fix being implemented and seem out of scope.

Do not comment about what is sound about the implementation, only point out potential issues and areas for improvement.

Provide concrete fix recommendations for each issue you find, and explain why the fix is necessary.

Your last message MUST ALWAYS contain ALL findings with recommendations.
