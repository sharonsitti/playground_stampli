### <Plan Name>

## Goal
<2-4 sentences. The user-visible outcome — lead with the product change, not the implementation.>

## Why
<2-4 sentences from a product perspective: why now, why this matters, what changes for the user or business when it ships.>

## Problem statement
<Current friction, the gap we're closing, supporting evidence. Omit the section entirely if there's no real problem statement.>

## Target personas
- <1-2 primary personas. One line each: who they are, the need this addresses, the pain point today. Brief — not a marketing doc.>

## Out of scope
- <Concrete things this feature does NOT do. "Auth" is too vague; "social login providers" is useful.>

## Requirements

### Functional (ranked by priority)

#### F1 — <one-line title>
As a <persona>, I want <capability> so that <outcome>.

**Acceptance criteria:**
- [ ] <Given/When/Then or a clear measurable assertion>
- [ ] <...>
- [ ] <...>

#### F2 — <...>

### Non-functional (ranked by priority)

#### NF1 — <Latency | Scale | Fault tolerance | Durability | Security | Consistency | ...>: <one-line title>
<one sentence: what the system must do and why it matters here.>

**Acceptance criteria:**
- [ ] <Measurable threshold. Examples: "P99 scan latency < 200ms"; "bundle stays under 500KB gzipped"; "no in-process session state — scaling to N instances is a config change"; "errors surface a user-readable message and never crash the handler".>
- [ ] <...>

#### NF2 — <...>

## Data Models

### Database Schemas

### API Schemas

## Key user flows

### Flow 1 — <name>
- **Purpose:** <user goal this flow serves>
- **Trigger:** <what starts it — UI action, scheduled job, webhook, etc.>
- **Architectural pattern:** <request/response, SSE, polling, queue, etc. — and why this pattern fits>
- **Walkthrough:**
  1. <step>
  2. <step>
  3. <...>
- **Rationale:** <why this design over the alternative — tradeoff taken, what it buys>
- **Supports:** F1, F3, N2 <link back to requirements explicitly>

<repeat per flow, ordered by importance>

## PR plan

Each PR delivers **tangible user value** — something a real user could try at the end. No PR whose only deliverable is "infrastructure for the next PR." When scaffolding is unavoidable, bundle it with the smallest user-facing change that exercises it.

**Tests are out of scope for the PR plan.** Do not list a test plan, test PR, or per-PR test checklist here — `/add-tests` is a separate, user-triggered flow that derives tests from this spec's acceptance criteria. PR entries should describe product behaviour only.

#### PR 1 — <title>
- **User-visible change:** <what works at the end of this PR that didn't before>
- **Scope:** <files/areas touched — small enough to review, large enough not to fragment>
- **Satisfies:** which AC bullets in F#/N# this PR ticks (partially is fine — list the specific bullets)

<repeat per PR>


## Open questions

Unresolved decisions that need the user's input before this spec is finalized. Each entry must be **understandable on its own** — a junior reading it cold should grasp what's being asked and what's at stake.

### Q1 — <one-line question>
**What's being asked:** <plain-English version of the decision>
**Why it matters:** <what part of the spec this unlocks — which requirement, flow, or PR it shapes>
**Option A — <name>:** <one line on what we'd do>
  - Outcome: <what the product/code looks like if we pick A>
**Option B — <name>:** <one line on what we'd do>
  - Outcome: <what the product/code looks like if we pick B>
**Recommendation (if any):** <which option you'd default to and why, or "no preference">

<repeat per question; aim for ≤ 5 open questions total — beyond that, the spec isn't ready and you should re-engage the user before drafting more>