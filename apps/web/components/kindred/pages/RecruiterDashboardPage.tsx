"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { apiUrl, authedFetch } from "../../api";
import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  FileTextIcon,
  HeartIcon,
  MapPinIcon,
  MessageCircleIcon,
  SearchIcon,
  Share2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "../icons";
import { AVATARS } from "../mock";
import { Avatar, Badge, Button, Card, cn } from "../primitives";

type DashboardPayload = {
  stats: {
    companies: number;
    jobs: number;
    shortlists: number;
    candidates: number;
  };
  recentJobs: Array<{
    id: number;
    title: string;
    status: string;
    featured: boolean;
    location: string;
    salary_range: string;
    company_name: string;
  }>;
  shortlists: Array<{
    id: number;
    name: string;
    candidate_count: number;
  }>;
};

type CompaniesPayload = Array<{
  id: number;
  name: string;
  slug: string;
  industry: string;
  location: string;
  verification_status: string;
  ad_headline: string;
  ad_copy: string;
  job_count: number;
  queued_jobs: number;
}>;

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

export function RecruiterDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [companies, setCompanies] = useState<CompaniesPayload>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [activeShortlistId, setActiveShortlistId] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<Record<number, boolean>>({});
  const [endorsedIds, setEndorsedIds] = useState<Record<number, boolean>>({});
  const [sharedIds, setSharedIds] = useState<Record<number, boolean>>({});
  const [extraComments, setExtraComments] = useState<Record<number, Array<{ id: string; author: string; text: string; time: string }>>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      authedFetch(`${apiUrl}/recruiter/dashboard`).then((response) => response.json()),
      authedFetch(`${apiUrl}/recruiter/companies`).then((response) => response.json()),
      authedFetch(`${apiUrl}/recruiter/candidates`).then((response) => response.json()),
      authedFetch(`${apiUrl}/recruiter/shortlists`).then((response) => response.json()),
    ])
      .then(([dashboardPayload, companiesPayload, candidatesPayload, shortlistsPayload]) => {
        if (!active) {
          return;
        }

        setDashboard(dashboardPayload as DashboardPayload);
        setCompanies(
          ((companiesPayload as { companies?: CompaniesPayload }).companies ??
            []) as CompaniesPayload,
        );
        setCandidates(
          ((candidatesPayload as { candidates?: Candidate[] }).candidates ?? []) as Candidate[],
        );
        const nextShortlists =
          ((shortlistsPayload as { shortlists?: Shortlist[] }).shortlists ?? []) as Shortlist[];
        setShortlists(nextShortlists);
        setActiveShortlistId((current) =>
          current && nextShortlists.some((shortlist) => shortlist.id === current)
            ? current
            : nextShortlists[0]?.id ?? null,
        );
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load recruiter dashboard.",
        );
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const stats = dashboard?.stats ?? {
    companies: 0,
    jobs: 0,
    shortlists: 0,
    candidates: 0,
  };

  const adHubPreview = companies.slice(0, 3);
  const activeShortlist =
    shortlists.find((shortlist) => shortlist.id === activeShortlistId) ?? null;
  const recruiterShorts = useMemo(
    () =>
      candidates.slice(0, 8).map((candidate, index) => {
        const matched = 82 + ((candidate.experience_years + index) % 15);
        const liked = Boolean(likedIds[candidate.id]);
        const endorsed = Boolean(endorsedIds[candidate.id]);
        const shared = Boolean(sharedIds[candidate.id]);
        const seededComments = [
          {
            id: `${candidate.id}-seed-1`,
            author: "Hiring ops",
            text: `Strong ${candidate.skills[0] ?? "general"} signal.`,
            time: "now",
          },
          {
            id: `${candidate.id}-seed-2`,
            author: "Recruiter review",
            text: `Location fit looks good for ${candidate.location}. Worth a deeper review.`,
            time: "now",
          },
        ];
        const commentItems = [...(extraComments[candidate.id] ?? []), ...seededComments];

        return {
          id: `${candidate.id}`,
          authorName: candidate.full_name,
          authorAvatar:
            index % 3 === 0
              ? AVATARS.person1
              : index % 3 === 1
                ? AVATARS.person2
                : AVATARS.person3,
          authorMeta: candidate.headline || candidate.role,
          caption:
            candidate.summary ||
            `${candidate.role} with ${candidate.experience_years} years of experience and strengths in ${candidate.skills
              .slice(0, 2)
              .join(", ")}.`,
          tags: ["Accountant", "Frontend Engineer", ...(candidate.skills.slice(0, 2) || [])],
          media: {
            type: index % 2 === 0 ? "video" : "image",
            src:
              index % 2 === 0
                ? "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                : AVATARS.cover,
            alt: `${candidate.full_name} showcase`,
          },
          locationLabel: candidate.location,
          matchPercent: matched,
          recommendationNote: `${candidate.skills[0] ?? "Product"} · ${(
            4.2 +
            ((candidate.experience_years % 5) * 0.1)
          ).toFixed(1)}★`,
          likes: 196 + (liked ? 1 : 0),
          comments: commentItems.length,
          shares: 12 + (shared ? 1 : 0),
          endorsements: 1 + (endorsed ? 1 : 0),
          liked,
          shared,
          endorsed,
          commentItems,
          expectedSalary:
            dashboard?.recentJobs?.[0]?.salary_range || "Salary available after review",
        };
      }),
    [
      candidates,
      dashboard?.recentJobs,
      endorsedIds,
      extraComments,
      likedIds,
      sharedIds,
    ],
  );
  const safeActiveIndex = recruiterShorts.length
    ? Math.min(activeIndex, recruiterShorts.length - 1)
    : 0;
  const activeShort = recruiterShorts[safeActiveIndex] ?? null;

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = isMuted;

    if (isPlaying) {
      void video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [activeShort?.id, isMuted, isPlaying]);

  function resetTransientState() {
    setCommentsOpen(false);
    setCommentDraft("");
    setIsMuted(true);
    setIsPlaying(true);
  }

  function move(direction: 1 | -1) {
    if (!recruiterShorts.length) {
      return;
    }

    resetTransientState();
    setActiveIndex((current) => (current + direction + recruiterShorts.length) % recruiterShorts.length);
  }

  async function handleShare(shortId: string) {
    const candidate = candidates.find((item) => `${item.id}` === shortId);

    if (!candidate) {
      return;
    }

    const shareText = `${candidate.full_name}: ${candidate.summary || candidate.headline}`;

    if (navigator.share) {
      await navigator
        .share({ title: "TalentShorts", text: shareText })
        .catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(shareText).catch(() => undefined);
    }

    setSharedIds((current) => ({ ...current, [Number(shortId)]: true }));
    setStatusMessage("Talent reel shared.");
  }

  function handleAddComment(shortId: string, text: string) {
    const numericId = Number(shortId);
    setExtraComments((current) => ({
      ...current,
      [numericId]: [
        {
          id: `${shortId}-${Date.now()}`,
          author: "Recruiter review",
          text,
          time: "now",
        },
        ...(current[numericId] ?? []),
      ],
    }));
    setStatusMessage("Comment posted to the talent reel.");
  }

  function submitComment() {
    const normalized = commentDraft.trim();

    if (!activeShort || !normalized) {
      return;
    }

    handleAddComment(activeShort.id, normalized);
    setCommentDraft("");
  }

  return (
    <div className="space-y-5">
      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </Card>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
              FOR YOUR NEXT HIRE
            </p>
            <h1 className="mt-2 font-display text-[2.35rem] font-bold tracking-tight text-slate-950">
              TalentShorts
            </h1>
          </div>
          <Button
            onClick={() => {
              setError("");
              setStatusMessage("Refreshing recruiter feed...");
              resetTransientState();
              setRefreshKey((current) => current + 1);
            }}
            className="rounded-full px-5"
          >
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/recruiter/candidates"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <SearchIcon className="h-4 w-4" aria-hidden="true" />
            Candidate search
          </Link>
          <Link
            href="/recruiter/shortlists"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileTextIcon className="h-4 w-4" aria-hidden="true" />
            To shortlist
          </Link>
          {recruiterShorts
            .slice(0, 3)
            .flatMap((item) => item.tags.slice(0, 1))
            .map((tag, index) => (
              <button
                key={`${tag}-${index}`}
                type="button"
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold",
                  index === 1
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700",
                )}
              >
                {tag}
              </button>
            ))}
          {statusMessage ? (
            <span className="inline-flex min-h-11 items-center rounded-full bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
              {statusMessage}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid gap-4">
            <div className="grid items-center gap-4 md:grid-cols-[3rem_minmax(0,1fr)_3rem]">
              <button
                type="button"
                onClick={() => move(-1)}
                className="hidden h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm md:grid"
                aria-label="Previous profile"
                disabled={!recruiterShorts.length}
              >
                <ChevronDownIcon className="h-4 w-4 rotate-90" aria-hidden="true" />
              </button>

              {activeShort ? (
                <article className="mx-auto w-full max-w-[22rem] rounded-[2rem] bg-slate-950 shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
                  <div className="relative overflow-hidden rounded-[2rem]">
                    {activeShort.media.type === "video" ? (
                      <video
                        ref={videoRef}
                        src={activeShort.media.src}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        preload="metadata"
                        className="h-[35rem] w-full object-cover"
                        aria-label={activeShort.media.alt}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    ) : (
                      <img
                        src={activeShort.media.src}
                        alt={activeShort.media.alt}
                        className="h-[35rem] w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/75" />

                    <div className="absolute left-5 top-5 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                      Talent reel
                    </div>

                    <div className="absolute right-4 top-4 z-10 grid gap-2 justify-items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const numericId = Number(activeShort.id);
                          setEndorsedIds((current) => ({
                            ...current,
                            [numericId]: !current[numericId],
                          }));
                        }}
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white",
                          activeShort.endorsed && "text-sky-300",
                        )}
                        aria-label="Endorse creator"
                      >
                        <CheckCircle2Icon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span className="text-sm font-bold text-white">{activeShort.endorsements}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const numericId = Number(activeShort.id);
                          setLikedIds((current) => ({ ...current, [numericId]: !current[numericId] }));
                        }}
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white",
                          activeShort.liked && "text-rose-400",
                        )}
                        aria-label="Like creator"
                      >
                        <HeartIcon className={cn("h-5 w-5", activeShort.liked && "fill-current")} />
                      </button>
                      <span className="text-sm font-bold text-white">{activeShort.likes}</span>
                      <button
                        type="button"
                        onClick={() => setCommentsOpen((current) => !current)}
                        className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white"
                        aria-label="Open comments"
                      >
                        <MessageCircleIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span className="text-sm font-bold text-white">{activeShort.comments}</span>
                      <button
                        type="button"
                        onClick={() => void handleShare(activeShort.id)}
                        className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white"
                        aria-label="Share profile"
                      >
                        <Share2Icon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPlaying((current) => !current)}
                        className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white"
                        aria-label={isPlaying ? "Pause reel" : "Play reel"}
                      >
                        <span className="text-lg font-bold">{isPlaying ? "❚❚" : "▶"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMuted((current) => !current)}
                        className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white"
                        aria-label={isMuted ? "Unmute reel" : "Mute reel"}
                      >
                        <span className="text-lg">{isMuted ? "🔇" : "🔊"}</span>
                      </button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                      <div className="flex items-center gap-3">
                        <Avatar src={activeShort.authorAvatar} alt={activeShort.authorName} size={44} />
                        <div className="min-w-0">
                          <p className="truncate text-[1.15rem] font-bold text-white">
                            {activeShort.authorName}
                          </p>
                          <p className="truncate text-sm text-white/75">
                            {activeShort.authorMeta}
                            {activeShort.locationLabel ? ` · ${activeShort.locationLabel}` : ""}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 max-w-[16rem] text-[0.95rem] font-semibold leading-7 text-white">
                        {activeShort.caption}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700">
                          {activeShort.matchPercent}% match
                        </span>
                        <span className="rounded-full bg-white/12 px-3 py-1 text-sm font-semibold text-white">
                          {activeShort.recommendationNote}
                        </span>
                      </div>
                      <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/85">
                        <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                        {activeShort.expectedSalary}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href="/recruiter/candidates"
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-slate-950"
                        >
                          View full profile
                        </Link>
                        <Link
                          href={activeShortlist ? `/recruiter/shortlists/${activeShortlist.id}` : "/recruiter/shortlists"}
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/10 px-5 text-sm font-bold text-white ring-1 ring-white/20"
                        >
                          Shortlist
                        </Link>
                      </div>
                    </div>

                    {commentsOpen ? (
                      <div className="absolute inset-x-4 bottom-4 z-20 rounded-[1.5rem] bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.2)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-950">Comments</p>
                            <p className="text-xs text-slate-500">
                              {activeShort.commentItems.length} replies
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCommentsOpen(false)}
                            className="text-xs font-bold text-slate-500"
                          >
                            Close
                          </button>
                        </div>
                        <div className="mt-3 grid max-h-44 gap-2 overflow-y-auto">
                          {activeShort.commentItems.map((comment) => (
                            <div key={comment.id} className="rounded-2xl bg-slate-50 p-3">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-900">{comment.author}</p>
                                <span className="text-[11px] text-slate-500">{comment.time}</span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-3">
                          <Avatar src={AVATARS.person1} alt="Recruiter review" size={40} />
                          <div className="flex-1">
                            <textarea
                              rows={3}
                              value={commentDraft}
                              onChange={(event) => setCommentDraft(event.target.value)}
                              placeholder="Add a thoughtful reply..."
                              className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                            />
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={submitComment}
                                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : (
                <Card className="mx-auto max-w-[22rem] border-slate-200/90 bg-white/95 p-8 text-center">
                  <h2 className="font-display text-xl font-bold text-slate-950">
                    No talent reels yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Talent videos and worker showcases will appear here once candidates are available.
                  </p>
                </Card>
              )}

              <button
                type="button"
                onClick={() => move(1)}
                className="hidden h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm md:grid"
                aria-label="Next profile"
                disabled={!recruiterShorts.length}
              >
                <ChevronDownIcon className="h-4 w-4 -rotate-90" aria-hidden="true" />
              </button>
            </div>

            {recruiterShorts.length ? (
              <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white md:hidden"
                  aria-label="Previous profile"
                >
                  <ChevronDownIcon className="h-4 w-4 rotate-90" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-2">
                  {recruiterShorts.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        resetTransientState();
                        setActiveIndex(index);
                      }}
                      className={cn(
                        "h-2.5 rounded-full transition-all",
                        index === safeActiveIndex ? "w-8 bg-indigo-600" : "w-2.5 bg-slate-300",
                      )}
                      aria-label={`Open reel ${index + 1}`}
                    />
                  ))}
                </div>
                <span>
                  {safeActiveIndex + 1}/{recruiterShorts.length}
                </span>
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white md:hidden"
                  aria-label="Next profile"
                >
                  <ChevronDownIcon className="h-4 w-4 -rotate-90" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-bold text-slate-950">Shortlist</p>
                <span className="text-sm font-semibold text-slate-500">
                  {activeShortlist?.candidate_count ?? 0} candidates
                </span>
              </div>
              {activeShort ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <Avatar src={activeShort.authorAvatar} alt={activeShort.authorName} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">{activeShort.authorName}</p>
                    <p className="truncate text-xs text-slate-600">
                      {activeShort.authorMeta} · {activeShort.matchPercent}% match
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-3xl font-display font-bold text-slate-950">
                    {activeShort?.endorsements ?? 0}
                  </p>
                  <p className="text-sm text-slate-500">Endorsed</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-slate-950">
                    {recruiterShorts.length}
                  </p>
                  <p className="text-sm text-slate-500">Reels today</p>
                </div>
              </div>
              <Link
                href={activeShortlist ? `/recruiter/shortlists/${activeShortlist.id}` : "/recruiter/shortlists"}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Open shortlist
              </Link>
            </Card>

            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-bold text-slate-950">Matched to your profile</p>
                <Link href="/jobs" className="text-sm font-bold text-indigo-700">
                  All jobs
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {(dashboard?.recentJobs ?? []).slice(0, 3).map((job, index) => (
                  <div key={job.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white",
                          index === 0
                            ? "bg-emerald-500"
                            : index === 1
                              ? "bg-rose-500"
                              : "bg-amber-500",
                        )}
                      >
                        {job.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-bold text-slate-950">{job.title}</p>
                          <span className="text-sm font-bold text-indigo-700">
                            {94 - index * 9}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {job.company_name} · {job.location}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-2 px-1 text-sm text-slate-500">
              <p className="flex items-center gap-2 font-semibold text-emerald-700">
                <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                Data stored in UK data zones
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span>About</span>
                <span>Help centre</span>
                <span>Privacy</span>
                <span>Careers</span>
              </div>
            </div>

            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <p className="text-xl font-bold text-slate-950">Cookies for core platform flows</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                We use a small cookie banner now so billing and privacy flows can grow into GDPR-ready consent management later.
              </p>
              <button
                type="button"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Accept cookies
              </button>
            </Card>
          </div>
        </div>
      </section>

      <div id="recruiter-home-panels" className="space-y-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Companies",
              value: stats.companies,
              icon: BriefcaseBusinessIcon,
              tone: "indigo" as const,
            },
            {
              label: "Live + queued jobs",
              value: stats.jobs,
              icon: FileTextIcon,
              tone: "amber" as const,
            },
            {
              label: "Shortlists",
              value: stats.shortlists,
              icon: UsersIcon,
              tone: "slate" as const,
            },
            {
              label: "Candidate pool",
              value: stats.candidates,
              icon: SparklesIcon,
              tone: "emerald" as const,
            },
          ].map(({ label, value, icon: Icon, tone }) => (
            <Card
              key={label}
              className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
                    {value}
                  </p>
                </div>
                <Badge tone={tone}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  Live
                </Badge>
              </div>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <Card className="overflow-hidden border-slate-200/90 bg-white/95 p-5 shadow-[0_22px_55px_rgba(15,23,42,0.05)]">
              <div id="recruiter-posting-queue" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-950">
                    Posting queue
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Featured roles and recruiter-owned role inventory.
                  </p>
                </div>
                <Badge tone="amber">
                  <BanknoteIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Featured role
                </Badge>
              </div>
              <div className="mt-5 space-y-3">
                {dashboard?.recentJobs?.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-950">{job.title}</h3>
                        <p className="text-sm text-slate-600">
                          {job.company_name} · {job.location}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.featured ? <Badge tone="amber">Featured role</Badge> : null}
                        <Badge tone={job.status === "published" ? "emerald" : "slate"}>
                          Recruiter-owned role
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{job.salary_range}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_22px_55px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-950">
                    Company queue
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Company validation and SaaS directory management.
                  </p>
                </div>
                <Link href="/recruiter/companies" className="text-sm font-bold text-indigo-800">
                  Company workflows
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {adHubPreview.map((company) => (
                  <div
                    key={company.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-950">{company.name}</h3>
                        <p className="text-sm text-slate-600">
                          {company.industry} · {company.location}
                        </p>
                      </div>
                      <Badge
                        tone={company.verification_status === "verified" ? "emerald" : "amber"}
                      >
                        {company.verification_status}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {company.ad_headline}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{company.ad_copy}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                Shortlists
              </p>
              <div className="mt-4 grid gap-2">
                {shortlists.map((shortlist) => (
                  <Link
                    key={shortlist.id}
                    href={`/recruiter/shortlists/${shortlist.id}`}
                    className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {shortlist.name}
                  </Link>
                ))}
              </div>
            </Card>
            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                <h2 className="font-bold text-slate-950">Compliance and trust</h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Verified company pages, recruiter-owned role control, and OVH-backed
                availability stay visible below the feed.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
