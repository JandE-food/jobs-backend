"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiUrl, authedFetch } from "../../api";
import {
  ArrowRightIcon,
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CheckCircle2Icon,
  FileTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "../icons";
import { Badge, Button, Card } from "../primitives";

type DashboardPayload = {
  stats: {
    companies: number;
    jobs: number;
    shortlists: number;
    candidates: number;
  };
  recentJobs: Array<{
    id: number;
    title: string;
    status: string;
    featured: boolean;
    location: string;
    salary_range: string;
    company_name: string;
  }>;
  shortlists: Array<{
    id: number;
    name: string;
    candidate_count: number;
  }>;
};

type CompaniesPayload = Array<{
  id: number;
  name: string;
  slug: string;
  industry: string;
  location: string;
  verification_status: string;
  ad_headline: string;
  ad_copy: string;
  job_count: number;
  queued_jobs: number;
}>;

export function RecruiterDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [companies, setCompanies] = useState<CompaniesPayload>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      authedFetch(`${apiUrl}/recruiter/dashboard`).then((response) =>
        response.json(),
      ),
      authedFetch(`${apiUrl}/recruiter/companies`).then((response) =>
        response.json(),
      ),
    ])
      .then(([dashboardPayload, companiesPayload]) => {
        if (!active) {
          return;
        }

        setDashboard(dashboardPayload as DashboardPayload);
        setCompanies(
          ((companiesPayload as { companies?: CompaniesPayload }).companies ??
            []) as CompaniesPayload,
        );
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load recruiter dashboard.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard?.stats ?? {
    companies: 0,
    jobs: 0,
    shortlists: 0,
    candidates: 0,
  };

  const adHubPreview = companies.slice(0, 3);

  return (
    <div className="space-y-6 py-5">
      <section className="rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6 shadow-[0_20px_40px_rgba(79,70,229,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 ring-1 ring-indigo-100">
              Recruiter Command Center
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">
              Run matching, validation, and corporate campaigns from one place
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Monitor candidate coverage, manage company verification, publish hiring queues,
              and power the B2B ad hub without leaving the current design system.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/recruiter/candidates">
              <Button>
                Candidate search
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/recruiter/companies">
              <Button variant="outline">Company workflows</Button>
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Companies",
            value: stats.companies,
            icon: BriefcaseBusinessIcon,
            tone: "indigo" as const,
          },
          {
            label: "Live + queued jobs",
            value: stats.jobs,
            icon: FileTextIcon,
            tone: "amber" as const,
          },
          {
            label: "Shortlists",
            value: stats.shortlists,
            icon: UsersIcon,
            tone: "slate" as const,
          },
          {
            label: "Candidate pool",
            value: stats.candidates,
            icon: SparklesIcon,
            tone: "emerald" as const,
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
                  {value}
                </p>
              </div>
              <Badge tone={tone}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                Live
              </Badge>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-950">
                Posting queue and hiring lanes
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Featured jobs, sponsored roles, and recruiter-owned pipeline status.
              </p>
            </div>
            <Badge tone="amber">
              <BanknoteIcon className="h-3.5 w-3.5" aria-hidden="true" />
              SaaS monetization
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {dashboard?.recentJobs?.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">{job.title}</h3>
                    <p className="text-sm text-slate-600">
                      {job.company_name} · {job.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.featured ? (
                      <Badge tone="amber">Featured</Badge>
                    ) : null}
                    <Badge tone={job.status === "published" ? "emerald" : "slate"}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{job.salary_range}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-950">
                Shortlist momentum
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Track the multi-tenant candidate stacks you are nurturing.
              </p>
            </div>
            <Link href="/recruiter/shortlists" className="text-sm font-bold text-indigo-800">
              Open all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {dashboard?.shortlists?.map((shortlist) => (
              <div
                key={shortlist.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-950">{shortlist.name}</h3>
                  <Badge tone="indigo">{shortlist.candidate_count} candidates</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-950">
                Corporate SaaS directory and ad hub
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Verified company profiles double as employer-brand campaign surfaces.
              </p>
            </div>
            <Link href="/companies" className="text-sm font-bold text-indigo-800">
              Open directory
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {adHubPreview.map((company) => (
              <div
                key={company.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">{company.name}</h3>
                    <p className="text-sm text-slate-600">
                      {company.industry} · {company.location}
                    </p>
                  </div>
                  <Badge
                    tone={
                      company.verification_status === "verified" ? "emerald" : "amber"
                    }
                  >
                    {company.verification_status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {company.ad_headline}
                </p>
                <p className="mt-1 text-sm text-slate-600">{company.ad_copy}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-xl font-bold text-slate-950">
            Compliance and trust
          </h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 font-bold text-emerald-900">
                <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                Verified company pages
              </p>
              <p className="mt-2 leading-relaxed">
                Corporate identity, ad inventory, and job queues stay aligned with recruiter-owned companies.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2Icon className="h-4 w-4" aria-hidden="true" />
                Direct-to-UK data posture
              </p>
              <p className="mt-2 leading-relaxed">
                The current backend remains OVH-hosted now, with the structure ready to move into your Civo UK control plane later.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
