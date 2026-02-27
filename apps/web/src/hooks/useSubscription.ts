import { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { deriveSubscriptionPda, ResearchRegistryClient, PROGRAM_ID, ResearchRegistry, IDL } from '@signallab/sdk';

export function useSubscription() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPro, setIsPro] = useState(false);
  const [expiry, setExpiry] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [subscriptionPda, setSubscriptionPda] = useState<PublicKey | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!wallet.publicKey) {
      setIsPro(false);
      setExpiry(null);
      setSubscriptionPda(null);
      return;
    }

    setLoading(true);
    try {
      const [pda] = deriveSubscriptionPda(wallet.publicKey, PROGRAM_ID);
      setSubscriptionPda(pda);

      // We can fetch the account data using Anchor or raw connection
      // Using raw connection for speed/simplicity without setting up full provider here if possible
      // But we need to decode it. Anchor is easier.
      
      const provider = new AnchorProvider(connection, wallet as any, {});
      const program = new Program(IDL as Idl, provider) as any;
      
      try {
        const subAccount = await program.account.subscription.fetch(pda);
        const now = Math.floor(Date.now() / 1000);
        // @ts-expect-error: BN type missing
        const expiresAt = subAccount.expiresAt.toNumber();
        
        setExpiry(expiresAt);
        setIsPro(expiresAt > now);
      } catch (e) {
        // Account likely doesn't exist
        setIsPro(false);
        setExpiry(null);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    
    try {
      const provider = new AnchorProvider(connection, wallet as any, {});
      const program = new Program<ResearchRegistry>(IDL as any, provider);
      const client = new ResearchRegistryClient(program);
      
      const ix = await client.subscribePro(wallet.publicKey);
      const tx = await provider.sendAndConfirm(
        new (await import("@solana/web3.js")).Transaction().add(ix)
      );
      
      console.log("Subscription tx:", tx);
      await checkSubscription(); // Refresh
      return tx;
    } catch (error) {
      console.error("Subscription failed:", error);
      throw error;
    }
  };

  return { isPro, expiry, loading, subscriptionPda, subscribe, checkSubscription };
}
