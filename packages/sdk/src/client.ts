import { PublicKey, Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, Wallet } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "./constants";
import idl from "./idl/research_registry.json";

import { ResearchRegistry } from "./types";

export const getProgram = (
  connection: Connection,
  wallet?: Wallet,
  programId: PublicKey = PROGRAM_ID
): Program<ResearchRegistry> => {
  const provider = new AnchorProvider(
    connection,
    wallet || ({ publicKey: PublicKey.default, signTransaction: () => Promise.reject(), signAllTransactions: () => Promise.reject() } as any),
    AnchorProvider.defaultOptions()
  );
  
  return new Program(idl as Idl, provider) as unknown as Program<ResearchRegistry>;
};
