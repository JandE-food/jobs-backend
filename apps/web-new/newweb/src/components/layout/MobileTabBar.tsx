import React from 'react';
import { NavLink } from 'react-router-dom';
import { BellIcon, BriefcaseIcon, ClapperboardIcon, MessageCircleIcon, UserIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const items = [
{ to: '/', label: 'Shorts', icon: ClapperboardIcon },
{ to: '/jobs', label: 'Jobs', icon: BriefcaseIcon },
{ to: '/messages', label: 'Chats', icon: MessageCircleIcon },
{ to: '/notifications', label: 'Activity', icon: BellIcon },
{ to: '/profile', label: 'You', icon: UserIcon }];


export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
      
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors duration-150',
                  isActive ? 'text-brand-700' : 'text-ink-mute'
                )
                }>
                
                <Icon className="h-5 w-5" strokeWidth={2.2} />
                {item.label}
              </NavLink>
            </li>);

        })}
      </ul>
    </nav>);

}