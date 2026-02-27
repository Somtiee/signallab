
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchWithRetry } from '@/lib/net';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Loading';
import { ExternalLink, RefreshCw, Search, Filter, MessageSquare, Activity } from 'lucide-react';

const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';

function getExplorerUrl(signature: string) {
  if (CLUSTER === 'localnet') {
    return `https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=http://localhost:8899`;
  }
  return `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`;
}

export default function SocialPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const { publicKey } = useWallet();

  const fetchPosts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await fetchWithRetry(`/api/social/feed?page=${page}&limit=${limit}`);
      const data = await res.json();
      
      if (data.configured === false) {
        setConfigured(false);
      }
      
      if (Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, limit]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Filter by type
      if (filter !== 'All') {
        const type = post.metadata?.type || 'Unknown';
        if (filter === 'Project' && type !== 'PROJECT_CREATED') return false;
        if (filter === 'Dataset' && type !== 'DATASET_ADDED') return false;
        if (filter === 'Migration' && type !== 'MIGRATION') return false;
        if (filter === 'Poll' && type !== 'POLL_CREATED') return false;
        if (filter === 'Vote' && type !== 'VOTE_CAST') return false;
      }

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        const content = post.text?.toLowerCase() || '';
        const author = post.author?.username?.toLowerCase() || post.author?.walletAddress?.toLowerCase() || '';
        const project = post.metadata?.projectSlug?.toLowerCase() || '';
        const tx = post.metadata?.signature?.toLowerCase() || '';
        
        return content.includes(searchLower) || 
               author.includes(searchLower) || 
               project.includes(searchLower) || 
               tx.includes(searchLower);
      }

      return true;
    });
  }, [posts, filter, search]);

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'PROJECT_CREATED': return <Badge variant="purple">Project Created</Badge>;
      case 'MIGRATION': return <Badge variant="success">Migrated</Badge>;
      case 'DATASET_ADDED': return <Badge variant="success">Dataset Added</Badge>;
      case 'POLL_CREATED': return <Badge variant="warning">Poll Created</Badge>;
      case 'VOTE_CAST': return <Badge variant="default">Vote Cast</Badge>;
      default: return <Badge variant="outline">Update</Badge>;
    }
  };

  // Regex to match "View Project: <url>"
  const projectLinkRegex = /View Project: (http[s]?:\/\/[^\s]+)/;

  return (
    <div className="min-h-screen bg-[#130d25] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white hover:text-purple-400 hover:drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300 cursor-default">Signal Stream</h1>
            <p className="text-gray-400 mt-1">Real-time updates from the SignalLab ecosystem</p>
          </div>
          <Button 
            onClick={() => fetchPosts(true)} 
            isLoading={refreshing}
            variant="secondary"
            className="w-full md:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 md:w-1/3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none text-sm text-white focus:ring-0 w-full cursor-pointer"
            >
              <option value="All" className="bg-[#130d25]">All Activity</option>
              <option value="Project" className="bg-[#130d25]">Projects</option>
              <option value="Dataset" className="bg-[#130d25]">Datasets</option>
              <option value="Migration" className="bg-[#130d25]">Migrations</option>
              <option value="Poll" className="bg-[#130d25]">Polls</option>
              <option value="Vote" className="bg-[#130d25]">Votes</option>
            </select>
          </div>

          <div className="h-px md:h-auto md:w-px bg-white/10" />

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by slug, wallet, or transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none pl-9 text-sm text-white placeholder:text-gray-500 focus:ring-0"
            />
          </div>

          <div className="h-px md:h-auto md:w-px bg-white/10" />

          <div className="flex items-center gap-2 md:w-auto">
            <span className="text-sm text-gray-400 whitespace-nowrap">Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-transparent border-none text-sm text-white focus:ring-0 cursor-pointer"
            >
              <option value={10} className="bg-[#130d25]">10</option>
              <option value={25} className="bg-[#130d25]">25</option>
              <option value={50} className="bg-[#130d25]">50</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading && !refreshing ? (
          <SkeletonList count={5} />
        ) : !configured ? (
          <EmptyState
            icon={Activity}
            title="Social Integration Not Configured"
            description="The Tapestry API key is missing. Please add your key to the environment variables to see the feed."
            action={{ label: "View Documentation", onClick: () => window.location.href = "/docs" }}
          />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No activity found"
            description={search || filter !== 'All' ? "Try adjusting your filters or search terms." : "Be the first to create a project or dataset!"}
            action={filter === 'All' && !search ? { label: "Create Project", onClick: () => window.location.href = "/feed" } : undefined}
          />
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const isUserPost = publicKey && (
                post.author?.walletAddress === publicKey.toBase58() || 
                post.author?.username === publicKey.toBase58()
              );
              
              const authorName = post.author?.username || 
                               (post.author?.walletAddress ? `${post.author.walletAddress.slice(0, 4)}...${post.author.walletAddress.slice(-4)}` : 'SignalLab Bot');

              const projectSlug = post.metadata?.projectSlug;
              const projectPda = post.metadata?.projectPda;
              const signature = post.metadata?.signature;
              const type = post.metadata?.type;
              const timestamp = new Date(post.createdAt).toLocaleString();

              const projectLinkMatch = post.text?.match(projectLinkRegex);
              const projectLink = projectLinkMatch ? projectLinkMatch[1] : null;

              // Clean text by removing raw links if we are rendering them as buttons
              const cleanText = post.text
                ?.replace(/TX: http[s]?:\/\/[^\s]+/g, '')
                ?.replace(/View Project: http[s]?:\/\/[^\s]+/g, '')
                ?.trim();

              return (
                <Card 
                  key={post.id} 
                  className={cn(
                    "hover:border-purple-500/30 transition-colors group relative overflow-hidden",
                    isUserPost && "border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-purple-900/20"
                  )}
                >
                  {isUserPost && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  )}
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isUserPost ? 'bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/30' : 'bg-gray-700'}`}>
                          {authorName[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-sm truncate max-w-[150px]">{authorName}</span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className="text-gray-500 text-xs whitespace-nowrap">{timestamp}</span>
                        {getActionBadge(type)}
                      </div>
                      
                      <p className="text-gray-200 text-sm leading-relaxed pl-10 break-all whitespace-pre-wrap">
                        {cleanText}
                      </p>

                      {/* Compact Preview / Metadata */}
                      <div className="ml-10 mt-3 flex flex-wrap items-center gap-3 text-xs">
                        {projectLink && (
                           <Link 
                             href={projectLink} 
                             className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all flex items-center gap-1.5 font-medium"
                           >
                             View Project <ExternalLink className="w-3 h-3" />
                           </Link>
                        )}
                        
                        {signature && (
                          <a 
                            href={getExplorerUrl(signature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-2 py-1 rounded"
                          >
                            View TX <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {projectSlug && !projectLink && (
                            <Link 
                              href={`/projects/${projectPda}`} 
                              className="bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-purple-300 transition-colors flex items-center gap-1"
                            >
                              @{projectSlug}
                            </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Button 
            variant="ghost" 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1 || loading}
          >
            ← Previous
          </Button>
          <span className="text-sm text-gray-400">
            Page {page}
          </span>
          <Button 
            variant="ghost" 
            onClick={() => setPage(p => p + 1)} 
            disabled={posts.length < limit || loading}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
