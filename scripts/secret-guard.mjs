
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { extname, relative } from "node:path";

// 1. Get staged files
let diffOutput;
try {
  diffOutput = execSync(
    "git diff --cached --name-only --diff-filter=ACM",
    { encoding: "utf8" }
  );
} catch (e) {
  // Not a git repo or no commits yet
  process.exit(0);
}

const files = diffOutput
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean);

if (!files.length) {
  process.exit(0);
}

// 2. Define patterns
const patterns = [
  "PRIVATE_KEY",
  "SECRET_KEY",
  "BEGIN PRIVATE KEY",
  "TAPESTRY_API_KEY",
  "BIO_API_KEY",
  // "sk_live_", // Common stripe/api prefix
  // "sk_test_",
];

// 3. Define regex for high-entropy strings (Base58-like, 40+ chars)
// Avoiding normal hashes or long strings in lockfiles
const highEntropyRegex = /\b[1-9A-HJ-NP-Za-km-z]{40,}\b/;

const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".env",
  ".toml",
  ".rs",
  ".md",
  ".yaml",
  ".yml",
]);

const allowedFiles = new Set([
  "apps/web/src/lib/env.ts",
  ".env.example",
  "apps/web/.env.example",
  "pnpm-lock.yaml",
  "package-lock.json",
]);

const findings = [];

for (const file of files) {
  if (allowedFiles.has(file)) continue;
  if (file.includes("lock.yaml") || file.includes("lock.json")) continue;

  const ext = extname(file);
  if (!textExtensions.has(ext)) {
    continue;
  }

  try {
    const stats = statSync(file);
    if (!stats.isFile() || stats.size > 1024 * 1024) {
      continue;
    }

    const content = readFileSync(file, "utf8");

    // Check strict patterns
    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        findings.push({ file, pattern, type: "pattern" });
      }
    }

    // Check high entropy (careful with false positives)
    // We only check if it looks like a private key assignment
    // or just a raw blob
    if (highEntropyRegex.test(content)) {
      // Filter out imports or benign strings if possible
      // For now, just warn
      // findings.push({ file, pattern: "high-entropy-string", type: "entropy" });
      // Base58 check specifically for private keys (usually 80+ chars for full keypair or 44 for address)
      // Address is public, so we only care about secret keys (which are often JSON arrays or long base58)
      // Let's stick to the requested "base58 blobs" but maybe refine to exclude public keys?
      // Actually, user asked for "base58 blobs".
      // A full keypair is [ ... ] or a very long string.
      // A public key is ~44 chars.
      // We'll warn on very long strings (> 50 chars) that are base58.
      const base58Matches = content.match(/\b[1-9A-HJ-NP-Za-km-z]{50,}\b/g);
      if (base58Matches) {
        findings.push({ file, pattern: "suspected-secret-blob", type: "entropy" });
      }
    }
  } catch (e) {
    // File might have been deleted
    continue;
  }
}

if (findings.length) {
  console.error("\x1b[31m%s\x1b[0m", "Potential secrets detected in staged changes:");
  for (const item of findings) {
    console.error(` - ${item.file}: ${item.pattern}`);
  }
  console.error(
    "\x1b[33m%s\x1b[0m",
    "Please remove these values or add the file to the allowlist in scripts/secret-guard.mjs if this is a false positive."
  );
  process.exit(1);
}

process.exit(0);
