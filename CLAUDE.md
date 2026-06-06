# Playground — coding-interview pairing repo

A full-stack app (Express backend + React frontend) used as a pairing surface for technical interviews. Keep changes minimal, demonstrative, and easy to read.

## Layout

```
server/                Node.js/Express backend
  src/index.ts         Entry point — routes live here
  src/db/              Database layer
    schema.sql         Table definitions — run on startup
    *.repository.ts    One repository file per entity
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
  skills/              Project-local Claude skills
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
| Frontend lint/format | ESLint 10 + typescript-eslint + eslint-plugin-security, Prettier + prettier-plugin-tailwindcss |
| Frontend tests | Vitest + @vitest/coverage-v8, @testing-library/react, happy-dom |
| Database | better-sqlite3 (local SQLite, single `.db` file) |


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

### ESLint rule posture

Both `app/` and `server/` use `eslint-plugin-security` to catch SQL injection, unsafe regex, `eval`, and similar patterns. In `app/`, the complexity caps (`max-lines`, `max-lines-per-function`, `complexity`) are **errors**, not warnings — agents are hard-blocked, not nudged.

Two additional rules fire as errors and commonly surprise agents:
- **`react-hooks/exhaustive-deps`** — every variable captured inside `useEffect`/`useCallback`/`useMemo` must appear in the dependency array, or the hook blocks the commit. Missing deps are the most common React bug.
- **`react-x/no-array-index-key`** — using an array index as a React `key` prop is an error. Use a stable, unique id (e.g. cell coordinates, ship type) instead.

### Coverage thresholds (frontend)

`make client-test` runs `vitest run --coverage`. Thresholds are enforced in `app/vite.config.ts`:

| Metric | Threshold |
|---|---|
| Statements | 5% |
| Branches | 5% |
| Functions | 5% |
| Lines | 5% |

Intentionally low — this is a conceptual pairing surface, not a production system. The threshold exists to catch complete regressions, not enforce production-grade coverage. **Never raise it, never lower it — keep it fixed at 5%.**

### Pre-commit test protection

**Rule: agents may write new tests but may never modify or delete an existing committed test. If a test fails, the code is wrong — not the test.**

The pre-commit hook enforces this. It guards against modifications or deletions of committed test files at commit time.

**Normal path:** no committed test files in the staged diff → `make check` runs → commit proceeds.

**Blocked path:** a committed test file (`*.test.ts`, `*.test.tsx`, `*.spec.ts`, etc.) appears as modified or deleted in the staged diff → hook prints the affected files and the review command, then exits 1. The commit does not happen.

**Approved path:** team-lead reviews the diff, decides the change is legitimate, re-runs with `ALLOW_TEST_CHANGES=1 git commit ...` → hook prints a confirmation line and continues to `make check`.

Key properties:
- New test files (not yet in HEAD) pass through silently — no friction for writing new tests
- Adding tests to an existing committed file triggers the warning — team-lead reviews and decides
- `ALLOW_TEST_CHANGES=1` is not persistent; every commit touching test files requires a conscious decision
- The team-lead is the only agent who commits, so this gate is always at the right level of authority

### Allowed permissions (`.claude/settings.json`)

Pre-approved without a prompt:
- `Bash(gh repo *)`, `Bash(gh pr *)`, `Bash(git push *)`
- `Bash(npm *)`, `Bash(npx *)`
- `Bash(make *)`
- `Bash(git mv *)`, `Bash(git check-ignore *)`
- `mcp__plugin_context7_context7__resolve-library-id`
- `mcp__plugin_context7_context7__query-docs`

### Enabled plugins / MCPs

**context7** (`@claude-plugins-official`) — fetch current library docs on demand.
- Tools: `resolve-library-id`, `query-docs`
- Use whenever touching an unfamiliar library API — training data may be stale.

**frontend-design** (`@claude-plugins-official`) — production-grade UI generation skill.
- Triggered automatically when building components, pages, or web interfaces.

## Skills

Global skills available (from `~/.claude/skills/` or plugin registry):
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
- **Tailwind CSS v4:** syntax differs significantly from v3 (CSS-native `@theme {}` config, no `tailwind.config.js`). Use context7 to fetch current Tailwind v4 docs before writing any styles — do not rely on v3 patterns from training data.
- **shadcn/ui components:** only use what is already installed: `button`, `card`, `dialog`, `input`. Do not install additional components.

## Server conventions

- **`better-sqlite3` is synchronous.** All DB calls return values directly — no `async`/`await`, no `.then()`. Wrapping them in `async` functions compiles fine but is misleading; keep DB calls synchronous throughout.
- **Ports:** server runs on `8000`, frontend on `3000`. The CORS header in `server/src/index.ts` already allows `http://localhost:3000`. Frontend API calls go to `http://localhost:8000`.
- **Server tests** use vitest + supertest (same vitest as the frontend). See `server/src/index.test.ts` for the pattern.

## `@shared` alias

`shared/` is a module shared between `server/` and `app/`. It must be configured in three places:

1. **`app/vite.config.ts`** — add to `resolve.alias`: `'@shared': path.resolve(__dirname, '../shared')`
2. **`app/tsconfig.json`** — add to `compilerOptions.paths`: `"@shared/*": ["../shared/*"]`
3. **`server/tsconfig.json`** — add to `compilerOptions.paths`: `"@shared/*": ["../shared/*"]`; also register `tsconfig-paths` with tsx so path aliases resolve at runtime (pass `-r tsconfig-paths/register` or equivalent)

Import as `import { Foo } from '@shared/schemas'` on both sides. Never use relative `../../shared` imports in source files.

**Third-party deps in `shared/`:** `shared/` has no `node_modules`. Any bare third-party import inside `shared/*.ts` (currently `zod`) must be aliased to each side's own installed copy. If you add a new third-party import to a `shared/` file, add a one-line alias on ALL THREE of: `server/tsconfig.json paths`, `app/tsconfig.json paths`, and `app/vite.config.ts resolve.alias`.
