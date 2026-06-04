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

## Why this stack

The choices optimize for **fast iteration, clarity of contract, and minimal setup tax** — so a small team can land changes quickly and trust what they're shipping.

- **Setup is one command.** `make install` does everything; `make dev` boots both sides. The only prerequisite is Node 22+ — no runtime juggling, no "works on my machine."
- **Feedback is instant.** Hot reload on the frontend, `tsx watch` on the backend, millisecond test runs, types checked as you type. You think about the problem, not the tools.
- **The toolchain is conventional.** Idiomatic choices throughout (`Vitest`, `Tailwind`, `shadcn/ui`, `Prettier`, `ESLint`, `Express`) — anyone familiar with the ecosystem is productive immediately.
- **The same checks run everywhere.** A pre-commit hook, CI, and `make check` all call the same targets. Green locally = green in CI.

The net effect: less time on plumbing, more time on the change you actually came here to make — and a codebase that stays legible as it grows.

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
