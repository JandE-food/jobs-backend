import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { people } from '../../data/people';
import { useAppState } from '../../contexts/AppState';
import { cn } from '../../utils/cn';

export function SuggestedPeople({ limit = 4 }: {limit?: number;}) {
  const { followedIds, toggleFollow } = useAppState();
  const list = people.filter((p) => p.id !== 'me').slice(0, limit);

  return (
    <section aria-label="Suggested connections" className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-extrabold text-ink">People in your field</h2>
        <Link to="/network" className="text-xs font-bold text-brand-600 hover:underline">
          See all
        </Link>
      </div>
      <ul className="space-y-3">
        {list.map((p) => {
          const following = followedIds.includes(p.id);
          return (
            <li key={p.id} className="flex items-center gap-2.5">
              <Avatar initials={p.initials} tone={p.tone} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold text-ink">{p.name}</p>
                <p className="truncate text-[11px] text-ink-mute">
                  {p.role} · {p.mutuals} mutual
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleFollow(p.id)}
                aria-pressed={following}
                className={cn(
                  'h-7 shrink-0 rounded-full px-3 text-[12px] font-bold transition-colors duration-150',
                  following ? 'bg-canvas text-ink-soft' : 'bg-brand-600 text-white hover:bg-brand-700'
                )}>
                
                {following ? 'Following' : 'Follow'}
              </button>
            </li>);

        })}
      </ul>
    </section>);

}