### <Plan Name>

## Goal
<2-4 sentences. The user-visible outcome — lead with the product change, not the implementation.>

## Why
<2-4 sentences from a product perspective: why now, why this matters, what changes for the user or business when it ships.>

## Problem Statement
<Current friction, the gap we're closing, supporting evidence. Omit the section entirely if there's no real problem statement.>

## Target Personas
- <1-2 primary personas. One line each: who they are, the need this addresses, the pain point today. Brief — not a marketing doc.>

## Out of Scope
- <Concrete things this feature does NOT do. "Auth" is too vague; "social login providers" is useful.>

## Assumptions
- <something taken as true that, if wrong, would change the design>

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

These are the **contracts** for this feature — the shared language between DB, backend, and frontend. Every other section references them: flows cite which entities they read/write, PRs scope their work against them, and tests assert their shape. Define them here before touching implementation. No SQL, no ORM syntax — entity design and field contracts only.

### Database Schemas

One entry per entity this feature introduces or meaningfully extends. Omit entities that are read-only and unchanged. For each entity, list every field that this feature owns or adds — not every field in the table.

#### `<table_name>`
<one sentence: what this entity represents and its role in the feature.>
**Referenced by:** <F#, NF#, Flow #>

| `<field>` | `<field>` | `<...>` |
|---|---|---|
| `<type>, <constraints>` | `<type>, <constraints>` | |

**Indices:**
- `<field(s)>` — <why: what query pattern this serves>

<repeat per entity>

### API Schemas

One entry per endpoint this feature introduces or changes. These are the interface contracts — the request and response shapes that backend commits to serve and frontend commits to consume. Both sides build against these independently.

#### `GET /api/<resource>/:param?query=..`
<one sentence: what this endpoint does.>


**Response**
```ts
{
  <field>: <type>  // <note>
}
```

---

#### `POST /api/<resource>`

**Request**
```ts
{
  <field>: <type>  // <note>
}
```

**Response**
```ts
{
  <field>: <type>
}
```

---

<repeat per endpoint>

## Key User Flows

### Flow 1 — <name>
- **Purpose:** <user goal this flow serves>
- **Trigger:** <what starts it — UI action, scheduled job, webhook, etc.>
- **Walkthrough:**
  1. <step>
  2. <step>
  3. <...>
- **Architectural pattern:** <request/response, SSE, polling, queue, etc. — and why this pattern fits>  
- **Supports:** F1, F3, N2 <link back to requirements explicitly>

<repeat per flow, ordered by importance>

## Key Design Decisions

Decisions that shaped the architecture — where real options existed and a deliberate choice was made. Each entry captures what was decided, what tension it resolved, and what it costs. This section is the institutional memory of the spec: future contributors should be able to read it and understand why the design is the way it is without re-litigating settled ground.

#### 1. <decision title>
<one sentence: what was decided. Name the alternative that was rejected so the tension is visible.>

**Tradeoff:** <what this buys us and what it costs — be specific. "Simpler to implement but harder to extend" is too vague; "avoids a join on every scan query, but denormalizes status so updates require two writes" is useful.>

#### 2. <...>

## PR Plan

Each PR delivers **tangible user value** — something a real user could try at the end. No PR whose only deliverable is "infrastructure for the next PR." When scaffolding is unavoidable, bundle it with the smallest user-facing change that exercises it.

Slice PRs so that later ones can be worked in parallel: early PRs establish the common ground and once that lands, independent slices can proceed without coupling. Call out parallelism explicitly so reviewers and contributors know what can be picked up concurrently.

#### PR 1 — <name>
- **User-visible change:** <what works at the end of this PR that didn't before>
- **Scope:** <files/areas touched — small enough to review, large enough not to fragment>
- **Satisfies:** <AC bullets in F#/NF# this PR ticks — partial is fine>
- **Depends on:** <PR # this must merge first, or "none">

#### PR 2 — <name> _(can start after PR #)_
- **User-visible change:**
- **Scope:**
- **Satisfies:**
- **Depends on:** <PR #>

#### PR 3 — <name> _(parallel with PR #)_
- **User-visible change:**
- **Scope:**
- **Satisfies:**
- **Depends on:** <PR #>

<repeat — annotate each PR as sequential or parallel with its sibling(s)>


## Open Questions

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