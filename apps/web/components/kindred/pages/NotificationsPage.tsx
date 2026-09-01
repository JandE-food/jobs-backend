"use client";

import Link from "next/link";

import { BellIcon, CheckCircle2Icon, SparklesIcon } from "../icons";
import { notifications } from "../mock";
import { Badge, Card } from "../primitives";

const unreadCount = notifications.filter((item) => item.unread).length;

export function NotificationsPage() {
  return (
    <div className="ui-fade-up space-y-8 xl:space-y-10">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              <BellIcon className="h-4 w-4" aria-hidden="true" />
              Notifications
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Stay on top of recruiter activity and platform signals
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Review shortlist actions, new matches, profile events, and platform updates
              from one clean notification center built for desktop browsing.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Unread
              </p>
              <p className="mt-1 text-2xl font-display font-bold text-slate-950">
                {unreadCount}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Total
              </p>
              <p className="mt-1 text-2xl font-display font-bold text-slate-950">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-7">
        <section className="space-y-5" aria-label="Notification items">
          {notifications.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
              <Card
                className={`p-5 hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-[0_14px_35px_rgba(15,23,42,0.08)] ${
                  item.unread ? "border-indigo-200 bg-indigo-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white">
                    <BellIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-950">{item.title}</h2>
                      <Badge tone={item.unread ? "indigo" : "slate"}>{item.category}</Badge>
                      {item.unread ? <Badge tone="emerald">New</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {item.time}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              <h2 className="font-bold text-slate-950">Notification logic</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">
                Recruiter and shortlist alerts appear when company-side activity touches your profile.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Job alerts reflect new role matches and saved-role movement.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Platform alerts keep CV parsing, privacy, and product updates visible.
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="font-bold text-slate-950">Quick actions</h2>
            </div>
            <div className="mt-4 grid gap-2">
              <Link
                href="/jobs"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Open jobs workspace
              </Link>
              <Link
                href="/network"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Review network activity
              </Link>
              <Link
                href="/resume"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Refresh resume data
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
