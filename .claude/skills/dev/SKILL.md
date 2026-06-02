---
name: dev
description: Engineering fundamentals for writing or changing code in this repo — clean code, SOLID, DRY, decoupling, componentization, KISS, and above all no bloat. Use when the user says "/dev", "write this", "implement X", "refactor X", or any non-trivial code change.
---

# dev

Write code a senior engineer would nod at: small, obvious, decoupled, and free of speculative scaffolding. Readability and maintainability win every tie.

## Before you start coding

Plan the change before you touch a keyboard. Skipping this is how you end up rewriting the wrong thing.

- **Read `docs/` for the relevant contract.** PRDs, feature specs, user stories, acceptance criteria — these define *what the product should do*. 
- **Read `CLAUDE.md` for project conventions.** Layout, Makefile entry points, house style, scope. Anything you'd otherwise have to guess is probably stated there.
- **Match the existing paradigms.** Look at neighbouring files in `server/` or `app/` and follow the patterns already in use — module shape, naming, error style, where I/O lives, how tests are wired. A change that reads like the rest of the codebase is a better change than a "more elegant" one that doesn't. If you think the existing pattern is wrong, raise it with the user as a separate discussion — don't quietly introduce a competing style mid-feature.
- **Sketch the plan, then execute.** Name the files you'll touch, the functions you'll add or change, and the seam where the new behavior plugs in. If the plan is non-trivial, surface it to the user before writing code so they can redirect cheaply.

## KISS — pick the boring shape

The simplest thing that satisfies the contract in `docs/` is the right thing. Before reaching for a pattern, ask: would a plain function, plain object, or plain conditional do? If yes, stop there. No factories, no observers, no DI containers, no state machines unless the problem actually has those shapes.

A junior should be able to read the change top-to-bottom and predict what it does. If they can't, simplify until they can.

## DRY — design for reuse from the first line

Aim for DRY upfront. Before you write a function, ask: *what is the reusable unit of knowledge here?* A senior engineer doesn't ship three near-identical functions and then refactor — they see the shared rule first and write it once, in the right place, with the right name.

How to design it on the way in:

1. **Name the rule, then write it.** "Compute the order total with discounts" is a unit of knowledge. `calculateOrderTotal(order)` is its home. The handler, the email, and the receipt all call it — not three copies of the math.
2. **Put the rule where it belongs.** Domain logic in domain modules. Formatting near the view. I/O at the edge. A function placed at the right layer gets reused naturally; one buried in a route handler doesn't.
3. **Shape the API for the callers you can name now.** Parameters should match how real callers think, not a generic "everything is configurable" wish-list. Reusable ≠ infinitely configurable.
4. **Pick a name a teammate could guess.** If the best name you can think of is `helper`, `utils`, `processData`, or `handleStuff`, the abstraction isn't crisp yet — keep thinking about what the rule actually *is*.

The trap to avoid: DRY is about **knowledge**, not **syntax**. Two functions that look alike but encode different rules (e.g., "validate a signup email" vs. "validate a newsletter email") are not duplication — fusing them couples unrelated decisions and you'll pay for it later. If two pieces of code share shape but not meaning, leave them apart.

When you genuinely can't tell yet whether two cases are the same rule or just look alike, write them separately and revisit — but the default posture is *think first, abstract once, reuse forever*, not *duplicate and clean up later*.

## SOLID, pragmatically

- **S — Single responsibility.** A function does one thing the caller can name in a sentence. A module has one reason to change. If you write `and` describing what a function does, split it.
- **O — Open/closed.** Don't pre-build extension points; add them when the second case actually arrives. YAGNI beats OCP at design time.
- **L — Liskov.** If you do subclass, the subclass must be substitutable without surprise. Usually a sign you should compose instead.
- **I — Interface segregation.** Small, role-shaped interfaces. Don't make callers depend on methods they ignore.
- **D — Dependency inversion.** High-level code shouldn't import low-level details directly. Pass collaborators in (function arg, constructor) instead of reaching out to globals, singletons, or module-level I/O. This is what makes code testable.

If applying a SOLID letter adds a file or a layer with no caller benefit *today*, you've over-applied it. Back out.

## Decoupling

Code is decoupled when you can change one piece without chasing edits through five others.

