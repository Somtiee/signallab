#!/bin/bash
export PATH="/home/somto/solana-install/solana-release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"

# Build program
echo "Building program..."
anchor build

# Kill any existing validator
pkill -f solana-test-validator
sleep 2

# Ensure wallet exists
if [ ! -f ~/.config/solana/id.json ]; then
    mkdir -p ~/.config/solana
    solana-keygen new --no-bip39-passphrase -o ~/.config/solana/id.json
fi

# Start validator with program pre-loaded
echo "Starting validator with program pre-loaded..."
PROGRAM_ID="Dcsc3iM5Q9hGPgQtaHHP7mBA3azaiW9rgcmguPuZhRzD"
solana-test-validator --bpf-program $PROGRAM_ID target/deploy/research_registry.so --reset --quiet &
VALIDATOR_PID=$!
echo "Validator PID: $VALIDATOR_PID"

# Wait for validator to be ready
echo "Waiting for validator..."
count=0
while ! solana cluster-version > /dev/null 2>&1; do
    echo "Waiting for validator... ($count/60)"
    sleep 1
    count=$((count+1))
    if [ $count -ge 60 ]; then
        echo "Validator failed to start within 60 seconds."
        kill $VALIDATOR_PID
        exit 1
    fi
done
echo "Validator is ready!"

# Check status
echo "Checking validator status..."
solana cluster-version
solana block-height
solana balance

# Run tests without deploy
echo "Running anchor test..."
anchor test --skip-local-validator --skip-build --skip-deploy

# Kill validator
kill $VALIDATOR_PID