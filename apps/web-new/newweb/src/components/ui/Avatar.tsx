import React from 'react';
import { cn } from '../../utils/cn';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<Size, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl'
};

type AvatarProps = {
  initials: string;
  tone: string;
  size?: Size;
  ring?: boolean;
  className?: string;
};

export function Avatar({ initials, tone, size = 'md', ring = false, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-extrabold tracking-tight text-white',
        sizes[size],
        tone,
        ring && 'ring-2 ring-white',
        className
      )}>
      
      {initials}
    </span>);

}