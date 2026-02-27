import { PublicKey, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { z } from "zod";
import { ResearchRegistry } from "./types";
import { 
  deriveProjectPda, 
  deriveDatasetPda, 
  derivePollPda, 
  deriveVoteReceiptPda,
  deriveSubscriptionPda
} from "./pdas";
import { 
  MAX_SLUG_LEN, 
  MAX_METADATA_URI_LEN, 
  MAX_DATA_URI_LEN, 
  MAX_QUESTION_URI_LEN,
  TREASURY_PUBKEY
} from "./constants";

// Zod schemas for input validation
const SlugSchema = z.string().max(MAX_SLUG_LEN, "Slug too long").min(1, "Slug cannot be empty");
const UriSchema = z.string().max(MAX_METADATA_URI_LEN, "URI too long").url("Invalid URI format");
const DataUriSchema = z.string().max(MAX_DATA_URI_LEN, "Data URI too long").url("Invalid URI format");
const QuestionSchema = z.string().max(MAX_QUESTION_URI_LEN, "Question too long").min(1, "Question cannot be empty");

export class ResearchRegistryClient {
  constructor(public program: Program<ResearchRegistry>) {}

  async subscribePro(
    authority: PublicKey
  ): Promise<TransactionInstruction> {
    const [subscriptionPda] = deriveSubscriptionPda(authority, this.program.programId);

    return await (this.program.methods as any)
      .subscribePro()
      .accounts({
        authority,
        subscription: subscriptionPda,
        treasury: TREASURY_PUBKEY,
        system_program: SystemProgram.programId,
      } as any)
      .instruction();
  }

  async createProject(
    authority: PublicKey,
    slug: string,
    metadataUri: string,
    subscriptionPda?: PublicKey | null
  ): Promise<TransactionInstruction> {
    // Validate inputs
    SlugSchema.parse(slug);
    UriSchema.parse(metadataUri);

    const [projectPda] = deriveProjectPda(authority, slug, this.program.programId);

    return await (this.program.methods as any)
      .createProject(slug, metadataUri)
      .accounts({
        authority,
        project: projectPda,
        treasury: TREASURY_PUBKEY,
        subscription: subscriptionPda || null,
        system_program: SystemProgram.programId,
      } as any)
      .instruction();
  }

  async addDataset(
    authority: PublicKey,
    project: PublicKey,
    version: number,
    contentHash: number[] | Uint8Array,
    dataUri: string,
    subscriptionPda?: PublicKey | null
  ): Promise<TransactionInstruction> {
    // Validate inputs
    DataUriSchema.parse(dataUri);
    if (contentHash.length !== 32) {
      throw new Error("Content hash must be 32 bytes");
    }

    const [datasetPda] = deriveDatasetPda(project, version, this.program.programId);

    return await (this.program.methods as any)
      .addDataset(version, Array.from(contentHash), dataUri)
      .accounts({
        authority,
        project,
        dataset: datasetPda,
        treasury: TREASURY_PUBKEY,
        subscription: subscriptionPda || null,
        system_program: SystemProgram.programId,
      } as any)
      .instruction();
  }

  async createPoll(
    authority: PublicKey,
    project: PublicKey,
    question: string,
    optionsHash: number[] | Uint8Array,
    endTs: number,
    mode: number,
    subscriptionPda?: PublicKey | null
  ): Promise<TransactionInstruction> {
    // Validate inputs
    QuestionSchema.parse(question);
    if (optionsHash.length !== 32) {
      throw new Error("Options hash must be 32 bytes");
    }
    if (endTs <= Date.now() / 1000) {
      throw new Error("End timestamp must be in the future");
    }

    const [pollPda] = derivePollPda(project, optionsHash, this.program.programId);

    return await (this.program.methods as any)
      .createPoll(question, Array.from(optionsHash), new BN(endTs), mode)
      .accounts({
        authority,
        project,
        poll: pollPda,
        treasury: TREASURY_PUBKEY,
        subscription: subscriptionPda || null,
        system_program: SystemProgram.programId,
      } as any)
      .instruction();
  }

  async castVote(
    voter: PublicKey,
    poll: PublicKey,
    choice: number
  ): Promise<TransactionInstruction> {
    // Validate inputs
    if (choice < 0 || choice > 255) {
      throw new Error("Invalid choice");
    }

    const [voteReceiptPda] = deriveVoteReceiptPda(poll, voter, this.program.programId);

    return await (this.program.methods as any)
      .castVote(choice)
      .accounts({
        voter,
        poll,
        voteReceipt: voteReceiptPda,
        system_program: SystemProgram.programId,
      } as any)
      .instruction();
  }
}
