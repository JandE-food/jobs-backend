import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellPlusIcon, SearchIcon, SlidersHorizontalIcon } from 'lucide-react';
import { PageFrame } from '../components/layout/PageFrame';
import { JobCard } from '../components/jobs/JobCard';
import { MatchedJobs } from '../components/rails/MatchedJobs';
import { TrendingTopics } from '../components/rails/TrendingTopics';
import { RailFooter } from '../components/rails/RailFooter';
import { jobs } from '../data/jobs';
import { useAppState } from '../contexts/AppState';
import { cn } from '../utils/cn';

const modes = ['All', 'Remote', 'Hybrid', 'On-site'] as const;
const types = ['All types', 'Full-time', 'Part-time', 'Contract'] as const;
const sorts = ['Best match', 'Newest', 'Salary'] as const;

export function Jobs() {
  const { savedJobIds } = useAppState();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<(typeof modes)[number]>('All');
  const [type, setType] = useState<(typeof types)[number]>('All types');
  const [sort, setSort] = useState<(typeof sorts)[number]>('Best match');

  const results = useMemo(() => {
    let list = jobs.filter((j) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.tags.some((t) => t.toLowerCase().includes(q));
      const matchesMode = mode === 'All' || j.workMode === mode;
      const matchesType = type === 'All types' || j.type === type;
      return matchesQuery && matchesMode && matchesType;
    });
    if (sort === 'Best match') list = [...list].sort((a, b) => b.match - a.match);
    if (sort === 'Newest') list = [...list].sort((a, b) => a.posted.localeCompare(b.posted));
    if (sort === 'Salary') list = [...list].sort((a, b) => b.salary.localeCompare(a.salary));
    return list;
  }, [query, mode, type, sort]);

  return (
    <PageFrame
      rail={
      <>
          <section aria-label="Job alerts" className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
              <BellPlusIcon className="h-4 w-4 text-brand-600" />
              Job alerts
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">
              You have 2 active alerts. New matches land in your Activity tab each morning.
            </p>
            <button
            type="button"
            className="mt-3 h-9 w-full rounded-full bg-brand-600 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700">
            
              Create an alert
            </button>
          </section>
          <section aria-label="Saved roles" className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-extrabold text-ink">Saved roles</h2>
              <Link to="/saved" className="text-xs font-bold text-brand-600 hover:underline">
                Open
              </Link>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-mute">{savedJobIds.length} roles waiting for you.</p>
          </section>
          <MatchedJobs limit={3} />
          <TrendingTopics />
          <RailFooter />
        </>
      }>
      
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Jobs</h1>
        <p className="mt-1 text-sm text-ink-mute">
          {results.length} roles matched to your profile and network activity.
        </p>
      </header>

      <div className="sticky top-14 z-20 mb-4 space-y-2 bg-canvas/95 py-2 backdrop-blur">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <label htmlFor="job-search" className="sr-only">
            Search jobs
          </label>
          <input
            id="job-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company or skill"
            className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm placeholder:text-ink-faint focus:border-brand-300 focus:outline-none" />
          
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {modes.map((m) =>
          <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
              {m}
            </Chip>
          )}
          <span className="mx-1 h-5 w-px bg-line" />
          {types.map((t) =>
          <Chip key={t} active={type === t} onClick={() => setType(t)}>
              {t}
            </Chip>
          )}
          <label htmlFor="job-sort" className="sr-only">
            Sort results
          </label>
          <div className="ml-auto flex items-center gap-1.5 text-ink-mute">
            <SlidersHorizontalIcon className="h-4 w-4" />
            <select
              id="job-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
              className="h-8 rounded-full border border-line bg-white px-2 text-[12px] font-bold text-ink focus:outline-none">
              
              {sorts.map((s) =>
              <option key={s}>{s}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {results.length === 0 ?
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="text-sm font-extrabold text-ink">No roles match those filters</p>
          <p className="mt-1 text-sm text-ink-mute">Try clearing a filter or widening your search.</p>
          <button
          type="button"
          onClick={() => {
            setQuery('');
            setMode('All');
            setType('All types');
          }}
          className="mt-4 h-9 rounded-full bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700">
          
            Clear filters
          </button>
        </div> :

      <div className="space-y-3">
          {results.map((job) =>
        <JobCard key={job.id} job={job} />
        )}
        </div>
      }
    </PageFrame>);

}

function Chip({ active, onClick, children }: {active: boolean;onClick: () => void;children: React.ReactNode;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-8 whitespace-nowrap rounded-full border px-3 text-[12px] font-bold transition-colors duration-150',
        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-soft hover:border-brand-200'
      )}>
      
      {children}
    </button>);

}