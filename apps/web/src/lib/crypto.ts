
// Simple canonical JSON implementation
// Sorts keys alphabetically to ensure deterministic output
export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalStringify(item)).join(',') + ']';
  }
  
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((key) => {
    return JSON.stringify(key) + ':' + canonicalStringify(obj[key]);
  }).join(',') + '}';
}

// SHA-256 implementation using Web Crypto API
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert string hash to Uint8Array (32 bytes)
export function hashToBytes(hashHex: string): Uint8Array {
  if (hashHex.length !== 64) {
    throw new Error('Invalid hash length');
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hashHex.substring(i * 2, (i * 2) + 2), 16);
  }
  return bytes;
}
