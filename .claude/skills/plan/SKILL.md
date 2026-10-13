---
name: plan
description: Collaboratively plan a new app or a feature of one. Gather context, ask questions, analyze together, then write a short high-level plan only after explicit user approval.
argument-hint: App or feature idea (optional)
---

Collaboratively plan a new app, or a feature of an existing one, with the user. Do NOT write the plan file until the user explicitly approves.
When planning architecture is literally all that matters - effort is not a driver.
Plan must deliver complete, production ready feature. Delivering "v1" or "MVP" is not acceptable. The plan must be complete and production ready.
Complete means the feature asked for — its whole surface, its declared contract, its tests, README and listing metadata — not every adjacent gap planning uncovers. A pre-existing defect found along the way is raised with the user as its own item; it enters the plan only if the feature cannot be complete without it and the user agrees.

## Phase 0 — Make sure you know what to plan

Before doing anything else, check whether the user has given enough detail to understand **what** they want to build. A bare invocation with no description, or a one-word topic, is not enough.

If the app or feature is unclear or under-specified:

- Do NOT start scanning the codebase yet.
- Do NOT make assumptions about scope.
- Ask the user to describe it: what it does, who runs it, what problem it solves.

Only proceed to Phase 1 once you have a workable description.

## Phase 1 — Gather context (silent)

Before asking anything, read enough to ask informed questions:

- Scan the app (or, for a new one, the apps nearest to it) and the patterns the feature would touch.
- Check the app's `plans/` for related prior plans and reuse their conventions.
- Note constraints from `CLAUDE.md` and any app-level conventions.
- Find the published kinds the feature would be composed from, and read their manifests from the hub. When something is not there, read what `../telo` and `../integrations` actually offer rather than assuming.

Do not dump findings — use them to shape better questions.

## Phase 2 — Ask the user questions

Ask focused questions to remove ambiguity. Cover, as relevant:

- **Goal & scope** — what problem this solves, who runs the app and who calls it, what's explicitly out of scope.
- **Behavior** — inputs, outputs, edge cases, failure modes, idempotency, concurrency.
- **The contract** — what someone must supply to run it, what has a default, what is a secret.
- **Trust model** — who may reach it, what is authenticated and what is not, what a caller could do that they should not.
- **Data** — what is persisted, whether anything is ever deleted, what an upgrade does to data an installed app already holds.
- **Integration points** — which published kinds are reused, and anything the feature needs that nothing published provides.
- **Non-functional** — performance, replicas, observability, migration/rollback.
- **Open decisions** — when multiple reasonable approaches exist, list them with trade-offs and ask the user to pick.

Batch related questions. Don't ask things you can answer from the manifests yourself.

## Phase 3 — User asks questions, joint analysis

Let the user probe your understanding and challenge assumptions. Iterate until you both agree on:

- The shape of the solution at a high level.
- Which existing pieces are reused vs. new.
- Key risks and how the plan addresses them.
- Examples of before and after the change, if relevant.

## Phase 4 — Resolve every open question

Before asking for go-ahead, make sure **every** decision is settled. No item is left for "later" or "TBD". For each open question either:

- Get the user to decide, or
- Decide yourself with a clear rationale and confirm the choice with the user.

If anything is still uncertain, go back to Phase 2 or 3. The plan will be refined further by the user afterwards, but it must not ship with open questions.

A capability the plan needs that no published module provides is never planned as app-local code: it is named as a prerequisite owed by `../telo` or `../integrations`, with its own plan there.

## Phase 5 — Get explicit go-ahead

Do NOT write the plan until the user explicitly says to write it (e.g. "write the plan", "go ahead", "looks good, save it"). If unsure, ask.

## Phase 6 — Write the plan

Write it to `<domain>/<member>/plans/<kebab-case-name>.md` in the application or library the plan affects the most (see `CLAUDE.md`). The plan must be:

- **Short** — aim for one page; never more than two.
- **High-level** — architecture, the split between the application and its libraries, data flow, key decisions and their rationale.
- **No code** — no YAML, TypeScript, SQL, or pseudocode blocks. App and module names are fine; implementation snippets are not.
- **Decision-focused** — capture _why_ choices were made (especially rejected alternatives) so future readers understand the trade-offs.
- **Complete** — no open questions, no "TBD", no "to be decided later". Every decision is made.

Structure:

1. **Problem** — what we're solving and why it matters, together with examples of the current behavior and its shortcomings.
2. **Solution** — the chosen approach in prose, with examples of how the feature will be used. Include only public surface — env vars and the inputs that bind them, routes and wire fields, error codes, pages, files the app writes; internal resources are not relevant.
3. **Decisions** — bullet list of the non-obvious choices made, each with a one-line rationale (and rejected alternative where relevant).
4. **Verify** — how someone would know it worked, as behaviour they can observe.

After writing, report the path and stop. Do not start implementing.

Do not change the plan until the user explicitly says to update it.
