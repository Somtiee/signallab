#!/bin/bash
export PATH="/home/somto/solana-install/solana-release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"

echo "Checking solana-test-validator..."
solana-test-validator --version

echo "Cleaning .anchor directory..."
rm -rf .anchor

echo "Installing node dependencies..."
pnpm install

echo "Running anchor test..."
anchor test