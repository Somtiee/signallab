import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "./constants";

export const deriveProjectPda = (
  authority: PublicKey,
  slug: string,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("project"),
      authority.toBuffer(),
      Buffer.from(slug)
    ],
    programId
  );
};

export const deriveDatasetPda = (
  project: PublicKey,
  version: number,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] => {
  // version is u32
  const versionBuf = Buffer.alloc(4);
  versionBuf.writeUInt32LE(version, 0);
  
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("dataset"),
      project.toBuffer(),
      versionBuf
    ],
    programId
  );
};

export const derivePollPda = (
  project: PublicKey,
  optionsHash: Uint8Array | number[],
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] => {
  const hashBuf = Buffer.from(optionsHash);
  if (hashBuf.length !== 32) {
    throw new Error("Options hash must be 32 bytes");
  }

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("poll"),
      project.toBuffer(),
      hashBuf
    ],
    programId
  );
};

export const deriveVoteReceiptPda = (
  poll: PublicKey,
  voter: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote"),
      poll.toBuffer(),
      voter.toBuffer()
    ],
    programId
  );
};

export const deriveSubscriptionPda = (
  authority: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("sub"),
      authority.toBuffer()
    ],
    programId
  );
};
