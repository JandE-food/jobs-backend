"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  BookmarkIcon,
  BriefcaseBusinessIcon,
  ClapperboardIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
  Building2Icon,
} from "lucide-react";

import { useKindredAuth } from "./app/kindred-provider";
import { Avatar, cn } from "./primitives";
import { me } from "./mock";

type NavItem = {
  href: string;
  label: string;
  icon: typeof BellIcon;
  badge?: number;
  startsWith?: boolean;
};

function buildProfileHandle(fullName?: string, email?: string) {
  const emailHandle = email?.split("@")[0]?.trim();

  if (emailHandle) {
    return `@${emailHandle.toLowerCase().replace(/[^a-z0-9._-]+/g, "")}`;
  }

  const nameHandle = (fullName ?? me.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  return `@${nameHandle || "bejeliuser"}`;
}

const talentPrimary: NavItem[] = [
  { href: "/", label: "Feed", icon: ClapperboardIcon },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusinessIcon },
  { href: "/network", label: "Network", icon: UsersIcon },
  { href: "/notifications", label: "Activity", icon: BellIcon, badge: 3 },
];

const talentSecondary: NavItem[] = [
  { href: "/resume", label: "Resume Studio", icon: FileTextIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
  { href: "/settings/privacy", label: "Settings", icon: SettingsIcon },
];

const recruiterPrimary: NavItem[] = [
  { href: "/recruiter", label: "Feed", icon: ClapperboardIcon },
  { href: "/recruiter/companies", label: "Companies", icon: Building2Icon },
  { href: "/recruiter/shortlists", label: "Shortlists", icon: BookmarkIcon, startsWith: true },
  { href: "/profile", label: "You", icon: UserIcon },
];

const recruiterSecondary: NavItem[] = [
  { href: "/recruiter/home", label: "Home", icon: LayoutDashboardIcon },
  { href: "/recruiter/candidates", label: "Candidate search", icon: UsersIcon, startsWith: true },
  { href: "/notifications", label: "Activity", icon: BellIcon, badge: 3 },
  { href: "/settings/privacy", label: "Settings", icon: SettingsIcon },
];

function NavItemRow({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = item.startsWith
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        isActive ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-white hover:text-ink",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-brand-600" : "text-ink-mute")} strokeWidth={2.2} />
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="ml-auto rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function SideNav() {
  const { user } = useKindredAuth();
  const recruiterMode = user?.role === "recruiter" || user?.role === "admin";
  const primary = recruiterMode ? recruiterPrimary : talentPrimary;
  const secondary = recruiterMode ? recruiterSecondary : talentSecondary;
  const displayName = user?.fullName ?? me.name;
  const profileHandle = buildProfileHandle(displayName, user?.email);

  return (
    <nav aria-label="Primary" className="flex h-full flex-col gap-1 pr-2">
      {primary.map((item) => (
        <NavItemRow key={`${item.href}-${item.label}`} item={item} />
      ))}

      <div className="my-3 h-px bg-line" />

      {secondary.map((item) => (
        <NavItemRow key={`${item.href}-${item.label}`} item={item} />
      ))}

      <div className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <Avatar src={me.avatar} alt={displayName} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-ink">{displayName}</p>
            <p className="truncate text-xs text-ink-mute">{profileHandle}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-1 text-center">
          {[
            ["842", "Network"],
            ["12", recruiterMode ? "Queued" : "Applied"],
            ["94%", "Match"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="text-sm font-extrabold text-ink">{value}</dd>
              <p className="text-[11px] text-ink-mute">{label}</p>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-6 px-3 text-[11px] leading-relaxed text-ink-faint">
        BEJELI · UK data zones · <span className="whitespace-nowrap">© 2026</span>
      </p>
    </nav>
  );
}
