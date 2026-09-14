import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { spotlights } from '../../data/posts';
import { cn } from '../../utils/cn';

export function SpotlightRail() {
  return (
    <section aria-label="Company spotlights" className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-extrabold text-ink">Hiring now</h2>
        <Link to="/jobs" className="text-xs font-bold text-brand-600 hover:underline">
          See all
        </Link>
      </div>
      <ul className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
        <li className="shrink-0">
          <Link to="/jobs" className="flex w-16 flex-col items-center gap-1.5 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-line text-ink-mute transition-colors duration-150 hover:border-brand-300 hover:text-brand-600">
              <PlusIcon className="h-5 w-5" />
            </span>
            <span className="w-full truncate text-[11px] font-bold text-ink-mute">Post a role</span>
          </Link>
        </li>
        {spotlights.map((s) =>
        <li key={s.id} className="shrink-0">
            <Link to="/jobs" className="flex w-16 flex-col items-center gap-1.5 text-center">
              <span className="rounded-full bg-brand-600 p-[2px]">
                <span className="block rounded-full bg-white p-[2px]">
                  {s.image ?
                <img src={s.image} alt="" className="h-14 w-14 rounded-full object-cover" /> :

                <span
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full text-sm font-extrabold text-white',
                    s.tone
                  )}>
                  
                      {s.initials}
                    </span>
                }
                </span>
              </span>
              <span className="w-full truncate text-[11px] font-bold text-ink">{s.company}</span>
              <span className="-mt-1 w-full truncate text-[10px] text-ink-faint">{s.roles} roles</span>
            </Link>
          </li>
        )}
      </ul>
    </section>);

}