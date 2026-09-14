"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { apiUrl, authedFetch } from "../../api";
import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  ChevronDownIcon,
  FileTextIcon,
  MapPinIcon,
  MessageCircleIcon,
  Share2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  ThumbsUpIcon,
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
  const DRAG_TRIGGER_PX = 90;
  const DRAG_LIMIT_PX = 178;
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [companies, setCompanies] = useState<CompaniesPayload>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [activeShortlistId, setActiveShortlistId] = useState<number | null>(null);
  const [endorsedIds, setEndorsedIds] = useState<Record<number, boolean>>({});
  const [sharedIds, setSharedIds] = useState<Record<number, boolean>>({});
  const [extraComments, setExtraComments] = useState<Record<number, Array<{ id: string; author: string; text: string; time: string }>>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isManualRefreshPending, setIsManualRefreshPending] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackIndicator, setPlaybackIndicator] = useState<"play" | "pause" | null>(null);
  const [lastMoveDirection, setLastMoveDirection] = useState<-1 | 0 | 1>(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingReel, setIsDraggingReel] = useState(false);
  const [isReleaseAnimating, setIsReleaseAnimating] = useState(false);
  const [animatedAction, setAnimatedAction] = useState<"endorse" | "comments" | "share" | null>(null);
  const [animatedCount, setAnimatedCount] = useState<"endorse" | "comments" | "share" | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragDistanceYRef = useRef(0);
  const suppressSurfaceClickRef = useRef(false);
  const releaseTimerRef = useRef<number | null>(null);
  const actionAnimationTimerRef = useRef<number | null>(null);
  const countAnimationTimerRef = useRef<number | null>(null);

  async function loadRecruiterFeed(nextRefreshKey: number, activeCheck: () => boolean) {
    const [dashboardPayload, companiesPayload, candidatesPayload, shortlistsPayload] =
      await Promise.all([
        authedFetch(`${apiUrl}/recruiter/dashboard`).then((response) => response.json()),
        authedFetch(`${apiUrl}/recruiter/companies`).then((response) => response.json()),
        authedFetch(`${apiUrl}/recruiter/candidates`).then((response) => response.json()),
        authedFetch(`${apiUrl}/recruiter/shortlists`).then((response) => response.json()),
      ]);

    if (!activeCheck()) {
      return;
    }

    setDashboard(dashboardPayload as DashboardPayload);
    setCompanies(
      ((companiesPayload as { companies?: CompaniesPayload }).companies ?? []) as CompaniesPayload,
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
    setStatusMessage(nextRefreshKey ? "Recruiter feed refreshed." : "Recruiter feed loaded.");
    setHasLoadedOnce(true);
    setIsManualRefreshPending(false);
  }

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadRecruiterFeed(refreshKey, () => active).catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load recruiter dashboard.",
        );
        setStatusMessage("");
        setIsManualRefreshPending(false);
      });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
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
          comments: commentItems.length,
          shares: 12 + (shared ? 1 : 0),
          endorsements: 1 + (endorsed ? 1 : 0),
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
    setLastMoveDirection(direction);
    setActiveIndex((current) => (current + direction + recruiterShorts.length) % recruiterShorts.length);
  }

  function clearReleaseTimer() {
    if (releaseTimerRef.current !== null) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  }

  function clearActionAnimationTimer() {
    if (actionAnimationTimerRef.current !== null) {
      window.clearTimeout(actionAnimationTimerRef.current);
      actionAnimationTimerRef.current = null;
    }
  }

  function clearCountAnimationTimer() {
    if (countAnimationTimerRef.current !== null) {
      window.clearTimeout(countAnimationTimerRef.current);
      countAnimationTimerRef.current = null;
    }
  }

  function triggerActionAnimation(action: "endorse" | "comments" | "share") {
    clearActionAnimationTimer();
    setAnimatedAction(action);
    actionAnimationTimerRef.current = window.setTimeout(() => {
      setAnimatedAction(null);
      actionAnimationTimerRef.current = null;
    }, 320);
  }

  function triggerCountAnimation(action: "endorse" | "comments" | "share") {
    clearCountAnimationTimer();
    setAnimatedCount(action);
    countAnimationTimerRef.current = window.setTimeout(() => {
      setAnimatedCount(null);
      countAnimationTimerRef.current = null;
    }, 320);
  }

  function isInteractiveReelTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(
      target.closest(
        "button, a, input, textarea, select, [data-reel-interactive='true']",
      ),
    );
  }

  function applyDragResistance(offset: number) {
    const direction = Math.sign(offset) || 1;
    const distance = Math.abs(offset);

    if (distance <= 32) {
      return offset;
    }

    const easedDistance = 32 + Math.pow(distance - 32, 0.82) * 0.88;
    return direction * Math.min(DRAG_LIMIT_PX, easedDistance);
  }

  function resetDragState() {
    activePointerIdRef.current = null;
    dragStartYRef.current = null;
    dragDistanceYRef.current = 0;
    setDragOffsetY(0);
    setIsDraggingReel(false);
  }

  function handleSurfacePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (
      !recruiterShorts.length ||
      (event.pointerType === "mouse" && event.button !== 0) ||
      isInteractiveReelTarget(event.target)
    ) {
      return;
    }

    clearReleaseTimer();
    activePointerIdRef.current = event.pointerId;
    dragStartYRef.current = event.clientY;
    dragDistanceYRef.current = 0;
    setDragOffsetY(0);
    setIsDraggingReel(false);
    setIsReleaseAnimating(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSurfacePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId || dragStartYRef.current === null) {
      return;
    }

    const nextOffset = event.clientY - dragStartYRef.current;
    dragDistanceYRef.current = nextOffset;

    if (Math.abs(nextOffset) > 6) {
      setIsDraggingReel(true);
      suppressSurfaceClickRef.current = true;
    }

    setDragOffsetY(applyDragResistance(nextOffset));
  }

  function finishSurfaceDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const totalOffset = dragDistanceYRef.current;
    const shouldMove = Math.abs(totalOffset) >= DRAG_TRIGGER_PX;

    if (!shouldMove) {
      resetDragState();
      setIsReleaseAnimating(true);
      releaseTimerRef.current = window.setTimeout(() => {
        setIsReleaseAnimating(false);
        releaseTimerRef.current = null;
      }, 240);
      return;
    }

    const direction = totalOffset < 0 ? 1 : -1;
    setIsDraggingReel(false);
    setIsReleaseAnimating(true);
    setDragOffsetY(direction === 1 ? -DRAG_LIMIT_PX : DRAG_LIMIT_PX);
    activePointerIdRef.current = null;
    dragStartYRef.current = null;
    dragDistanceYRef.current = 0;

    releaseTimerRef.current = window.setTimeout(() => {
      setIsReleaseAnimating(false);
      setDragOffsetY(0);
      releaseTimerRef.current = null;
      move(direction);
    }, 160);
  }

  function togglePlayback() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      setPlaybackIndicator("play");
      setIsPlaying(true);
      void video.play().catch(() => undefined);
      return;
    }

    setPlaybackIndicator("pause");
    video.pause();
    setIsPlaying(false);
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
    triggerCountAnimation("share");
  }

  function handleAddComment(shortId: string, text: string) {
    const numericId = Number(shortId);
    triggerCountAnimation("comments");
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
      setStatusMessage("Write a comment before sending.");
      return;
    }

    handleAddComment(activeShort.id, normalized);
    setCommentDraft("");
    setCommentsOpen(true);
  }

  useEffect(() => {
    if (!playbackIndicator) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPlaybackIndicator(null);
    }, 800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [playbackIndicator]);

  useEffect(() => () => {
    clearReleaseTimer();
    clearActionAnimationTimer();
    clearCountAnimationTimer();
  }, []);

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
              Feed
            </h1>
          </div>
          <Button
            onClick={() => {
              setError("");
              setStatusMessage("");
              setIsManualRefreshPending(true);
              resetTransientState();
              setRefreshKey((current) => current + 1);
            }}
            disabled={isManualRefreshPending}
            className="rounded-full px-5"
          >
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            {!hasLoadedOnce || isManualRefreshPending ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {statusMessage ? (
          <p className="mt-3 text-sm font-semibold text-emerald-700" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid gap-4">
            <div className="grid items-center gap-4 md:grid-cols-[3.5rem_minmax(0,1fr)_3.5rem]">
              <div className="hidden justify-items-center gap-3 md:grid">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                  aria-label="Move up to previous profile"
                  disabled={!recruiterShorts.length}
                >
                  <ChevronDownIcon className="h-4 w-4 rotate-180" aria-hidden="true" />
                </button>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Up
                </span>
              </div>
              {activeShort ? (
                <article
                  key={`${activeShort.id}-${lastMoveDirection}`}
                  className="-translate-y-[1cm] mx-auto w-full max-w-[calc(22rem+2cm)] rounded-[2rem] bg-slate-950 shadow-[0_32px_80px_rgba(15,23,42,0.22)]"
                  style={
                    lastMoveDirection === 0
                      ? undefined
                      : {
                          animation:
                            lastMoveDirection < 0
                              ? "reel-slide-from-top 280ms cubic-bezier(0.2, 0.8, 0.2, 1)"
                              : "reel-slide-from-bottom 280ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                        }
                  }
                >
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[2rem] touch-none select-none",
                      isDraggingReel && "cursor-grabbing",
                    )}
                    style={{
                      transform: dragOffsetY ? `translateY(${dragOffsetY}px)` : undefined,
                      transition: isDraggingReel
                        ? "none"
                        : isReleaseAnimating
                          ? "transform 240ms cubic-bezier(0.18, 0.9, 0.24, 1.15)"
                          : "transform 180ms ease-out",
                    }}
                    onPointerDown={handleSurfacePointerDown}
                    onPointerMove={handleSurfacePointerMove}
                    onPointerUp={finishSurfaceDrag}
                    onPointerCancel={finishSurfaceDrag}
                    onClick={() => {
                      if (suppressSurfaceClickRef.current) {
                        suppressSurfaceClickRef.current = false;
                        return;
                      }

                      if (activeShort.media.type === "video") {
                        togglePlayback();
                      }
                    }}
                  >
                    {activeShort.media.type === "video" ? (
                      <video
                        ref={videoRef}
                        src={activeShort.media.src}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        preload="metadata"
                        className="h-[44rem] w-full cursor-pointer object-cover"
                        aria-label={activeShort.media.alt}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    ) : (
                      <div className="relative h-[44rem] w-full">
                        <Image
                          src={activeShort.media.src}
                          alt={activeShort.media.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 31rem"
                          className="object-cover"
                          draggable={false}
                        />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/75" />
                    {activeShort.media.type === "video" && playbackIndicator ? (
                      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
                        <div className="flex min-w-[8.5rem] flex-col items-center gap-2 rounded-[1.75rem] bg-black/52 px-5 py-4 text-white shadow-[0_20px_45px_rgba(15,23,42,0.28)] backdrop-blur-md">
                          <span className="text-3xl font-bold leading-none">
                            {playbackIndicator === "pause" ? "❚❚" : "▶"}
                          </span>
                          <span className="text-sm font-semibold tracking-[0.08em] text-white/90">
                            {playbackIndicator === "pause" ? "Paused" : "Playing"}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "absolute bottom-5 right-4 z-30 grid content-end gap-2 justify-items-center transition-all duration-200",
                        commentsOpen
                          ? "pointer-events-none translate-x-3 opacity-0"
                          : "pointer-events-auto translate-x-0 opacity-100",
                      )}
                      data-reel-interactive="true"
                      onPointerDown={(event) => event.stopPropagation()}
                      onPointerUp={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          triggerActionAnimation("endorse");
                          triggerCountAnimation("endorse");
                          const numericId = Number(activeShort.id);
                          setEndorsedIds((current) => ({
                            ...current,
                            [numericId]: !current[numericId],
                          }));
                        }}
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 hover:scale-105 active:scale-95",
                          activeShort.endorsed && "text-sky-300",
                          animatedAction === "endorse" && "reel-action-pop",
                        )}
                        aria-label="Endorse creator"
                      >
                        <ThumbsUpIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span
                        className={cn(
                          "text-sm font-bold text-white",
                          animatedCount === "endorse" && "reel-count-pop",
                        )}
                      >
                        {activeShort.endorsements}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCommentsOpen((current) => {
                            triggerActionAnimation("comments");
                            const nextOpen = !current;
                            setStatusMessage(nextOpen ? "Comments opened." : "Comments hidden.");
                            return nextOpen;
                          })
                        }
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 hover:scale-105 active:scale-95",
                          animatedAction === "comments" && "reel-action-pop",
                        )}
                        aria-label="Open comments"
                      >
                        <MessageCircleIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span
                        className={cn(
                          "text-sm font-bold text-white",
                          animatedCount === "comments" && "reel-count-pop",
                        )}
                      >
                        {activeShort.comments}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerActionAnimation("share");
                          void handleShare(activeShort.id);
                        }}
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 hover:scale-105 active:scale-95",
                          animatedAction === "share" && "reel-action-pop",
                        )}
                        aria-label="Share profile"
                      >
                        <Share2Icon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span
                        className={cn(
                          "text-sm font-bold text-white",
                          animatedCount === "share" && "reel-count-pop",
                        )}
                      >
                        {activeShort.shares}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsMuted((current) => !current)}
                        className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white"
                        aria-label={isMuted ? "Unmute reel" : "Mute reel"}
                      >
                        <span className="text-lg">{isMuted ? "🔇" : "🔊"}</span>
                      </button>
                    </div>

                    <div
                      className="absolute inset-x-0 bottom-0 z-10 p-5"
                      data-reel-interactive="true"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                    >
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
                      <p className="mt-3 max-w-[15rem] text-[0.84rem] font-semibold leading-6 text-white/95">
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
                          href={activeShort ? `/recruiter/candidates/${activeShort.id}` : "/recruiter/candidates"}
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
                      <div
                        className="ui-fade-up absolute inset-x-4 bottom-4 z-40 rounded-[1.5rem] bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.2)]"
                        data-reel-interactive="true"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                      >
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
                              onKeyDown={(event) => {
                                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                                  event.preventDefault();
                                  submitComment();
                                }
                              }}
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
                <Card className="mx-auto max-w-[calc(22rem+2cm)] border-slate-200/90 bg-white/95 p-8 text-center">
                  <h2 className="font-display text-xl font-bold text-slate-950">
                    No talent reels yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Talent videos and worker showcases will appear here once candidates are available.
                  </p>
                </Card>
              )}
              <div className="hidden justify-items-center gap-3 md:grid">
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                  aria-label="Move down to next profile"
                  disabled={!recruiterShorts.length}
                >
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Down
                </span>
              </div>
            </div>

            {recruiterShorts.length ? (
              <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white md:hidden"
                  aria-label="Previous profile above"
                >
                  <ChevronDownIcon className="h-4 w-4 rotate-180" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-2">
                  {recruiterShorts.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        resetTransientState();
                        setLastMoveDirection(index > safeActiveIndex ? 1 : -1);
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
                  aria-label="Next profile below"
                >
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
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
