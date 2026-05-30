#!/usr/bin/env sh
set -eu

SCHEMA_FILE="packages/shared-types/prisma/schema.prisma"
MIGRATIONS_DIR="packages/shared-types/prisma/migrations/"

if [ "${1:-}" = "--" ]; then
  shift
fi

if [ "${1:-}" = "--ci" ]; then
  base_branch="${2:-${GITHUB_BASE_REF:-main}}"
  git fetch --no-tags --depth=100 origin "$base_branch" >/dev/null 2>&1 || true
  base_ref="origin/$base_branch"
  merge_base="$(git merge-base HEAD "$base_ref" 2>/dev/null || git rev-parse HEAD^)"
  changed_files="$(git diff --name-only --diff-filter=ACMR "$merge_base"...HEAD)"
else
  changed_files="$(git diff --cached --name-only --diff-filter=ACMR)"
fi

schema_changed=false
migration_changed=false

printf '%s\n' "$changed_files" | grep -qx "$SCHEMA_FILE" && schema_changed=true
printf '%s\n' "$changed_files" | grep -q "^$MIGRATIONS_DIR" && migration_changed=true

if [ "$schema_changed" = true ] && [ "$migration_changed" = false ]; then
  echo "Prisma schema changed without a staged migration."
  echo ""
  echo "Create one with:"
  echo "  pnpm db:migrate -- --name describe_your_change"
  echo ""
  echo "Then stage both:"
  echo "  git add $SCHEMA_FILE $MIGRATIONS_DIR"
  exit 1
fi
