"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import Link from "next/link";

import {
  HeartIcon,
  MapPinIcon,
  MessageCircleIcon,
  SearchIcon,
  Share2Icon,
  SparklesIcon,
  VideoIcon,
} from "../icons";
import { motion, useReducedMotion } from "../motion";
import { Avatar, Card, cn } from "../primitives";

export type ImmersiveNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
};

export type ImmersiveDockItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "accent" | "success";
};

export type ImmersiveShortComment = {
  id: string;
  author: string;
  text: string;
  time: string;
};

export type ImmersiveShortItem = {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorMeta: string;
  caption: string;
  tags: string[];
  media?: {
    type: "image" | "video";
    src: string;
    alt: string;
  };
  locationLabel?: string;
  recommendationLabel?: string;
  recommendationNote?: string;
  ctaLabel?: string;
  likes: number;
  comments: number;
  shares?: number;
  endorsements?: number;
  liked?: boolean;
  shared?: boolean;
  endorsed?: boolean;
  commentItems?: ImmersiveShortComment[];
  searchText?: string;
};

function DockButton({ item }: { item: ImmersiveDockItem }) {
  const className = cn(
    "immersive-dock-chip",
    item.active && "is-active",
    item.tone === "accent" && "is-accent",
    item.tone === "success" && "is-success",
  );

  const content = (
    <>
      {item.icon ? <span className="h-4 w-4">{item.icon}</span> : null}
      <span>{item.label}</span>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={className}>
      {content}
    </button>
  );
}

