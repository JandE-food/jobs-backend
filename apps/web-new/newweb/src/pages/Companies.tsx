import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, ShieldCheckIcon } from 'lucide-react';
import { PageFrame } from '../components/layout/PageFrame';
import { Avatar } from '../components/ui/Avatar';
import { RailFooter } from '../components/rails/RailFooter';
import { jobs } from '../data/jobs';
import { spotlights } from '../data/posts';

export function Companies() {
  const [query, setQuery] = useState('');

  const companies = useMemo(() => {
    const map = new Map<string, {name: string;initials: string;tone: string;roles: number;location: string;}>();
    jobs.forEach((j) => {
      const current = map.get(j.company);
      map.set(j.company, {
        name: j.company,
        initials: j.companyInitials,
        tone: j.tone,
        roles: (current?.roles ?? 0) + 1,
        location: j.location
      });
    });
    const list = Array.from(map.values());
    const q = query.trim().toLowerCase();
    return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
  }, [query]);

  return (
    <PageFrame
      rail={
      <>
          <section aria-label="Employer verification" className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
              <ShieldCheckIcon className="h-4 w-4 text-success" />
              Verified employers
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">
              Every company here has passed BEJELI identity checks and stores candidate data in UK data zones.
            </p>
          </section>
          <RailFooter />
        </>
      }>
      
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Companies</h1>
        <p className="mt-1 text-sm text-ink-mute">Employers hiring through TalentShorts right now.</p>
      </header>

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <label htmlFor="company-search" className="sr-only">
          Search companies
        </label>
        <input
          id="company-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies"
          className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm placeholder:text-ink-faint focus:border-brand-300 focus:outline-none" />
        
      </div>

      {companies.length === 0 ?
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="text-sm font-extrabold text-ink">No companies match that search</p>
        </div> :

      <ul className="grid gap-3 sm:grid-cols-2">
          {companies.map((c) => {
          const spotlight = spotlights.find((s) => s.company.startsWith(c.name.split(' ')[0]));
          return (
            <li key={c.name} className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <Avatar initials={c.initials} tone={c.tone} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-extrabold leading-tight text-ink">{c.name}</h2>
                    <p className="truncate text-[13px] text-ink-mute">{c.location}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] text-ink-soft">
                  {spotlight?.headline ?? 'Hiring across product and engineering'}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-[12px] font-bold text-ink-mute">{c.roles} open roles</span>
                  <Link
                  to="/jobs"
                  className="h-9 rounded-full bg-brand-600 px-4 text-sm font-bold leading-9 text-white transition-colors duration-150 hover:bg-brand-700">
                  
                    View roles
                  </Link>
                </div>
              </li>);

        })}
        </ul>
      }
    </PageFrame>);

}