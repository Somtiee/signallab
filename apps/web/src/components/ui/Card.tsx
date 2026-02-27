
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white/5 border border-white/10 rounded-xl p-6 transition-all",
        onClick && "cursor-pointer hover:bg-white/10 hover:border-purple-500/30",
        className
      )}
    >
      {children}
    </div>
  );
}
