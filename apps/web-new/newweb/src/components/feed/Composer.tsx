import React from 'react';
import { BriefcaseIcon, ImageIcon, ListChecksIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { me } from '../../data/people';

export function Composer({ onOpen }: {onOpen: () => void;}) {
  return (
    <section aria-label="Create a post" className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Avatar initials={me.initials} tone={me.tone} />
        <button
          type="button"
          onClick={onOpen}
          className="h-11 flex-1 rounded-full border border-line bg-canvas px-4 text-left text-sm text-ink-mute transition-colors duration-150 hover:border-brand-200 hover:bg-white">
          
          Share an update with your network…
        </button>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-line pt-3">
        {[
        { label: 'Media', icon: ImageIcon },
        { label: 'Role', icon: BriefcaseIcon },
        { label: 'Poll', icon: ListChecksIcon }].
        map(({ label, icon: Icon }) =>
        <button
          key={label}
          type="button"
          onClick={onOpen}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold text-ink-soft transition-colors duration-150 hover:bg-canvas">
          
            <Icon className="h-4 w-4 text-ink-mute" />
            {label}
          </button>
        )}
      </div>
    </section>);

}