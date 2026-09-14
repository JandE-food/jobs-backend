import React from 'react';
import { cn } from '../../utils/cn';

type PageFrameProps = {
  children: React.ReactNode;
  rail?: React.ReactNode;
  width?: 'feed' | 'wide';
};

export function PageFrame({ children, rail, width = 'feed' }: PageFrameProps) {
  return (
    <div className="flex justify-center gap-8">
      <div className={cn('min-w-0 flex-1', width === 'feed' ? 'max-w-[620px]' : 'max-w-[900px]')}>{children}</div>
      {rail ?
      <aside className="hidden w-[300px] shrink-0 xl:block">
          <div className="sticky top-[4.5rem] max-h-[calc(100vh-5rem)] space-y-4 overflow-y-auto pb-8 no-scrollbar">
            {rail}
          </div>
        </aside> :
      null}
    </div>);

}