import React, { useState } from 'react';
import {
  AtSignIcon,
  BriefcaseIcon,
  ClipboardCheckIcon,
  HeartIcon,
  MessageCircleIcon,
  UserPlusIcon } from
'lucide-react';
import { PageFrame } from '../components/layout/PageFrame';
import { Avatar } from '../components/ui/Avatar';
import { SuggestedPeople } from '../components/rails/SuggestedPeople';
import { RailFooter } from '../components/rails/RailFooter';
import { notifications } from '../data/messages';
import { personById } from '../data/people';
import { Notification } from '../types';
import { cn } from '../utils/cn';

const icons: Record<Notification['kind'], {icon: typeof HeartIcon;tone: string;}> = {
  like: { icon: HeartIcon, tone: 'bg-rose-50 text-rose-600' },
  comment: { icon: MessageCircleIcon, tone: 'bg-canvas text-ink-soft' },
  follow: { icon: UserPlusIcon, tone: 'bg-brand-50 text-brand-700' },
  job: { icon: BriefcaseIcon, tone: 'bg-emerald-50 text-success' },
  application: { icon: ClipboardCheckIcon, tone: 'bg-amber-50 text-warn' },
  mention: { icon: AtSignIcon, tone: 'bg-brand-50 text-brand-700' }
};

const filters = ['All', 'Unread', 'Jobs'] as const;

export function Notifications() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');

  const list = notifications.filter((n) =>
  filter === 'Unread' ? n.unread : filter === 'Jobs' ? n.kind === 'job' || n.kind === 'application' : true
  );

  return (
    <PageFrame
      rail={
      <>
          <SuggestedPeople />
          <RailFooter />
        </>
      }>
      
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Activity</h1>
        <p className="mt-1 text-sm text-ink-mute">Reactions, replies and everything happening on your applications.</p>
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
          <p className="text-sm font-extrabold text-ink">Nothing new</p>
          <p className="mt-1 text-sm text-ink-mute">You have read everything in this filter.</p>
        </div> :

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {list.map((n) => {
          const { icon: Icon, tone } = icons[n.kind];
          const person = n.personId ? personById(n.personId) : undefined;
          return (
            <li key={n.id} className={cn('flex items-start gap-3 px-4 py-3.5', n.unread && 'bg-brand-50/40')}>
                {person ?
              <Avatar initials={person.initials} tone={person.tone} size="sm" /> :

              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
              }
                <p className="min-w-0 flex-1 text-[14px] leading-relaxed text-ink-soft">
                  {person ? <span className="font-extrabold text-ink">{person.name} </span> : null}
                  {n.text}
                  <span className="ml-1 text-[12px] text-ink-faint">· {n.time}</span>
                </p>
                {n.unread ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" /> : null}
              </li>);

        })}
        </ul>
      }
    </PageFrame>);

}