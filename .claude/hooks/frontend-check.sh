#!/usr/bin/env bash
set -euo pipefail

input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Only act on TS/TSX/CSS files under app/
if [[ -z "$file" ]]; then
  exit 0
fi

case "$file" in
  *.ts|*.tsx|*.css) ;;
  *) exit 0 ;;
esac

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
app_dir="$repo_root/app"

if [[ "$file" != "$app_dir"/* ]]; then
  exit 0
fi

rel="${file#"$app_dir"/}"

cd "$app_dir"

# Auto-fix lint and format — never block on fixable issues
npx eslint --fix --no-warn-ignored "$rel" 2>/dev/null || true
npx prettier --write --log-level=error "$rel" 2>/dev/null || true

# Type-check (TS/TSX only) — block on failure so Claude self-corrects
if [[ "$file" == *.ts || "$file" == *.tsx ]]; then
  if ! tsc_out=$(npx tsc -b --noEmit 2>&1); then
    echo "$tsc_out" >&2
    exit 2
  fi
fi

exit 0
