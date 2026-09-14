import React, { useState } from 'react';
import { MessageCircleIcon, SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageFrame } from '../components/layout/PageFrame';
import { Avatar } from '../components/ui/Avatar';
import { TrendingTopics } from '../components/rails/TrendingTopics';
import { RailFooter } from '../components/rails/RailFooter';
import { people } from '../data/people';
import { useAppState } from '../contexts/AppState';
import { cn } from '../utils/cn';

const tabs = ['Suggested', 'Following', 'Open to work'] as const;

export function Network() {
  const { followedIds, toggleFollow } = useAppState();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Suggested');
  const [query, setQuery] = useState('');

  const list = people.
  filter((p) => p.id !== 'me').
  filter((p) => {
    if (tab === 'Following') return followedIds.includes(p.id);
    if (tab === 'Open to work') return p.openTo;
    return true;
  }).
  filter((p) => {
    const q = query.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.company.toLowerCase().includes(q);
  });

  return (
    <PageFrame
      rail={
      <>
          <section aria-label="Network growth" className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <h2 className="text-sm font-extrabold text-ink">Your network</h2>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink">842</p>
            <p className="text-[13px] text-ink-mute">+24 this month</p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-mute">
              People who post weekly get 3× more recruiter messages.
            </p>
          </section>
          <TrendingTopics />
          <RailFooter />
        </>
      }>
      
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Network</h1>
        <p className="mt-1 text-sm text-ink-mute">Follow the people shaping the roles you want.</p>
      </header>

      <div className="mb-4 space-y-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <label htmlFor="network-search" className="sr-only">
            Search your network
          </label>
          <input
            id="network-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, roles, companies"
            className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm placeholder:text-ink-faint focus:border-brand-300 focus:outline-none" />
          
        </div>
        <div className="flex gap-1.5">
          {tabs.map((t) =>
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={cn(
              'h-8 rounded-full border px-3.5 text-[12px] font-bold transition-colors duration-150',
              tab === t ?
              'border-brand-600 bg-brand-600 text-white' :
              'border-line bg-white text-ink-soft hover:border-brand-200'
            )}>
            
              {t}
            </button>
          )}
        </div>
      </div>

      {list.length === 0 ?
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="text-sm font-extrabold text-ink">No one here yet</p>
          <p className="mt-1 text-sm text-ink-mute">Try another tab or clear your search.</p>
        </div> :

      <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((p) => {
          const following = followedIds.includes(p.id);
          return (
            <li key={p.id} className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <Avatar initials={p.initials} tone={p.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-extrabold leading-tight text-ink">{p.name}</p>
                    <p className="truncate text-[13px] text-ink-mute">{p.role}</p>
                    <p className="truncate text-[13px] text-ink-mute">{p.company}</p>
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-ink-faint">
                  {p.mutuals} mutual connections{p.openTo ? ' · Open to work' : ''}
                </p>
                <div className="mt-auto flex gap-2 pt-3">
                  <button
                  type="button"
                  onClick={() => toggleFollow(p.id)}
                  aria-pressed={following}
                  className={cn(
                    'h-9 flex-1 rounded-full text-sm font-bold transition-colors duration-150',
                    following ? 'bg-canvas text-ink-soft' : 'bg-brand-600 text-white hover:bg-brand-700'
                  )}>
                  
                    {following ? 'Following' : 'Follow'}
                  </button>
                  <Link
                  to="/messages"
                  aria-label={`Message ${p.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-mute transition-colors duration-150 hover:bg-canvas">
                  
                    <MessageCircleIcon className="h-4 w-4" />
                  </Link>
                </div>
              </li>);

        })}
        </ul>
      }
    </PageFrame>);

}