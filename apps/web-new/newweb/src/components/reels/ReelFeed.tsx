import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { TalentReel } from '../../types';
import { ReelCard } from './ReelCard';
import { cn } from '../../utils/cn';

export function ReelFeed({ reels }: {reels: TalentReel[];}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [reels]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index >= 0) setActiveIndex(index);
          }
        });
      },
      { root: scroller, threshold: 0.6 }
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(reels.length - 1, index));
      slideRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [reels.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goTo(activeIndex + 1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, goTo]);

  if (reels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="text-sm font-extrabold text-ink">No talent reels match those filters</p>
          <p className="mt-1 text-sm text-ink-mute">Clear a filter to bring the feed back.</p>
        </div>
      </div>);

  }

  return (
    <div className="relative h-full">
      <div
        ref={scrollerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto no-scrollbar"
        tabIndex={0}
        aria-label="Talent reels">
        
        {reels.map((reel, i) =>
        <div
          key={reel.id}
          ref={(el) => {
            slideRefs.current[i] = el;
          }}
          className="flex h-full snap-start items-center justify-center py-2">
          
            <div className="h-full max-h-full w-auto" style={{ aspectRatio: '9 / 16' }}>
              <ReelCard reel={reel} active={i === activeIndex} />
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center md:flex">
        <div className="pointer-events-auto flex flex-col gap-2 pl-3">
          <ArrowButton
            label="Previous reel"
            disabled={activeIndex === 0}
            onClick={() => goTo(activeIndex - 1)}
            icon={<ChevronUpIcon className="h-5 w-5" />} />
          
          <ArrowButton
            label="Next reel"
            disabled={activeIndex === reels.length - 1}
            onClick={() => goTo(activeIndex + 1)}
            icon={<ChevronDownIcon className="h-5 w-5" />} />
          
          <p className="mt-1 text-center text-[11px] font-bold tabular-nums text-ink-faint">
            {activeIndex + 1}/{reels.length}
          </p>
        </div>
      </div>
    </div>);

}

function ArrowButton({
  icon,
  label,
  onClick,
  disabled





}: {icon: React.ReactNode;label: string;onClick: () => void;disabled?: boolean;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink shadow-card transition-colors duration-150',
        disabled ? 'cursor-not-allowed text-ink-faint' : 'hover:bg-canvas'
      )}>
      
      {icon}
    </button>);

}