export function ImmersiveShortsHome({
  brandLabel,
  navLabel,
  navItems,
  searchPlaceholder,
  eyebrow,
  title,
  modeLabel,
  onToggleMode,
  dockItems,
  shorts,
  viewerName,
  viewerAvatar,
  emptyTitle,
  emptyBody,
  commentPlaceholder,
  onToggleLike,
  onAddComment,
  onShare,
  onToggleEndorse,
  topBarActions,
  sidePanel,
  belowFeed,
}: {
  brandLabel: string;
  navLabel: string;
  navItems: ImmersiveNavItem[];
  searchPlaceholder: string;
  eyebrow: string;
  title: string;
  modeLabel: string;
  onToggleMode?: () => void;
  dockItems: ImmersiveDockItem[];
  shorts: ImmersiveShortItem[];
  viewerName: string;
  viewerAvatar: string;
  emptyTitle: string;
  emptyBody: string;
  commentPlaceholder: string;
  onToggleLike: (shortId: string) => void;
  onAddComment: (shortId: string, text: string) => void;
  onShare: (shortId: string) => void;
  onToggleEndorse?: (shortId: string) => void;
  topBarActions?: ReactNode;
  sidePanel?: ReactNode;
  belowFeed?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const filteredShorts = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (!normalized) {
      return shorts;
    }

    return shorts.filter((item) => {
      const haystack = [
        item.title,
        item.authorName,
        item.authorMeta,
        item.caption,
        item.locationLabel,
        item.searchText,
        item.tags.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [searchQuery, shorts]);
  const safeActiveIndex = filteredShorts.length
    ? Math.min(activeIndex, filteredShorts.length - 1)
    : 0;
  const activeShort = filteredShorts[safeActiveIndex] ?? null;
  const activeMedia = activeShort?.media;

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
    resetTransientState();
    setActiveIndex((current) => {
      if (!filteredShorts.length) {
        return 0;
      }

      return (current + direction + filteredShorts.length) % filteredShorts.length;
    });
  }

  function submitComment() {
    const normalized = commentDraft.trim();

    if (!activeShort || !normalized) {
      return;
    }

    onAddComment(activeShort.id, normalized);
    setCommentDraft("");
  }

  return (
    <div className="immersive-home-page ui-fade-up">
      <header className="immersive-topbar">
        <div className="immersive-brand-lockup">
          <span className="immersive-brand-dot" />
          <div>
            <p className="immersive-brand-name">BEJELI</p>
            <p className="immersive-brand-subtitle">{brandLabel}</p>
          </div>
        </div>
        <label className="immersive-search-shell">
          <SearchIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={(event) => {
              resetTransientState();
              setActiveIndex(0);
              setSearchQuery(event.target.value);
            }}
            placeholder={searchPlaceholder}
            className="immersive-search-input"
          />
        </label>
        {topBarActions ? <div className="immersive-topbar-actions">{topBarActions}</div> : null}
      </header>

      <main className="immersive-home-main">
        <section className="immersive-hero-shell">
          <div className="immersive-home-header">
            <div>
              <p className="shorts-eyebrow">{eyebrow}</p>
              <h1 className="immersive-home-title">{title}</h1>
            </div>
            <button
              type="button"
              onClick={onToggleMode}
              className="immersive-mode-pill"
              disabled={!onToggleMode}
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              {modeLabel}
            </button>
          </div>

          <div className="immersive-dock-row">
            {dockItems.map((item) => (
              <DockButton key={item.key} item={item} />
            ))}
          </div>

          <div className="immersive-stage-layout">
            <section className="immersive-stage" aria-label={title}>
              <div className="immersive-stage-core">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="immersive-stage-arrow left"
                  aria-label="Previous short"
                  disabled={!filteredShorts.length}
                >
                  Prev
                </button>

                {activeShort ? (
                  <motion.div
                    key={activeShort.id}
                    className="immersive-short-card"
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.32 }}
                  >
                    <article className="immersive-short-media">
                      {activeMedia?.type === "video" ? (
                        <video
                          ref={videoRef}
                          src={activeMedia.src}
                          autoPlay
                          muted={isMuted}
                          loop
                          playsInline
                          preload="metadata"
                          aria-label={activeMedia.alt}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      ) : activeMedia ? (
                        <img src={activeMedia.src} alt={activeMedia.alt} />
                      ) : (
                        <div className="immersive-short-fallback">
                          <VideoIcon className="h-8 w-8 text-white/70" aria-hidden="true" />
                        </div>
                      )}
                      <div className="immersive-short-scrim" />

                      <div className="immersive-short-meta">
                        {activeShort.locationLabel ? (
                          <span className="immersive-location-pill">
                            <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {activeShort.locationLabel}
                          </span>
                        ) : null}
                        {activeShort.recommendationLabel ? (
                          <span className="immersive-recommendation-pill">
                            {activeShort.recommendationLabel}
                          </span>
                        ) : null}
                      </div>

                      <div className="immersive-short-copy">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={activeShort.authorAvatar}
                            alt={activeShort.authorName}
                            size={44}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-white">
                              {activeShort.authorName}
                            </p>
                            <p className="truncate text-sm text-white/72">
                              {activeShort.authorMeta}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-[1.05rem] font-semibold text-white">
                          {activeShort.title}
                        </p>
                        <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                          {activeShort.caption}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeShort.tags.map((tag) => (
                            <span key={tag} className="short-tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        {activeShort.recommendationNote ? (
                          <p className="mt-3 text-sm font-medium text-emerald-200">
                            {activeShort.recommendationNote}
                          </p>
                        ) : null}
                        {activeShort.ctaLabel ? (
                          <div className="mt-4">
                            <span className="immersive-cta-pill">{activeShort.ctaLabel}</span>
                          </div>
                        ) : null}
                      </div>

                      <div
                        className="immersive-short-actions"
                        aria-label={`${activeShort.authorName} actions`}
                      >
                        {onToggleEndorse ? (
                          <button
                            type="button"
                            onClick={() => onToggleEndorse(activeShort.id)}
                            className={cn(
                              "immersive-short-action",
                              activeShort.endorsed && "is-endorse",
                            )}
                          >
                            <span className="immersive-short-action-icon">👍</span>
                            <span>{activeShort.endorsed ? "Endorsed" : "Endorse"}</span>
                            <strong>{activeShort.endorsements ?? 0}</strong>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onToggleLike(activeShort.id)}
                          className={cn(
                            "immersive-short-action",
                            activeShort.liked && "is-liked",
                          )}
                        >
                          <HeartIcon
                            className={cn("h-5 w-5", activeShort.liked && "fill-current")}
                          />
                          <span>Like</span>
                          <strong>{activeShort.likes}</strong>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommentsOpen((current) => !current)}
                          className="immersive-short-action"
                        >
                          <MessageCircleIcon className="h-5 w-5" />
                          <span>Comments</span>
                          <strong>{activeShort.comments}</strong>
                        </button>
                        <button
                          type="button"
                          onClick={() => onShare(activeShort.id)}
                          className={cn(
                            "immersive-short-action",
                            activeShort.shared && "is-shared",
                          )}
                        >
                          <Share2Icon className="h-5 w-5" />
                          <span>{activeShort.shared ? "Sent" : "Share"}</span>
                          <strong>{activeShort.shares ?? 0}</strong>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeMedia?.type !== "video") {
                              return;
                            }

                            setIsPlaying((current) => !current);
                          }}
                          className="immersive-short-action"
                        >
                          <span className="immersive-short-action-icon">
                            {isPlaying ? "❚❚" : "▶"}
                          </span>
                          <span>{isPlaying ? "Pause" : "Play"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeMedia?.type !== "video") {
                              return;
                            }

                            setIsMuted((current) => !current);
                          }}
                          className="immersive-short-action"
                        >
                          <span className="immersive-short-action-icon">
                            {isMuted ? "🔇" : "🔊"}
                          </span>
                          <span>{isMuted ? "Muted" : "Sound"}</span>
                        </button>
                      </div>

                      {commentsOpen ? (
                        <div className="immersive-comments-sheet" role="dialog" aria-label="Comments">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-950">Comments</p>
                              <p className="text-xs text-slate-500">
                                {(activeShort.commentItems ?? []).length}{" "}
                                {(activeShort.commentItems ?? []).length === 1
                                  ? "reply"
                                  : "replies"}
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
                          <div className="immersive-comments-list">
                            {(activeShort.commentItems ?? []).length ? (
                              (activeShort.commentItems ?? []).map((comment) => (
                                <div key={comment.id} className="rounded-2xl bg-slate-50 p-3">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-slate-900">
                                      {comment.author}
                                    </p>
                                    <span className="text-[11px] text-slate-500">
                                      {comment.time}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">
                                    {comment.text}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">
                                Start the conversation on this short.
                              </p>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <Avatar src={viewerAvatar} alt={viewerName} size={40} />
                            <div className="flex-1">
                              <textarea
                                rows={3}
                                value={commentDraft}
                                onChange={(event) => setCommentDraft(event.target.value)}
                                placeholder={commentPlaceholder}
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
                    </article>
                  </motion.div>
                ) : (
                  <Card className="immersive-empty-card">
                    <VideoIcon className="mx-auto h-8 w-8 text-indigo-500" aria-hidden="true" />
                    <h2 className="mt-3 font-display text-xl font-bold text-slate-950">
                      {emptyTitle}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                      {emptyBody}
                    </p>
                  </Card>
                )}

                <button
                  type="button"
                  onClick={() => move(1)}
                  className="immersive-stage-arrow right"
                  aria-label="Next short"
                  disabled={!filteredShorts.length}
                >
                  Next
                </button>
              </div>
              <div className="immersive-stage-dots" aria-label="Short positions">
                {filteredShorts.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      resetTransientState();
                      setActiveIndex(index);
                    }}
                    className={cn(
                      "immersive-stage-dot",
                      index === safeActiveIndex && "is-active",
                    )}
                    aria-label={`Open short ${index + 1}`}
                  />
                ))}
              </div>
            </section>

            {sidePanel ? <aside className="immersive-home-rail">{sidePanel}</aside> : null}
          </div>
        </section>

        {belowFeed ? <div className="immersive-home-below">{belowFeed}</div> : null}
      </main>

      <nav className="immersive-bottom-nav" aria-label={navLabel}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn("immersive-bottom-nav-link", item.active && "is-active")}
          >
            <span className="h-5 w-5">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
