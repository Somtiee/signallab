
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'purple';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: "bg-white/10 text-gray-300 border-white/5 border",
    outline: "border-white/20 text-gray-400 bg-transparent border",
    success: "bg-green-500/10 text-green-400 border-green-500/20 border",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 border",
    error: "bg-red-500/10 text-red-400 border-red-500/20 border",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 border",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium inline-block", variants[variant], className)}>
      {children}
    </span>
  );
}
