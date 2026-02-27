#!/bin/bash

# This script fixes validator issues by clearing the ledger and restarting.
# Use this when the validator fails to start or the UI is stuck.

echo "🛑 Stopping any running validator..."
pkill -f solana-test-validator

echo "🧹 Clearing potentially corrupted ledger data..."
rm -rf ~/.signal-lab-ledger

echo "✅ Ledger cleared."
echo "🚀 Restarting development environment..."

./start_dev.sh
