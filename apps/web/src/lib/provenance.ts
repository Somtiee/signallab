
// Provenance Schema for Sunrise/BIO
// This wraps the original dataset content to provide integrity, source, and enrichment metadata.

export type ProvenanceSource = 'sunrise' | 'bio' | 'manual';

export interface BioEnrichment {
  summary: string;
  keywords: string[];
  claims: string[];
  citations: {
    title: string;
    url: string;
    doi?: string;
  }[];
}

export interface DatasetProvenance {
  // Metadata
  source: ProvenanceSource;
  source_refs?: string[]; // URLs or IDs from the source system
  ingested_at: string; // ISO 8601 timestamp
  
  // Content Integrity (Inner)
  canonical_sha256: string; // SHA-256 of the canonicalized INNER content (the original JSON)
  
  // Storage
  content_uri: string; // URI where the INNER content is stored (Data URI, Arweave, etc.)
  
  // Enrichment (Optional)
  bio_enrichment?: BioEnrichment;
}

// Helper to check if an object is a valid provenance wrapper
export function isDatasetProvenance(obj: any): obj is DatasetProvenance {
  return (
    obj &&
    typeof obj.source === 'string' &&
    typeof obj.ingested_at === 'string' &&
    typeof obj.canonical_sha256 === 'string' &&
    typeof obj.content_uri === 'string'
  );
}
