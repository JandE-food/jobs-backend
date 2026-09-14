import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageFrame } from '../components/layout/PageFrame';
import { JobCard } from '../components/jobs/JobCard';
import { PostCard } from '../components/feed/PostCard';
import { RailFooter } from '../components/rails/RailFooter';
import { jobById } from '../data/jobs';
import { useAppState } from '../contexts/AppState';
import { cn } from '../utils/cn';

const tabs = ['Roles', 'Posts'] as const;

export function Saved() {
  const { savedJobIds, posts } = useAppState();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Roles');
  const savedPosts = posts.filter((p) => p.saved);

  return (
    <PageFrame rail={<RailFooter />}>
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Saved</h1>
        <p className="mt-1 text-sm text-ink-mute">Roles and posts you have bookmarked for later.</p>
      </header>

      <div className="mb-4 flex gap-1.5">
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

      {tab === 'Roles' ?
      savedJobIds.length ?
      <div className="space-y-3">
            {savedJobIds.map((id) => {
          const job = jobById(id);
          return job ? <JobCard key={id} job={job} /> : null;
        })}
          </div> :

      <EmptyState
        title="No saved roles yet"
        body="Tap the bookmark on any role and it will wait for you here."
        to="/jobs"
        cta="Browse jobs" /> :


      savedPosts.length ?
      <div className="space-y-4">
          {savedPosts.map((p) =>
        <PostCard key={p.id} post={p} />
        )}
        </div> :

      <EmptyState
        title="No saved posts yet"
        body="Save posts from your feed to come back to them later."
        to="/"
        cta="Open the feed" />

      }
    </PageFrame>);

}

function EmptyState({ title, body, to, cta }: {title: string;body: string;to: string;cta: string;}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
      <p className="text-sm font-extrabold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-mute">{body}</p>
      <Link
        to={to}
        className="mt-4 inline-block h-9 rounded-full bg-brand-600 px-4 text-sm font-bold leading-9 text-white transition-colors duration-150 hover:bg-brand-700">
        
        {cta}
      </Link>
    </div>);

}