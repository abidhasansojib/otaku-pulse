import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'amber' | 'cyber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ children, variant = 'primary', size = 'md', className }: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full tracking-wide transition-all';
  
  const variants = {
    primary: 'bg-[#FF2A5F]/15 text-[#FF2A5F] border border-[#FF2A5F]/30',
    secondary: 'bg-[#8A2BE2]/15 text-[#C77DFF] border border-[#8A2BE2]/30',
    success: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    outline: 'bg-slate-800/60 text-slate-300 border border-white/10',
    cyber: 'bg-gradient-to-r from-[#FF2A5F]/20 to-[#8A2BE2]/20 text-white border border-[#FF2A5F]/40 shadow-sm',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}>
      {children}
    </span>
  );
}
