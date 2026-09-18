"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { BriefcaseBusinessIcon, ShieldCheckIcon } from "./icons";
import { TransitionLink } from "./TransitionLink";

export function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main
      key={pathname}
      className="auth-shell-enter min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.09),_transparent_28%),linear-gradient(180deg,#f8faff_0%,#f1f5fb_48%,#ecf1f8_100%)] px-4 py-5 sm:p-8"
    >
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <TransitionLink
            href="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label="BEJELI sign in"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-700 text-white shadow-[0_12px_30px_rgba(79,70,229,0.26)]">
              <BriefcaseBusinessIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-slate-950">
              BEJELI
            </span>
          </TransitionLink>
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-emerald-50 px-4 text-xs font-semibold text-emerald-700">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            UK data protected
          </span>
        </header>

        <div className="flex flex-1 items-center py-8 sm:py-10">
          <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)]">
            <section className="hidden rounded-[2.25rem] border border-slate-200/90 bg-white/80 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur xl:grid">
              <div className="flex items-start gap-4">
                <div className="w-full">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
                    Social hiring ecosystem
                  </p>
                  <h1 className="auth-hero-typewriter mt-3 max-w-none font-display text-5xl font-bold tracking-tight text-slate-950">
                    One design system for talent and recruiters.
                  </h1>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.6rem] bg-slate-950 p-5 text-white shadow-[0_28px_60px_rgba(15,23,42,0.22)]">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                    Talent side
                  </p>
                  <p className="mt-3 text-2xl font-bold">CareerShorts</p>
                  <p className="mt-2 text-sm leading-7 text-white/75">
                    Build creator proof, discover opportunities, and keep your professional signal sharp.
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
                    Recruiter side
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-950">TalentShorts</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Review reels, move profiles into shortlists, and operate company workflows from one workspace.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  "Same server as mobile and web",
                  "Role-aware login and signup",
                  "Shared data across talent and recruiter flows",
                ].map((item) => (
                  <div key={item} className="rounded-[1.4rem] border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <div className="auth-card-enter flex items-center justify-center">{children}</div>
          </div>
        </div>

        <p className="pb-2 text-center text-xs leading-relaxed text-slate-500">
          Your profile data is encrypted and stored in UK data zones.
        </p>
      </div>
    </main>
  );
}
