import { PublicKey } from "@solana/web3.js";

// Allow injection via env, otherwise fallback to default devnet/localnet ID
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_RESEARCH_REGISTRY_PROGRAM_ID || 
  "Dcsc3iM5Q9hGPgQtaHHP7mBA3azaiW9rgcmguPuZhRzD"
);

// Hardcoded Treasury for MVP (replace with real one in prod)
export const TREASURY_PUBKEY = new PublicKey("9G8DEvKZmc1ssMyMmxd969GhCMaVT2eYtjGTzwDBshKt");

export const MAX_SLUG_LEN = 32;
export const MAX_METADATA_URI_LEN = 200;
export const MAX_DATA_URI_LEN = 200;
export const MAX_QUESTION_URI_LEN = 200;

export const FEES = {
  PROJECT: 0.005,
  DATASET: 0.001,
  POLL: 0.001,
  PRO_SUBSCRIPTION: 0.1
};
