
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

// BIO Enrichment API
// This route simulates an external call to a Biological/Biotech knowledge graph or LLM service.
// In production, this would use the BIO_API_KEY to fetch real data.

export async function POST(req: NextRequest) {
  // Rate Limit
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limiter = rateLimit(ip, 'bio_enrich');
  if (!limiter.success) {
    return rateLimitResponse(limiter.retryAfter!);
  }

  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    // Check for API Key
    const apiKey = env.BIO_API_KEY;
    
    // Allow "mock" mode if explicitly requested or if we want to bypass for dev
    const forceMock = true; // For local dev MVP

    if (!apiKey && !forceMock) {
      // Fallback: No enrichment if key is missing (safe default)
      return NextResponse.json({ 
        enriched: false, 
        message: "BIO_API_KEY not configured. Skipping enrichment." 
      });
    }

    // SIMULATED ENRICHMENT (Mock)
    // In a real implementation, we would call:
    // const response = await fetch("https://api.bio-protocol.xyz/enrich", { ... });
    
    // For now, we generate structured output based on the input content length/type
    // to demonstrate the UI flow.
    
    const mockEnrichment = {
      summary: "This dataset contains structured experimental results relevant to biological signal processing. Preliminary analysis suggests high reproducibility.",
      keywords: ["bio-signal", "genomics", "experiment-v1", "reproducibility"],
      claims: [
        "Dataset demonstrates a 95% confidence interval in control groups.",
        "Primary markers are consistent with established baselines."
      ],
      citations: [
        {
          title: "Standard Protocols for Signal Analysis",
          url: "https://doi.org/10.1038/s41592-020-0918-8",
          doi: "10.1038/s41592-020-0918-8"
        },
        {
          title: "Reproducibility in Computational Biology",
          url: "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003285"
        }
      ]
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      enriched: true,
      data: mockEnrichment
    });

  } catch (error: any) {
    console.error("BIO Enrichment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
