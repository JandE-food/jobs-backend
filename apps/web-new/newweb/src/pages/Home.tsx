import React, { useMemo, useState } from 'react';
import { BookmarkIcon, RefreshCwIcon, SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReelFeed } from '../components/reels/ReelFeed';
import { ShortlistPanel } from '../components/reels/ShortlistPanel';
import { MatchedJobs } from '../components/rails/MatchedJobs';
import { RailFooter } from '../components/rails/RailFooter';
import { reelFilters, reels } from '../data/reels';
import { useAppState } from '../contexts/AppState';
import { cn } from '../utils/cn';

type HomeProps = {
  showRail?: boolean;
};

export function Home({ showRail = true }: HomeProps) {
  const { shortlist } = useAppState();
  const [filter, setFilter] = useState<string>('Frontend Engineer');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const visibleReels = useMemo(() => {
    let list = [...reels];
    if (filter === 'To shortlist') list = list.filter((r) => shortlist.includes(r.id));else
    if (filter !== 'Candidate search') {
      const f = filter.toLowerCase();
      const matched = list.filter(
        (r) =>
        r.category.toLowerCase().includes(f) ||
        r.role.toLowerCase().includes(f) ||
        r.location.toLowerCase().includes(f) ||
        r.availability.toLowerCase().includes(f) ||
        r.skills.some((s) => s.toLowerCase().includes(f))
      );
      if (matched.length) list = [...matched, ...list.filter((r) => !matched.includes(r))];
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
        r.name.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (refreshKey % 2 === 1) list = [...list].reverse();
    return list;
  }, [filter, query, shortlist, refreshKey]);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] justify-center gap-8 lg:h-[calc(100vh-5rem)]">
      <div className="flex min-w-0 max-w-[580px] flex-1 flex-col">
        <header className="shrink-0 pb-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-600">
                For your next hire
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">TalentShorts</h1>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700">
              
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSearchOpen((s) => !s)}
              aria-expanded={searchOpen}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors duration-150',
                searchOpen ?
                'border-brand-600 bg-brand-600 text-white' :
                'border-line bg-white text-ink-soft hover:border-brand-200'
              )}>
              
              <SearchIcon className="h-3.5 w-3.5" />
              Candidate search
            </button>
            {reelFilters.slice(1).map((f) =>
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors duration-150',
                filter === f ?
                'border-brand-600 bg-brand-600 text-white' :
                'border-line bg-white text-ink-soft hover:border-brand-200'
              )}>
              
                {f === 'To shortlist' ? <BookmarkIcon className="h-3.5 w-3.5" /> : null}
                {f}
              </button>
            )}
          </div>

          {searchOpen ?
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="mt-1.5">
            
              <label htmlFor="reel-search" className="sr-only">
                Search candidates
              </label>
              <input
              id="reel-search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates by name, role or skill"
              className="h-10 w-full rounded-full border border-line bg-white px-4 text-sm placeholder:text-ink-faint focus:border-brand-300 focus:outline-none" />
            
            </motion.div> :
          null}
        </header>

        <div className="min-h-0 flex-1 pb-2">
          <ReelFeed reels={visibleReels} />
        </div>
      </div>

      {showRail ?
      <aside className="hidden w-[300px] shrink-0 overflow-y-auto py-1 no-scrollbar xl:block">
          <div className="space-y-4">
            <ShortlistPanel />
            <MatchedJobs limit={3} />
            <RailFooter />
          </div>
        </aside> :
      null}
    </div>);

}