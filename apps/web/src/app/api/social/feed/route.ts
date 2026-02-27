import { NextResponse } from 'next/server';
import { SocialFi } from 'socialfi';
import { env } from '@/lib/env';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(req: Request) {
  // Rate Limit
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limiter = rateLimit(ip, 'social_feed');
  if (!limiter.success) {
    return rateLimitResponse(limiter.retryAfter!);
  }

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') || '10';
  const page = searchParams.get('page') || '1';

  const apiKey = env.TAPESTRY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ posts: [], configured: false });
  }

  const client = new SocialFi({
    headers: {
      'x-api-key': apiKey
    }
  });

  try {
    // Strategy: Fetch recent contents (Projects) and then get comments for them.
    // This effectively builds a feed of project updates.
    // Note: We fetch more projects (100) to increase the chance of finding recent updates on older projects.
    // We always fetch page 1 of projects to get the most relevant set, then filter/paginate the *comments* manually.
    const contentRes = await client.contents.contentsList({ 
        apiKey, 
        pageSize: "100", 
        page: "1" 
    });
    const contents = contentRes.contents || [];

    const allComments: any[] = [];

    // Fetch comments for each content in parallel
    await Promise.all(contents.map(async (c: any) => {
        if (!c.content || !c.content.id) return;
        try {
            const commentsRes = await client.comments.commentsList({ 
                apiKey, 
                contentId: c.content.id,
                pageSize: "100" // Increased to fetch more history per project
            });
            if (commentsRes.comments) {
                // Attach content info to comment for context
                const projectComments = commentsRes.comments.map((item: any) => ({
                    ...item,
                    relatedContent: c.content
                }));
                allComments.push(...projectComments);
            }
        } catch (e) {
            // Ignore errors for individual content fetches
            console.warn(`Failed to fetch comments for content ${c.content.id}`, e);
        }
    }));

    // Sort by date descending
    allComments.sort((a, b) => new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime());
    
    // Manual Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedComments = allComments.slice(startIndex, endIndex);
    
    const posts = paginatedComments.map((item: any) => {
      let type = 'Project Update';
      const text = item.comment.text || '';
      
      if (text.includes('New Project Created')) type = 'PROJECT_CREATED';
      else if (text.includes('Migration:')) type = 'MIGRATION';
      else if (text.includes('New Dataset Added')) type = 'DATASET_ADDED';
      else if (text.includes('New Poll Created')) type = 'POLL_CREATED';
      else if (text.includes('Vote Cast')) type = 'VOTE_CAST';

      return {
        id: item.comment.id,
        text: text,
        createdAt: item.comment.created_at,
        author: item.author,
        socialCounts: item.socialCounts,
        metadata: {
          type,
          projectSlug: item.relatedContent?.properties?.find((p: any) => p.key === 'slug')?.value,
          projectPda: item.relatedContent?.id,
          // Extract signature from text if present
          signature: text.match(/tx\/([A-Za-z0-9]+)/)?.[1]
        },
        externalUrl: item.relatedContent?.id ? `/projects/${item.relatedContent.id}` : undefined
      };
    });
    
    return NextResponse.json({ posts, configured: true });
  } catch (error) {
    console.error("Tapestry Feed Error:", error);
    return NextResponse.json({ posts: [], configured: true, error: (error as Error).message });
  }
}
