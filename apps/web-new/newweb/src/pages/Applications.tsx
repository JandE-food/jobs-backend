import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageFrame } from '../components/layout/PageFrame';
import { Avatar } from '../components/ui/Avatar';
import { RailFooter } from '../components/rails/RailFooter';
import { applications, jobById } from '../data/jobs';
import { ApplicationStatus } from '../types';
import { cn } from '../utils/cn';

const stages: ApplicationStatus[] = ['Applied', 'In review', 'Interview', 'Offer'];

const statusTone: Record<ApplicationStatus, string> = {
  Applied: 'bg-canvas text-ink-soft',
  'In review': 'bg-amber-50 text-warn',
  Interview: 'bg-brand-50 text-brand-700',
  Offer: 'bg-emerald-50 text-success',
  Closed: 'bg-canvas text-ink-faint'
};

const filters = ['All', 'Active', 'Closed'] as const;

export function Applications() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');

  const list = applications.filter((a) =>
  filter === 'All' ? true : filter === 'Closed' ? a.status === 'Closed' : a.status !== 'Closed'
  );

  return (
    <PageFrame
      rail={
      <>
          <section aria-label="Application summary" className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <h2 className="text-sm font-extrabold text-ink">This month</h2>
            <ul className="mt-3 space-y-2 text-[13px]">
              {[
            ['Applications sent', '12'],
            ['Profile views', '184'],
            ['Interviews booked', '3'],
            ['Response rate', '38%']].
            map(([label, value]) =>
            <li key={label} className="flex justify-between">
                  <span className="text-ink-mute">{label}</span>
                  <span className="font-extrabold text-ink">{value}</span>
                </li>
            )}
            </ul>
          </section>
          <RailFooter />
        </>
      }>
      
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Applications</h1>
        <p className="mt-1 text-sm text-ink-mute">Every role you have applied to, and where it stands.</p>
      </header>

      <div className="mb-4 flex gap-1.5">
        {filters.map((f) =>
        <button
          key={f}
          type="button"
          onClick={() => setFilter(f)}
          aria-pressed={filter === f}
          className={cn(
            'h-8 rounded-full border px-3.5 text-[12px] font-bold transition-colors duration-150',
            filter === f ?
            'border-brand-600 bg-brand-600 text-white' :
            'border-line bg-white text-ink-soft hover:border-brand-200'
          )}>
          
            {f}
          </button>
        )}
      </div>

      {list.length === 0 ?
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="text-sm font-extrabold text-ink">Nothing in this view</p>
          <p className="mt-1 text-sm text-ink-mute">Switch the filter to see your other applications.</p>
        </div> :

      <ul className="space-y-3">
          {list.map((app) => {
          const job = jobById(app.jobId);
          if (!job) return null;
          return (
            <li key={app.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <Avatar initials={job.companyInitials} tone={job.tone} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-extrabold leading-tight text-ink">
                      <Link to={`/jobs/${job.id}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </h2>
                    <p className="truncate text-[13px] text-ink-mute">
                      {job.company} · {app.updated}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-extrabold', statusTone[app.status])}>
                    {app.status}
                  </span>
                </div>

                <ol className="mt-4 flex items-center gap-1.5" aria-label="Application progress">
                  {stages.map((s, i) => {
                  const reached = app.status !== 'Closed' && i < app.step;
                  return (
                    <li key={s} className="flex-1">
                        <span
                        className={cn('block h-1.5 rounded-full', reached ? 'bg-brand-600' : 'bg-canvas')}
                        aria-hidden="true" />
                      
                        <span
                        className={cn(
                          'mt-1.5 block text-[11px] font-bold',
                          reached ? 'text-ink' : 'text-ink-faint'
                        )}>
                        
                          {s}
                        </span>
                      </li>);

                })}
                </ol>
              </li>);

        })}
        </ul>
      }
    </PageFrame>);

}