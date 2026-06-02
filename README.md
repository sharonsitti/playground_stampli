# playground

A small full-stack app — **FastAPI** (Python) backend + **React + Vite + TypeScript** frontend — set up for rapid, collaborative, pair-friendly development. The scaffold is deliberately minimal: each tool earns its place, nothing is added until it's needed.

## Quick start

You'll need [`uv`](https://docs.astral.sh/uv/) (Python) and Node 22+.

```bash
make install   # install all deps + wire up the pre-commit hook (run once)
make dev       # start both servers in parallel
```

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>

## Why this stack

The choices optimize for **fast iteration, clarity of contract, and minimal setup tax** — so a small team can land changes quickly and trust what they're shipping.

- **Setup is one command.** `make install` does everything; `make dev` boots both sides. The only prerequisites are `uv` and Node 22+ — no version-manager juggling, no "works on my machine."
- **Feedback is instant.** Hot reload on the frontend, autoreload on the backend, millisecond test runs, types checked as you type. You think about the problem, not the tools.
- **The contract stays visible.** FastAPI generates a live Swagger UI from route signatures, so the API documents itself. Strict type checking on both sides surfaces bugs at edit time. Lockfiles on both sides pin every dependency.
- **The toolchain is conventional.** Idiomatic choices throughout (`pytest`, `Vitest`, `Tailwind`, `shadcn/ui`, `Prettier`, `ruff`) — anyone familiar with the ecosystem is productive immediately. No custom build pipelines, no bespoke abstractions to learn.
- **The same checks run everywhere.** A pre-commit hook, CI, and `make check` all call the same targets. Green locally = green in CI, with no last-minute surprises.

The net effect: less time on plumbing, more time on the change you actually came here to make — and a codebase that stays legible as it grows.

## How the harness works

The repo is set up to stay productive whether a human or [Claude Code](https://docs.claude.com/en/docs/agents-and-tools/claude-code) is at the keyboard. The pieces:

- **[`docs/`](./docs/)** — used for Spec Driven Development. Features, product context and goals, and high level design are derived from here. Write the spec first; everything else follows from it.
- **[`CLAUDE.md`](./CLAUDE.md) files** — load project context automatically at the start of every Claude session, so Claude isn't starting cold. Kept close to the code they describe.
- **[`.claude/settings.json`](./.claude/settings.json)** — controls what Claude is allowed to do autonomously without prompting. Tuned to reduce friction for routine tasks while keeping destructive actions gated.
- **[`.claude/hooks/`](./.claude/hooks/)** — auto-fix lint and format on every file Claude touches, and surface type errors immediately. Keeps the working tree clean turn-by-turn instead of letting issues pile up until CI runs.
- **[`.claude/skills/`](./.claude/skills/)** — project-local workflows for common tasks: writing contract-driven tests (`add-tests`) and managing pull requests (`make-pr`). Encodes the right process so it doesn't need to be re-explained each session.
- **[`.githooks/`](./.githooks/)** — pre-commit hook that runs `make check` before every commit. Catches issues before they reach CI; `make install` wires it up automatically.
- **[`.github/workflows/`](./.github/workflows/)** — CI that mirrors local checks exactly, plus a dependency vulnerability scan on the backend. No surprises between local and remote.

Everything in the harness is designed around the same minimalism as the codebase: keep what earns its keep, fail fast on real bugs, stay out of the way the rest of the time.
