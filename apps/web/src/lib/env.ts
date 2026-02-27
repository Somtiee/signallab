
import { z } from 'zod';

const envSchema = z.object({
  // Public
  NEXT_PUBLIC_SOLANA_CLUSTER: z.enum(['devnet', 'localnet', 'mainnet-beta']).default('devnet'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_RESEARCH_REGISTRY_PROGRAM_ID: z.string().optional(),

  // Private (Server-side only)
  TAPESTRY_API_KEY: z.string().optional(),
  BIO_API_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(_env.error.format(), null, 4)
  );
  // Only throw in production to prevent crashes in dev if keys are missing but not critical
  if (process.env.NODE_ENV === 'production') {
    throw new Error("Invalid environment variables");
  }
}

export const env = _env.success ? _env.data : process.env as any;

/**
 * Helper to check if a feature is enabled based on env vars
 */
export const isSocialEnabled = !!env.TAPESTRY_API_KEY;
export const isBioEnabled = !!env.BIO_API_KEY;
