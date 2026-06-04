# playground

A small full-stack app — **Express** (Node.js) backend + **React + Vite + TypeScript** frontend — set up for rapid, collaborative, pair-friendly development. The scaffold is deliberately minimal: each tool earns its place, nothing is added until it's needed.

## Quick start

You'll need Node 22+.

```bash
make install   # install all deps + wire up the pre-commit hook (run once)
make dev       # start both servers in parallel
```

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>

## Approach

Autonomous agents produce good work when they're squeezed from both ends. Non-deterministic constraints — the spec, the agent team structure, the PR decomposition — set a north star that agents interpret and navigate toward. Deterministic constraints — linters, type-checks, tests, a pre-chosen tech stack, a locked UI component system — define the lines they must color within. Neither end alone is enough: direction without guardrails produces confident slop; guardrails without direction produce technically compliant code that serves no one. The combination creates productive pressure that keeps agents oriented toward user value without spiraling.

- **Spec Driven Development**
  - The spec is the single contract between intent and execution — all work is derived from it, never the other way around.
  - **Schema as binding contract.** The spec defines Database and API schemas upfront, implemented as Zod schemas in a single [`shared/schemas.ts`](./shared/schemas.ts) imported by both the frontend and backend. This enforces the same contract at every layer — TypeScript types at compile time, Zod parsing at runtime, and the same schemas in tests. When two agents implement opposite ends of the same endpoint, they start from a shared, authoritative definition of its shape — so drift is caught immediately, not discovered downstream.
  - **PR decomposition.** The spec also slices the work into PRs before a single line of code is written. Each PR ships a vertical fragment of user value — never pure technical scaffolding or boilerplate detached from a requirement. This keeps implementation honest: agents can't drift into building things the spec didn't ask for. Order matters too — PRs are sequenced to build on each other in small, tangible increments of user value, while parallelizing work in genuinely independent areas wherever the dependency graph allows.
- **AI harness** — CLAUDE.md files, hooks, skills, and settings that keep autonomous agents productive, constrained, and aligned without constant human supervision.
- **Autonomous agent team** — implementation is driven by a team of specialized agents (backend, frontend, QA, PM, security) working from the spec independently, in sequence, without coordination.

## How the harness works

The repo is set up to stay productive whether a human or [Claude Code](https://docs.claude.com/en/docs/agents-and-tools/claude-code) is at the keyboard. The pieces:

- **[`docs/`](./docs/)** — used for Spec Driven Development. Features, product context and goals, and high level design are derived from here. Write the spec first; everything else follows from it.
- **[`CLAUDE.md`](./CLAUDE.md) files** — load project context automatically at the start of every Claude session, so Claude isn't starting cold. Kept close to the code they describe.
- **[`.claude/settings.json`](./.claude/settings.json)** — controls what Claude is allowed to do autonomously without prompting. Tuned to reduce friction for routine tasks while keeping destructive actions gated.
- **[`.claude/hooks/`](./.claude/hooks/)** — auto-fix lint and format on every file Claude touches, and surface type errors immediately. Keeps the working tree clean turn-by-turn instead of letting issues pile up until CI runs.
- **[`.claude/skills/`](./.claude/skills/)** — project-local workflows for common tasks: writing contract-driven tests (`add-tests`) and managing pull requests (`make-pr`). Encodes the right process so it doesn't need to be re-explained each session.
- **[`.githooks/`](./.githooks/)** — pre-commit hook that runs `make check` before every commit. Catches issues before they reach CI; `make install` wires it up automatically.
- **[`.github/workflows/`](./.github/workflows/)** — CI that mirrors local checks exactly. No surprises between local and remote.

Everything in the harness is designed around the same minimalism as the codebase: keep what earns its keep, fail fast on real bugs, stay out of the way the rest of the time.

## Test coverage

The frontend coverage threshold is set to **5%** across all metrics (statements, branches, functions, lines). This is intentionally low — the project is a conceptual pairing surface, not a production system. The threshold exists to catch complete regressions, not to enforce production-grade coverage discipline.

## Workflow

1. **Domain research** — started by reading the assignment, then used LLMs and YouTube videos to understand the game, its rules, and its conventions. The goal was to arrive at a clear mental model before writing a single line of spec.

2. **Spec conversation** — conversed with Claude Code to build shared context: surfacing questions about game rules, user interactions, expected behaviors, and edge cases before any decisions were locked in. The conversation was the first draft of the spec.

3. **Spec writing** — wrote the spec using a fixed template, working strictly top-down: each section builds only on the sections that precede it, never on what comes after. The final section — PR slicing — is the most important: it accumulates all context, decisions, and constraints from the entire document. The spec is deliberately light on implementation detail; implementation decisions belong to the harness and the agents executing it, not the spec.

4. **UI mockup (in parallel)** — fed the functional requirements to a separate agent that generated a mock UI design system. The output was tweaked to taste, a screenshot was taken, and the mockup code was discarded. The screenshot is the source of truth for UI and experience development — not the code.

5. **Spec review for autonomous executability** — used Claude Code to review the spec from the perspective of a team of autonomous agents: could they execute it without ambiguity, without a human in the loop, and without diverging from intent? Gaps surfaced in review were fixed in the spec before implementation began.

6. **PR slicing** — multiple rounds of review were done using Opus to verify that a team of autonomous agents could execute each PR independently — in sequence, without coordination, and without drifting from the original spec. Each PR was scoped to be fully executable from the spec alone, with no hidden dependencies on conversations that happened outside it.

7. **Autonomous execution** — handed the sliced PRs to a team of specialized agents (backend, frontend, QA, PM, security) to implement in sequence. Each agent worked from the spec alone, with no human coordination.

## Retrospective

### Went well

- Item 1
- Item 2

### Not so well

- Item 1
- Item 2

## What I'd do if I had more time

- Item 1
- Item 2
