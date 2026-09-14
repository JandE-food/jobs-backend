import React from 'react';
import { ShieldCheckIcon } from 'lucide-react';

const links = ['About', 'Help centre', 'Privacy', 'Terms', 'Billing', 'Accessibility', 'Careers at BEJELI'];

export function RailFooter() {
  return (
    <footer className="px-2 pb-4 text-[11px] text-ink-faint">
      <p className="mb-2 inline-flex items-center gap-1.5 font-bold text-success">
        <ShieldCheckIcon className="h-3.5 w-3.5" />
        Data stored in UK data zones
      </p>
      <ul className="flex flex-wrap gap-x-2 gap-y-1">
        {links.map((l) =>
        <li key={l}>
            <a href="#" className="hover:text-ink-mute hover:underline">
              {l}
            </a>
          </li>
        )}
      </ul>
      <p className="mt-2">© 2026 BEJELI Ltd.</p>
    </footer>);

}