- **Push side-effects to the edges.** Pure functions in the middle (parse, transform, decide); I/O at the boundary (HTTP handler, DB call, file read). The pure core is trivially testable; the shell is thin enough to eyeball.
- **Depend on data, not on modules.** A function that takes `user_id` and a `fetch_user` callable is easier to reuse than one that imports the user repo directly.
- **No reaching across layers.** Frontend components don't know SQL. Route handlers don't format JSX. The server in `server/` and the app in `app/` talk through the documented API surface only.
- **One direction of flow.** Avoid circular imports, two-way data binding between unrelated modules, or "manager" objects that own everything.

## Componentization (frontend specifics)

- Components are small, named for what they *are* (`OrderRow`, not `OrderRowContainer`), and take props that describe data, not behavior soup.
- Local state stays local. Lift state only when two siblings genuinely need it. No global store until there's pain.
- A component renders; it doesn't fetch *and* render *and* validate *and* navigate. Split those — render is one component, the rest are hooks or plain functions.
- No prop drilling more than ~2 levels — at that point, lift or use context for that specific slice, not a god-context.

## Readability checklist (apply before declaring done)

1. **Names.** A variable, function, or file name should let a reader skip the body and still understand the code that uses it. Rename `data`, `result`, `helper`, `utils`, `manager`.
2. **Function length.** If it doesn't fit on a screen, it's doing too much. Split by the seams already present (the comments you were about to write).
3. **Nesting.** Three levels deep is a smell; four is a bug waiting. Use early returns / guard clauses.
4. **Boolean flags in signatures.** `doThing(true, false, true)` is unreadable. Split the function or pass an options object with named fields.
5. **No magic numbers / strings.** Names them at the top of the module if they have meaning. Inline if they're truly local (`for i in range(3)`).
6. **Comments earn their place.** Delete every comment that restates the code. Keep ones that explain a constraint, a workaround, or a non-obvious *why*.
7. **Imports tidy.** No unused, no wildcard, ordered consistently with the rest of the file.

## Tests are out of scope

Do not write, update, or extend tests as part of `/dev`. Testing is a deliberate, separate decision the human user makes by invoking the `add-tests` skill. Do not nudge them toward it either.

If your change causes an existing test to fail, **do not modify the test to make it green**. A failing test is a signal — usually one of:

1. Your change broke a real behavioral contract. Fix the code.
2. The test was enforcing the old behavior and the *contract itself* has changed. Stop, surface the discrepancy to the user, and let them decide whether the test or the code is the source of truth. Updating the test is their call, not yours, and it belongs in an `add-tests` flow.

Editing an existing test inside a `/dev` flow is unacceptable.

## Before you stop

- Did you change a behavioral contract? Update `docs/` in the same change — `docs/` is the source of truth.
- Run `make check` (or the relevant `server-check` / `client-check`) locally before handing back. If a test fails, see the "Tests are out of scope" section — do not edit the test.
- Re-read the diff with one question in mind: *what can I delete?* Almost always the answer is "something." Delete it.

## React patterns and anti-patterns

The frontend in `app/` is React 19 + Vite + TS. The React 19 / React Compiler era changed what "good" looks like.

### Patterns to reach for

1. **Trust the React Compiler.** Write plain, idiomatic components. The compiler memoizes reads, props, and callbacks for you. Spend the saved energy on clarity, not on hand-rolled caching.
2. **Suspense + `use()` for async reads.** Read a promise or context with `use(promise)` and let a `<Suspense>` boundary handle the loading state. Cleaner than `useEffect` → `setState` → "is loading" flag soup.
3. **`useActionState` / form actions for mutations.** React 19's action model gives you pending state, optimistic updates, and error handling without bespoke `isSubmitting` booleans.
4. **Composition over prop drilling.** Pass `children`, use slot-style props, or lean on context for the *specific* slice that needs sharing. Composition is the cheapest decoupling tool React gives you.
5. **Custom hooks for reusable stateful logic.** Pull a coherent piece of behavior (`useDebouncedValue`, `useOrderStatus`) into a hook with a name a caller can guess. One hook, one responsibility.
6. **Refs as regular props.** React 19 removed the need for `forwardRef` in new code — accept `ref` as a normal prop on function components.

### Anti-patterns to avoid

