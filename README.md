# Stampli Battleship Game

A two-player Battleship game built as a full-stack web app. Two players open the app in separate browser tabs, place their fleets, and take turns firing shots until one fleet is destroyed.

The entire game was implemented by a team of autonomous AI agents working from a written spec without human supervision.

## What's included

**Built by Agent Team:** 

- **Multiplayer Battleship game** — fully playable on localhost by two players in separate browser tabs. Ships a complete UI (React + Tailwind), an Express backend, and a SQLite database.

**Built by Sharon:**

- **Specs** — the product and technical spec, UI design system, and visual mockup that served as the agents' source of truth. See [Spec Driven Development](#spec-driven-development) for details.

- **Claude Code harness** — the agent instruction prompts, PostToolUse hooks, and pre-commit rules that made autonomous execution reliable. See [How the harness works](#how-the-harness-works) for details.

## Quick start

```bash
make install   # run once: installs all deps and wires up the pre-commit hook
make dev       # starts the frontend (port 3000) and backend (port 8000) in parallel
make check     # runs lint, type-checking, and the full test suite on both sides
```

### Try it out

The game requires two players, so you'll need two browser tabs.

1. Open <http://localhost:3000> in two separate tabs
2. Enter a name and click **Play** in each tab
3. In one tab, click **Create Game** and pick a preset
4. In the other tab, click **Join** on the game that appears
5. Place your ships, click **I'm ready!**, and battle

## My Approach

Autonomous agent teams have known failure modes:

- **Scope drift** — without clear boundaries, agents over-build or absorb work they weren't asked to do
- **Coordination divergence** — teammates make incompatible assumptions and deliver the wrong outcome
- **Code slop** — without enforced standards, agents produce code that passes but ignores style rules, type safety, and coding conventions

My approach uses a spec and a harness working in tandem. Together, they address the failure modes above without human supervision.

---

### Spec Driven Development
I designed a [spec](./docs/spec.md) that anticipates where agents are likely to spiral, diverge, or backtrack and removed the ambiguity:

- **[Schema as binding contract](./docs/spec.md#data-models).** Parallel agents can diverge on data shapes: one assumes a field exists, another never adds it. Defining every schema in the spec as a source of truth means there's no drift in what gets built or how it connects.
- **[PR decomposition](./docs/spec.md#pr-plan).** Without a bounded scope, agents over-build and absorb work they weren't asked to do. Slicing the spec into explicit PRs before coding begins gives each agent a clear unit of work — one vertical slice of user value, never boilerplate detached from a requirement. Each PR builds on the last in dependency order, so there's nothing to coordinate and nothing to guess mid-development.
- **UI [design system](./docs/battleship-design-system.md) and [mockup](./docs/battleship-ui-mockup.png).** Without a visual reference, frontend agents make independent styling decisions that produce an inconsistent UI. Both are provided to agents upfront so there's no room for interpretation.

### AI Harness

I built a harness that includes instructions and guardrails so that agents can't drift from requirements and quality standards.

- [**Claude Hooks**](./.claude/settings.json) — run after every file edit, before the agent moves on. Formatting is auto-corrected silently; type errors are surfaced as a hard block the agent must resolve before continuing.
- [**Pre-commit hook**](./.githooks/pre-commit) — runs lint, type-checking, and the full test suite on every `git commit`. Broken or failing code cannot enter the repo.
- [**Test integrity rule**](./.githooks/pre-commit) — agents may add new tests but may never modify or delete a committed test. A failing test means the code is wrong, not the test. The pre-commit hook blocks any staged change to a committed test file; only the Team Lead can sign off (`ALLOW_TEST_CHANGES=1`) after reviewing whether the test or the code was at fault.

- **Instruction prompts** 
  - [CLAUDE.md](./CLAUDE.md) — project-wide context: repo layout, tech stack, house style, conventions
  - [Team Lead](./.claude/agents/team-lead.md) — orchestrates agents, parallelizes work, owns commits and PRs, and is the final decision-maker on any cross-cutting call
  - [Backend Engineer](./.claude/agents/backend-engineer.md) — implements and reviews all server-side code: Express routes, SQLite schema, and repository layer
  - [Frontend Engineer](./.claude/agents/frontend-engineer.md) — implements and reviews all client-side code: React components, state management, and Tailwind styling
  - [Product Manager](./.claude/agents/product-manager.md) — guards scope, validates delivery against the spec's acceptance criteria, and blocks sign-off when requirements aren't fully met
  - [QA Engineer](./.claude/agents/qa-engineer.md) — writes tests derived from the spec and user flows, not the implementation, to ensure the suite enforces the product contract
  - [Security Engineer](./.claude/agents/security-engineer.md) — reviews PRs for OWASP Top 10 vulnerabilities, SQL injection, XSS, and input validation gaps across the full stack


## Test coverage

The frontend coverage threshold is set to **5%** across all metrics (statements, branches, functions, lines). This is intentionally low — the project is a conceptual pairing surface, not a production system. The threshold exists to catch complete regressions, not to enforce production-grade coverage discipline.

## Work process

This section documents how the feature work for this repo was approached — specifically how the spec was built and how implementation was driven from it.

### 1. Domain research

Started by reading the assignment, then used LLMs and YouTube videos to understand the game, its rules, and its conventions. The goal was to arrive at a clear mental model before writing a single line of spec.

### 2. Spec conversation

Conversed with Claude Code to build shared context — surfacing questions about game rules, user interactions, expected behaviors, and edge cases before any decisions were locked in. The conversation was the first draft of the spec.

### 3. Spec writing

Wrote the spec using a fixed template, working strictly top-down: each section builds only on the sections that precede it, never on what comes after. The final section — PR slicing — is the most important: it accumulates all context, decisions, and constraints from the entire document. The spec is deliberately light on implementation detail; implementation decisions belong to the harness and the agents executing it, not the spec.

### 4. UI mockup (in parallel)

In parallel with spec writing, fed the functional requirements to a separate agent that generated a mock UI design system. The output was tweaked to taste, a screenshot was taken, and the mockup code was discarded. The screenshot is the source of truth for UI and experience development — not the code.

### 5. Spec review for autonomous executability

Used Claude Code to review the spec from the perspective of a team of autonomous agents: could they execute it without ambiguity, without a human in the loop, and without diverging from intent? Gaps surfaced in review were fixed in the spec before implementation began.

### 6. PR slicing

PR slicing is the critical piece. Multiple rounds of review were done using Opus to verify that a team of autonomous agents could execute each PR independently — in sequence, without coordination, and without drifting from the original spec. Each PR was scoped to be fully executable from the spec alone, with no hidden dependencies on conversations that happened outside it.

### Where human judgment was concentrated

The requirements section of the spec is where the most judgment calls were made — deliberately so, because every subsequent section builds off it. Getting requirements right meant the rest of the spec could be derived rather than invented.

Architecture decisions were strategically chosen to give the implementation a clear technical direction. These weren't defaults — they were picks made with intent, to constrain the solution space in a way that matched the goals of the project.

PR slicing was the section most personally scrutinized. It is the contract between the spec and execution: if it is wrong, autonomous agents diverge. Every PR boundary was reviewed to ensure it was unambiguous, self-contained, and faithful to the original spec.
