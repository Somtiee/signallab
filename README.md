SignalLab

SignalLab is a decentralized research registry and coordination layer built on Solana.

It enables researchers to:

📦 Publish datasets with cryptographic provenance

🗳 Run governance polls for funding and decisions

💰 Monetize through on-chain fee mechanics

🌐 Generate a verifiable on-chain social activity feed

SignalLab bridges raw research data and community consensus — ensuring scientific progress is transparent, auditable, and incentive-aligned.

🏗 Monorepo Structure
SignalLab/
├── apps/
│   └── web/                      # Next.js frontend (App Router)
├── packages/
│   └── sdk/                      # TypeScript SDK for Solana program
├── programs/
│   └── research_registry/        # Anchor-based Solana smart contract
├── scripts/                      # Security + maintenance scripts
└── README.md
⚙️ Prerequisites

Node.js v18+

pnpm

Solana CLI

Anchor CLI

Phantom or Solflare wallet (Devnet enabled)

🚀 Quickstart (Localnet – Developer Mode)
1️⃣ Start local validator
solana-test-validator --reset
2️⃣ Build & deploy program
cd programs/research_registry
anchor build
anchor deploy --provider.cluster localnet

If program ID changes:

Update declare_id! in lib.rs

Update Anchor.toml

3️⃣ Run Web App

From root:

pnpm install
cp apps/web/.env.example apps/web/.env.local

Edit:

NEXT_PUBLIC_SOLANA_CLUSTER=localnet

Then:

pnpm --filter web dev

Visit:

http://localhost:3000
🌐 Devnet Deployment (Public Testing Mode)
1️⃣ Switch Solana CLI
solana config set --url https://api.devnet.solana.com
solana airdrop 2
2️⃣ Deploy program
cd programs/research_registry
anchor build
anchor deploy --provider.cluster devnet

Copy the deployed Program ID.

3️⃣ Configure frontend

Edit apps/web/.env.local:

NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RESEARCH_REGISTRY_PROGRAM_ID=YOUR_DEVNET_PROGRAM_ID
TAPESTRY_API_KEY=your_key_here
BIO_API_KEY=your_key_here

Then:

pnpm --filter web dev
💰 Fee Model (Devnet)

SignalLab enforces fees on-chain:

Action	Free Plan	Pro Plan
Create Project	0.005 SOL	Free
Add Dataset	0.001 SOL	Free
Create Poll	0.001 SOL	Free
Pro Subscription	0.1 SOL / 30 days	—
🔐 Pro Subscription

Subscription stored in PDA:

seeds = ["sub", authority]

Includes:

Unlimited project creation

Unlimited datasets

Unlimited polls

Expires after 30 days (on-chain timestamp)

All fee logic is enforced inside the Anchor program.

🧪 End-to-End Testing Flow (Devnet)

Connect wallet (Devnet)

Create Project (/feed -> Radar Tab)

Add Dataset via Migration Tool

Create Poll

Vote

Visit /social (Signals Tab) to see:

Project Created

Dataset Added

Poll Created

Vote Cast

Explorer links automatically match cluster.

🧠 Architecture
                ┌─────────────────────────────┐
                │          Browser UI         │
                │     (Next.js + React)       │
                └──────────────┬──────────────┘
                               │
                               ▼
                ┌─────────────────────────────┐
                │   Solana Wallet Adapter     │
                │ (Phantom / Solflare)        │
                └──────────────┬──────────────┘
                               │
                               ▼
                ┌─────────────────────────────┐
                │   SignalLab Anchor Program  │
                │     (Solana Devnet)         │
                └──────────────┬──────────────┘
                               │
                               ▼
                ┌─────────────────────────────┐
                │ On-chain Accounts (PDAs)    │
                │ - Project                   │
                │ - Dataset                   │
                │ - Poll                      │
                │ - VoteReceipt               │
                │ - Subscription              │
                └─────────────────────────────┘

     External Integrations:
     - Tapestry (On-chain Signals Stream)
     - BIO (Scientific enrichment engine)
🔒 Security Model
Environment Separation

NEXT_PUBLIC_* → exposed to client

API keys validated server-side via env.ts

Git Hygiene

.gitignore excludes:

id.json

*keypair*.json

.env.local

.anchor/

target/

node_modules/

Secret Guard

Pre-commit hook:

scripts/secret-guard.mjs

Blocks:

API keys

Private key blobs

Base58 suspicious strings

Rate Limiting

30 requests/min/IP

Exponential backoff on retries

🧩 Tech Stack

Solana

Anchor

Next.js (App Router)

TypeScript

TailwindCSS

Tapestry SDK

BIO API

pnpm monorepo

📜 License

MIT