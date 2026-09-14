import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, BriefcaseIcon, Building2Icon, PlusIcon, SearchIcon, ShieldCheckIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { me } from '../../data/people';

export function TopBar({ onCompose }: {onCompose: () => void;}) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2" aria-label="BEJELI home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <BriefcaseIcon className="h-4 w-4 text-white" strokeWidth={2.4} />
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-ink sm:inline">BEJELI</span>
        </Link>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/jobs');
          }}
          className="ml-2 flex-1 md:mx-auto md:max-w-md">
          
          <label htmlFor="global-search" className="sr-only">
            Search people, roles and companies
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              id="global-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, roles, companies"
              className="h-9 w-full rounded-full border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-300 focus:bg-white focus:outline-none" />
            
          </div>
        </form>

        <div className="flex items-center gap-1.5">
          <Link
            to="/companies"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-bold text-ink transition-colors duration-150 hover:bg-canvas sm:inline-flex">
            
            <Building2Icon className="h-4 w-4 text-ink-mute" />
            Companies
          </Link>

          <span className="mr-1 hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-success lg:inline-flex">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            UK data protected
          </span>

          <button
            type="button"
            onClick={onCompose}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700">
            
            <PlusIcon className="h-4 w-4" strokeWidth={2.6} />
            <span className="hidden sm:inline">Post</span>
          </button>

          <Link
            to="/notifications"
            className="relative hidden h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-canvas sm:inline-flex"
            aria-label="Activity, 3 unread">
            
            <BellIcon className="h-5 w-5" strokeWidth={2.2} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" />
          </Link>

          <Link to="/profile" aria-label="Your profile" className="ml-0.5">
            <Avatar initials={me.initials} tone={me.tone} size="sm" />
          </Link>
        </div>
      </div>
    </header>);

}