import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { assert } from "chai";

import { ResearchRegistry } from "../target/types/research_registry";

describe("research_registry", function() {
  this.timeout(60000); // Set timeout to 60 seconds
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .ResearchRegistry as Program<ResearchRegistry>;

  const authority = provider.wallet;

  const slug = "signal-lab";
  const metadataUri = "https://example.com/project.json";
  const datasetUri = "https://example.com/dataset.json";
  const questionUri = "https://example.com/question.json";

  const contentHash = Buffer.alloc(32);
  const optionsHash = Buffer.alloc(32);

  let projectPda: PublicKey;
  let datasetPda: PublicKey;
  let pollPda: PublicKey;
  let voteReceiptPda: PublicKey;

  before(async () => {
    // Derive project PDA
    [projectPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("project"),
        authority.publicKey.toBuffer(),
        Buffer.from(slug),
      ],
      program.programId
    );
    console.log("Project PDA:", projectPda.toBase58());

    // Check if account exists, create if missing
    const accountInfo = await provider.connection.getAccountInfo(projectPda);
    if (accountInfo === null) {
      console.log("Project account missing, creating...");
      try {
        await program.methods
          .createProject(slug, metadataUri)
          .accounts({
            authority: authority.publicKey,
            project: projectPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log("Project created successfully");
      } catch (e) {
        console.error("Create project failed:", e);
        throw e;
      }
    } else {
      console.log("Project account already exists, skipping creation.");
    }
  });

  it("verifies project creation", async () => {
    const project = await program.account.project.fetch(projectPda);
    assert.strictEqual(project.slug, slug);
    assert.strictEqual(project.metadataUri, metadataUri);
    assert.strictEqual(project.datasetCount, 0);
  });

  it("adds a dataset", async () => {
    const version = 1;
    const versionBuf = Buffer.alloc(4);
    versionBuf.writeUInt32LE(version, 0);

    [datasetPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("dataset"),
        projectPda.toBuffer(),
        versionBuf,
      ],
      program.programId
    );

    await program.methods
      .addDataset(version, Array.from(contentHash.values()), datasetUri)
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        dataset: datasetPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const dataset = await program.account.dataset.fetch(datasetPda);
    assert.strictEqual(dataset.project.toBase58(), projectPda.toBase58());
    assert.strictEqual(dataset.version, version);
    assert.strictEqual(dataset.dataUri, datasetUri);
  });

  it("creates a poll and allows voting", async () => {
    const now = Math.floor(Date.now() / 1000);
    const endTs = new anchor.BN(now + 60);

    [pollPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("poll"),
        projectPda.toBuffer(),
        optionsHash,
      ],
      program.programId
    );

    await program.methods
      .createPoll(
        questionUri,
        Array.from(optionsHash.values()),
        endTs,
        0
      )
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        poll: pollPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    [voteReceiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        pollPda.toBuffer(),
        authority.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .castVote(1)
      .accounts({
        voter: authority.publicKey,
        poll: pollPda,
        voteReceipt: voteReceiptPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const pollAfter = await program.account.poll.fetch(pollPda);
    assert.strictEqual(pollAfter.yesVotes.toNumber(), 1);
    assert.strictEqual(pollAfter.noVotes.toNumber(), 0);

    const voterTwo = Keypair.generate();
    const voteTwoSeed = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        pollPda.toBuffer(),
        voterTwo.publicKey.toBuffer(),
      ],
      program.programId
    );

    const voteTwoPda = voteTwoSeed[0];

    // Transfer SOL from authority to voterTwo instead of airdrop
    const transferTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: voterTwo.publicKey,
        lamports: 1_000_000_000, // 1 SOL
      })
    );
    await provider.sendAndConfirm(transferTx);

    await program.methods
      .castVote(0)
      .accounts({
        voter: voterTwo.publicKey,
        poll: pollPda,
        voteReceipt: voteTwoPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([voterTwo])
      .rpc();

    const pollFinal = await program.account.poll.fetch(pollPda);
    assert.strictEqual(pollFinal.yesVotes.toNumber(), 1);
    assert.strictEqual(pollFinal.noVotes.toNumber(), 1);
  });

  it("blocks double voting from the same wallet", async () => {
    let failed = false;
    try {
      await program.methods
        .castVote(1)
        .accounts({
          voter: authority.publicKey,
          poll: pollPda,
          voteReceipt: voteReceiptPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e) {
      failed = true;
    }
    assert.isTrue(failed);
  });

  it("fails to create a poll ending in the past", async () => {
    const now = Math.floor(Date.now() / 1000);
    const endTsPast = new anchor.BN(now - 100);
    const optionsHashPast = Buffer.alloc(32, 1);

    const [pollPastPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("poll"),
        projectPda.toBuffer(),
        optionsHashPast,
      ],
      program.programId
    );

    let failed = false;
    try {
      await program.methods
        .createPoll(
          questionUri,
          Array.from(optionsHashPast.values()),
          endTsPast,
          0
        )
        .accounts({
          authority: authority.publicKey,
          project: projectPda,
          poll: pollPastPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e) {
      failed = true;
    }
    assert.isTrue(failed, "Should have failed to create poll with past end_ts");
  });

  it("blocks voting after end_ts", async () => {
    // Create a poll that ends in 2 seconds
    const now = Math.floor(Date.now() / 1000);
    const endTsSoon = new anchor.BN(now + 2);

    const optionsHashSoon = Buffer.alloc(32, 2);

    const [pollSoonPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("poll"),
        projectPda.toBuffer(),
        optionsHashSoon,
      ],
      program.programId
    );

    await program.methods
      .createPoll(
        questionUri,
        Array.from(optionsHashSoon.values()),
        endTsSoon,
        0
      )
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        poll: pollSoonPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
// Wait for poll to end (loop until on-chain time passes end_ts)
    console.log("Waiting for poll to end...");
    let currentOnChainTime = await provider.connection.getBlockTime(
      await provider.connection.getSlot()
    );
    const targetTime = endTsSoon.toNumber();
    
    let attempts = 0;
    while ((currentOnChainTime === null || currentOnChainTime <= targetTime) && attempts < 20) {
       console.log(`Waiting... On-chain: ${currentOnChainTime}, Target: ${targetTime}`);
       await new Promise((resolve) => setTimeout(resolve, 2000));
       try {
         const slot = await provider.connection.getSlot();
         currentOnChainTime = await provider.connection.getBlockTime(slot);
       } catch (e) {
         console.log("Error fetching time:", e);
       }
       attempts++;
    }
    
    let failed = false;
    try {
      const [voteSoonPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          pollSoonPda.toBuffer(),
          authority.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .castVote(1)
        .accounts({
          voter: authority.publicKey,
          poll: pollSoonPda,
          voteReceipt: voteSoonPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e) {
      failed = true;
    }
    assert.isTrue(failed, "Should have failed to vote after end_ts");
  });
});

