"use client";

import { useEffect, useState } from "react";

import { apiUrl, authedFetch, readJsonResponse } from "../../api";
import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  FileTextIcon,
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
};

type Job = {
  id: number;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  status: string;
  featured: boolean;
  company_name: string;
};

export function RecruiterCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [companyForm, setCompanyForm] = useState({
    name: "",
    slug: "",
    website: "",
    industry: "",
    size: "",
    location: "",
    description: "",
    adHeadline: "",
    adCopy: "",
  });
  const [jobForm, setJobForm] = useState({
    companyId: "",
    title: "",
    description: "",
    requirements: "",
    location: "",
    salaryRange: "",
    status: "queued",
    featured: false,
  });
  const primaryCompany = companies[0] ?? null;
  const companyCreationLocked = Boolean(primaryCompany);

  async function loadData() {
    setError("");

    try {
      const [companiesResponse, jobsResponse] = await Promise.all([
        authedFetch(`${apiUrl}/recruiter/companies`),
        authedFetch(`${apiUrl}/jobs`),
      ]);
      const companiesPayload = (await companiesResponse.json()) as {
        companies?: Company[];
      };
      const jobsPayload = (await jobsResponse.json()) as { jobs?: Job[] };

      if (!companiesResponse.ok || !jobsResponse.ok) {
        throw new Error("Unable to load company workflows.");
      }

      const nextCompanies = companiesPayload.companies ?? [];
      setCompanies(nextCompanies);
      setJobs(jobsPayload.jobs ?? []);
      setJobForm((current) =>
        current.companyId || !nextCompanies.length
          ? current
          : { ...current, companyId: `${nextCompanies[0].id}` },
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load company workflows.",
      );
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  async function createCompanyRecord() {
    setMessage("");
    setError("");

    if (companyCreationLocked) {
      setError(
        `This recruiter account already owns ${primaryCompany?.name}. Delete it before creating another company.`,
      );
      return;
    }

    const response = await authedFetch(`${apiUrl}/companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(companyForm),
    });

    const payload = await readJsonResponse<{ error?: string }>(response);

    if (!response.ok) {
      setError(payload.error ?? "Unable to create company.");
      return;
    }

    setMessage("Company created and sent to verification queue.");
    setCompanyForm({
      name: "",
      slug: "",
      website: "",
      industry: "",
      size: "",
      location: "",
      description: "",
      adHeadline: "",
      adCopy: "",
    });
    await loadData();
  }

  async function createJobRecord() {
    setMessage("");
    setError("");

    const response = await authedFetch(`${apiUrl}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...jobForm,
        companyId: Number(jobForm.companyId),
      }),
    });

    if (!response.ok) {
      setError("Unable to create job.");
      return;
    }

    setMessage("Job created and added to the posting queue.");
    setJobForm({
      companyId: "",
      title: "",
      description: "",
      requirements: "",
      location: "",
      salaryRange: "",
      status: "queued",
      featured: false,
    });
    await loadData();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-5">
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
              Recruiter company workflows
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">
              Company pages, posting queues, and employer inventory
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Manage the same employer data powering the public company directory, recruiter feed, and mobile-connected hiring flows.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Companies", value: companies.length },
              { label: "Jobs", value: jobs.length },
              {
                label: "Featured",
                value: jobs.filter((job) => job.featured).length,
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
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2">
            <BriefcaseBusinessIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
              Company validation and SaaS directory management
            </h1>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Stand up company pages, queue ad placements, and publish hiring inventory into the public corporate directory.
          </p>
          {primaryCompany ? (
            <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900">
              This recruiter account already owns {primaryCompany.name}. Delete that company
              before creating another one. You can still create multiple jobs below.
            </div>
          ) : null}

          <fieldset disabled={companyCreationLocked} className="mt-5 disabled:opacity-60">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Company name
                <input
                  value={companyForm.name}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, name: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Slug
                <input
                  value={companyForm.slug}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, slug: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Website
                <input
                  value={companyForm.website}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, website: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Industry
                <input
                  value={companyForm.industry}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, industry: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Size
                <input
                  value={companyForm.size}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, size: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Location
                <input
                  value={companyForm.location}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, location: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm font-semibold text-slate-800">
              Description
              <textarea
                value={companyForm.description}
                onChange={(event) =>
                  setCompanyForm({ ...companyForm, description: event.target.value })
                }
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </label>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Ad headline
                <input
                  value={companyForm.adHeadline}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, adHeadline: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Ad copy
                <input
                  value={companyForm.adCopy}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, adCopy: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
            </div>
            <Button
              className="mt-4"
              onClick={() => void createCompanyRecord()}
              disabled={companyCreationLocked}
            >
              {companyCreationLocked ? "Company page locked" : "Create company page"}
            </Button>
          </fieldset>
        </Card>

        <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
              Posting queue and campaign inventory
            </h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Create jobs inside recruiter-owned companies and flag premium roles for ad visibility.
          </p>

          <div className="mt-5 grid gap-3">
            <label className="text-sm font-semibold text-slate-800">
              Company
              <select
                value={jobForm.companyId}
                onChange={(event) =>
                  setJobForm({ ...jobForm, companyId: event.target.value })
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none"
              >
                <option value="">Choose company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Job title
              <input
                value={jobForm.title}
                onChange={(event) =>
                  setJobForm({ ...jobForm, title: event.target.value })
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Description
              <textarea
                value={jobForm.description}
                onChange={(event) =>
                  setJobForm({ ...jobForm, description: event.target.value })
                }
                className="mt-2 min-h-24 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Requirements
                <input
                  value={jobForm.requirements}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, requirements: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Location
                <input
                  value={jobForm.location}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, location: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Salary range
                <input
                  value={jobForm.salaryRange}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, salaryRange: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Status
                <select
                  value={jobForm.status}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, status: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
                >
                  <option value="queued">Queued</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={jobForm.featured}
                onChange={(event) =>
                  setJobForm({ ...jobForm, featured: event.target.checked })
                }
                className="h-4 w-4 rounded border-slate-400 text-indigo-700"
              />
              Featured placement for ad hub visibility
            </label>
            <Button onClick={() => void createJobRecord()}>Create job</Button>
          </div>
        </Card>
      </section>

      {message ? (
        <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {message}
        </Card>
      ) : null}
      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
              Corporate directory queue
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {companies.map((company) => (
              <div key={company.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">{company.name}</h3>
                    <p className="text-sm text-slate-600">
                      {company.industry} · {company.location} · {company.size}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={company.verification_status === "verified" ? "emerald" : "amber"}>
                      {company.verification_status}
                    </Badge>
                    <Badge tone="indigo">{company.job_count} jobs</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{company.ad_headline}</p>
                <p className="mt-1 text-sm text-slate-600">{company.ad_copy}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="slate">{company.queued_jobs} queued jobs</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2">
            <BanknoteIcon className="h-5 w-5 text-amber-700" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
              Posting queue snapshot
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {jobs.slice(0, 6).map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">{job.title}</h3>
                    <p className="text-sm text-slate-600">
                      {job.company_name} · {job.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.featured ? <Badge tone="amber">Featured</Badge> : null}
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
      </section>
    </div>
  );
}
