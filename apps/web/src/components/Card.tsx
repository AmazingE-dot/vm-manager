import type { HTMLAttributes } from 'react';
import { cn } from '../lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border border-separator bg-surface p-6 shadow-card', className)}
      {...props}
    />
  );
}
