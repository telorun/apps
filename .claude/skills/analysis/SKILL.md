---
name: analysis
description: Analyze a problem or feature request from first principles. Proposes the ideal architectural solution and then verifies it against the codebase.
---

Do NOT modify any files. This is a read-only analysis task.

## Step 1: Analyze

Rules:
- Disregard existing implementation. Treat the app as if it could be rewritten from scratch.
- Think from first principles. What is the ideal design given the app's purpose and this repo's goals?
- Be concrete. Propose the specific resources, the contract (`variables`, `secrets`, `ports`), the routes and their wire shapes, the persisted data, and the published kinds each piece is composed from.
- Read what a published module actually offers — its manifest from the hub or its source in `../telo` / `../integrations` — rather than assuming.
- Consider trade-offs. Present the recommended approach alongside alternatives you considered.

Structure your response as:
1. **Problem definition** — restate the problem, identify core requirements and constraints
2. **Ideal architecture** — the application and its libraries, the published kinds it composes, data and control flow, the declared contract, and what ships in the artifact
3. **Trade-offs considered** — alternative designs and why the proposed approach is better
4. **Impact surface** — which apps this touches, including their inputs, routes, error codes, persisted schema, README and listing metadata; and anything it needs that no published module provides
5. **Open questions** — decisions that need user input

## Step 2: Review

After receiving the analyst's proposal, spawn the `reviewer` agent with this prompt:

> A solution was proposed for: $ARGUMENTS
>
> Here is the proposed solution:
> [include the full analyst output here]
>
> Disregard existing manifests. Review this purely as an architectural proposal. Evaluate whether it:
> 1. **Makes sense** — is the design coherent and well-reasoned?
> 2. **Is sustainable long-term** — will this hold up as the app grows and the repo fills with apps, or will it become a liability?
> 3. **Runs as obtained** — does someone with only the published app and its declared inputs get a working app, with no checkout, no build step the artifact does not carry, and no undeclared environment variable or file?
> 4. **Keeps the contract honest** — does the manifest say exactly what the app does and needs, with every input declared, typed, described and defaulted where a default can be right?
> 5. **Preserves static analysis** — is the behaviour declared resources and CEL that `telo check` can validate, with no opaque code?
> 6. **Respects the boundaries** — does it compose published kinds, and leave a capability a second app would want to the standard library or a connector?
> 7. **Is secure and scales** — a stated trust model, secrets only through `secrets:`, bounded memory, correct behaviour on more than one replica?
>
> Read CLAUDE.md for architectural context about this repo's goals.
>
> Structure your response as:
> - **Verdict**: sound / has issues / fundamentally flawed
> - **Issues found** (if any): list each with explanation of the architectural concern
> - **Suggestions**: concrete improvements to address each issue

## Step 3: Present

Synthesize the analysis and review into a single implementation plan. The plan must read as a standalone document — do not reference the analysis or review phases, do not attribute ideas to "the analyst" or "the reviewer". Where the review raised issues or suggestions, fold them into the plan as refinements to the proposed approach.

Structure the plan as:

### Problem
Restate the problem and core requirements.

### Plan
A concrete, ordered list of changes to make. Each item should specify what to change, where, and why. Incorporate any corrections or improvements surfaced during review directly into the steps — the reader should see only the best version of the approach.

### Trade-offs
Key alternatives considered and why this path was chosen.

### Open questions
Decisions that need user input before implementation can proceed.
