"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiUrl, authedFetch, readJsonResponse } from "../../api";
import { UsersIcon } from "../icons";
import { Badge, Button, Card } from "../primitives";

type Shortlist = {
  id: number;
  name: string;
  candidate_count: number;
  created_at?: string;
};

export function RecruiterShortlistsPage() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recentShortlistId, setRecentShortlistId] = useState<number | null>(null);

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
    void loadShortlists();
  }, []);

  async function createShortlist() {
    setError("");
    setMessage("");

    try {
      const response = await authedFetch(`${apiUrl}/recruiter/shortlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      const payload = await readJsonResponse<{
        shortlist?: Shortlist;
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create shortlist.");
      }

      setName("");
      setRecentShortlistId(payload.shortlist?.id ?? null);
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

  return (
    <div className="space-y-6 py-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">
            Candidate shortlist pipelines
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Structure multi-tenant talent funnels for enterprise customers, regional launches, or premium campaign delivery.
        </p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 text-sm outline-none"
            placeholder="Create a shortlist, e.g. UK healthcare product leaders"
          />
          <Button onClick={() => void createShortlist()}>Create shortlist</Button>
        </div>
        {message ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm font-semibold text-emerald-700">{message}</p>
            {recentShortlistId ? (
              <Link
                href={`/recruiter/shortlists/${recentShortlistId}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
              >
                View shortlist
              </Link>
            ) : null}
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shortlists.map((shortlist) => (
          <Card key={shortlist.id} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                {shortlist.name}
              </h2>
              <Badge tone="indigo">{shortlist.candidate_count} candidates</Badge>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Use this shortlist to drive outreach, client review, and recruiter handoff inside the enterprise workflow.
            </p>
            <Link
              href={`/recruiter/shortlists/${shortlist.id}`}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              View shortlist
            </Link>
          </Card>
        ))}
      </section>
    </div>
  );
}
