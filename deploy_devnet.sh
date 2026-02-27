#!/bin/bash
export PATH="/home/somto/solana-install/solana-release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"

echo "Deploying to Devnet..."
solana config set --url devnet
solana balance
cd programs/research_registry
anchor deploy --provider.cluster devnet
