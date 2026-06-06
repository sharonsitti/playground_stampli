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

- [**Claude Hooks**](./.claude/settings.json) — run after every file edit, before the agent moves on. Rules are enforced as hard blocks: strict TypeScript type checking, React hook dependency exhaustion, complexity caps on file size, function length, and branching depth and more.
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
- [**Decision Records**](./docs/spec.md#decision-records) — spec gaps are recorded and only if the gap is genuine, unavoidable, and resolved at the simplest level. Not confirmed until the Team Lead agrees.
- [**Known Issues**](./docs/spec.md#known-issues) — only **critical** issues are fixed in the current cycle. Everything else is deferred.
- [**Contract-driven tests**](./.claude/agents/qa-engineer.md) — tests assert the spec, not the code. The QA engineer never reads the implementation to decide what to assert. The PM verifies all tests map back to Acceptance Criteria before sign-off.
- [**Test integrity rule**](./.githooks/pre-commit) — agents may add new tests but may never modify or delete a committed test. A failing test means the code is wrong, not the test. The pre-commit hook blocks any staged change to a committed test file; only the Team Lead can sign off (`ALLOW_TEST_CHANGES=1`) after reviewing whether the test or the code was at fault.
- **No architect or devil's advocate personas** — the spec is closed and final. Personas that explore alternatives and tradeoffs belong in discovery work; this team is executing a written spec, not designing one. 

## Benchmarking 

I fed the same spec to three teams and tweaked the harness between Iterasions:


| Team | Personas | Teammates at Peak | Issues Caught | Issues Fixed | Test Coverage | Time Elapsed |
|------|-----------|----------------|---------------|--------------|---------------|--------------|
| First    | 4         | 10             | 29            | 14           | 85%           | 1 hour           |
| Second    | 6         | 6             | 8            | 8           | 85%           | 1 hour           |
| Third    | 6         | 3             | 4            | 4           | ~10%           | 30 minutes           |


## Iterations

### First Team
First trial run using Claude Code's experimental teams feature. Used automatically generated teammates with default instructions. No Team Lead or Security Engineer personas included.

**Outcome:** Working Battleship game with high UI fidelity and strong test coverage. Game Over screen not implemented.

**Cost:** High — session tokens exhausted.

### Second Team 

**Upgrades:**

- **Custom personas** — all agents, including the Team Lead, now run from hand-authored instruction prompts instead of Claude's defaults. Each persona has explicit responsibilities, rules, and communication style.
- **UI design system** — the design system markdown was added alongside the mockup screenshot, giving frontend agents a structured token reference rather than relying solely on screenshot interpretation.
- **Teammate cap** — concurrent agents are capped to prevent runaway spawning and reduce noise.
- **Conflict timeout** — any unresolved dispute is decided by the Team Lead within 5 turns. Debates don't loop.
- **PR cycle rule** — no PR is done until critical gaps are closed and both the Team Lead and PM sign off. Code review and QA run in parallel, not sequentially.
- **Contract-driven tests** — QA consistently asserted from the spec, not the implementation. 

**Outcome:** Working Battleship game with high UI fidelity and strong test coverage. Game Over screen not implemented.

**Cost:** High — session tokens exhausted.

### Third Team

**Upgrades:**
- **Test integrity rule** — agents may add tests but never modify or delete a committed one; enforced via pre-commit hook.
- **Coverage cap** — fixed at 5%; never raised or lowered.
- **Explicit parallelism in spec** — the PR plan called out which PRs could run in parallel, removing any guesswork from the Team Lead.
- **Token budget signals** — I occasionally told the Team Lead what percentage of session tokens remained so they could adjust pacing.

**Outcome:** Working Battleship game with high UI fidelity and complete feature set. Weaker test coverage — acceptable for a conceptual example, not a production system.

**Cost:** Medium - 50% session tokens exhuased

## Key Learnings

- **Clearer specs mean fewer agents.** Team 1 peaked at 10 agents; Team 3 peaked at 3. Less ambiguity meant less coordination overhead.
- **The PM blocking sign-off is genuinely useful.** It caught real bugs before code shipped — not just process theater.
- **Agent chatter is hard to fix.** Both Team 1 and Team 2 had agents announcing decisions, making them, then confirming they were made. Personas alone didn't solve it.
- **Enforced rules beat written rules.** The test integrity hook had zero violations. The same rule as policy would have been negotiated around.
- **Token pressure causes shortcuts.** When Team 3 ran low, the Team Lead skipped code review to conserve runway. The tradeoff was real and visible.
- **Agents read markdown better than screenshots.** Team 1 had low UI fidelity when a screenshot was the only visual reference. Adding a design system in markdown — with explicit color tokens, spacing rules, and component specs — gave agents something they could actually reason from. The screenshot became a supplement, not the source of truth.

## Thank you for considering

I really enjoyed working on this assignment. The experimental teams feature was new to me going in, and having a real project to build with it was the best way to learn. I certainly learnt a lot and I'm looking forward to your feedback!

*Built by agents that will never know the joy of yelling "I sunk your battleship!"* 😄

**Sharon Sitti**

📧 sharon.sitti@gmail.com

💼 [linkedin.com/in/sharonsitti](https://www.linkedin.com/in/sharonsitti/)