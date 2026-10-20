"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { apiUrl, authedFetch, readJsonResponse } from "../../api";
import { MapPinIcon, SearchIcon, SparklesIcon, UsersIcon } from "../icons";
import { Badge, Button, Card } from "../primitives";

type Candidate = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  headline: string;
  location: string;
  summary: string;
  skills: string[];
  education: string[];
  experience_years: number;
};

type Shortlist = {
  id: number;
  name: string;
  candidate_count: number;
};

export function RecruiterCandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [certification, setCertification] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [newShortlistName, setNewShortlistName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recentShortlist, setRecentShortlist] = useState<Shortlist | null>(null);

  const loadCandidates = useCallback(async (
    nextFilters: Partial<{
      query: string;
      skills: string;
      location: string;
      certification: string;
    }> = {},
  ) => {
    setError("");
    const resolvedQuery = nextFilters.query ?? query;
    const resolvedSkills = nextFilters.skills ?? skills;
    const resolvedLocation = nextFilters.location ?? location;
    const resolvedCertification = nextFilters.certification ?? certification;

    try {
      const searchParams = new URLSearchParams();

      if (resolvedQuery.trim()) {
        searchParams.set("query", resolvedQuery.trim());
      }
      if (resolvedSkills.trim()) {
        searchParams.set("skills", resolvedSkills.trim());
      }
      if (resolvedLocation.trim()) {
        searchParams.set("location", resolvedLocation.trim());
      }
      if (resolvedCertification.trim()) {
        searchParams.set("certification", resolvedCertification.trim());
      }

      const response = await authedFetch(
        `${apiUrl}/recruiter/candidates?${searchParams.toString()}`,
      );
      const payload = await readJsonResponse<{ candidates?: Candidate[] }>(response);

      if (!response.ok) {
        throw new Error("Unable to load candidates.");
      }

      setCandidates(payload.candidates ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load candidates.",
      );
    }
  }, [certification, location, query, skills]);

  async function loadShortlists() {
    try {
      const response = await authedFetch(`${apiUrl}/recruiter/shortlists`);
      const payload = await readJsonResponse<{ shortlists?: Shortlist[] }>(response);

      if (!response.ok) {
        throw new Error("Unable to load shortlists.");
      }

      setShortlists(payload.shortlists ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load shortlists.",
      );
    }
  }

  useEffect(() => {
    let active = true;
    const nextQuery = searchParams.get("query") ?? "";
    const nextSkills = searchParams.get("skills") ?? "";
    const nextLocation = searchParams.get("location") ?? "";
    const nextCertification = searchParams.get("certification") ?? "";

    const timer = window.setTimeout(() => {
      setQuery(nextQuery);
      setSkills(nextSkills);
      setLocation(nextLocation);
      setCertification(nextCertification);
      loadCandidates({
        query: nextQuery,
        skills: nextSkills,
        location: nextLocation,
        certification: nextCertification,
      })
        .then(() => {
          if (!active) {
            return;
          }
        })
        .catch((caughtError) => {
          if (!active) {
            return;
          }

          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load candidates.",
          );
        });

      authedFetch(`${apiUrl}/recruiter/shortlists`)
        .then(async (response) => {
          const payload = await readJsonResponse<{ shortlists?: Shortlist[] }>(response);

          if (!response.ok) {
            throw new Error("Unable to load shortlists.");
          }

          if (active) {
            setShortlists(payload.shortlists ?? []);
          }
        })
        .catch((caughtError) => {
          if (!active) {
            return;
          }

          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load shortlists.",
          );
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadCandidates, searchParams]);

  async function createShortlist() {
    setError("");
    setMessage("");

    if (!newShortlistName.trim()) {
      return;
    }

    try {
      const response = await authedFetch(`${apiUrl}/recruiter/shortlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newShortlistName.trim(),
        }),
      });
      const payload = await readJsonResponse<{ shortlist?: Shortlist; error?: string }>(
        response,
      );

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create shortlist.");
      }

      setNewShortlistName("");
      setRecentShortlist(payload.shortlist ?? null);
      setMessage("Shortlist created.");
      await loadShortlists();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create shortlist.",
      );
    }
  }

  async function addToShortlist(candidateUserId: number, shortlistId: number) {
    setMessage("");
    setError("");

    try {
      const response = await authedFetch(
        `${apiUrl}/recruiter/shortlists/${shortlistId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            candidateUserId,
          }),
        },
      );
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error || "Unable to add candidate to shortlist.");
      }

      const targetShortlist =
        shortlists.find((shortlist) => shortlist.id === shortlistId) ?? null;
      setRecentShortlist(targetShortlist);
      setMessage(
        targetShortlist
          ? `Candidate added to ${targetShortlist.name}.`
          : "Candidate added to shortlist.",
      );
      await loadShortlists();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to add candidate to shortlist.",
      );
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearchParams = new URLSearchParams();

    if (query.trim()) {
      nextSearchParams.set("query", query.trim());
    }
    if (skills.trim()) {
      nextSearchParams.set("skills", skills.trim());
    }
    if (location.trim()) {
      nextSearchParams.set("location", location.trim());
    }
    if (certification.trim()) {
      nextSearchParams.set("certification", certification.trim());
    }

    router.push(
      nextSearchParams.toString()
        ? `/recruiter/candidates?${nextSearchParams.toString()}`
        : "/recruiter/candidates",
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-5">
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
              Algorithmic talent search
            </span>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
              Find candidates without turning the network into spam
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Filter by query, skills, location, and certifications, then drop high-fit candidates into the right shortlist.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {shortlists.length} active shortlists
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white">
            Candidate search
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            Shortlist actions
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            Shared recruiter data
          </span>
        </div>

        <form
          className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-[1.2fr,1fr,1fr,1fr,auto]"
          onSubmit={handleSearchSubmit}
        >
          <label className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Query
            </span>
            <div className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 outline-none"
                placeholder="Product designer, growth, frontend..."
              />
            </div>
          </label>
          <label className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Skills
            </span>
            <input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
              placeholder="React, Growth, Figma"
            />
          </label>
          <label className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Location
            </span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
              placeholder="London, Lagos, Remote"
            />
          </label>
          <label className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Certification
            </span>
            <input
              value={certification}
              onChange={(event) => setCertification(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
              placeholder="PhD, BSc, AWS, MSc"
            />
          </label>
          <div className="flex items-end">
            <Button className="w-full lg:w-auto" type="submit">
              Search
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          {candidates.length ? (
            candidates.map((candidate) => (
              <Card key={candidate.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                        {candidate.full_name}
                      </h2>
                      <Badge tone="indigo">
                        <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {candidate.experience_years} years
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {candidate.headline}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                      {candidate.location}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {candidate.summary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {candidate.skills.map((skill) => (
                        <Badge key={skill}>{skill}</Badge>
                      ))}
                    </div>
                    {candidate.education.length ? (
                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Certifications
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {candidate.education.map((item) => (
                            <Badge key={item} tone="emerald">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="w-full max-w-xs space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-900">
                      Send to shortlist
                    </p>
                    <div className="grid gap-2">
                      {shortlists.slice(0, 3).map((shortlist) => (
                        <Button
                          key={shortlist.id}
                          variant="outline"
                          className="justify-start"
                          onClick={() => void addToShortlist(candidate.id, shortlist.id)}
                        >
                          <UsersIcon className="h-4 w-4" aria-hidden="true" />
                          {shortlist.name}
                        </Button>
                      ))}
                    </div>
                    {shortlists.length ? (
                      <Link
                        href="/recruiter/shortlists"
                        className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-50"
                      >
                        View all shortlists
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                No matching candidates
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Try broadening the query or reducing the skill, location, or certification filters.
              </p>
            </Card>
          )}
        </div>

        <Card className="h-fit border-slate-200/90 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <h2 className="font-display text-xl font-bold text-slate-950">
            Shortlist workflow
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Create curated pipelines for UK product roles, Africa expansion, or any enterprise campaign.
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              New shortlist
            </label>
            <input
              value={newShortlistName}
              onChange={(event) => setNewShortlistName(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none"
              placeholder="EMEA growth pipeline"
            />
            <Button className="mt-3 w-full" onClick={() => void createShortlist()}>
              Create shortlist
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {shortlists.map((shortlist) => (
              <Link
                key={shortlist.id}
                href={`/recruiter/shortlists/${shortlist.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-950">{shortlist.name}</p>
                  <Badge tone="emerald">{shortlist.candidate_count} candidates</Badge>
                </div>
              </Link>
            ))}
          </div>

          {message ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-700">{message}</p>
              {recentShortlist ? (
                <Link
                  href={`/recruiter/shortlists/${recentShortlist.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
                >
                  View {recentShortlist.name}
                </Link>
              ) : null}
            </div>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm font-semibold text-rose-700">{error}</p>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
