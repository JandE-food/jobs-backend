import React from 'react';
import { Link } from 'react-router-dom';
import { BookmarkIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { Job } from '../../types';
import { Avatar } from '../ui/Avatar';
import { useAppState } from '../../contexts/AppState';
import { cn } from '../../utils/cn';

export function JobCard({ job }: {job: Job;}) {
  const { savedJobIds, toggleSaveJob, appliedJobIds } = useAppState();
  const saved = savedJobIds.includes(job.id);
  const applied = appliedJobIds.includes(job.id);

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-card transition-colors duration-150 hover:border-brand-200">
      <div className="flex items-start gap-3">
        <Avatar initials={job.companyInitials} tone={job.tone} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-extrabold leading-tight text-ink">
            <Link to={`/jobs/${job.id}`} className="hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-ink-mute">
            {job.company} · {job.posted}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleSaveJob(job.id)}
          aria-label={saved ? `Remove ${job.title} from saved` : `Save ${job.title}`}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
            saved ? 'text-brand-700' : 'text-ink-mute hover:bg-canvas'
          )}>
          
          <BookmarkIcon className={cn('h-5 w-5', saved && 'fill-current')} />
        </button>
      </div>

      <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="h-4 w-4 text-ink-faint" />
          <dt className="sr-only">Location</dt>
          <dd>
            {job.location} · {job.workMode}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Salary</dt>
          <dd className="font-bold text-ink">{job.salary}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <UsersIcon className="h-4 w-4 text-ink-faint" />
          <dt className="sr-only">Applicants</dt>
          <dd>{job.applicants} applied</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-extrabold text-brand-700">
          {job.match}% match
        </span>
        {job.tags.map((t) =>
        <span key={t} className="rounded-full border border-line px-2.5 py-1 text-[11px] font-bold text-ink-soft">
            {t}
          </span>
        )}
        <Link
          to={`/jobs/${job.id}`}
          className={cn(
            'ml-auto h-9 rounded-full px-4 text-sm font-bold leading-9 transition-colors duration-150',
            applied ? 'bg-canvas text-ink-soft' : 'bg-brand-600 text-white hover:bg-brand-700'
          )}>
          
          {applied ? 'Applied' : 'View role'}
        </Link>
      </div>
    </article>);

}