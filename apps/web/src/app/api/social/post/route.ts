import { NextResponse } from 'next/server';
import { SocialFi } from 'socialfi';
import { env } from '@/lib/env';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // Rate Limit
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limiter = rateLimit(ip, 'social_post');
  if (!limiter.success) {
    return rateLimitResponse(limiter.retryAfter!);
  }

  try {
    const body = await req.json();
    const { action, projectPda, signature, hash, endTs, projectSlug, walletAddress } = body;

    const apiKey = env.TAPESTRY_API_KEY;
    if (!apiKey) {
      // Return success to not block UX
      return NextResponse.json({ success: false, message: "Tapestry not configured" }, { status: 200 });
    }

    const client = new SocialFi({
      headers: {
        'x-api-key': apiKey
      }
    });

    let text = "";
    const projectLink = `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/projects/${projectPda}`;

    switch (action) {
      case 'create_project':
        text = `🚀 New Project Created: ${projectSlug || projectPda.slice(0, 8)}...`;
        break;
      case 'add_dataset':
        text = `📦 New Dataset Added\nProject: ${projectSlug || projectPda.slice(0, 8)}...\nHash: ${hash?.slice(0, 16)}...`;
        break;
      case 'migrate_dataset':
        text = `🔄 Migration: New Dataset Added\nProject: ${projectSlug || projectPda.slice(0, 8)}...\nHash: ${hash?.slice(0, 16)}...`;
        break;
      case 'create_poll':
        text = `🗳️ New Poll Created\nProject: ${projectSlug || projectPda.slice(0, 8)}...\nEnds: ${new Date(endTs * 1000).toLocaleString()}`;
        break;
      case 'cast_vote':
        text = `✅ Vote Cast\nProject: ${projectSlug || projectPda.slice(0, 8)}...`;
        break;
      default:
        text = `Update on Project ${projectSlug || projectPda.slice(0, 8)}...`;
    }

    if (signature) {
      text += `\n\nTX: https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    }

    text += `\n\nView Project: ${projectLink}`;

    let profileId: string | undefined;

    if (walletAddress) {
      try {
        console.log("Attempting to resolve profile for wallet:", walletAddress);
        // Find or create profile for the wallet
        const profileRes = await client.profiles.findOrCreateCreate({ apiKey }, {
          username: walletAddress.slice(0, 10), // Use first 10 chars of wallet as username
          walletAddress: walletAddress,
          blockchain: 'SOLANA'
        });
        console.log("Profile resolution response:", JSON.stringify(profileRes, null, 2));

        if (profileRes && profileRes.profile) {
          profileId = profileRes.profile.id;
        } else {
          console.warn("Profile response missing profile object:", profileRes);
        }
      } catch (e) {
        console.error("Failed to resolve profile from wallet:", e);
      }
    }

    if (!profileId) {
       console.warn("No profile ID found for wallet:", walletAddress);
       return NextResponse.json({ success: false, message: "Could not resolve Tapestry profile" }, { status: 200 });
    }

    let contentId: string | undefined;
    try {
        const content = await client.contents.findOrCreateCreate({ apiKey }, {
          id: projectPda,
          profileId: profileId,
          properties: [
            { key: "slug", value: projectSlug || projectPda },
            { key: "type", value: "project" }
          ]
        });
        contentId = content.id;
    } catch (e: any) {
        console.error("Failed to find/create content:", e);
        if (e.response) {
            console.error("Content creation error data:", JSON.stringify(e.response.data));
        }
    }

    // Create a comment (post)
    const postData: any = {
      profileId: profileId,
      text: text,
    };

    if (contentId) {
        postData.contentId = contentId;
    } else {
        // Fallback to posting on user's own profile
        postData.targetProfileId = profileId;
    }

    console.log("Creating comment with data:", JSON.stringify(postData, null, 2));
    const post = await client.comments.commentsCreate({ apiKey }, postData);

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Tapestry Post Error:", error);
    if (error.response) {
        console.error("Tapestry API Error Data:", JSON.stringify(error.response.data));
    }
    // Non-fatal error
    return NextResponse.json({ success: false, error: error.message }, { status: 200 }); 
  }
}
