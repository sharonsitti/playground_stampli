# Playground — coding-interview pairing repo

A full-stack app (Express backend + React frontend) used as a pairing surface for technical interviews. Keep changes minimal, demonstrative, and easy to read.

## Layout

```
server/                Node.js/Express backend
  src/index.ts         Entry point — routes live here
  package.json
  tsconfig.json
app/                   React frontend
  src/App.tsx          Root component
  src/components/ui/   shadcn/ui primitives (button, card, dialog, input)
  src/lib/utils.ts     Shared utilities (cn helper)
  tests/               Vitest + @testing-library tests
  vite.config.ts       Vite + Tailwind CSS v4 config
docs/                  Product/technical context — source of truth for behavior
.claude/
  skills/              Project-local Claude skills (spec, dev, add-tests, make-pr)
  hooks/               PostToolUse hooks (frontend-check.sh)
  settings.json        Permissions, hooks, enabled plugins
.github/               CI workflows (client-ci on every PR)
.githooks/pre-commit   Runs `make client-check` before every commit
Makefile               Single entry point for dev, install, lint, type, test
```

## Tech stack

| Layer | Tech |
|---|---|
| Backend language | Node.js 22, TypeScript 5 |
| Backend framework | Express 5 |
| Backend dev runner | tsx (watch mode, no build step) |
| Frontend language | TypeScript 6, React 19, Vite 8 |
| Frontend styling | Tailwind CSS v4 (via @tailwindcss/vite), tw-animate-css |
| Frontend components | shadcn/ui (Base UI primitives + CVA + clsx + tailwind-merge) |
| Frontend icons | lucide-react |
| Frontend lint/format | ESLint 10 + typescript-eslint, Prettier + prettier-plugin-tailwindcss |
| Frontend tests | Vitest, @testing-library/react, happy-dom |

## docs/ is the source of truth

`docs/` holds PRDs, feature specs, user stories, acceptance criteria, KPIs — anything describing *what the product should do*. **Always read it before making behavioral changes, and curate it as the project evolves.** When a behavioral decision is made in conversation, capture it in `docs/` so future sessions inherit the contract.

If `docs/` is empty or silent on a feature you're touching, ask the user for the spec — don't infer intent from the code.

## Makefile — the commands to know

Run from repo root.

| Command | What it does |
|---|---|
| `make install` | Install all deps (frontend + server) + git hook |
| `make dev` | Start both dev servers in parallel (:3000 frontend, :8000 server) |
| `make check` | Lint + typecheck + test both frontend and server |
| `make client-check` | Lint + typecheck + test the frontend only |
| `make client-test` | Frontend tests only |
| `make client-lint` | Frontend lint only |
| `make client-typecheck` | Frontend type-check only |
| `make client-build` | Production build of the frontend |
| `make server-check` | Lint + typecheck + test the server only |
| `make server-test` | Server tests only |
| `make server-lint` | Server lint only |
| `make server-typecheck` | Server type-check only |
| `make server-install` | Install server deps only |
| `make server-dev` | Start the server dev server only |

CI runs `make client-check` only (server has no CI — local playground only).

A git `pre-commit` hook in [.githooks/](./.githooks/) runs `make check` (both sides) before every commit. `make install` (or `make install-hooks` standalone) points `core.hooksPath` at that directory. Bypass with `git commit --no-verify` only for genuine emergencies.

## Harness — hooks, permissions, plugins

### PostToolUse hooks (auto-run after every Edit/Write/MultiEdit)

**`.claude/hooks/frontend-check.sh`** — fires on `.ts`, `.tsx`, `.css` files under `app/`:
1. Auto-fixes: `eslint --fix` + `prettier --write` (never blocks)
2. Blocks and surfaces errors to Claude on `tsc -b --noEmit` failure (exit 2) for TS/TSX files

**`.claude/hooks/server-check.sh`** — fires on `.ts` files under `server/`:
1. Auto-fixes: `eslint --fix` + `prettier --write` (never blocks)
2. Blocks and surfaces errors to Claude on `tsc --noEmit` failure (exit 2)

### Allowed permissions (`.claude/settings.json`)

Pre-approved without a prompt:
- `Bash(gh repo *)`, `Bash(gh pr *)`, `Bash(git push *)`
- `Bash(npm *)`, `Bash(npx *)`
- `Bash(make *)`
- `Bash(git mv *)`, `Bash(git check-ignore *)`
- `mcp__plugin_context7_context7__resolve-library-id`
- `mcp__plugin_context7_context7__query-docs`
- `Edit(/.claude/skills/spec/**)`

### Enabled plugins / MCPs

**context7** (`@claude-plugins-official`) — fetch current library docs on demand.
- Tools: `resolve-library-id`, `query-docs`
- Use whenever touching an unfamiliar library API — training data may be stale.

**frontend-design** (`@claude-plugins-official`) — production-grade UI generation skill.
- Triggered automatically when building components, pages, or web interfaces.

## Skills

Project-local skills live in `.claude/skills/`. Invoke when the user's request matches the trigger:

- **`spec`** — authors `docs/feat-<name>.md`: goal, problem, personas, ranked requirements with measurable acceptance criteria, workflows, PR plan, risks. Use for "spec X", "/spec", "write the spec for...". Asks at most 3 critical clarifying questions, then drafts; any remaining unknowns become an "Open questions" section in the doc.
- **`dev`** — engineering fundamentals for non-trivial code changes: clean code, SOLID, DRY, decoupling, componentization, KISS, no bloat. Use for "/dev", "implement X", "refactor X". Plans against `docs/` + `CLAUDE.md` before writing; never touches tests (that's `add-tests`).
- **`add-tests`** — writes unit/integration tests **driven by `docs/`**, not the implementation. Use for "add tests", "/add-tests", "write tests for X". Proposes ranked happy/unhappy checks first and waits for confirmation before writing code. Refuses to proceed if `docs/` is silent on the feature.
- **`make-pr`** — opens or refreshes a GitHub PR for the current branch via `gh`. Use for "make a PR", "/make-pr", "update the PR". Pushes the branch and submits without further confirmation.

Global skills also available (from `~/.claude/skills/` or plugin registry):
- **`frontend-design`** — polished, production-grade component/page generation.
- **`verify`** — runs the app and confirms a change works end-to-end.
- **`simplify`** — reviews changed code for quality and fixes issues found.
- **`security-review`** — security review of pending branch changes.
- **`run`** — launch the app and observe behavior.
- **`update-config`** — modify `.claude/settings.json` (permissions, hooks, env vars).

## House style

- Prefer editing existing files over creating new ones.
- No bloat: don't add deps, scripts, abstractions, or files until a concrete use exists.
- No comments explaining *what* code does — only *why* when non-obvious.
- Interview scope: pick the simplest pattern that demonstrates the idea (no Redux, no microservices, no premature scaffolding).
