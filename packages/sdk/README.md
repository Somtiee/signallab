# @signallab/sdk

Production-quality TypeScript SDK for the SignalLab Research Registry Solana program.

## Installation

```bash
npm install @signallab/sdk @solana/web3.js @coral-xyz/anchor
# or
yarn add @signallab/sdk @solana/web3.js @coral-xyz/anchor
```

## Usage in Next.js

### 1. Initialize the Client

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { getProgram, ResearchRegistryClient } from "@signallab/sdk";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

// In your component or hook
const wallet = useAnchorWallet();
const connection = new Connection("https://api.devnet.solana.com");

const program = getProgram(connection, wallet as any);
const client = new ResearchRegistryClient(program);
```

### 2. Derive PDAs

```typescript
import { deriveProjectPda, deriveDatasetPda } from "@signallab/sdk";

// Get Project PDA
const [projectPda] = deriveProjectPda(wallet.publicKey, "my-project-slug");

// Get Dataset PDA
const version = 1;
const [datasetPda] = deriveDatasetPda(projectPda, version);
```

### 3. Send Transactions

```typescript
// Create Project
const tx = await client.createProject(
  wallet.publicKey,
  "my-project-slug",
  "https://example.com/metadata.json"
);

// Sign and send
const signature = await wallet.sendTransaction(tx, connection);
await connection.confirmTransaction(signature);
```

## API Reference

### PDAs

- `deriveProjectPda(authority: PublicKey, slug: string)`
- `deriveDatasetPda(project: PublicKey, version: number)`
- `derivePollPda(project: PublicKey, optionsHash: Uint8Array)`
- `deriveVoteReceiptPda(poll: PublicKey, voter: PublicKey)`

### Instructions

- `createProject(authority, slug, metadataUri)`
- `addDataset(authority, project, version, contentHash, dataUri)`
- `createPoll(authority, project, questionUri, optionsHash, endTs, mode)`
- `castVote(voter, poll, choice)`

## Validation

Input validation is enforced using Zod:
- Slugs: Max 32 chars
- URIs: Max 200 chars, valid URL format
- Content/Options Hash: Must be 32 bytes

## Constants

- `PROGRAM_ID`: `Dcsc3iM5Q9hGPgQtaHHP7mBA3azaiW9rgcmguPuZhRzD`
