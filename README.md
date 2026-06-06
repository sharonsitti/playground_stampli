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
- [**Test coverage**](./app/vite.config.ts) — frontend test coverage is enforced at 5% across all metrics. Intentionally low — this is a conceptual example, not a production system. 

- **Instruction prompts** 
  - [CLAUDE.md](./CLAUDE.md) — project-wide context: repo layout, tech stack, house style, conventions
  - [Team Lead](./.claude/agents/team-lead.md) — orchestrates agents, parallelizes work, owns commits and PRs, and is the final decision-maker on any cross-cutting call
  - [Backend Engineer](./.claude/agents/backend-engineer.md) — implements and reviews all server-side code: Express routes, SQLite schema, and repository layer
  - [Frontend Engineer](./.claude/agents/frontend-engineer.md) — implements and reviews all client-side code: React components, state management, and Tailwind styling
  - [Product Manager](./.claude/agents/product-manager.md) — guards scope, validates delivery against the spec's acceptance criteria, and blocks sign-off when requirements aren't fully met
  - [QA Engineer](./.claude/agents/qa-engineer.md) — writes tests derived from the spec and user flows, not the implementation, to ensure the suite enforces the product contract
  - [Security Engineer](./.claude/agents/security-engineer.md) — reviews PRs for OWASP Top 10 vulnerabilities, SQL injection, XSS, and input validation gaps across the full stack

## Key Rules and Descisions

- [**Team Lead authority**](./.claude/agents/team-lead.md) — the Team Lead is the final decision-maker on all open questions. Any dispute that hasn't converged within 5 turns gets decided by the Team Lead; debates don't spiral.
- [**Commit and push gate**](./.claude/agents/team-lead.md) — the Team Lead is the only agent permitted to commit and push. Each push is their sign-off that the full PR cycle has concluded.
- [**Product Manager authority**](./.claude/agents/product-manager.md) — new scope is never silently absorbed; it gets explicitly evaluated or it doesn't happen. The PM blocks sign-off on any feature that doesn't fully match the spec.
- [**Decision Records**](./.claude/agents/product-manager.md) — spec gaps are recorded and only if the gap is genuine, unavoidable, and resolved at the simplest level. Not confirmed until the Team Lead agrees.
- [**Known Issues**](./.claude/agents/product-manager.md) — only **critical** issues are fixed in the current cycle. Everything else is deferred.
- [**Contract-driven tests**](./.claude/agents/qa-engineer.md) — tests assert the spec, not the code. The QA engineer never reads the implementation to decide what to assert. The PM verifies all tests map back to Acceptance Criteria before sign-off.
- [**Test integrity rule**](./.githooks/pre-commit) — agents may add new tests but may never modify or delete a committed test. A failing test means the code is wrong, not the test. The pre-commit hook blocks any staged change to a committed test file; only the Team Lead can sign off (`ALLOW_TEST_CHANGES=1`) after reviewing whether the test or the code was at fault.