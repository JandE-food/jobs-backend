import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { jobs } from '../../data/jobs';

export function MatchedJobs({ limit = 3 }: {limit?: number;}) {
  const list = [...jobs].sort((a, b) => b.match - a.match).slice(0, limit);

  return (
    <section aria-label="Matched roles" className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-extrabold text-ink">Matched to your profile</h2>
        <Link to="/jobs" className="text-xs font-bold text-brand-600 hover:underline">
          All jobs
        </Link>
      </div>
      <ul className="space-y-1">
        {list.map((job) =>
        <li key={job.id}>
            <Link
            to={`/jobs/${job.id}`}
            className="-mx-2 flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-canvas">
            
              <Avatar initials={job.companyInitials} tone={job.tone} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold text-ink">{job.title}</span>
                <span className="block truncate text-[11px] text-ink-mute">
                  {job.company} · {job.location}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-extrabold text-brand-600">{job.match}%</span>
            </Link>
          </li>
        )}
      </ul>
    </section>);

}