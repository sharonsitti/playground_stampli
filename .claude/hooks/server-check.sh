#!/usr/bin/env bash
set -euo pipefail

input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Only act on TS files under server/ or shared/
if [[ -z "$file" ]]; then
  exit 0
fi

case "$file" in
  *.ts) ;;
  *) exit 0 ;;
esac

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
server_dir="$repo_root/server"
shared_dir="$repo_root/shared"

if [[ "$file" != "$server_dir"/* && "$file" != "$shared_dir"/* ]]; then
  exit 0
fi

cd "$server_dir"

# Auto-fix lint and format on the changed file — never block on fixable issues
npx eslint --fix --no-warn-ignored "$file" 2>/dev/null || true
npx prettier --write --log-level=error "$file" 2>/dev/null || true

# Type-check — block on failure so Claude self-corrects
if ! tsc_out=$(npx tsc --noEmit 2>&1); then
  echo "$tsc_out" >&2
  exit 2
fi

# Run tests — block on failure so Claude self-corrects
if ! test_out=$(npm test 2>&1); then
  echo "$test_out" >&2
  exit 2
fi

exit 0