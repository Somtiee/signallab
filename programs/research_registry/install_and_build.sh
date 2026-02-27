#!/bin/bash
export PATH="/home/somto/solana-install/solana-release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"

echo "Installing types..."
pnpm add -D @types/mocha @types/chai @types/node

echo "Building..."
anchor build