1. **Manual `useMemo` / `useCallback` / `React.memo` as a default.** With the React Compiler, hand-rolled memoization is noise at best and incorrect at worst (stale closures, broken referential identity). Only reach for it with a measured perf problem the compiler genuinely can't see.
2. **`useEffect` for data fetching.** Effects are for *synchronizing with external systems*, not for kicking off requests on mount. Use Suspense + `use()`, a data library (TanStack Query, SWR), or a route loader.
3. **`useEffect` to mirror props into state.** If state is derived from props, *compute it during render*. If you need to "reset" on prop change, use the `key` prop. Mirroring causes double renders and stale data.
4. **Storing derived state in `useState`.** `const fullName = `${first} ${last}`` belongs in render, not in a `useState` + `useEffect`. State is only for things the component *owns*; everything else is a derivation.
5. **Class components, `forwardRef`, default exports for components, index-as-key.** Each of these has a strictly better 2026 replacement: function components, `ref` prop, named exports (better refactors and tooling), stable IDs for keys. If you're writing new code with any of them, stop.
6. **"God effects."** One `useEffect` that subscribes, fetches, logs analytics, and updates the URL is unmaintainable. Split by *which external system you're syncing with* — one effect per concern, each with the minimal dep array it actually needs.

## Python 3.13 patterns and anti-patterns

The backend in `server/` is Python 3.13 + FastAPI + Pydantic v2, managed with `uv`, tested with `pytest`. A lot of older Python advice is now obsolete.

### Patterns to reach for

1. **Modern type syntax.** Use built-in generics (`list[str]`, `dict[str, int]`), `X | None` over `Optional[X]`, `A | B` over `Union[A, B]`, and PEP 695 (`type OrderId = int`, `def first[T](xs: list[T]) -> T`). No `from __future__ import annotations` in 3.13+ — drop it on sight.
2. **Pydantic v2 models at every API boundary.** Request bodies, response models, and internal DTOs are `BaseModel` subclasses. Discriminated unions for polymorphic payloads. Pydantic does the validation, the OpenAPI schema, and the error messages — don't reinvent any of it.
3. **`async def` only when you actually `await`.** Async is a tool for I/O concurrency, not a default. A pure CPU function should be `def`. An I/O-bound handler is `async def` *and* uses async libraries the whole way down (`httpx.AsyncClient`, async DB drivers).
4. **FastAPI `Depends()` for shared resources.** DB sessions, current user, settings, HTTP clients flow in through `Depends()`. No module-level globals, no `request.state` soup, no singletons reached for from inside handlers — that's what makes routes trivially testable.
5. **`pathlib.Path` for filesystem, `httpx` for HTTP, `logging` for diagnostics.** `os.path.join` strings, `requests` in async code, and `print()` for "let me see what's happening" are all 2010s defaults that should not appear in new code.
6. **Let FastAPI's exception handlers do their job.** Raise `HTTPException` (or a domain exception with a registered handler) and stop. Don't `try/except` every route to return a manually-built `JSONResponse` — that's framework code you're duplicating.

### Anti-patterns to avoid

1. **Mutable default arguments.** `def push(item, items: list = []):` — the list is *shared across every call*. Use `None` and assign inside: `items = items if items is not None else []`. Same trap with `dict` and `set`.
2. **Sync I/O inside `async def`.** A blocking `requests.get`, `time.sleep`, or sync DB call inside a coroutine freezes the entire event loop and tanks throughput. If you must call sync code from async, use `asyncio.to_thread`.
3. **`dict` and tuple soup at boundaries.** `def create_order(data: dict) -> dict:` is unvalidated, undocumented, and the OpenAPI schema is empty. Make it a `BaseModel` in and a `BaseModel` out.
4. **Legacy typing imports.** `Optional[X]`, `Union[A, B]`, `typing.List[X]`, `typing.Dict[str, X]`, `typing.Tuple[...]` — all superseded. They're not wrong, but they signal a codebase frozen in 2019. Match the 3.13 idiom.
5. **Bare `except:` or `except Exception:` that swallows.** Catching everything and logging or returning `None` hides bugs and turns crashes into silent corruption. Catch the specific exception you can actually handle; let everything else propagate to FastAPI.
6. **Module-import-time side effects.** Reading env vars into module-level constants, opening DB connections, or making HTTP calls when a file is imported makes tests slow, fragile, and order-dependent. Put initialization inside functions/dependencies invoked at startup or per-request.
