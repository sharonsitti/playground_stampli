---
name: make-pr
description: Create or update a GitHub pull request for the current branch using the gh CLI. If a PR already exists for the branch, refresh its title/description from the latest commits and diff; otherwise open a new one. No need for user's confirmation. Use when the user says "make a PR", "update the PR", "/make-pr", or similar.
---

# make-pr

Create or update a GitHub pull request for the current branch using `gh`. If a PR already exists for the branch, refresh it; otherwise open a new one. Either way, push and submit without confirmation.

## Detect existing PR

- Current branch: `git branch --show-current`.
- Base branch: `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`.
- Check for an open PR for this branch: `gh pr list --head <branch> --state open --json number,url,title,body`.
- If a result is returned, you will **update** that PR. Otherwise, you will **create** a new one.

## Gather context

- Commits on the branch (`git log <base>...HEAD --oneline`) and the diff against base (`git diff <base>...HEAD --stat` for an overview; read specific files as needed).
- For updates, the existing PR title and body come from the `gh pr list` call above — use them to decide what actually needs to change.

## Draft the PR body

Use this template:

```markdown
## Goal
<what this PR is trying to achieve>

## Outcomes
- <high-level outcome>

## Changes
- <high-level change>

## Acceptance criteria
- <only include this section if criteria are available from the user, issue, or branch context>

## Test plan
- [ ] <how to verify>

## Known issues / risks
- <only include this section if there is something critical or high-importance to flag (e.g. data migration risk, breaking change, known regression, security implication). Otherwise omit entirely — empty risk sections are noise.>
```

**Title** — under 70 chars, imperative mood, summarizes the change. For updates, keep the existing title unless the scope has materially shifted.

## Push and submit

1. Check `git status` for uncommitted changes. If any look like they belong in this PR, surface them to the user before continuing — don't auto-commit.
2. Push the branch: `git push -u origin <branch>` (safe whether or not upstream is set). Required for both create and update flows so the remote matches what the PR description claims.
3. Submit:
   - **Create**: `gh pr create --title ... --body ...` with a HEREDOC body to preserve formatting.
   - **Update**: `gh pr edit <number> --body ...` with a HEREDOC body. Add `--title ...` only if the title needs to change.

Report the PR URL.

## Rules

- Never use `--no-verify` or skip hooks.
- Never force-push.
- Do not push to `main`/`master`.
- If `gh pr create` / `gh pr edit` fails, surface the error verbatim — don't retry blindly.
- Do not invent a base branch; always derive it from `gh repo view`.
- For updates, only rewrite sections that actually changed. Don't churn the description for cosmetic reasons.
