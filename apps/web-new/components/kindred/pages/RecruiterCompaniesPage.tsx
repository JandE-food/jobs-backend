"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const emptyCompanyForm = {
  name: "",
  slug: "",
  website: "",
  industry: "",
  size: "",
  location: "",
  description: "",
  adHeadline: "",
  adCopy: "",
};

export function RecruiterCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
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
  const companyPanelRef = useRef<HTMLDivElement | null>(null);
  const companyNameInputRef = useRef<HTMLInputElement | null>(null);
  const editHighlightTimerRef = useRef<number | null>(null);
  const [editPanelHighlighted, setEditPanelHighlighted] = useState(false);

  function toCompanyForm(company: Company) {
    return {
      name: company.name ?? "",
      slug: company.slug ?? "",
      website: company.website ?? "",
      industry: company.industry ?? "",
      size: company.size ?? "",
      location: company.location ?? "",
      description: company.description ?? "",
      adHeadline: company.ad_headline ?? "",
      adCopy: company.ad_copy ?? "",
    };
  }

  const loadData = useCallback(async () => {
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
      setCompanyForm(nextCompanies[0] ? toCompanyForm(nextCompanies[0]) : emptyCompanyForm);
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
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

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
    setCompanyForm(emptyCompanyForm);
    await loadData();
  }

  async function saveCompanyDetails() {
    setMessage("");
    setError("");

    if (!primaryCompany) {
      await createCompanyRecord();
      return;
    }

    const response = await authedFetch(`${apiUrl}/companies/${primaryCompany.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(companyForm),
    });

    const payload = await readJsonResponse<{ error?: string }>(response);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update company details.");
      return;
    }

    setMessage("Company details updated.");
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

  function openCompanyEditPanel() {
    if (!primaryCompany) {
      return;
    }

    if (editHighlightTimerRef.current !== null) {
      window.clearTimeout(editHighlightTimerRef.current);
    }

    setEditPanelHighlighted(true);
    companyPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      companyNameInputRef.current?.focus();
    }, 220);
    editHighlightTimerRef.current = window.setTimeout(() => {
      setEditPanelHighlighted(false);
      editHighlightTimerRef.current = null;
    }, 1800);
  }

  useEffect(() => () => {
    if (editHighlightTimerRef.current !== null) {
      window.clearTimeout(editHighlightTimerRef.current);
    }
  }, []);

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
            <div className="mt-5 rounded-[1.6rem] border border-indigo-200 bg-indigo-50/90 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
                    Edit company page
                  </p>
                  <p className="mt-2 text-sm font-semibold text-indigo-950">
                    {primaryCompany.name} is the active company for this recruiter account.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-indigo-900/80">
                    One recruiter can only have one company page, but you can edit this company details panel at any time and still create multiple jobs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCompanyEditPanel}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Edit company details
                </button>
              </div>
            </div>
          ) : null}

          <div
            ref={companyPanelRef}
            className={`mt-5 rounded-[1.8rem] border p-4 transition-all duration-300 sm:p-5 ${
              companyCreationLocked
                ? editPanelHighlighted
                  ? "border-indigo-400 bg-indigo-50/80 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                  : "border-indigo-200 bg-slate-50/70"
                : "border-slate-200 bg-slate-50/70"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
                  {companyCreationLocked ? "Edit panel" : "Create panel"}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">
                  {companyCreationLocked ? "Edit company details" : "Create your company page"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {companyCreationLocked
                    ? "Update the public company profile, ad copy, and directory fields used across the recruiter feed and company pages."
                    : "Fill in the company profile that powers the recruiter feed, public directory, and connected hiring surfaces."}
                </p>
              </div>
              <Badge tone={companyCreationLocked ? "indigo" : "slate"}>
                {companyCreationLocked ? "Editing live company" : "New company setup"}
              </Badge>
            </div>

            <fieldset className="mt-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Company name
                <input
                  ref={companyNameInputRef}
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
              onClick={() => void saveCompanyDetails()}
            >
              {companyCreationLocked ? "Save edited company details" : "Create company page"}
            </Button>
            </fieldset>
          </div>
        </Card>

        <div id="posting-queue">
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
        </div>
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
