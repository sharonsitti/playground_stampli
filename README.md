# playground

A small full-stack app — **Express** (Node.js) backend + **React + Vite + TypeScript** frontend — set up for rapid, collaborative, pair-friendly development. The scaffold is deliberately minimal: each tool earns its place, nothing is added until it's needed.

## What's included

- **Multiplayer Battleship game** — fully playable on localhost by two players in seperate browser tabs. Ships a complete UI (React + Tailwind), an Express backend, and a SQLite database. Built and tested by a team of autonomous agents.

- **Specs** — the source of truth the agents worked from, and where most of the human judgment in this project was concentrated:
  - [`docs/spec.md`](./docs/spec.md) — requirements, data models, API contracts, key user flows, design decisions, and PR slicing
  - [`docs/battleship-design-system.md`](./docs/battleship-design-system.md) — color tokens, typography, component specs, and per-screen layout for every UI state
  - [`docs/battleship-ui-mockup.png`](./docs/battleship-ui-mockup.png) — annotated visual reference; the screenshot is the source of truth for UI and experience

- **A Claude Code harness** — the scaffolding that made autonomous team execution reliable. 
  - **Instruction prompts** — loaded automatically at the start of every session so agents are never starting cold:
    - [`CLAUDE.md`](./CLAUDE.md) — project-wide context: repo layout, tech stack, house style, conventions
    - [`.claude/agents/team-lead.md`](./.claude/agents/team-lead.md) — orchestrates agents, parallelizes work, owns commits and PRs, and is the final decision-maker on any cross-cutting call
    - [`.claude/agents/backend-engineer.md`](./.claude/agents/backend-engineer.md) — implements and reviews all server-side code: Express routes, SQLite schema, and repository layer
    - [`.claude/agents/frontend-engineer.md`](./.claude/agents/frontend-engineer.md) — implements and reviews all client-side code: React components, state management, and Tailwind styling
    - [`.claude/agents/product-manager.md`](./.claude/agents/product-manager.md) — guards scope, validates delivery against the spec's acceptance criteria, and blocks sign-off when requirements aren't fully met
    - [`.claude/agents/qa-engineer.md`](./.claude/agents/qa-engineer.md) — writes tests derived from the spec and user flows, not the implementation, to ensure the suite enforces the product contract
    - [`.claude/agents/security-engineer.md`](./.claude/agents/security-engineer.md) — reviews PRs for OWASP Top 10 vulnerabilities, SQL injection, XSS, and input validation gaps across the full stack
  - **PostToolUse hooks** — fire automatically after every file edit, keeping the working tree clean turn-by-turn:
    - [`frontend-check.sh`](./.claude/hooks/frontend-check.sh) — on any `.ts`/`.tsx`/`.css` change under `app/`: auto-fixes lint and format, then blocks and surfaces TypeScript errors to the agent immediately
    - [`server-check.sh`](./.claude/hooks/server-check.sh) — on any `.ts` change under `server/`: same auto-fix and block pattern
  - **Pre-commit hook** ([`.githooks/pre-commit`](./.githooks/pre-commit)) — fires on every `git commit` and runs lint, type-checking, and the full test suite on both frontend and server before the commit is allowed through. This ensures no broken or failing code ever enters the repo.
  - **Test integrity rule** —  agents may write new tests but may never modify or delete an existing committed test. If a test fails, the code is wrong — not the test. This rule is enforced using a pre-commit hook that surfaces staged changes to a committed test file and blocks the commit. The team-lead reviews the changes and makes a judgement call whether the it's the code or the tests were broken. Lead signs-off (`ALLOW_TEST_CHANGES=1`) to proceed with changing test files, or push back to engineers to fix an actual code issue. 

## Quick start

You'll need Node 22+.

```bash
make install   # install all deps + wire up the pre-commit hook (run once)
make dev       # start both servers in parallel
```

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>

## How the harness works

The repo is set up to stay productive whether a human or [Claude Code](https://docs.claude.com/en/docs/agents-and-tools/claude-code) is at the keyboard. The pieces:

- **[`docs/`](./docs/)** — used for Spec Driven Development. Features, product context and goals, and high level design are derived from here. Write the spec first; everything else follows from it.
- **[`CLAUDE.md`](./CLAUDE.md) files** — load project context automatically at the start of every Claude session, so Claude isn't starting cold. Kept close to the code they describe.
- **[`.claude/settings.json`](./.claude/settings.json)** — controls what Claude is allowed to do autonomously without prompting. Tuned to reduce friction for routine tasks while keeping destructive actions gated.
- **[`.claude/hooks/`](./.claude/hooks/)** — auto-fix lint and format on every file Claude touches, and surface type errors immediately. Keeps the working tree clean turn-by-turn instead of letting issues pile up until CI runs.
- **[`.claude/skills/`](./.claude/skills/)** — project-local workflows for common tasks (e.g. writing contract-driven tests). Encodes the right process so it doesn't need to be re-explained each session.
- **[`.githooks/`](./.githooks/)** — pre-commit hook that runs `make check` before every commit, and enforces a hard rule: **agents may write new tests but may never modify or delete an existing committed test — if a test fails, the code is wrong, not the test.** If committed test files appear in the staged diff, the hook blocks and prints the affected files. The team-lead reviews the diff and re-runs with `ALLOW_TEST_CHANGES=1 git commit ...` only when the change is a legitimate, spec-driven update. New test files pass through silently. `make install` wires the hook up automatically.
- **[`.github/workflows/`](./.github/workflows/)** — CI that mirrors local checks exactly. No surprises between local and remote.

Everything in the harness is designed around the same minimalism as the codebase: keep what earns its keep, fail fast on real bugs, stay out of the way the rest of the time.

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
