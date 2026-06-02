---
name: spec
description: Author a spec-driven `docs/feat-<name>.md` covering goal, problem, personas, requirements with acceptance criteria, workflows, PR plan, and risks. Use when the user says "/spec", "spec X", "write the spec for...", or before any non-trivial feature so `/dev` and `/add-tests` have a contract to build and test against.
---

# spec

Produce one document: `docs/feat-<name>.md`. This becomes the source of truth that `/dev` builds from and `/add-tests` writes against, so acceptance criteria must be sharp and measurable.

## Project context — read before drafting

This is a **playground project for software-engineering interviews that last about an hour**. The bar for every spec is:

- **Meets the requirements, isn't over-engineered.** No code in this repo will ever reach production.
- **Zero slop.** Readable, maintainable code that uses the stack properly is the entire point — that's what's being evaluated.
- **No production-readiness scaffolding.** No observability, alerting, multi-region failover, autoscaling, blue/green deploys, secret managers, etc. Don't write requirements for them, don't plan PRs for them, don't list them as risks.
- **New building blocks use industry-standard deps in-memory.** If the feature genuinely needs a database, vector store, queue, or cache that the project doesn't already have, pick the dependency a senior engineer would reach for (e.g., SQLite, FAISS, in-memory Redis-compatible) and run it **in-process / in-memory**. No Docker compose files, no managed services, no setup scripts beyond `make install`.
- **Default to "what fits in an hour."** When in doubt about scope or depth, pick the smaller, cleaner option.

Reflect this context throughout the spec — especially in **Out of scope** (call out the prod-readiness items explicitly), **External dependencies** (justify each one and confirm it runs locally/in-memory), and **Risks** (skip prod-readiness concerns entirely).

## Step 1 — Name and gather (lightly)

Pick a kebab-case `<name>` from the topic and confirm it in passing — don't make it its own round-trip.

Then ask **at most three** clarifying questions, and only ones that are **absolutely critical** to drafting a coherent spec — i.e. you literally can't write the Goal / top-priority requirement / out-of-scope without the answer. Everything else goes into the "Open questions" section of the draft instead, so the user reviews it asynchronously rather than being interrogated up front.

Heuristic: if a question only affects one PR or one acceptance criterion, it's *not* critical — note it as an open question. If a question changes what the feature fundamentally is, who it's for, or what success means, ask it now.

Never invent: goal, problem statement, persona pain points, out-of-scope items, or priority order. If the user defers ("you decide"), put it in Open questions with a recommended default and tradeoffs.

## Step 2 — Understand external dependencies

If the feature touches a third-party library, API, SDK, or service:

- Prefer a **direct MCP** for that dependency (e.g., the `openai-python` MCP for the OpenAI SDK). Use it to confirm current API shape, auth, and idiomatic usage.
- If no direct MCP exists, fall back to **`context7`** (`mcp__plugin_context7_context7__resolve-library-id` → `query-docs`).
- It's OK to rely on training knowledge if fresher knowledge wasn't available — but try MCPs / context7 first, since APIs drift.

In the spec, call out **standout contracts** explicitly: project↔external API, client↔server payloads, persisted formats. Include the shape (fields, types, errors) when not obvious.

## Step 3 — Write the doc

Use this template. Omit any section that has nothing real to say (empty headers are noise).

