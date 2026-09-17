"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, BookmarkIcon, BriefcaseBusinessIcon, Building2Icon, ClapperboardIcon, UserIcon } from "lucide-react";

import { useKindredAuth } from "./app/kindred-provider";
import { cn } from "./primitives";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useKindredAuth();
  const recruiterMode = user?.role === "recruiter" || user?.role === "admin";
  const items = recruiterMode
    ? [
        { href: "/recruiter", label: "Feed", icon: ClapperboardIcon },
        { href: "/recruiter/companies", label: "Companies", icon: Building2Icon },
        { href: "/recruiter/shortlists", label: "Shortlists", icon: BookmarkIcon, startsWith: true },
        { href: "/profile", label: "You", icon: UserIcon },
      ]
    : [
        { href: "/", label: "Feed", icon: ClapperboardIcon },
        { href: "/jobs", label: "Jobs", icon: BriefcaseBusinessIcon },
        { href: "/notifications", label: "Activity", icon: BellIcon },
        { href: "/profile", label: "You", icon: UserIcon },
      ];

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {items.map(({ href, label, icon: Icon, startsWith }) => {
          const isActive = startsWith
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;

          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                isActive ? "text-brand-700" : "text-ink-mute",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2.2} />
              {label}
              {isActive ? <span className="sr-only">, current page</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
