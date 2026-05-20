#!/bin/bash
# One-time setup for a fresh clone. Run once after cloning.
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
git -C "$REPO_ROOT" config core.hooksPath hooks
chmod +x "$REPO_ROOT/hooks/"*
echo "Git hooks installed (hooks/ directory)."
