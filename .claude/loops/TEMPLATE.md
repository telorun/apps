# Loop <YYYY-MM-DD>

Goal: <one sentence — the feature this loop delivers>

## Standing approvals

Written at the plan gate, in the user's own words. The queue below is the loop's whole scope;
approvals cover only its cards and the paths they name.

- <e.g. edit anything under plan-approval and its tests; run its suite>
- <e.g. park anything needing a change to the runtime or a standard-library module>

## Queue

One line per field. Narrative lives in the card's artifacts, never here.

### 1. <card title> — `pending`

- **Intent:** <one sentence>
- **Paths:** <the only files this card may touch>
- **Acceptance:** <behaviour that must hold — the complete feature, never a first step, never a list of tests>
- **Size:** <expected files and roughly the lines>
- **Gates:** <the commands that prove it>
- **Effort:** medium | high
- **Evidence:** <one line per gate + `git diff --stat`; full output in `<nn>-<slug>/gate.md`>
- **Artifacts:** `<nn>-<slug>/` — brief.md, builder.md, gate.md, tree.diff

### 2. <card title> — `pending`

...

## Decisions

Every decision `decider` made. One line each, stated as behaviour; this line is its only record.

- <planning | card n> — <decision>

## For the user

Decisions the loop could not make, cards it dropped, and pre-existing defects that blocked a card.
Each with what it needs from you.

## Incidental fixes

Behaviour-free corrections found along the way, applied by the architect in one sweep after the last card. Each
entry: path and lines, what is wrong, the exact replacement text.

## Report

Appended as the loop runs — never rewritten at the end. The loop's one audit, its fix rounds and
what it left open are recorded here, with the full findings in `99-final-audit.md`.

- `<time>` loop opened, N cards queued.
