import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2Icon, MapPinIcon, PencilIcon, ShieldCheckIcon } from 'lucide-react';
import { PageFrame } from '../components/layout/PageFrame';
import { Avatar } from '../components/ui/Avatar';
import { PostCard } from '../components/feed/PostCard';
import { ProfileStrength } from '../components/rails/ProfileStrength';
import { MatchedJobs } from '../components/rails/MatchedJobs';
import { RailFooter } from '../components/rails/RailFooter';
import { me } from '../data/people';
import { jobById } from '../data/jobs';
import { useAppState } from '../contexts/AppState';
import { cn } from '../utils/cn';

const tabs = ['Posts', 'Experience', 'Saved roles'] as const;

const experience = [
{ role: 'Senior Product Designer', company: 'Kite Studio (contract)', period: '2024 — present', detail: 'Design system, marketing site and three product launches.' },
{ role: 'Product Designer', company: 'Trainline', period: '2021 — 2024', detail: 'Owned the booking flow across web and native.' },
{ role: 'UI Designer', company: 'Bloom Agency', period: '2019 — 2021', detail: 'Brand and interface work for early-stage clients.' }];


const skills = ['Design systems', 'Figma', 'Prototyping', 'Research', 'Accessibility', 'Front-end basics'];

export function Profile() {
  const { posts, savedJobIds } = useAppState();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Posts');
  const myPosts = posts.filter((p) => p.authorId === 'me');

  return (
    <PageFrame
      rail={
      <>
          <ProfileStrength />
          <MatchedJobs />
          <RailFooter />
        </>
      }>
      
      <h1 className="sr-only">Your profile</h1>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <img
          src="/27264751-07cc-4809-ac74-983b40331b89.jpg"
          alt=""
          className="h-28 w-full object-cover" />
        
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <span className="rounded-full bg-white p-1">
              <Avatar initials={me.initials} tone={me.tone} size="xl" />
            </span>
            <div className="mb-1 flex gap-2">
              <Link
                to="/settings"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-bold text-ink transition-colors duration-150 hover:bg-canvas">
                
                <PencilIcon className="h-3.5 w-3.5" />
                Edit profile
              </Link>
            </div>
          </div>

          <div className="mt-3">
            <h2 className="text-xl font-extrabold tracking-tight text-ink">{me.name}</h2>
            <p className="text-sm text-ink-mute">@{me.handle}</p>
            <p className="mt-2 text-[15px] font-bold text-ink-soft">{me.role}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-mute">
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                London, UK
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-success">
                <CheckCircle2Icon className="h-3.5 w-3.5" />
                Open to Senior Design roles
              </span>
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Product designer working on tools people use every day. Currently freelance, taking on one long
              engagement at a time. I write about hiring, portfolios and design systems.
            </p>
          </div>

          <dl className="mt-4 flex gap-6 border-t border-line pt-4">
            {[
            ['842', 'Network'],
            ['1.2k', 'Followers'],
            ['184', 'Profile views']].
            map(([value, label]) =>
            <div key={label}>
                <dd className="text-lg font-extrabold text-ink">{value}</dd>
                <dt className="text-[12px] text-ink-mute">{label}</dt>
              </div>
            )}
          </dl>

          <ul className="mt-4 flex flex-wrap gap-2">
            {skills.map((s) =>
            <li key={s} className="rounded-full bg-canvas px-3 py-1.5 text-[12px] font-bold text-ink-soft">
                {s}
              </li>
            )}
          </ul>

          <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-success">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Profile data encrypted and stored in UK data zones
          </p>
        </div>
      </section>

      <div className="my-4 flex gap-1.5">
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

      {tab === 'Posts' ?
      myPosts.length ?
      <div className="space-y-4">
            {myPosts.map((p) =>
        <PostCard key={p.id} post={p} />
        )}
          </div> :

      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <p className="text-sm font-extrabold text-ink">You have not posted yet</p>
            <p className="mt-1 text-sm text-ink-mute">
              Share what you are working on — posts are the fastest route to recruiter replies.
            </p>
          </div> :

      null}

      {tab === 'Experience' ?
      <ol className="space-y-3">
          {experience.map((e) =>
        <li key={e.role} className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <h3 className="text-[15px] font-extrabold text-ink">{e.role}</h3>
              <p className="text-[13px] text-ink-mute">
                {e.company} · {e.period}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{e.detail}</p>
            </li>
        )}
        </ol> :
      null}

      {tab === 'Saved roles' ?
      <ul className="space-y-3">
          {savedJobIds.map((id) => {
          const job = jobById(id);
          if (!job) return null;
          return (
            <li key={id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <Link to={`/jobs/${job.id}`} className="flex items-center gap-3">
                  <Avatar initials={job.companyInitials} tone={job.tone} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-extrabold text-ink">{job.title}</span>
                    <span className="block truncate text-[13px] text-ink-mute">
                      {job.company} · {job.salary}
                    </span>
                  </span>
                </Link>
              </li>);

        })}
        </ul> :
      null}
    </PageFrame>);

}