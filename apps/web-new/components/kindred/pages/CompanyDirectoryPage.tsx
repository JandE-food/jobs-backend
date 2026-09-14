"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiUrl, readJsonResponse } from "../../api";
import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "../icons";
import { Badge, Button, Card } from "../primitives";

type Company = {
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
  job_count: number;
  queued_jobs: number;
  company_number?: string;
  companies_house_status?: string;
  hmrc_status?: string;
  data_residency_region?: string;
  right_to_work_required?: boolean;
};

export function CompanyDirectoryPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState("");
  const verifiedCompanies = companies.filter(
    (company) => company.verification_status === "verified",
  );

  useEffect(() => {
    let active = true;

    fetch(`${apiUrl}/companies`)
      .then(async (response) => {
        const payload = await readJsonResponse<{ companies?: Company[] }>(response);

        if (!response.ok) {
          throw new Error("Unable to load company directory.");
        }

        if (active) {
          setCompanies(payload.companies ?? []);
        }
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load company directory.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="ui-fade-up space-y-8 py-5 xl:space-y-10">
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
              Corporate directory
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">
              Verified company pages, campaigns, and hiring queues
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Explore the same employer network used across the shared BEJELI ecosystem. Every page stays connected to live roles, trust signals, and the same API used by mobile and recruiter workflows.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Companies", value: companies.length },
              { label: "Verified", value: verifiedCompanies.length },
              {
                label: "Live jobs",
                value: companies.reduce((total, company) => total + company.job_count, 0),
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[1.4rem] bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-slate-950">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white">
            Verified employers
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            Sponsored campaigns
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            Hiring queues
          </span>
        </div>
      </section>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </Card>
      ) : null}

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-5 xl:grid-cols-2">
          {companies.map((company) => (
            <Card key={company.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BriefcaseBusinessIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                      {company.name}
                    </h2>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                    {company.location} · {company.industry} · {company.size}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    tone={company.verification_status === "verified" ? "emerald" : "amber"}
                  >
                    <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {company.verification_status}
                  </Badge>
                  <Badge tone="indigo">{company.job_count} jobs</Badge>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">{company.description}</p>

              <div className="mt-5 rounded-[1.4rem] border border-indigo-100 bg-indigo-50/70 p-5">
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
                  <Badge tone="indigo">Right-to-work required</Badge>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/companies/${company.slug}`}>
                  <Button>
                    Open page
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Visit site
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              Directory status
            </p>
            <h2 className="mt-2 font-display text-xl font-bold text-slate-950">
              Trusted employer network
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Company pages, job inventory, and employer branding stay in one consistent experience across talent and recruiter views.
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
              Compliance
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-950">UK data zones</p>
                <p className="mt-1 text-sm text-slate-600">Shared with the same live BEJELI backend.</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-950">Verification ready</p>
                <p className="mt-1 text-sm text-slate-600">Companies House and HMRC status remain visible in the new UI.</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
