import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const steps = [
{ label: 'Add a headline', done: true },
{ label: 'Upload your CV', done: true },
{ label: 'Add two case studies', done: false },
{ label: 'Set salary expectations', done: false }];


export function ProfileStrength() {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round(done / steps.length * 100);

  return (
    <section aria-label="Profile strength" className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-extrabold text-ink">Profile strength</h2>
        <span className="text-sm font-extrabold text-brand-600">{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas" role="presentation">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-3 space-y-2">
        {steps.map((s) =>
        <li key={s.label} className="flex items-center gap-2 text-[13px]">
            <span
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-full',
              s.done ? 'bg-success text-white' : 'border border-line'
            )}>
            
              {s.done ? <CheckIcon className="h-3 w-3" strokeWidth={3} /> : null}
            </span>
            <span className={s.done ? 'text-ink-faint line-through' : 'text-ink-soft'}>{s.label}</span>
          </li>
        )}
      </ul>
      <Link
        to="/profile"
        className="mt-3 block h-9 rounded-full bg-canvas text-center text-sm font-bold leading-9 text-ink transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700">
        
        Finish profile
      </Link>
    </section>);

}