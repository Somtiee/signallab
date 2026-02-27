#!/bin/bash
export PATH="/home/somto/solana-install/solana-release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"

echo "Installing @solana/web3.js..."
pnpm add -D @solana/web3.js