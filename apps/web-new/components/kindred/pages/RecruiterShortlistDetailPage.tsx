"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiUrl, authedFetch, readJsonResponse } from "../../api";
import { MapPinIcon, SparklesIcon, UsersIcon } from "../icons";
import { Badge, Card } from "../primitives";

type ShortlistCandidate = {
  id: number;
  full_name: string;
  email: string;
  headline: string;
  location: string;
  summary: string;
  skills: string[];
  education: string[];
  experience_years: number;
  note?: string;
  added_at?: string;
};

type ShortlistDetail = {
  id: number;
  name: string;
  candidate_count: number;
  created_at?: string;
  candidates: ShortlistCandidate[];
};

export function RecruiterShortlistDetailPage({
  shortlistId,
}: {
  shortlistId: number;
}) {
  const [shortlist, setShortlist] = useState<ShortlistDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadShortlist() {
      setError("");

      try {
        const response = await authedFetch(
          `${apiUrl}/recruiter/shortlists/${shortlistId}`,
        );
        const payload = await readJsonResponse<{
          shortlist?: ShortlistDetail;
          error?: string;
        }>(response);

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load shortlist.");
        }

        setShortlist(payload.shortlist ?? null);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load shortlist.",
        );
      }
    }

    const timer = window.setTimeout(() => {
      void loadShortlist();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [shortlistId]);

  return (
    <div className="space-y-6 py-5">
      <section className="rounded-[2rem] border border-[#3a2c17]/90 bg-[#0f0b07]/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-brand-300" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
                Shortlist detail
              </span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-brand-50">
              {shortlist?.name ?? "Loading shortlist"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-brand-100/78">
              Review everyone you added to this shortlist and use the saved criteria for recruiter handoff.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/recruiter/candidates"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#4d3a1d] bg-[#16110b] px-4 text-sm font-semibold text-brand-100 transition-colors hover:bg-[#18130d]"
            >
              Open talent search
            </Link>
            <Link
              href="/recruiter/shortlists"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#4d3a1d] bg-[#14100c] px-4 text-sm font-semibold text-brand-100 transition-colors hover:bg-[#18130d]"
            >
              All shortlists
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center rounded-full bg-brand-500 px-4 text-sm font-semibold text-[#140f08]">
            Shortlist review
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full border border-[#3a2c17] bg-[#16110b] px-4 text-sm font-semibold text-brand-100">
            Saved candidate context
          </span>
        </div>

        {shortlist ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {shortlist.candidate_count} candidates saved
          </div>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm font-semibold text-rose-700">{error}</p>
        ) : null}
      </section>

      <section className="space-y-4">
        {shortlist?.candidates.length ? (
          shortlist.candidates.map((candidate) => (
            <Card key={candidate.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl font-bold tracking-tight text-brand-50">
                      {candidate.full_name}
                    </h2>
                    <Badge tone="indigo">
                      <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {candidate.experience_years} years
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-brand-100/82">
                    {candidate.headline}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-100/75">
                    <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                    {candidate.location}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-brand-100/75">
                    {candidate.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                  {candidate.education.length ? (
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-200/60">
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

                <div className="w-full max-w-xs space-y-3 rounded-2xl border border-[#302312] bg-[#16110b] p-4">
                  <p className="text-sm font-bold text-brand-50">Saved context</p>
                  <p className="text-sm text-brand-100/75">
                    Added from algorithmic search to keep this candidate inside the active recruiter pipeline.
                  </p>
                  {candidate.note ? (
                    <div className="rounded-xl border border-[#3a2c17] bg-[#14100c] p-3 text-sm text-brand-100/80">
                      {candidate.note}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        ) : shortlist ? (
          <Card className="p-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-brand-50">
              No candidates yet
            </h2>
            <p className="mt-2 text-sm leading-7 text-brand-100/75">
              Add candidates from the algorithmic talent search and they will appear here immediately.
            </p>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
