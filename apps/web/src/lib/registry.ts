import { useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getProgram, ResearchRegistry } from "@signallab/sdk";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";

export function useRegistryProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    return getProgram(connection, wallet as any);
  }, [connection, wallet]);

  return program;
}

export function shortenAddress(address: PublicKey | string, chars = 4): string {
  if (!address) return "";
  const str = typeof address === "string" ? address : address.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return "-";
  return new Date(timestamp * 1000).toLocaleDateString();
}
