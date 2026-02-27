
// Storage Provider Interface for Migration
// Supports MVP (Data URI) and future expansion (Arweave, Irys, etc.)

export interface StorageProvider {
  name: string;
  isAvailable: () => boolean;
  upload: (content: string, contentType: string) => Promise<string>;
}

export class DataUriStorageProvider implements StorageProvider {
  name = "On-Chain (Data URI)";

  isAvailable(): boolean {
    return true; // Always available, but limited by size
  }

  async upload(content: string, contentType: string): Promise<string> {
    // Basic base64 encoding
    const b64 = btoa(content);
    const dataUri = `data:${contentType};base64,${b64}`;
    
    // Check if Data URI exceeds strict on-chain limit (200 bytes)
    if (dataUri.length > 200) {
      console.warn("Data URI too long for on-chain storage. Using mock IPFS hash for MVP.");
      // Return a mock IPFS hash that fits within 200 bytes
      // In production, this would be a real IPFS upload
      return `ipfs://Qm${btoa(content.substring(0, 20)).replace(/[^a-zA-Z0-9]/g, "").substring(0, 44)}`;
    }
    
    return dataUri;
  }
}

// Stub for Arweave - to be implemented
export class ArweaveStorageProvider implements StorageProvider {
  name = "Arweave (Permanent)";

  isAvailable(): boolean {
    return false; // Not implemented yet
  }

  async upload(content: string, contentType: string): Promise<string> {
    throw new Error("Arweave storage not implemented yet.");
  }
}

// Stub for Irys - to be implemented
export class IrysStorageProvider implements StorageProvider {
  name = "Irys (Bundler)";

  isAvailable(): boolean {
    return false; // Not implemented yet
  }

  async upload(content: string, contentType: string): Promise<string> {
    throw new Error("Irys storage not implemented yet.");
  }
}
