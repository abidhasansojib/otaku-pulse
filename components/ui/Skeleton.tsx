import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={twMerge(clsx('animate-shimmer rounded-xl bg-slate-800/50', className))}
      {...props}
    />
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden p-3 space-y-3">
      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[480px] md:h-[560px] rounded-3xl overflow-hidden glass-panel p-6 md:p-12 flex flex-col justify-end">
      <Skeleton className="h-6 w-32 rounded-full mb-4" />
      <Skeleton className="h-10 md:h-14 w-3/4 max-w-xl mb-4" />
      <Skeleton className="h-4 w-full max-w-lg mb-6" />
      <div className="flex gap-4">
        <Skeleton className="h-12 w-36 rounded-xl" />
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>
    </div>
  );
}
