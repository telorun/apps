---
name: plan-review
description: Read-only review of an implementation plan.
argument-hint: Selected file
---

Perform a read-only review of an implementation plan. Do NOT modify any files (including the plan itself).

Determine whether the proposed plan is sound, sustainable long-term, and aligned with this repo's core goals:

- **Runs as obtained** — someone who gets the app from its listing runs it with nothing but the inputs its manifest declares: no checkout, no build step the artifact does not carry, no undeclared environment variable or file
- **An honest contract** — the listing metadata and the `variables` / `secrets` / `ports` entries say exactly what the app does and needs
- **Static analysis** — manifests stay type-safe and clean under `telo check`; behaviour is declared resources and CEL, never opaque code
- **Boundaries** — an app composes published kinds; a capability a second app would want belongs to the standard library or a connector, built in its own repo
- **Security** — a stated trust model, secrets only through `secrets:`, inbound surfaces that validate what they accept
- **Scalability** — correct on more than one replica where the design allows it, bounded memory, paging or streaming for whatever can grow without limit

Focus on:

- architecture and design of the proposed solution
- the split between the application and its libraries, dependency direction, and where things live
- cohesion and coupling implied by the plan, including between sibling apps of one product
- whether the plan builds app-locally something a published kind already does, or something a second app would want
- whether `JS.Script` or other opaque code is being used where declared resources belong
- public surface the plan changes — inputs and their env vars, routes, wire fields, error codes, persisted schema — and whether it covers the README, the listing metadata, and data an installed app already holds
- scope creep, missing steps, unstated assumptions, and risks
- adherence to the core goals
- whether the plan contains redundant text that doesn't add value for implementers

Never mention:

- minor implementation details that don't affect the overall soundness of the plan
- gaps that can be easily filled in during implementation without affecting the overall design

Make sure there is no major version bump of any module or dependency.

Ground your feedback in specific sections of the plan. Provide actionable recommendations for improvement, and prioritize them based on impact and effort.

**Important**: Find alternative solutions or well known generic patterns that can be applied to the problem at hand, and suggest them if they would be a better fit than the proposed solution.

Provide only important feedback that would significantly improve the plan. Avoid nitpicks or minor style issues unless they have a meaningful impact on readability or maintainability.

Do not summarize what is sound about the plan.

List top 3 real issues in the plan and propose options to solve them.
Always be sure about the issues you list. If you are not sure whether something is an issue then investigate more.
Keep the list of issues very concise.
Never point to any source code or line numbers in the codebase. Focus on behaviour and design issues in the plan itself, not on implementation details.
