"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { BriefcaseBusinessIcon, ShieldCheckIcon } from "./icons";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full flex-col bg-[#f5f7fb] px-4 py-5 sm:items-center sm:justify-center sm:p-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col sm:flex-none">
        <header className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label="BEJELI sign in"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-700 text-white">
              <BriefcaseBusinessIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-slate-950">
              BEJELI
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            UK data protected
          </span>
        </header>
        <div className="flex flex-1 items-center py-8 sm:py-10">{children}</div>
        <p className="pb-2 text-center text-xs leading-relaxed text-slate-500">
          Your profile data is encrypted and stored in UK data zones.
        </p>
      </div>
    </main>
  );
}
