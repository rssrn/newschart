#!/bin/bash
# One-time setup for a fresh clone. Run once after cloning.
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
git -C "$REPO_ROOT" config core.hooksPath hooks
chmod +x "$REPO_ROOT/hooks/"*
echo "Git hooks installed (hooks/ directory)."

# The pre-push hook runs the Playwright accessibility suite, which needs a browser
# binary. Without one the suite fails with "Executable doesn't exist", which reads
# like a wall of real a11y failures. Install it up front so a fresh clone can push.
cd "$REPO_ROOT/frontend"
if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm ci
fi
echo "Installing Playwright browser..."
npx playwright install chromium
echo "Setup complete."
