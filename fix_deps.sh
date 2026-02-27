#!/bin/bash
# Load NVM if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Using Node version: $(node --version)"
echo "Running pnpm install..."
pnpm install --shamefully-hoist
