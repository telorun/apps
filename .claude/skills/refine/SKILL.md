---
name: refine
description: Surface concrete options to refine or refactor a given app. Read-only analysis; does not modify files.
---

Do NOT modify any files. This is a read-only analysis task.

The user will supply the path (or name) of an application or library as `$ARGUMENTS`. If `$ARGUMENTS` is empty or ambiguous (e.g. a domain holding several members), ask the user to clarify before proceeding.

## Step 1: Locate the member

Resolve `$ARGUMENTS` to a concrete directory. Domains sit at the repo root, one directory each; a domain's applications and libraries sit directly inside it. Confirm the resolved path before spawning the agent.

## Step 2: Refine

Use the Agent tool to spawn the `refiner` agent with the following prompt:

> Examine the app at `<resolved path>` and surface concrete options to refine or refactor it.
>
> Rules:
>
> - Do NOT modify any files.
> - Ground every option in specific file paths and line ranges from the app.
> - Consider both this repo's core goals (runs as obtained, an honest contract, static analysis, boundaries, security, scalability) and general refinement categories (cohesion, duplication, abstraction fit, dead manifest, naming, error handling, test coverage, docs drift).
> - Rate each option's impact and effort independently, sort by impact-to-effort ratio (best first), and call out quick wins (large impact, small effort) up top.
>
> Read CLAUDE.md for architectural context.
>
> Follow the response structure defined in your agent instructions (Package summary / Refinement options / Out of scope / Open questions).

## Step 3: Present

Relay the refiner's output to the user verbatim, preserving its structure (keep the Quick wins section prominent). Do not collapse options and do not start implementing. After presenting, recommend starting with the quick wins if any were identified, then ask the user which option(s) they want to pursue — and wait for an explicit go-ahead before making any changes.
