import React from 'react';
import { Link } from 'react-router-dom';
import { BookmarkIcon } from 'lucide-react';
import { reels } from '../../data/reels';
import { useAppState } from '../../contexts/AppState';
import { cn } from '../../utils/cn';

export function ShortlistPanel() {
  const { shortlist, toggleShortlist, endorsedReels } = useAppState();
  const listed = reels.filter((r) => shortlist.includes(r.id));

  return (
    <section aria-label="Your shortlist" className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
          <BookmarkIcon className="h-4 w-4 text-brand-600" />
          Shortlist
        </h2>
        <span className="text-xs font-bold text-ink-mute">{listed.length} candidates</span>
      </div>

      {listed.length === 0 ?
      <p className="mt-2 text-[13px] leading-relaxed text-ink-mute">
          Shortlist a reel and the candidate lands here for your hiring panel.
        </p> :

      <ul className="mt-3 space-y-2">
          {listed.map((r) =>
        <li key={r.id} className="flex items-center gap-2.5">
              <img src={r.media} alt="" className="h-10 w-8 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold text-ink">{r.name}</span>
                <span className="block truncate text-[11px] text-ink-mute">
                  {r.role} · {r.match}% match
                </span>
              </span>
              <button
            type="button"
            onClick={() => toggleShortlist(r.id)}
            className="text-[11px] font-bold text-ink-faint transition-colors duration-150 hover:text-rose-600">
            
                Remove
              </button>
            </li>
        )}
        </ul>
      }

      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-center">
        <div>
          <dd className="text-lg font-extrabold text-ink">{endorsedReels.length}</dd>
          <dt className="text-[11px] text-ink-mute">Endorsed</dt>
        </div>
        <div>
          <dd className="text-lg font-extrabold text-ink">{reels.length}</dd>
          <dt className="text-[11px] text-ink-mute">Reels today</dt>
        </div>
      </dl>

      <Link
        to="/saved"
        className={cn(
          'mt-3 block h-9 rounded-full text-center text-sm font-bold leading-9 transition-colors duration-150',
          listed.length ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-canvas text-ink-soft'
        )}>
        
        Open shortlist
      </Link>
    </section>);

}