#!/bin/bash
export PATH="/home/somto/solana-install/solana-release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"
exec > deploy_log.txt 2>&1

echo "Configuring Solana..."
solana config set --url devnet

echo "Checking Balance..."
solana balance

echo "Attempting Airdrop..."
solana airdrop 2 || echo "Airdrop 2 failed"
sleep 5
solana airdrop 1 || echo "Airdrop 1 failed"

echo "Checking Balance after airdrop..."
solana balance

echo "Deploying Program..."
cd /mnt/c/Users/USER/Documents/trae_projects/SignalLab
solana program deploy programs/research_registry/target/deploy/research_registry.so --program-id programs/research_registry/target/deploy/research_registry-keypair.json

echo "Deployment Complete!"
