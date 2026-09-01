"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { apiUrl, authedFetch, readJsonResponse } from "../../api";
import { useKindredAuth } from "../app/kindred-provider";
import {
  ArrowRightIcon,
  MapPinIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "../icons";
import { Avatar, Badge, Button, Card } from "../primitives";
import { AVATARS } from "../mock";
import { getStoredPersonaMode, savePersonaMode, type PersonaMode } from "../workspace-state";

type TalentProfile = {
  id: number;
  full_name: string;
  headline: string;
  location: string;
  summary: string;
  skills: string[];
  education: string[];
  experience_years: number;
  persona_mode: PersonaMode;
  sector: string;
  hourly_rate: string;
  endorsement_points: number;
  endorsement_count: number;
  instant_bookable: boolean;
  rating: number;
};

export function NetworkPage() {
  const { user } = useKindredAuth();
  const [persona, setPersona] = useState<PersonaMode>(() => getStoredPersonaMode());
  const [location, setLocation] = useState("");
  const [sector, setSector] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [talent, setTalent] = useState<TalentProfile[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const canInstantBook = user?.role === "recruiter" || user?.role === "admin";

  useEffect(() => {
    savePersonaMode(persona);
  }, [persona]);

  useEffect(() => {
    let active = true;
    const searchParams = new URLSearchParams({
      persona,
      minRating,
    });

    if (location.trim()) {
      searchParams.set("location", location.trim());
    }

    if (sector.trim()) {
      searchParams.set("sector", sector.trim());
    }

    authedFetch(`${apiUrl}/discovery/talent?${searchParams.toString()}`)
      .then(async (response) => {
        const payload = await readJsonResponse<{ talent?: TalentProfile[]; error?: string }>(
          response,
        );

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load discovery results.");
        }

        if (active) {
          setTalent(payload.talent ?? []);
          setError("");
        }
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load discovery results.",
        );
      });

    return () => {
      active = false;
    };
  }, [location, minRating, persona, sector]);

  const summaryStats = useMemo(
    () => [
      { label: "Discovery pool", value: talent.length },
      { label: "Instant-book ready", value: talent.filter((item) => item.instant_bookable).length },
      { label: "High-signal talent", value: talent.filter((item) => item.rating >= 4.2).length },
    ],
    [talent],
  );

  async function endorseTalent(profile: TalentProfile) {
    setBusyId(profile.id);
    setMessage("");
    setError("");

    try {
      const response = await authedFetch(`${apiUrl}/rewards/endorsements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: profile.id,
          note: `Endorsed from discovery feed for ${profile.sector} availability.`,
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to endorse talent.");
      }

      setMessage(`${profile.full_name} received a talent endorsement.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to endorse talent.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function instantBook(profile: TalentProfile) {
    setBusyId(profile.id);
    setMessage("");
    setError("");

    try {
      const response = await authedFetch(`${apiUrl}/operations/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workerUserId: profile.id,
          title: `${profile.sector} instant-book shift`,
          sector: profile.sector,
          location: profile.location,
          amountMinor: 28000,
          instantBook: true,
          milestoneNote: "Release escrow after shift sign-off.",
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create instant-book shift.");
      }

      setMessage(`Escrow hold created for ${profile.full_name}.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create instant-book shift.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="ui-fade-up space-y-8 xl:space-y-10">
      <section
        aria-labelledby="network-title"
        className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-9"
      >
        <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          Discovery engine
        </p>
        <h1
          id="network-title"
          className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          Match skilled professionals and worker-ready talent in one discovery workspace
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Filter by location, sector, and rating, then endorse strong profiles or dispatch
          instant-book shifts from the same discovery flow.
        </p>
      </section>

      <dl className="grid gap-4 md:grid-cols-3" aria-label="Network summary">
        {summaryStats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              {stat.label}
            </dt>
            <dd className="mt-2 font-display text-3xl font-bold text-slate-950">
              {stat.value}
            </dd>
          </Card>
        ))}
      </dl>

      <div className="space-y-7">
        <section aria-labelledby="filters-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="filters-title" className="text-xl font-bold text-slate-950">
              Discovery filters
            </h2>
            <Badge tone="indigo">Persona-aware results</Badge>
          </div>
          <Card className="mt-5 p-5">
            <div className="grid gap-4 lg:grid-cols-[auto_repeat(3,minmax(0,1fr))]">
              <div className="flex flex-wrap gap-2">
                {(["professional", "worker"] as PersonaMode[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPersona(value)}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${
                      persona === value
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {value === "professional" ? "Skilled professionals" : "Worker / gig talent"}
                  </button>
                ))}
              </div>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Filter by location"
                className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none"
              />
              <input
                value={sector}
                onChange={(event) => setSector(event.target.value)}
                placeholder="Filter by sector"
                className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none"
              />
              <select
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none"
              >
                <option value="0">All ratings</option>
                <option value="3.5">3.5+</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
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

        <section aria-labelledby="suggestions-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="suggestions-title" className="text-xl font-bold text-slate-950">
              Recommended talent
            </h2>
            <Badge tone="indigo">{persona === "professional" ? "Role fit" : "Instant dispatch"}</Badge>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {talent.map((person) => {
              const isMe = person.id === user?.id;

              return (
                <Card key={person.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={person.persona_mode === "worker" ? AVATARS.person3 : AVATARS.person1}
                      alt={person.full_name}
                      size={56}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-bold text-slate-950">{person.full_name}</h3>
                        <Badge tone={person.instant_bookable ? "emerald" : "slate"}>
                          {person.instant_bookable ? "Instant book" : "Needs scheduling"}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-slate-600">
                        {person.headline} · {person.sector}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {person.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <StarIcon className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                          {person.rating.toFixed(1)} rating
                        </span>
                        <span>{person.hourly_rate}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{person.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {person.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} tone="slate">
                        {skill}
                      </Badge>
                    ))}
                    <Badge tone="indigo">{person.endorsement_points} points earned</Badge>
                  </div>
                  <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="text-sm leading-7 text-slate-600">
                      {person.persona_mode === "worker"
                        ? "Shift-ready talent surfaced with structured availability and fast dispatch signals."
                        : "Skilled profile surfaced with professional endorsement and discovery scoring signals."}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === person.id || isMe}
                        onClick={() => void endorseTalent(person)}
                      >
                        {busyId === person.id ? "Saving..." : "Endorse"}
                      </Button>
                      {canInstantBook && person.instant_bookable ? (
                        <Button
                          size="sm"
                          disabled={busyId === person.id}
                          onClick={() => void instantBook(person)}
                        >
                          {busyId === person.id ? "Holding funds..." : "Instant book"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              <h2 className="font-bold text-slate-950">Networking prompts</h2>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Worker mode emphasizes instant-bookable talent and shift-ready availability windows.",
                "Professional mode emphasizes endorsements, sector fit, and long-form skill credibility.",
                "Use endorsements to feed the loyalty ledger and reward higher-trust participation.",
              ].map((note) => (
                <div key={note} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {note}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold text-slate-950">Explore recruiter demand</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Move from discovery into company verification, escrow-backed bookings, and platform operations.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/companies"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Open company directory <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/recruiter/operations"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Open operations dashboard <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
