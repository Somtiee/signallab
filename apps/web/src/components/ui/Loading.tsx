
import React from 'react';
import { cn } from '@/lib/utils';

export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-white/5 rounded", className)}></div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <LoadingSkeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-32" />
          <LoadingSkeleton className="h-3 w-24" />
        </div>
      </div>
      <LoadingSkeleton className="h-16 w-full rounded-lg" />
      <div className="flex gap-2">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-4">
        <LoadingSkeleton className="h-12 w-48" />
        <LoadingSkeleton className="h-6 w-96" />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <SkeletonList count={3} />
      </div>
    </div>
  );
}
