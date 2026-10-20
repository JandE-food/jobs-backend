"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiUrl, authedFetch, readJsonResponse } from "../../api";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  MailIcon,
  MapPinIcon,
  SparklesIcon,
  UsersIcon,
} from "../icons";
import { Badge, Button, Card } from "../primitives";

type Candidate = {
  id: number | string;
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

export function RecruiterCandidateProfilePage({
  candidateId,
}: {
  candidateId: string;
}) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      authedFetch(`${apiUrl}/recruiter/candidates`)
        .then(async (response) => {
          const payload = await readJsonResponse<{ candidates?: Candidate[]; error?: string }>(
            response,
          );

          if (!response.ok) {
            throw new Error(payload.error ?? "Unable to load candidate profile.");
          }

          if (!active) {
            return;
          }

          const match =
            (payload.candidates ?? []).find((item) => String(item.id) === candidateId) ?? null;
          setCandidate(match);
          if (!match) {
            setError("Candidate profile not found.");
          }
        })
        .catch((caughtError) => {
          if (!active) {
            return;
          }

          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load candidate profile.",
          );
        });

      authedFetch(`${apiUrl}/recruiter/shortlists`)
        .then(async (response) => {
          const payload = await readJsonResponse<{ shortlists?: Shortlist[]; error?: string }>(
            response,
          );

          if (!response.ok || !active) {
            return;
          }

          setShortlists(payload.shortlists ?? []);
        })
        .catch(() => undefined);
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [candidateId]);

  const fitScore = useMemo(() => {
    if (!candidate) {
      return 0;
    }

    return Math.min(98, 78 + candidate.experience_years + Math.min(12, candidate.skills.length));
  }, [candidate]);

  async function addToShortlist(shortlistId: number) {
    if (!candidate) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await authedFetch(`${apiUrl}/recruiter/shortlists/${shortlistId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateUserId: Number(candidate.id),
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to add candidate to shortlist.");
      }

      const shortlist = shortlists.find((item) => item.id === shortlistId);
      setMessage(
        shortlist
          ? `${candidate.full_name} added to ${shortlist.name}.`
          : "Candidate added to shortlist.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to add candidate to shortlist.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-5">
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                Candidate profile
              </span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
              {candidate?.full_name ?? "Loading candidate"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Review the candidate&apos;s background, skill fit, and shortlist options from a single recruiter profile view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/recruiter/candidates"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Back to search
            </Link>
            <Link
              href="/recruiter/shortlists"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              All shortlists
            </Link>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}
      </section>

      {candidate ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                {candidate.headline || candidate.role}
              </h2>
              <Badge tone="indigo">
                <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {candidate.experience_years} years
              </Badge>
              <Badge tone="emerald">
                <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {fitScore}% recruiter fit
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                {candidate.location}
              </span>
              <span className="inline-flex items-center gap-2">
                <MailIcon className="h-4 w-4" aria-hidden="true" />
                {candidate.email}
              </span>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">{candidate.summary}</p>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </div>

            {candidate.education.length ? (
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Certifications
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.education.map((item) => (
                    <Badge key={item} tone="emerald">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
                Shortlist actions
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Send this candidate straight into a shortlist for follow-up and recruiter handoff.
              </p>
              <div className="mt-4 grid gap-2">
                {shortlists.length ? (
                  shortlists.slice(0, 4).map((shortlist) => (
                    <Button
                      key={shortlist.id}
                      variant="outline"
                      className="justify-start"
                      onClick={() => void addToShortlist(shortlist.id)}
                    >
                      <UsersIcon className="h-4 w-4" aria-hidden="true" />
                      {shortlist.name}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Create a shortlist before saving candidates.</p>
                )}
              </div>
              <Link
                href="/recruiter/shortlists"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-50"
              >
                Manage shortlists <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
                Profile summary
              </p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="font-bold text-slate-900">Primary role</dt>
                  <dd className="mt-1 text-slate-600">{candidate.role}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="font-bold text-slate-900">Experience</dt>
                  <dd className="mt-1 text-slate-600">{candidate.experience_years} years of hands-on delivery</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="font-bold text-slate-900">Location</dt>
                  <dd className="mt-1 text-slate-600">{candidate.location}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </section>
      ) : null}
    </div>
  );
}
