#!/bin/bash
# SessionStart hook — keep every session on the canonical branch with the latest
# contents, so work never lands on a stale local ref or the wrong branch (see
# CLAUDE.md). Runs synchronously so the branch is correct before the agent starts.
set -uo pipefail

# Only relevant in Claude Code on the web (remote) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# The one branch all work goes to (must match CLAUDE.md).
BRANCH="claude/monitor-comparison-app-bb0k5l"

# Only reshape the checkout on a fresh session start; never disturb a resumed or
# compacted session (its container is cached and may hold in-progress work).
payload="$(cat)"
source="$(printf '%s' "$payload" | grep -o '"source"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"([^"]*)"$/\1/')" || true
if [ "${source:-startup}" != "startup" ]; then
  exit 0
fi

# --- Switch to the canonical branch, fast-forwarded to origin -----------------
# Skipped (not fatal) if the tree is dirty — never clobber uncommitted changes.
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "session-start: working tree not clean — leaving the current branch untouched." >&2
elif git fetch --quiet origin "$BRANCH" 2>/dev/null; then
  git checkout --quiet "$BRANCH" 2>/dev/null \
    || git checkout --quiet -b "$BRANCH" --track "origin/$BRANCH" 2>/dev/null || true
  # ff-only never discards divergent local commits; it warns and leaves as-is.
  git merge --ff-only --quiet "origin/$BRANCH" 2>/dev/null \
    || echo "session-start: could not fast-forward $BRANCH to origin (diverged) — left as-is." >&2
  echo "session-start: on $(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse --short HEAD)" >&2
else
  echo "session-start: git fetch failed — leaving the current branch untouched." >&2
fi

# --- Install dependencies so build/tests/linters work immediately -------------
# Idempotent; the container state is cached after the hook completes.
if [ -f package.json ]; then
  npm install --no-audit --no-fund >&2
fi