```markdown
# feat: <name>

## Goal
<2-4 sentences. The user-visible outcome — lead with the product change, not the implementation.>

## Why
<2-4 sentences from a product perspective: why now, why this matters, what changes for the user or business when it ships.>

## Problem statement
<Current friction, the gap we're closing, supporting evidence. Omit the section entirely if there's no real problem statement.>

## Target personas
<1-2 primary personas. One line each: who they are, the need this addresses, the pain point today. Brief — not a marketing doc.>

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

Anchor each NFR in a recognised **architectural indicator** — latency, throughput, availability, scalability, fault tolerance, maintainability, extensibility, security, accessibility, observability, etc. State the indicator in the title so the tradeoff is obvious.

Calibrate to this project: a demo MVP that will not scale to millions of users. Targets should fit current traffic (single-digit concurrent users, dev-laptop hardware) while leaving the door open to scale later if needed — e.g. "stateless handlers so we can horizontally scale" rather than "supports 10k RPS today". Avoid overreaching budgets that force prod-readiness work this repo explicitly excludes (no autoscaling, no multi-region, no SLO dashboards).

#### N1 — <indicator>: <one-line title>
<Plain description. Tie it to the functional requirement(s) it supports and name the architectural indicator it targets.>

**Acceptance criteria:**
- [ ] <Measurable and proportionate. Examples: "P95 API latency < 300ms locally with 1 concurrent user"; "frontend bundle stays under 500KB gzipped"; "handlers are stateless — no in-process session state — so a future second instance is a config change"; "feature module exposes a single typed interface so swapping the provider is a one-file edit"; "errors from the external API surface a user-readable message and never crash the request handler".>
- [ ] <...>
- [ ] <...>

## External dependencies
<Each library/API/service: version, how we use it, failure modes. "None" is a valid value.>

### Contracts
<Standout boundaries — client↔server payload shape, project↔external API shape, persisted formats. Show example payloads if the shape isn't obvious. Omit if nothing non-trivial.>

## Data storage

Enumerate every piece of data the feature touches. One row per logical entity — be explicit about source, store, and lifecycle. If the feature is truly stateless, say "None — feature is stateless" and stop.

Follow the project context: prefer **in-process / in-memory** stores (Python dict, SQLite file, FAISS index) over managed services. Justify any persistence beyond process lifetime.

| Entity | Source | Store | Format | Lifetime | Notes |
|---|---|---|---|---|---|
| <e.g. ChatMessage> | <user input via POST /chat> | <in-memory dict keyed by session_id> | <Pydantic model → dict> | <process lifetime> | <e.g. lost on restart — acceptable for MVP> |
| <e.g. EmbeddingIndex> | <OpenAI embeddings API> | <FAISS index, in-process> | <float32 vectors + id map> | <rebuilt on startup> | <…> |

After the table, briefly cover:
- **Read/write patterns:** which flows read vs. write each entity, and rough access shape (point lookup, scan, similarity search, etc.).
- **Concurrency:** is concurrent write safety needed for the MVP, or is single-user assumed? Name the assumption.
- **Migration / upgrade path:** one line on what changes if we later swap the in-memory store for a real DB (ties back to the scalability NFR).

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

| # | Title | Delivers | Depends on | Parallel with |
|---|---|---|---|---|
| 1 | <imperative title> | <one line of user value> | — | — |
| 2 | <...> | <...> | 1 | — |
| 3 | <...> | <...> | 1 | 2 |

#### PR 1 — <title>
- **User-visible change:** <what works at the end of this PR that didn't before>
- **Scope:** <files/areas touched — small enough to review, large enough not to fragment>
- **Satisfies:** which AC bullets in F#/N# this PR ticks (partially is fine — list the specific bullets)

<repeat per PR>

Sequencing rules baked into the plan:
- A later PR depends on an earlier one only when it genuinely needs to.
- **Always** populate the "Parallel with" column for every PR — list the PR numbers that can ship concurrently, or `—` if none. Never leave it blank. Two PRs are parallel when they share no dependency chain and touch independent files/areas, so two engineers (or two Claude sessions) can ship at once.
- After the table, add a one-line **Parallelisation summary** calling out the parallel batches explicitly (e.g. "After PR 1 lands, PRs 2 and 3 can run in parallel; PR 4 waits on both"). If nothing is parallelisable, say so and why.

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

## Risks and mitigations

Local MVP — no production-readiness focus. Focus on:

- **Code robustness:** parts of the design most likely to be wrong, brittle, or hard to refactor later.
- **Fault tolerance:** what happens when the external dep is slow / down / returns garbage; what happens when the user does something unexpected.
- **External dependencies:** version churn, rate limits, auth quirks, undocumented behavior surfaced during the MCP / context7 lookup.

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| <one-line risk> | low/med/high | low/med/high | <one-line plan — "accept and move on" is a valid answer> |
```

## Step 4 — Save and hand off

Write to `docs/feat-<name>.md`. If a file with that name exists, surface it and ask whether to overwrite, append, or pick a new name — do not silently clobber.

After saving, report the path, a one-line summary, and **surface the Open questions inline** so the user can answer them in chat. Update the file with their answers before considering the spec finalized.

**Do not start implementing.** `/dev` and `/add-tests` are separate, user-triggered flows.

## Rules

- Acceptance criteria must be **measurable**. "Should be fast" is not a criterion; "P95 response < 200ms under 10 concurrent requests" is.
- Each requirement gets 3-4 acceptance criteria. Fewer is under-specified; more is bloat.
- Phrase everything so a junior developer can read it cold and know what to build *and* what to verify.
- PRs deliver user value or they don't ship. No "infrastructure-only" PRs.
- Omit empty sections rather than leaving stubs.
