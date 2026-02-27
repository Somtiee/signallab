#!/bin/bash

# This script starts a persistent localnet for development.
# Data is stored in ~/.signal-lab-ledger and preserved between restarts.

# Add potential solana paths
export PATH="$HOME/solana-install/solana-release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"

# Ensure wallet exists
if [ ! -f ~/.config/solana/id.json ]; then
    echo "Creating new wallet..."
    mkdir -p ~/.config/solana
    solana-keygen new --no-bip39-passphrase -o ~/.config/solana/id.json
fi

# Build program
echo "Building program..."
anchor build

# Ledger path (using home directory for WSL compatibility and persistence)
LEDGER_PATH=~/.signal-lab-ledger
PROGRAM_ID="Dcsc3iM5Q9hGPgQtaHHP7mBA3azaiW9rgcmguPuZhRzD"

echo "Starting persistent Solana Localnet..."
echo "Ledger: $LEDGER_PATH"

# Check if validator is already running
if pgrep -x "solana-test-validator" > /dev/null; then
    echo "Validator is already running. We will just deploy the latest program."
else
    # Start validator in background
    # We load the program on startup. If ledger exists, it resumes state.
    solana-test-validator \
      --bpf-program $PROGRAM_ID target/deploy/research_registry.so \
      --ledger $LEDGER_PATH \
      --url http://127.0.0.1:8899 \
      --quiet &
      
    VALIDATOR_PID=$!
    echo "Validator started (PID: $VALIDATOR_PID). Waiting for it to be ready..."
    
    # Wait for validator
    count=0
    while ! solana cluster-version > /dev/null 2>&1; do
        sleep 1
        count=$((count+1))
        if [ $count -ge 60 ]; then
            echo "Validator failed to start."
            exit 1
        fi
    done
fi

echo "Validator is ready!"
solana config set --url localhost

# Deploy/Upgrade program
echo "Deploying latest program version..."
anchor deploy --provider.cluster localnet

echo "---------------------------------------------------"
echo "Localnet is running and data is PERSISTED in $LEDGER_PATH"
echo "To stop the validator, run: pkill -f solana-test-validator"
echo "---------------------------------------------------"

# Tail logs to keep the window useful
echo "Tailing validator logs (Press Ctrl+C to stop tailing - validator will keep running)..."
tail -f $LEDGER_PATH/validator.log
