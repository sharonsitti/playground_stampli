# Stampli Battleship Takehome

A real-time multiplayer Battleship game where two players take turns firing shots at each other's hidden fleets until one player sinks them all. 100% of the implementation code was written by a team of specialized AI agents.

## Quick start

You'll need Node 22+.

```bash
make install   # install all deps + wire up the pre-commit hook (run once)
make dev       # start both servers in parallel
```

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>

## My Approach

Autonomous agents produce good work when they're squeezed from both ends. Non-deterministic prompts give LLMs the creative latitude to understand and solve a task. Deterministic guardrails bound that latitude — safe lines to color within. Together, they keep agents producing high-quality output that stays true to the original requirements.

### AI Harness

Keeps autonomous agents productive and aligned without constant human supervision.

- **Deterministic guardrails:** linters, type-checks, tests, a fixed tech stack, a locked UI component system, and shared schemas — run automatically on every change
- **Non-deterministic compass:** the spec, agent roles, skills, and [CLAUDE.md](./CLAUDE.md) — encode intent, process, and constraints that agents interpret and act on

### Spec Driven Development

The spec is the single contract between intent and execution — all work is derived from it, never the other way around.

- **Schema as binding contract.** Database and API schemas are defined in the spec and implemented as Zod schemas in a single [`shared/schemas.ts`](./shared/schemas.ts) imported by both sides. The same schema enforces types at compile time, validates at runtime, and anchors tests — so two agents implementing opposite ends of an endpoint can't diverge.
- **PR decomposition.** The spec slices work into PRs before a line of code is written. Each PR ships a vertical fragment of user value — never pure technical scaffolding or boilerplate detached from a requirement. PR decomposition prevents implementation drift. Order matters: PRs build on each other in small increments, parallelizing only where the dependency graph allows.

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

## Benchmarking

| Team | Teammates | Agents at Peak | Issues Caught | Issues Fixed | Test Coverage | Time Elapsed |
|------|-----------|----------------|---------------|--------------|---------------|--------------|
| One    | 4         | 10             | 29            | 14           | 85%           | 1            |

## Retrospective

### Went well

- **Parallel execution delivered real time savings.** The lobby backend and placement UI were built simultaneously, as was the battle phase — with no coordination required mid-development. This worked because the backend defined its schemas first and the frontend coded against them. By the time the two agents met, they were already speaking the same language. The final alignment check — did the frontend assume the right field names? — was a quick confirmation, not a discovery.
- **Code review caught real, non-trivial bugs.** Every review pass found something worth fixing — not style issues, actual behavioral bugs:
  - A dead client socket would silently abort the broadcast loop, dropping events for every other connected player
  - Two inline event handlers restarted the live server connection on every render — caught before the battle phase multiplied the re-render count
  - A game-ending shot briefly told the losing player it was their turn — a one-event race, fixed with a one-liner on the server
- **The PM earned their role.** Three standout contributions:
  - Rejected a test that would have failed against correct code
  - Refused a tautological persistence test — QA's first three attempts secretly reimplemented the database logic inside the test itself, meaning the test would pass even if the real implementation was broken
  - Caught two missing SSE integration tests the team lead had signed off as covered. The PM read every test file line by line, cited exact filenames and line numbers, and proved the team lead wrong
- **Mutation testing went beyond the minimum.** The team verified key tests by temporarily breaking the exact production code each test was meant to guard, then confirming the test went red — without being asked. That's the difference between knowing *what* to test and understanding *why*.

### Not so well

- **Naming collision was the biggest waste of time.** QA and PM each proposed tests for the same feature in separate conversations, and each independently numbered their lists B1–B5. When QA said "B2 is covered" and PM said "B2 is missing," they were talking about different tests. Neither noticed until several rounds in. Shared namespacing across agent conversations would have caught it immediately.
- **The PM-QA loop generated too much noise.** The PM was rigorous — genuinely valuable — but produced high message volume: announcing a decision, making the decision, confirming the decision was made. Several times one decision arrived as three messages. The signal was good; the ratio was low.
- **The `max-lines` wall hit twice unexpectedly.** `LobbyScreen.test.tsx` and `App.tsx` both hit the ESLint complexity and line-count caps mid-development. Both were recoverable but added unplanned work. Agents should be briefed on these caps upfront so they design file structure with room to grow.

## What I'd do if I had more time

- Item 1
- Item 2
