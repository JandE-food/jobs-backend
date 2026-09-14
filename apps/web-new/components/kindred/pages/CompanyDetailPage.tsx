"use client";

import { useEffect, useState } from "react";

import { apiUrl, readJsonResponse } from "../../api";
import { BriefcaseBusinessIcon, MapPinIcon, ShieldCheckIcon } from "../icons";
import { Badge, Card } from "../primitives";

type CompanyDetail = {
  id: number;
  name: string;
  slug: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  verification_status: string;
  ad_headline: string;
  ad_copy: string;
  company_number?: string;
  directors?: string[];
  companies_house_status?: string;
  hmrc_status?: string;
  data_residency_region?: string;
  right_to_work_required?: boolean;
  retention_policy_days?: number;
  risk_notes?: string;
  jobs: Array<{
    id: number;
    title: string;
    description: string;
    requirements: string;
    location: string;
    salary_range: string;
    status: string;
    featured: boolean;
  }>;
};

export function CompanyDetailPage({ slug }: { slug: string }) {
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`${apiUrl}/companies/${slug}`)
      .then(async (response) => {
        const payload = await readJsonResponse<{ company?: CompanyDetail; error?: string }>(
          response,
        );

        if (!response.ok || !payload.company) {
          throw new Error(payload.error ?? "Unable to load company.");
        }

        if (active) {
          setCompany(payload.company);
        }
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load company.",
        );
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="py-5">
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-5">
        <Card className="p-5 text-sm font-semibold text-slate-600">
          Loading company page...
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-5">
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <BriefcaseBusinessIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">
                {company.name}
              </h1>
              <Badge tone={company.verification_status === "verified" ? "emerald" : "amber"}>
                <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {company.verification_status}
              </Badge>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
              <MapPinIcon className="h-4 w-4" aria-hidden="true" />
              {company.location} · {company.industry} · {company.size}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{company.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Open jobs</p>
              <p className="mt-1 font-display text-2xl font-bold text-slate-950">{company.jobs.length}</p>
            </div>
            <div className="rounded-[1.4rem] bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Region</p>
              <p className="mt-1 font-display text-xl font-bold text-slate-950">
                {company.data_residency_region ?? "UK"}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Status</p>
              <p className="mt-1 font-display text-xl font-bold text-slate-950">
                {company.verification_status}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-sm font-bold text-indigo-950">{company.ad_headline}</p>
          <p className="mt-2 text-sm leading-7 text-indigo-900/80">{company.ad_copy}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={company.companies_house_status === "verified" ? "emerald" : "amber"}>
            Companies House {company.companies_house_status ?? "pending"}
          </Badge>
          <Badge tone={company.hmrc_status === "verified" ? "emerald" : "amber"}>
            HMRC {company.hmrc_status ?? "pending"}
          </Badge>
          <Badge tone="slate">{company.data_residency_region ?? "UK"} residency</Badge>
          {company.right_to_work_required ? (
            <Badge tone="indigo">Right-to-work vault active</Badge>
          ) : null}
        </div>
        {company.risk_notes ? (
          <p className="mt-4 text-sm leading-7 text-slate-600">{company.risk_notes}</p>
        ) : null}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid gap-4">
          {company.jobs.map((job) => (
            <Card key={job.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                    {job.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {job.location} · {job.salary_range}
                  </p>
                </div>
                <div className="flex gap-2">
                  {job.featured ? <Badge tone="amber">Featured</Badge> : null}
                  <Badge tone={job.status === "published" ? "emerald" : "slate"}>
                    {job.status}
                  </Badge>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{job.description}</p>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Requirements:{" "}
                <span className="font-normal text-slate-600">{job.requirements}</span>
              </p>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              Company profile
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Website:</span>{" "}
                {company.website || "Not provided"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Company number:</span>{" "}
                {company.company_number || "Pending"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Retention policy:</span>{" "}
                {company.retention_policy_days ? `${company.retention_policy_days} days` : "Standard"}
              </p>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
              Directors
            </p>
            <div className="mt-4 space-y-2">
              {(company.directors ?? []).length ? (
                (company.directors ?? []).map((director) => (
                  <div key={director} className="rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    {director}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No director data attached yet.</p>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
