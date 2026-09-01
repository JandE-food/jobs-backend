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
      <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_16px_35px_rgba(15,23,42,0.06)] sm:p-9">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
          Corporate SaaS directory
        </span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">
          Verified company pages, ad inventory, and hiring queues
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This hub turns company validation into a monetizable employer-brand surface. Corporate clients can showcase trusted profiles, sponsored campaigns, and live recruitment queues without breaking the current design language.
        </p>
      </section>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </Card>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
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
                  tone={
                    company.verification_status === "verified" ? "emerald" : "amber"
                  }
                >
                  <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {company.verification_status}
                </Badge>
                <Badge tone="indigo">{company.job_count} jobs</Badge>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {company.description}
            </p>

            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
              <p className="text-sm font-bold text-indigo-950">{company.ad_headline}</p>
              <p className="mt-2 text-sm leading-7 text-indigo-900/80">
                {company.ad_copy}
              </p>
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

            <div className="mt-4 flex flex-wrap gap-3">
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
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Visit site
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
