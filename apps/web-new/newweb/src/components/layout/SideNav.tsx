import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BellIcon,
  BookmarkIcon,
  BriefcaseIcon,
  Building2Icon,
  ClapperboardIcon,
  ClipboardListIcon,
  HomeIcon,
  MessageCircleIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon } from
'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { me } from '../../data/people';

type Item = {to: string;label: string;icon: typeof HomeIcon;badge?: number;};

const primary: Item[] = [
{ to: '/', label: 'TalentShorts', icon: ClapperboardIcon },
{ to: '/feed', label: 'Network feed', icon: HomeIcon },
{ to: '/jobs', label: 'Jobs', icon: BriefcaseIcon },
{ to: '/companies', label: 'Companies', icon: Building2Icon },
{ to: '/network', label: 'Network', icon: UsersIcon },
{ to: '/messages', label: 'Messages', icon: MessageCircleIcon, badge: 3 },
{ to: '/notifications', label: 'Activity', icon: BellIcon, badge: 3 }];


const secondary: Item[] = [
{ to: '/applications', label: 'Applications', icon: ClipboardListIcon },
{ to: '/saved', label: 'Saved', icon: BookmarkIcon },
{ to: '/profile', label: 'Profile', icon: UserIcon },
{ to: '/settings', label: 'Settings', icon: SettingsIcon }];


function NavItem({ item }: {item: Item;}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
      cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors duration-150',
        isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-white hover:text-ink'
      )
      }>
      
      {({ isActive }) =>
      <>
          <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-brand-600' : 'text-ink-mute')} strokeWidth={2.2} />
          <span className="truncate">{item.label}</span>
          {item.badge ?
        <span className="ml-auto rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
              {item.badge}
            </span> :
        null}
        </>
      }
    </NavLink>);

}

export function SideNav() {
  return (
    <nav aria-label="Primary" className="flex h-full flex-col gap-1 pr-2">
      {primary.map((item) =>
      <NavItem key={item.to} item={item} />
      )}

      <div className="my-3 h-px bg-line" />

      {secondary.map((item) =>
      <NavItem key={item.to} item={item} />
      )}

      <div className="mt-6 rounded-2xl border border-line bg-white p-4">
        <div className="flex items-center gap-3">
          <Avatar initials={me.initials} tone={me.tone} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-ink">{me.name}</p>
            <p className="truncate text-xs text-ink-mute">@{me.handle}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-1 text-center">
          {[
          ['842', 'Network'],
          ['12', 'Applied'],
          ['94%', 'Match']].
          map(([value, label]) =>
          <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="text-sm font-extrabold text-ink">{value}</dd>
              <p className="text-[11px] text-ink-mute">{label}</p>
            </div>
          )}
        </dl>
      </div>

      <p className="mt-6 px-3 text-[11px] leading-relaxed text-ink-faint">
        BEJELI · UK data zones · <span className="whitespace-nowrap">© 2026</span>
      </p>
    </nav>);

}