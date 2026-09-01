"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HomeIcon, SparklesIcon, UserIcon, UsersIcon } from "./icons";
import { cn } from "./primitives";

const items = [
  { href: "/", label: "Feed", icon: HomeIcon },
  { href: "/jobs", label: "Matches", icon: SparklesIcon },
  { href: "/network", label: "Network", icon: UsersIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="safe-bottom border-t border-slate-200 bg-white/95 px-2 pt-1.5 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-xl justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 min-w-[68px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                isActive ? "text-indigo-700" : "text-slate-600",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
              {isActive ? <span className="sr-only">, current page</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
