import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  BookmarkIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  Share2Icon,
  UsersIcon } from
'lucide-react';
import { PageFrame } from '../components/layout/PageFrame';
import { Avatar } from '../components/ui/Avatar';
import { MatchedJobs } from '../components/rails/MatchedJobs';
import { RailFooter } from '../components/rails/RailFooter';
import { jobById } from '../data/jobs';
import { useAppState } from '../contexts/AppState';
import { cn } from '../utils/cn';

export function JobDetail() {
  const { jobId = '' } = useParams();
  const job = jobById(jobId);
  const { savedJobIds, toggleSaveJob, appliedJobIds, applyToJob } = useAppState();
  const [justApplied, setJustApplied] = useState(false);

  if (!job) {
    return (
      <PageFrame>
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <p className="text-sm font-extrabold text-ink">This role is no longer listed</p>
          <Link to="/jobs" className="mt-4 inline-block text-sm font-bold text-brand-600 hover:underline">
            Back to all jobs
          </Link>
        </div>
      </PageFrame>);

  }

  const saved = savedJobIds.includes(job.id);
  const applied = appliedJobIds.includes(job.id);

  return (
    <PageFrame
      rail={
      <>
          <section aria-label="Hiring team" className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <h2 className="text-sm font-extrabold text-ink">About {job.company}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">
              120–250 people · {job.location} · Verified employer on BEJELI since 2023.
            </p>
            <Link
            to="/network"
            className="mt-3 block h-9 rounded-full bg-canvas text-center text-sm font-bold leading-9 text-ink transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700">
            
              See who you know here
            </Link>
          </section>
          <MatchedJobs limit={3} />
          <RailFooter />
        </>
      }>
      
      <Link
        to="/jobs"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-ink-mute transition-colors duration-150 hover:text-ink">
        
        <ArrowLeftIcon className="h-4 w-4" />
        All jobs
      </Link>

      <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex items-start gap-4 p-5">
          <Avatar initials={job.companyInitials} tone={job.tone} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-ink">{job.title}</h1>
            <p className="mt-1 text-sm text-ink-mute">
              {job.company} · {job.type} · posted {job.posted}
            </p>
            <p className="mt-2 text-lg font-extrabold text-ink">{job.salary}</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">
            {job.match}% match
          </span>
        </div>

        <dl className="flex flex-wrap gap-x-5 gap-y-2 border-y border-line bg-canvas px-5 py-3 text-[13px] text-ink-soft">
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 text-ink-faint" />
            <dt className="sr-only">Location</dt>
            <dd>
              {job.location} · {job.workMode}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <UsersIcon className="h-4 w-4 text-ink-faint" />
            <dt className="sr-only">Applicants</dt>
            <dd>{job.applicants} applicants</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 text-ink-faint" />
            <dt className="sr-only">Typical response</dt>
            <dd>Usually responds within 5 days</dd>
          </div>
        </dl>

        <div className="space-y-6 p-5">
          <p className="text-[15px] leading-relaxed text-ink-soft">{job.summary}</p>

          <Section title="What you will do" items={job.responsibilities} />
          <Section title="What they are looking for" items={job.requirements} />

          <div>
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink-mute">Benefits</h2>
            <ul className="flex flex-wrap gap-2">
              {job.benefits.map((b) =>
              <li key={b} className="rounded-full border border-line px-3 py-1.5 text-[13px] font-bold text-ink-soft">
                  {b}
                </li>
              )}
            </ul>
          </div>
        </div>
      </article>

      <div className="sticky bottom-20 z-20 mt-4 flex items-center gap-2 rounded-2xl border border-line bg-white p-3 shadow-pop lg:bottom-4">
        <button
          type="button"
          onClick={() => {
            applyToJob(job.id);
            setJustApplied(true);
          }}
          disabled={applied}
          className={cn(
            'h-11 flex-1 rounded-full text-sm font-bold transition-colors duration-150',
            applied ? 'cursor-default bg-canvas text-ink-soft' : 'bg-brand-600 text-white hover:bg-brand-700'
          )}>
          
          {applied ? 'Application submitted' : 'Apply with BEJELI profile'}
        </button>
        <button
          type="button"
          onClick={() => toggleSaveJob(job.id)}
          aria-label={saved ? 'Remove from saved' : 'Save role'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors duration-150',
            saved ? 'text-brand-700' : 'text-ink-mute hover:bg-canvas'
          )}>
          
          <BookmarkIcon className={cn('h-5 w-5', saved && 'fill-current')} />
        </button>
        <button
          type="button"
          aria-label="Share role"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-mute transition-colors duration-150 hover:bg-canvas">
          
          <Share2Icon className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {justApplied ?
        <motion.p
          role="status"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-success">
          
            <CheckCircle2Icon className="h-4 w-4" />
            Applied — track progress in Applications.
          </motion.p> :
        null}
      </AnimatePresence>
    </PageFrame>);

}

function Section({ title, items }: {title: string;items: string[];}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink-mute">{title}</h2>
      <ul className="space-y-1.5">
        {items.map((item) =>
        <li key={item} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft">
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300" />
            {item}
          </li>
        )}
      </ul>
    </div>);

}