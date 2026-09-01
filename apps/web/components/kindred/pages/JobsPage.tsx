"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  MapPinIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  BriefcaseBusinessIcon,
  ArrowRightIcon,
} from "../icons";

import { motion, useReducedMotion } from "../motion";
import { jobs, type Job } from "../mock";
import { Badge, Button, Card, MatchRing, cn } from "../primitives";

const filters = ["All", "Full-time", "Contract", "Remote"] as const;

function JobCard({
  job,
  isApplied,
  isSaved,
  onApply,
  onSave,
  onHide,
}: {
  job: Job;
  isApplied: boolean;
  isSaved: boolean;
  onApply: () => void;
  onSave: () => void;
  onHide: () => void;
}) {
  function stopCardSelection(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <article>
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-xs font-bold text-slate-700"
            style={{ background: job.logoBg }}
          >
            {job.logoText}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-950">{job.role}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {job.company} · {job.posted}
                </p>
              </div>
              <MatchRing score={job.score} size={50} />
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                {job.location}
              </p>
              <p className="flex items-center gap-1.5">
                <BanknoteIcon className="h-4 w-4" aria-hidden="true" />
                {job.salary}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {job.reasons.slice(0, 2).map((reason) => (
            <Badge key={reason} tone="emerald">
              <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {reason}
            </Badge>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button
            size="sm"
            onClick={(event) => {
              stopCardSelection(event);
              onApply();
            }}
            aria-label={`Apply for ${job.role} at ${job.company}`}
          >
            {isApplied ? "Applied" : "Apply"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              stopCardSelection(event);
              onSave();
            }}
            aria-label={`Save ${job.role} at ${job.company}`}
          >
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="px-3"
            onClick={(event) => {
              stopCardSelection(event);
              onHide();
            }}
            aria-label={`Hide ${job.role} at ${job.company}`}
          >
            Hide
          </Button>
        </div>
      </Card>
    </article>
  );
}

export function JobsPage() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();

  const list = useMemo(() => {
    const visible = jobs.filter((job) => !hiddenIds.includes(job.id));

    if (active === "All") {
      return visible;
    }

    if (active === "Remote") {
      return visible.filter((job) => job.location.toLowerCase().includes("remote"));
    }

    return visible.filter((job) => job.type === active);
  }, [active, hiddenIds]);
  const [selectedId, setSelectedId] = useState(jobs[0]?.id ?? "");
  const selectedJob = list.find((job) => job.id === selectedId) ?? list[0] ?? null;

  return (
    <div className="ui-fade-up space-y-8 xl:space-y-10">
      <section
        aria-labelledby="matches-title"
        className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-9"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              AI matches
            </p>
            <h1
              id="matches-title"
              className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950"
            >
              Roles that fit you
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Scored from your CV, skills and network.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Saved", value: savedIds.length },
              { label: "Applied", value: appliedIds.length },
              { label: "Visible", value: list.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-display font-bold text-slate-950">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-7 2xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontalIcon className="h-4 w-4 text-indigo-700" aria-hidden="true" />
            <h2 className="font-bold text-slate-950">Filters</h2>
          </div>
          <div
            role="group"
            aria-label="Filter job matches"
            className="mt-5 grid gap-2.5"
          >
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={active === filter}
                onClick={() => setActive(filter)}
                className={cn(
                  "min-h-11 rounded-xl border px-4 text-left text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                  active === filter
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-[1.35rem] border border-indigo-100 bg-indigo-50/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              Search strategy
            </p>
            <p className="mt-3 text-sm leading-7 text-indigo-950">
              Roles are ranked from CV skills, geography, salary fit, and network
              proximity so you can work through the strongest options first.
            </p>
          </div>
        </Card>

        <div className="space-y-7">
          {selectedJob ? (
            <Card className="overflow-hidden rounded-[2rem] p-0 shadow-[0_20px_55px_rgba(15,23,42,0.07)]">
              <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(238,242,255,0.9),rgba(255,255,255,0.96))] px-6 py-6 sm:px-7">
                <div className="space-y-6">
                  <div className="min-w-0 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                      Selected role
                    </p>
                    <h2 className="max-w-3xl font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {selectedJob.role}
                    </h2>
                    <p className="text-base font-medium text-slate-700">
                      {selectedJob.company}
                    </p>
                    <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                      Review the strongest fit signals first, then act on the role from a cleaner workspace.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-indigo-100 bg-white/90 px-5 py-4 shadow-[0_12px_35px_rgba(79,70,229,0.08)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Role match
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Ranked for your current profile
                        </p>
                      </div>
                      <MatchRing score={selectedJob.score} size={72} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-7">
                <div className="grid gap-3 xl:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Location
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800 leading-7">
                      <MapPinIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      {selectedJob.location}
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Compensation
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800 leading-7">
                      <BanknoteIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      {selectedJob.salary}
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Schedule
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800 leading-7">
                      <BriefcaseBusinessIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      {selectedJob.type} · Posted {selectedJob.posted}
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-6">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                      Fit summary
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-950">
                      Why this role is ranking highly
                    </h3>
                    <div className="mt-5 grid gap-3 xl:grid-cols-2">
                      {selectedJob.reasons.map((reason) => (
                        <div
                          key={reason}
                          className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.03)]"
                        >
                          <CheckCircle2Icon
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                            aria-hidden="true"
                          />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.6rem] border border-indigo-100 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,255,1))] p-5 shadow-[0_18px_45px_rgba(79,70,229,0.08)]">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                      Take action
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                      Keep this role moving with a direct apply action, a saved reminder, or a company review.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
                      <Button
                        className="lg:min-w-[180px]"
                        onClick={() =>
                          setAppliedIds((current) =>
                            current.includes(selectedJob.id) ? current : [...current, selectedJob.id],
                          )
                        }
                      >
                        {appliedIds.includes(selectedJob.id) ? "Applied" : "Apply now"}
                      </Button>
                      <Button
                        variant="outline"
                        className="lg:min-w-[180px]"
                        onClick={() =>
                          setSavedIds((current) =>
                            current.includes(selectedJob.id)
                              ? current.filter((id) => id !== selectedJob.id)
                              : [...current, selectedJob.id],
                          )
                        }
                      >
                        {savedIds.includes(selectedJob.id) ? "Saved to shortlist" : "Save role"}
                      </Button>
                      <Link
                        href="/companies"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 lg:min-w-[240px]"
                      >
                        Explore employer directory
                        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <p className="text-sm text-slate-600">Choose a job to see the full fit summary.</p>
            </Card>
          )}
          <section aria-live="polite" aria-label={`${active} roles`} className="space-y-3">
            {list.map((job, index) => (
              <motion.div
                key={job.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, delay: index * 0.04 }}
                onClick={() => setSelectedId(job.id)}
                className={cn(
                  "block w-full cursor-pointer rounded-2xl text-left",
                  selectedJob?.id === job.id && "ring-2 ring-indigo-600 ring-offset-2",
                )}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${job.role} at ${job.company}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(job.id);
                    }
                  }}
                  className="rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <JobCard
                    job={job}
                    isApplied={appliedIds.includes(job.id)}
                    isSaved={savedIds.includes(job.id)}
                    onApply={() =>
                      setAppliedIds((current) =>
                        current.includes(job.id) ? current : [...current, job.id],
                      )
                    }
                    onSave={() =>
                      setSavedIds((current) =>
                        current.includes(job.id)
                          ? current.filter((id) => id !== job.id)
                          : [...current, job.id],
                      )
                    }
                    onHide={() => setHiddenIds((current) => [...current, job.id])}
                  />
                </div>
              </motion.div>
            ))}
            {list.length === 0 ? (
              <Card className="p-5 text-center text-sm text-slate-600">
                No roles match this filter right now.
              </Card>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
