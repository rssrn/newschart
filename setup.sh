#!/bin/bash
# One-time setup for a fresh clone. Run once after cloning.
set -e

git config core.hooksPath hooks
chmod +x hooks/*
echo "Git hooks installed (hooks/ directory)."
