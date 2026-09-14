"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";

import { BottomNav } from "../BottomNav";
import {
  BellIcon,
  CheckCircle2Icon,
  BriefcaseBusinessIcon,
  FileTextIcon,
  HomeIcon,
  MapPinIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "../icons";
import { Avatar, Badge, Card, cn } from "../primitives";
import { jobs, me, people } from "../mock";
import { TopBar } from "../TopBar";
import { useKindredAuth } from "./kindred-provider";

const APP_ROUTES = new Set([
  "/",
  "/jobs",
  "/notifications",
  "/resume",
  "/network",
  "/profile",
  "/companies",
  "/recruiter",
  "/recruiter/candidates",
  "/recruiter/shortlists",
  "/recruiter/companies",
  "/recruiter/operations",
]);
const AUTH_ROUTES = new Set(["/login", "/signup"]);
const IMMERSIVE_FEED_ROUTES = new Set([
  "/",
  "/jobs",
  "/notifications",
  "/network",
  "/resume",
  "/profile",
]);
const MOBILE_HOME_ROUTES = new Set(["/"]);

function isRecruiterRoute(pathname: string) {
  return pathname.startsWith("/recruiter");
}

function isAppRoute(pathname: string) {
  return (
    APP_ROUTES.has(pathname) ||
    pathname.startsWith("/companies/") ||
    pathname.startsWith("/recruiter/shortlists/")
  );
}

const PROFESSIONAL_ITEMS = [
  { href: "/", label: "CareerShorts", icon: HomeIcon },
  { href: "/jobs", label: "Jobs", icon: SparklesIcon },
  { href: "/companies", label: "Companies", icon: BriefcaseBusinessIcon },
  { href: "/network", label: "Network", icon: UsersIcon },
  { href: "/notifications", label: "Activity", icon: BellIcon },
  { href: "/resume", label: "Resume", icon: FileTextIcon },
  { href: "/profile", label: "You", icon: UserIcon },
];

const RECRUITER_ITEMS = [
  { href: "/recruiter", label: "TalentShorts", icon: HomeIcon },
  { href: "/recruiter/candidates", label: "Candidate search", icon: SparklesIcon },
  { href: "/recruiter/shortlists", label: "Shortlists", icon: UsersIcon },
  { href: "/recruiter/companies", label: "Companies", icon: BriefcaseBusinessIcon },
  { href: "/recruiter/operations", label: "Activity", icon: CheckCircle2Icon },
];

function ProfessionalSidebar({
  pathname,
}: {
  pathname: string;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="space-y-4">
        <Card className="overflow-hidden border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <Avatar src={me.avatar} alt={me.name} size={56} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-950">{me.name}</p>
              <p className="truncate text-sm text-slate-600">{me.title}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-indigo-700">
                Talent workspace
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {PROFESSIONAL_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                    active
                      ? "bg-slate-950 text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)]"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        </Card>
        <Card className="border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Account
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-3">
            <Avatar src={me.avatar} alt={me.name} size={44} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">{me.name}</p>
              <p className="truncate text-xs text-slate-600">@amaraokonkwo</p>
            </div>
          </div>
        </Card>
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
            Feed visibility
          </p>
          <p className="mt-2 text-3xl font-display font-bold text-slate-950">
            {me.profileScore}%
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep your profile, CV, and creator proof fresh so your centered home feed
            stays strong for recruiters and peers.
          </p>
          <Link
            href="/resume"
            className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            Refresh resume
          </Link>
        </Card>
      </div>
    </aside>
  );
}

function ProfessionalRail({
  canUseRecruiterShell,
}: {
  canUseRecruiterShell: boolean;
}) {
  return (
    <aside className="hidden xl:block">
      <div className="space-y-4">
        <Card className="border-slate-200/90 bg-white/95 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                  Right rail
                </p>
                <h2 className="mt-2 font-display text-xl font-bold text-slate-950">
                  Keep the feed useful
                </h2>
              </div>
              <Badge tone="emerald">Live</Badge>
            </div>
            <dl className="mt-4 grid gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Connections</dt>
                <dd className="mt-1 text-lg font-bold text-slate-950">{me.connections}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Profile strength</dt>
                <dd className="mt-1 text-lg font-bold text-slate-950">{me.profileScore}%</dd>
              </div>
            </dl>
          </Card>
        <Card className="border-slate-200/90 bg-white/95 p-4">
            <h2 className="font-bold text-slate-950">Explore the platform</h2>
            <div className="mt-3 grid gap-2">
              <Link
                href="/companies"
                className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Corporate directory
              </Link>
              {canUseRecruiterShell ? (
                <Link
                  href="/recruiter"
                  className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  Recruiter command center
                </Link>
              ) : null}
            </div>
        </Card>
        <Card className="border-slate-200/90 bg-white/95 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                  Featured roles
                </p>
                <h2 className="mt-1 font-display text-lg font-bold text-slate-950">
                  High-signal opportunities
                </h2>
              </div>
              <Badge tone="emerald">Live</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {jobs.slice(0, 2).map((job) => (
                <div key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{job.role}</p>
                  <p className="mt-1 text-xs text-slate-600">{job.company}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                    <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {job.location}
                  </p>
                </div>
              ))}
            </div>
        </Card>
        <Card className="border-slate-200/90 bg-white/95 p-4">
            <h2 className="font-bold text-slate-950">People worth meeting</h2>
            <div className="mt-4 space-y-3">
              {people.map((person) => (
                <div key={person.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                  <Avatar src={person.avatar} alt={person.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{person.name}</p>
                    <p className="truncate text-xs text-slate-600">{person.title}</p>
                  </div>
                  <span className="inline-flex min-h-9 items-center rounded-lg bg-white px-2.5 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200">
                    Connect
                  </span>
                </div>
              ))}
            </div>
        </Card>
        <Card className="border-slate-200/90 bg-white/95 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <h2 className="font-bold text-slate-950">Quick actions</h2>
            </div>
            <div className="mt-3 grid gap-2">
              <Link
                href="/jobs"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Open jobs workspace
              </Link>
              <Link
                href="/network"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Review network activity
              </Link>
              <Link
                href="/resume"
                className="rounded-xl bg-indigo-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Refresh resume data
              </Link>
            </div>
        </Card>
        </div>
    </aside>
  );
}

function RecruiterSidebar({
  pathname,
}: {
  pathname: string;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="space-y-4">
        <Card className="overflow-hidden border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
              <BriefcaseBusinessIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-950">Recruiter workspace</p>
              <p className="truncate text-sm text-slate-600">
                Social hiring home
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {RECRUITER_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                    active
                      ? "bg-slate-950 text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)]"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        </Card>
        <Card className="border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Workspace owner
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-700 text-sm font-bold text-white">
              AO
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">Amara Okafor</p>
              <p className="truncate text-xs text-slate-600">@amaraokafor</p>
            </div>
          </div>
        </Card>
        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Daily flow
          </p>
          <p className="mt-2 text-3xl font-display font-bold text-slate-950">
            Source, review, act
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep hiring activity in a centered recruiter feed, then branch into
            companies, queues, and shortlist workflows only when needed.
          </p>
        </Card>
      </div>
    </aside>
  );
}

function RecruiterRail({
  pathname,
}: {
  pathname: string;
}) {
  if (pathname === "/recruiter") {
    return null;
  }

  return (
    <aside className="hidden xl:block">
      <div className="space-y-4">
        <Card className="border-slate-200/90 bg-white/95 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
            Workflow map
          </p>
          <h2 className="mt-2 font-display text-xl font-bold text-slate-950">
            Keep every tool close
          </h2>
          <div className="mt-4 space-y-3">
            <Link
              href="/recruiter/candidates"
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
            >
              Source candidates
            </Link>
            <Link
              href="/recruiter/shortlists"
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
            >
              Review shortlists
            </Link>
            <Link
              href="/recruiter/companies"
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
            >
              Manage company page
            </Link>
          </div>
        </Card>
        <Card className="border-slate-200/90 bg-white/95 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <h2 className="font-bold text-slate-950">Best next steps</h2>
          </div>
          <div className="mt-3 grid gap-2">
            <Link
              href="/recruiter"
              className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Review recruiter feed
            </Link>
            <Link
              href="/companies"
              className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              View public company directory
            </Link>
            <Link
              href="/recruiter/operations"
              className="rounded-2xl bg-indigo-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Open trust operations
            </Link>
          </div>
        </Card>
      </div>
    </aside>
  );
}

export function KindredChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, user } = useKindredAuth();
  const immersiveFeedShell = IMMERSIVE_FEED_ROUTES.has(pathname);
  const mobileHomeShell = MOBILE_HOME_ROUTES.has(pathname);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!user && isAppRoute(pathname)) {
      router.replace("/login");
      return;
    }

    if (
      user &&
      isRecruiterRoute(pathname) &&
      user.role === "professional"
    ) {
      router.replace("/");
      return;
    }

    if (user && AUTH_ROUTES.has(pathname)) {
      router.replace("/");
    }
  }, [hydrated, pathname, router, user]);

  if (!hydrated && (APP_ROUTES.has(pathname) || AUTH_ROUTES.has(pathname))) {
    return <div className="min-h-screen bg-[#f5f7fb]" />;
  }

  if (isAppRoute(pathname)) {
    const recruiterShell = isRecruiterRoute(pathname);
    const canUseRecruiterShell =
      user?.role === "recruiter" || user?.role === "admin";

    return (
      <div className={cn("min-h-screen w-full bg-[#f5f7fb]", mobileHomeShell && "bg-[#050608]")}>
        <a
          href="#main-content"
          className="sr-only z-50 rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        {mobileHomeShell ? (
          <main id="main-content" aria-label="BEJELI" className="min-h-screen outline-none">
            {children}
          </main>
        ) : recruiterShell ? (
          <>
          <TopBar />
          <div className="ui-fade-up mx-auto grid max-w-[96rem] items-start gap-5 px-4 pb-10 pt-6 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_18rem] xl:px-5">
            <RecruiterSidebar pathname={pathname} />
            <main
              id="main-content"
              aria-label="BEJELI"
              className="min-h-[calc(100vh-8rem)] outline-none"
            >
              {children}
            </main>
            <RecruiterRail pathname={pathname} />
          </div>
          </>
        ) : (
          <>
            <TopBar />
            <div
              className={cn(
                "ui-fade-up mx-auto grid max-w-[96rem] items-start gap-5 px-4 pb-24 pt-6 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_18rem] xl:pb-10 xl:px-5",
                immersiveFeedShell
                  ? "lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_18rem]"
                  : "",
              )}
            >
              <ProfessionalSidebar pathname={pathname} />
              <main
                id="main-content"
                aria-label="BEJELI"
                className={cn(
                  "outline-none",
                  immersiveFeedShell ? "lg:pr-3" : "min-h-[calc(100vh-8rem)]",
                )}
              >
                {children}
              </main>
              <ProfessionalRail canUseRecruiterShell={canUseRecruiterShell} />
            </div>
            <BottomNav />
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
