#!/bin/bash
set -euo pipefail

# Only run in remote environment (Claude Code on the web)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Run in async mode for faster session startup
echo '{"async": true, "asyncTimeout": 300000}'

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies with pnpm
# Using pnpm install instead of pnpm install --frozen-lockfile
# to take advantage of container state caching
pnpm install

# Run database migrations for local D1 database
pnpm db:migrate
