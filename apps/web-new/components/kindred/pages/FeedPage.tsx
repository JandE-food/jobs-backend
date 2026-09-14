"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type RefObject } from "react";

import Link from "next/link";
import {
  ArrowRightIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  HeartIcon,
  ImageIcon,
  MapPinIcon,
  MessageCircleIcon,
  Share2Icon,
  SparklesIcon,
  FileTextIcon,
  ThumbsUpIcon,
  UploadCloudIcon,
  VideoIcon,
} from "../icons";

import { motion, useReducedMotion } from "../motion";
import { feed, me, type FeedItem } from "../mock";
import { useKindredAuth } from "../app/kindred-provider";
import { Avatar, Badge, Button, Card, MatchRing, cn } from "../primitives";
import { type ImmersiveShortItem } from "./ImmersiveShortsHome";
import { apiUrl } from "../../api";
import {
  feedStorageKey,
  getStoredProfileWorkspace,
  getStoredResumeWorkspace,
  readFileAsDataUrl,
  type ProfileWorkspace,
  type ResumeWorkspace,
} from "../workspace-state";

type FeedMode = "All" | "Work" | "Showcase" | "Local";

type ComposerMedia = {
  id: string;
  type: "image" | "video";
  src: string;
  alt: string;
  name: string;
};

type SyncedFeedMedia = {
  kind: "image" | "video";
  uri: string;
  alt?: string;
  fileName?: string;
};

type SyncedFeedPost = {
  id: string;
  channel: "Work" | "Showcase" | "Local";
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  authorName: string;
  authorTitle: string;
  authorLocation: string;
  authorAvatarUri?: string;
  media: SyncedFeedMedia[];
};

const DRAG_TRIGGER_PX = 90;
const DRAG_LIMIT_PX = 178;

function ComposeCard({
  authorAvatar,
  authorName,
  body,
  onBodyChange,
  media,
  selectedChannel,
  onSelectChannel,
  onCreateDraft,
  onPickImages,
  onPickVideos,
  onRemoveMedia,
  onPublish,
  statusMessage,
}: {
  authorAvatar: string;
  authorName: string;
  body: string;
  onBodyChange: (value: string) => void;
  media: ComposerMedia[];
  selectedChannel: FeedMode;
  onSelectChannel: (value: FeedMode) => void;
  onCreateDraft: () => void;
  onPickImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onPickVideos: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveMedia: (mediaId: string) => void;
  onPublish: () => void;
  statusMessage: string;
}) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const captureVideoInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card className="overflow-hidden border-slate-200/90 bg-white/95 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex items-start gap-3">
        <Avatar src={authorAvatar} alt={authorName} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{authorName}</p>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Post to your feed
              </p>
            </div>
            <Badge tone="indigo">Creator mode</Badge>
          </div>
          <textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            rows={4}
            placeholder="Share an update, a role, or a win..."
            className="mt-3 min-h-28 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition-colors placeholder:text-slate-500 focus:border-slate-300 focus:bg-white focus-visible:outline-none"
          />
          {media.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-50"
                >
                  {item.type === "image" ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <video src={item.src} controls className="h-48 w-full object-cover" />
                  )}
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {item.type === "image" ? "Photo ready" : "Video ready"}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemoveMedia(item.id)}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPickImages}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={onPickVideos}
      />
      <input
        ref={captureVideoInputRef}
        type="file"
        accept="video/*"
        capture="user"
        className="hidden"
        onChange={onPickVideos}
      />

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {(["Work", "Showcase", "Local"] as FeedMode[]).map((channel) => (
          <button
            key={channel}
            type="button"
            onClick={() => onSelectChannel(channel)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
              selectedChannel === channel
                ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50",
            )}
          >
            {channel}
          </button>
        ))}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <ImageIcon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          Photos
        </button>
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <VideoIcon className="h-4 w-4 text-indigo-700" aria-hidden="true" />
          Videos
        </button>
        <button
          type="button"
          onClick={() => captureVideoInputRef.current?.click()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <VideoIcon className="h-4 w-4 text-rose-700" aria-hidden="true" />
          Record intro
        </button>
        <button
          type="button"
          onClick={onCreateDraft}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          AI draft
        </button>
        <Button className="ml-auto" onClick={onPublish}>
          <UploadCloudIcon className="h-4 w-4" aria-hidden="true" />
          Post update
        </Button>
      </div>
      {statusMessage ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">{statusMessage}</p>
      ) : null}
    </Card>
  );
}

function buildCurrentAuthor(profile: ProfileWorkspace) {
  return {
    ...me,
    name: profile.fullName || me.name,
    title: profile.headline || me.title,
    company: profile.openToWork ? "Open to work" : "Private profile",
    location: profile.location || me.location,
    avatar: profile.avatarSrc || me.avatar,
  };
}

function formatSyncedPostTime(timestamp: string) {
  const createdAt = new Date(timestamp).getTime();

  if (!Number.isFinite(createdAt)) {
    return "now";
  }

  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  return `${Math.floor(diffHours / 24)}d`;
}

function mapWebPostToSyncedPost(item: Extract<FeedItem, { kind: "post" }>): SyncedFeedPost {
  return {
    id: item.id,
    channel: item.channel,
    body: item.body,
    tags: item.tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    edited: false,
    authorName: item.author.name,
    authorTitle: item.author.title,
    authorLocation: item.author.location,
    authorAvatarUri: item.author.avatar,
    media: (item.media ?? []).map((media) => ({
      kind: media.type,
      uri: media.src,
      alt: media.alt,
      fileName: media.alt,
    })),
  };
}

function mapSyncedPostToWebItem(post: SyncedFeedPost): Extract<FeedItem, { kind: "post" }> {
  return {
    kind: "post",
    id: post.id,
    channel: post.channel,
    author: {
      ...me,
      name: post.authorName,
      title: post.authorTitle,
      company: "BEJELI",
      location: post.authorLocation,
      avatar: post.authorAvatarUri || me.avatar,
    },
    time: formatSyncedPostTime(post.updatedAt || post.createdAt),
    body: post.body,
    tags: post.tags,
    likes: 0,
    comments: 0,
    liked: false,
    media: post.media.map((media, index) => ({
      type: media.kind,
      src: media.uri,
      alt: media.alt || media.fileName || `${media.kind}-${index + 1}`,
    })),
    commentItems: [],
  };
}

async function fetchSyncedFeedPosts(token: string) {
  const response = await fetch(`${apiUrl}/feed/posts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load synced posts.");
  }

  const payload = (await response.json()) as { posts?: SyncedFeedPost[] };
  return payload.posts ?? [];
}

async function upsertSyncedFeedPost(token: string, post: SyncedFeedPost) {
  await fetch(`${apiUrl}/feed/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post }),
  });
}

function buildAiDraft(
  channel: Exclude<FeedMode, "All">,
  profile: ProfileWorkspace,
  resume: ResumeWorkspace,
) {
  const firstSkill = resume.skills[0] ?? "product work";
  const preferredRole = resume.preferredRoles[0] ?? "new opportunities";

  if (channel === "Showcase") {
    return `Showcase clip: sharing a recent workflow from my ${firstSkill.toLowerCase()} practice. Open to conversations around ${preferredRole.toLowerCase()} roles and thoughtful product teams.`;
  }

  if (channel === "Local") {
    return `Available locally in ${profile.location} for short-form portfolio reviews, design critiques, and fast-moving product work this week.`;
  }

  return `Professional update: I am currently focused on ${resume.skills
    .slice(0, 3)
    .join(", ")} and open to ${preferredRole.toLowerCase()} conversations. ${resume.availabilityNote}`;
}

function ProfileNudge({
  avatarSrc,
  profileReadiness,
}: {
  avatarSrc: string;
  profileReadiness: number;
}) {
  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-5">
      <div className="flex items-center gap-3">
        <Avatar src={avatarSrc} alt="" size={42} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-indigo-950">
            Your profile is {profileReadiness}% ready
          </p>
          <p className="text-xs text-indigo-900">
            Add your CV to improve every match.
          </p>
        </div>
        <Link
          href="/resume"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-white px-3 text-sm font-bold text-indigo-800 shadow-sm ring-1 ring-indigo-200 hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <FileTextIcon className="h-4 w-4" aria-hidden="true" />
          CV
        </Link>
      </div>
    </Card>
  );
}

function PostCard({
  item,
  viewerAvatar,
  viewerName,
  onToggleLike,
  onAddComment,
}: {
  item: Extract<FeedItem, { kind: "post" }>;
  viewerAvatar: string;
  viewerName: string;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentStatus, setCommentStatus] = useState("");
  const comments = item.commentItems ?? [];

  function handleAddComment() {
    const normalized = commentText.trim();

    if (!normalized) {
      return;
    }

    onAddComment(item.id, normalized);
    setCommentText("");
    setCommentStatus("Comment posted.");
  }

  async function handleShare() {
    const shareText = `${item.author.name}: ${item.body}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCommentStatus("Post copied for sharing.");
    } catch {
      setCommentStatus("Share text ready, but clipboard access was blocked.");
    }
  }

  return (
    <article>
      <Card className="overflow-hidden border-slate-200/90 bg-white/95 p-0 shadow-[0_22px_55px_rgba(15,23,42,0.06)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Avatar src={item.author.avatar} alt={item.author.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p className="truncate font-semibold text-slate-900">
                  {item.author.name}
                </p>
                <span className="text-xs text-slate-500">· {item.time}</span>
              </div>
              <p className="truncate text-sm text-slate-600">
                {item.author.title} at {item.author.company}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-700">{item.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Badge key={tag} tone="indigo">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {item.media?.length ? (
          <div
            className={cn(
              "grid gap-1.5 border-y border-slate-100 bg-slate-100/70 p-1.5",
              item.media.length > 1 && "sm:grid-cols-2",
            )}
          >
            {item.media.map((media) =>
              media.type === "image" ? (
                <div
                  key={media.src}
                  className="relative h-[20rem] w-full overflow-hidden rounded-[1.5rem] bg-slate-200 sm:h-[32rem]"
                >
                  <Image
                    src={media.src}
                    alt={media.alt}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <video
                  key={media.src}
                  src={media.src}
                  controls
                  className="max-h-[32rem] w-full rounded-[1.5rem] bg-slate-950 object-cover"
                />
              ),
            )}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              onToggleLike(item.id);
            }}
            aria-pressed={Boolean(item.liked)}
            aria-label={`${item.liked ? "Unlike" : "Like"} post, ${item.likes} likes`}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-2xl px-3.5 text-sm font-semibold hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
              item.liked && "text-rose-700",
            )}
          >
            <HeartIcon
              className={cn("h-4 w-4", item.liked && "fill-rose-700")}
              aria-hidden="true"
            />
            {item.likes}
          </button>
          <button
            type="button"
            onClick={() => setCommentsOpen((current) => !current)}
            aria-label={`Open ${comments.length} comments`}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <MessageCircleIcon className="h-4 w-4" aria-hidden="true" />
            {comments.length}
          </button>
          <button
            type="button"
            aria-label="Share post"
            onClick={() => void handleShare()}
            className="grid h-11 w-11 place-items-center rounded-2xl text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Share2Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {commentsOpen ? (
          <div className="space-y-3 border-t border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex gap-3">
              <Avatar src={viewerAvatar} alt={viewerName} size={40} />
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  rows={3}
                  placeholder="Add a comment..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300 focus:bg-white focus-visible:outline-none"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Keep the conversation useful and specific.</span>
                  <Button size="sm" onClick={handleAddComment}>
                    Comment
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                    <span className="text-xs text-slate-500">{comment.time}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{comment.text}</p>
                </div>
              ))}
            </div>
            {commentStatus ? (
              <p className="text-sm font-semibold text-emerald-700">{commentStatus}</p>
            ) : null}
          </div>
        ) : null}
      </Card>
    </article>
  );
}

function MatchCard({
  item,
}: {
  item: Extract<FeedItem, { kind: "match" }>;
}) {
  return (
    <article>
      <Card className="overflow-hidden border-indigo-200">
        <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-4 py-2.5">
          <SparklesIcon className="h-4 w-4 text-indigo-700" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">
            High-confidence match
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {item.role}
              </h2>
              <p className="text-sm text-slate-600">{item.company}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                  {item.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <BanknoteIcon className="h-4 w-4" aria-hidden="true" />
                  {item.salary}
                </span>
              </div>
            </div>
            <MatchRing score={item.score} size={58} />
          </div>
          <ul className="mt-4 space-y-2">
            {item.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2Icon
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                {reason}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="sm" aria-label={`Apply for ${item.role} at ${item.company}`}>
              Apply now
            </Button>
            <Link
              href="/jobs"
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              All matches <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Card>
    </article>
  );
}

function HiringCard({
  item,
}: {
  item: Extract<FeedItem, { kind: "hiring" }>;
}) {
  return (
    <article>
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar src={item.author.avatar} alt={item.author.name} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{item.author.name}</span> is
              hiring · {item.time}
            </p>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{item.role}</h2>
                <Badge tone="emerald">{item.seats} seats</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.note}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm">Refer</Button>
                <Button size="sm" variant="outline">
                  View role
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
}

function FeedItemView({
  item,
  viewerAvatar,
  viewerName,
  onToggleLike,
  onAddComment,
}: {
  item: FeedItem;
  viewerAvatar: string;
  viewerName: string;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const content =
    item.kind === "post" ? (
      <PostCard
        item={item}
        viewerAvatar={viewerAvatar}
        viewerName={viewerName}
        onToggleLike={onToggleLike}
        onAddComment={onAddComment}
      />
    ) : item.kind === "match" ? (
      <MatchCard item={item} />
    ) : (
      <HiringCard item={item} />
    );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
    >
      {content}
    </motion.div>
  );
}

export function FeedPage() {
  const { token, user } = useKindredAuth();
  const workspaceIdentity = {
    userId: user?.id,
    userFullName: user?.fullName,
    userEmail: user?.email,
  };
  const [feedItems, setFeedItems] = useState<FeedItem[]>(() => {
    if (typeof window === "undefined") {
      return feed;
    }

    try {
      const raw = window.localStorage.getItem(feedStorageKey);
      return raw ? (JSON.parse(raw) as FeedItem[]) : feed;
    } catch {
      return feed;
    }
  });
  const [composerText, setComposerText] = useState("");
  const [composerMedia, setComposerMedia] = useState<ComposerMedia[]>([]);
  const [composerStatus, setComposerStatus] = useState("");
  const [composerChannel, setComposerChannel] = useState<Exclude<FeedMode, "All">>("Work");
  const [shortsMode, setShortsMode] = useState<"curated" | "latest">("curated");
  const [discoveryLocation] = useState("All locations");
  const [discoverySector] = useState("All sectors");
  const [discoveryRating] = useState("All ratings");
  const [sharedShortIds, setSharedShortIds] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackIndicator, setPlaybackIndicator] = useState<"play" | "pause" | null>(null);
  const [lastMoveDirection, setLastMoveDirection] = useState<-1 | 0 | 1>(0);
  const [animatedAction, setAnimatedAction] = useState<"endorse" | null>(null);
  const [recruiterPromptOpen, setRecruiterPromptOpen] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isReleaseAnimating, setIsReleaseAnimating] = useState(false);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const actionAnimationTimerRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragDistanceYRef = useRef(0);
  const suppressSurfaceClickRef = useRef(false);
  const [profile] = useState(() => getStoredProfileWorkspace(workspaceIdentity));
  const [resume] = useState(() => getStoredResumeWorkspace(workspaceIdentity));
  const author = useMemo(() => buildCurrentAuthor(profile), [profile]);
  const profileReadiness = useMemo(
    () =>
      Math.min(
        98,
        60 + Math.min(20, resume.skills.length * 2) + Math.min(18, profile.portfolio.length * 3),
      ),
    [profile.portfolio.length, resume.skills.length],
  );
  const mediaPosts = useMemo(
    () =>
      feedItems.filter(
        (item): item is Extract<FeedItem, { kind: "post" }> =>
          item.kind === "post" && Boolean(item.media?.length),
      ),
    [feedItems],
  );
  const streamItems = useMemo(
    () => feedItems.filter((item) => item.kind !== "post" || !item.media?.length),
    [feedItems],
  );
  const shortsItems = useMemo(() => {
    const base = mediaPosts.filter((item) => {
      const rating = 4 + Math.min(0.9, item.likes / 300 + item.comments / 500);
      const passesLocation =
        discoveryLocation === "All locations" || item.author.location === discoveryLocation;
      const passesSector =
        discoverySector === "All sectors" || item.tags.includes(discoverySector);
      const passesRating =
        discoveryRating === "All ratings" ||
        rating >= Number.parseFloat(discoveryRating.replace("★+", ""));

      return passesLocation && passesSector && passesRating;
    });

    if (shortsMode === "latest") {
      return base;
    }

    return [...base].sort((left, right) => {
      const leftScore = left.likes * 2 + left.comments * 3;
      const rightScore = right.likes * 2 + right.comments * 3;
      return rightScore - leftScore;
    });
  }, [discoveryLocation, discoveryRating, discoverySector, mediaPosts, shortsMode]);

  const immersiveShorts = useMemo<ImmersiveShortItem[]>(
    () =>
      shortsItems.map((item) => {
        const rating = 4 + Math.min(0.9, item.likes / 300 + item.comments / 500);
        const estimatedShares = Math.max(1, Math.round(item.likes / 6));

        return {
          id: item.id,
          title: item.author.name,
          authorId: item.author.id,
          authorName: item.author.name,
          authorAvatar: item.author.avatar,
          authorMeta: item.author.title,
          caption: item.body,
          tags: item.tags,
          media: item.media?.[0],
          locationLabel: item.author.location,
          recommendationLabel: `${rating.toFixed(1)}★ creator signal`,
          recommendationNote:
            shortsMode === "curated"
              ? "Curated to surface strong proof-of-work and standout momentum."
              : "Latest short from your professional graph.",
          ctaLabel: item.tags[0] ?? "Open profile",
          likes: item.likes,
          comments: item.comments,
          endorsements: Math.max(1, Math.round(item.likes / 5)),
          shares: estimatedShares + (sharedShortIds[item.id] ? 1 : 0),
          shared: Boolean(sharedShortIds[item.id]),
          liked: item.liked,
          commentItems: item.commentItems ?? [],
          searchText: `${item.author.location} ${item.tags.join(" ")}`,
        };
      }),
    [sharedShortIds, shortsItems, shortsMode],
  );
  const safeActiveIndex = immersiveShorts.length
    ? Math.min(activeIndex, immersiveShorts.length - 1)
    : 0;
  const activeShort = immersiveShorts[safeActiveIndex] ?? null;

  useEffect(() => {
    const videos = [mobileVideoRef.current, desktopVideoRef.current].filter(
      (video): video is HTMLVideoElement => Boolean(video),
    );

    if (!videos.length) {
      return;
    }

    if (activeShort?.media?.type !== "video") {
      videos.forEach((video) => {
        video.pause();
      });
      return;
    }

    const primaryVideo = getPrimaryVideoElement();
    const secondaryVideos = videos.filter((video) => video !== primaryVideo);

    secondaryVideos.forEach((video) => {
      video.muted = true;
      video.pause();
    });

    if (!primaryVideo) {
      return;
    }

    primaryVideo.muted = isMuted;

    if (isPlaying) {
      void primaryVideo.play().catch(() => undefined);
      return;
    }

    primaryVideo.pause();
  }, [activeShort?.id, activeShort?.media?.type, isMuted, isPlaying]);

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
    if (actionAnimationTimerRef.current) {
      window.clearTimeout(actionAnimationTimerRef.current);
    }
    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(feedStorageKey, JSON.stringify(feedItems));
    } catch {
      // Keep the feed usable even if storage is unavailable.
    }
  }, [feedItems]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    void fetchSyncedFeedPosts(token)
      .then((posts) => {
        if (!active) {
          return;
        }

        setFeedItems((current) => {
          const syncedItems = posts.map(mapSyncedPostToWebItem);
          const preservedItems = current.filter(
            (item) =>
              !(
                item.kind === "post" &&
                item.author.id === me.id &&
                item.id.startsWith("post-")
              ),
          );

          return [...syncedItems, ...preservedItems];
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [token]);

  async function handleMediaUpload(
    event: ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    setComposerStatus("Preparing media for upload...");
    if (type === "video") {
      setComposerStatus("Compressing and optimizing your short-form clip for low-bandwidth playback...");
    }

    try {
      const nextMedia = await Promise.all(
        files.map(async (file) => ({
          id: `${type}-${file.name}-${file.size}-${Date.now()}`,
          type,
          src: await readFileAsDataUrl(file),
          alt: file.name,
          name: file.name,
        })),
      );

      setComposerMedia((current) => [...current, ...nextMedia]);
      setComposerStatus(
        type === "image" ? "Photos ready for posting." : "Videos ready for posting.",
      );
    } catch (error) {
      setComposerStatus(
        error instanceof Error ? error.message : "Unable to prepare your media.",
      );
    }
  }

  function handleCreateDraft() {
    setComposerText(buildAiDraft(composerChannel, profile, resume));
    setComposerStatus(`AI draft prepared for the ${composerChannel.toLowerCase()} channel.`);
  }

  function updatePostItem(
    postId: string,
    updater: (item: Extract<FeedItem, { kind: "post" }>) => Extract<FeedItem, { kind: "post" }>,
  ) {
    setFeedItems((current) =>
      current.map((item) =>
        item.kind === "post" && item.id === postId ? updater(item) : item,
      ),
    );
  }

  function handleToggleLike(postId: string) {
    updatePostItem(postId, (item) => ({
      ...item,
      liked: !item.liked,
      likes: Math.max(0, item.likes + (item.liked ? -1 : 1)),
    }));
  }

  function handleAddComment(postId: string, text: string) {
    updatePostItem(postId, (item) => {
      const nextCommentItems = [
        {
          id: `${item.id}-${Date.now()}`,
          author: author.name,
          text,
          time: "now",
        },
        ...(item.commentItems ?? []),
      ];

      return {
        ...item,
        commentItems: nextCommentItems,
        comments: nextCommentItems.length,
      };
    });
  }

  function handlePublishPost() {
    const normalized = composerText.trim();

    if (!normalized && !composerMedia.length) {
      setComposerStatus("Add text, a photo, or a video before posting.");
      return;
    }

    const nextPost: Extract<FeedItem, { kind: "post" }> = {
      kind: "post",
      id: `post-${Date.now()}`,
      channel: composerChannel,
      author,
      time: "Just now",
      body: normalized || "Shared a media update.",
      tags:
        composerChannel === "Showcase"
          ? ["Portfolio", composerMedia.length ? "Media update" : "Creator post"]
          : composerChannel === "Local"
            ? ["Local talent", "Availability"]
            : composerMedia.length
              ? ["Media update", "Work graph"]
              : ["New post", "Work graph"],
      likes: 0,
      comments: 0,
      liked: false,
      media: composerMedia.map(({ type, src, alt }) => ({ type, src, alt })),
      commentItems: [],
    };

    setFeedItems((current) => [nextPost, ...current]);
    if (token) {
      void upsertSyncedFeedPost(token, mapWebPostToSyncedPost(nextPost));
    }
    setComposerText("");
    setComposerMedia([]);
    setComposerChannel("Work");
    setComposerStatus("Post published to your feed.");
  }

  async function handleShareShort(shortId: string) {
    const targetItem = feedItems.find(
      (item): item is Extract<FeedItem, { kind: "post" }> =>
        item.kind === "post" && item.id === shortId,
    );

    if (!targetItem) {
      return;
    }

    const shareText = `${targetItem.author.name}: ${targetItem.body}`;

    if (navigator.share) {
      await navigator
        .share({ title: "CareerShorts", text: shareText })
        .catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(shareText).catch(() => undefined);
    }

    setSharedShortIds((current) => ({ ...current, [shortId]: true }));
  }

  function resetTransientState() {
    setCommentsOpen(false);
    setCommentDraft("");
    setIsMuted(true);
    setIsPlaying(true);
  }

  function move(direction: 1 | -1) {
    if (!immersiveShorts.length) {
      return;
    }

    resetTransientState();
    setLastMoveDirection(direction);
    setActiveIndex((current) => (current + direction + immersiveShorts.length) % immersiveShorts.length);
  }

  function clearReleaseTimer() {
    if (releaseTimerRef.current !== null) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
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
  }

  function handleSurfacePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (
      !immersiveShorts.length ||
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
    const isTap =
      Math.abs(totalOffset) <= 6 &&
      activeShort?.media?.type === "video" &&
      !isInteractiveReelTarget(event.target);
    const shouldMove = Math.abs(totalOffset) >= DRAG_TRIGGER_PX;

    if (!shouldMove) {
      resetDragState();

      if (isTap) {
        suppressSurfaceClickRef.current = true;
        togglePlayback();
        return;
      }

      setIsReleaseAnimating(true);
      releaseTimerRef.current = window.setTimeout(() => {
        setIsReleaseAnimating(false);
        releaseTimerRef.current = null;
      }, 240);
      return;
    }

    const direction = totalOffset < 0 ? 1 : -1;
    const releaseTravelPx = getReleaseTravelPx();
    setIsReleaseAnimating(true);
    setDragOffsetY(direction === 1 ? -releaseTravelPx : releaseTravelPx);
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

  function getPrimaryVideoElement() {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      return mobileVideoRef.current ?? desktopVideoRef.current;
    }

    return desktopVideoRef.current ?? mobileVideoRef.current;
  }

  function getReleaseTravelPx() {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      return Math.max(DRAG_LIMIT_PX, Math.round(window.innerHeight * 0.88));
    }

    return DRAG_LIMIT_PX;
  }

  function togglePlayback() {
    const video = getPrimaryVideoElement();

    if (!video || activeShort?.media?.type !== "video") {
      return;
    }

    setPlaybackIndicator(isPlaying ? "pause" : "play");
    setIsPlaying((current) => !current);
  }

  function triggerActionAnimation() {
    if (actionAnimationTimerRef.current) {
      window.clearTimeout(actionAnimationTimerRef.current);
    }

    setAnimatedAction("endorse");
    actionAnimationTimerRef.current = window.setTimeout(() => {
      setAnimatedAction(null);
      actionAnimationTimerRef.current = null;
    }, 320);
  }

  function handleTalentEndorseAttempt() {
    triggerActionAnimation();
    setRecruiterPromptOpen(true);
  }

  function submitShortComment() {
    const normalized = commentDraft.trim();

    if (!activeShort || !normalized) {
      return;
    }

    handleAddComment(activeShort.id, normalized);
    setCommentDraft("");
  }

  function renderImmersiveMedia(
    short: ImmersiveShortItem,
    options?: {
      videoRef?: RefObject<HTMLVideoElement | null>;
      muted?: boolean;
      autoPlay?: boolean;
      preload?: "none" | "metadata" | "auto";
      onPlay?: () => void;
      onPause?: () => void;
      sizes?: string;
      className?: string;
    },
  ) {
    if (short.media?.type === "video") {
      return (
        <video
          ref={options?.videoRef}
          src={short.media.src}
          autoPlay={options?.autoPlay ?? true}
          muted={options?.muted ?? isMuted}
          loop
          playsInline
          preload={options?.preload ?? "metadata"}
          className={cn("h-full w-full object-cover", options?.className)}
          aria-label={short.media.alt}
          onPlay={options?.onPlay}
          onPause={options?.onPause}
        />
      );
    }

    if (short.media) {
      return (
        <div className={cn("relative h-full w-full", options?.className)}>
          <Image
            src={short.media.src}
            alt={short.media.alt}
            fill
            sizes={options?.sizes ?? "100vw"}
            className="object-cover"
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "grid h-full w-full place-items-center bg-slate-900 text-white/70",
          options?.className,
        )}
      >
        <VideoIcon className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }

  const mobileSwipeDirection = dragOffsetY === 0 ? 0 : dragOffsetY < 0 ? 1 : -1;
  const mobilePreviewShort =
    mobileSwipeDirection !== 0 && immersiveShorts.length > 1
      ? immersiveShorts[
          (safeActiveIndex + mobileSwipeDirection + immersiveShorts.length) % immersiveShorts.length
        ]
      : null;
  const mobileSwipeProgress = Math.min(
    1,
    Math.abs(dragOffsetY) /
      Math.max(
        DRAG_LIMIT_PX,
        typeof window !== "undefined" ? Math.round(window.innerHeight * 0.72) : DRAG_LIMIT_PX,
      ),
  );
  const mobilePreviewStyle =
    mobilePreviewShort && mobileSwipeDirection !== 0
      ? {
          transform: `translate3d(0, ${
            mobileSwipeDirection === 1
              ? `${100 - mobileSwipeProgress * 100}%`
              : `${-100 + mobileSwipeProgress * 100}%`
          }, 0) scale(${0.965 + mobileSwipeProgress * 0.035})`,
          opacity: 0.68 + mobileSwipeProgress * 0.32,
        }
      : undefined;
  const mobileActiveLayerStyle = dragOffsetY
    ? {
        transform: `translate3d(0, ${dragOffsetY}px, 0) scale(${1 - mobileSwipeProgress * 0.018})`,
        opacity: 1 - mobileSwipeProgress * 0.08,
      }
    : undefined;

  return (
    <div className="sm:space-y-5">
      <section className="sm:hidden">
        {activeShort ? (
          <article
            key={`${activeShort.id}-${lastMoveDirection}-mobile`}
            className="relative h-[100svh] overflow-hidden bg-slate-950 text-white"
          >
            {mobilePreviewShort ? (
              <div
                className="pointer-events-none absolute inset-0 will-change-transform"
                style={mobilePreviewStyle}
              >
                {renderImmersiveMedia(mobilePreviewShort, {
                  muted: true,
                  autoPlay: false,
                  preload: "none",
                })}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/80" />
              </div>
            ) : null}
            <div
              className={cn(
                "relative h-full touch-none overflow-hidden will-change-transform",
                isReleaseAnimating &&
                  "transition-[transform,opacity] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              )}
              style={mobileActiveLayerStyle}
              onPointerDown={handleSurfacePointerDown}
              onPointerMove={handleSurfacePointerMove}
              onPointerUp={finishSurfaceDrag}
              onPointerCancel={resetDragState}
              onClick={() => {
                if (suppressSurfaceClickRef.current) {
                  suppressSurfaceClickRef.current = false;
                  return;
                }

                if (activeShort.media?.type === "video") {
                  togglePlayback();
                }
              }}
            >
              {renderImmersiveMedia(activeShort, {
                videoRef: mobileVideoRef,
                autoPlay: true,
                preload: "metadata",
                onPlay: () => setIsPlaying(true),
                onPause: () => setIsPlaying(false),
                className: "cursor-pointer",
              })}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
              {activeShort.media?.type === "video" && playbackIndicator ? (
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
                  "absolute bottom-24 right-3 z-30 grid content-end gap-2 justify-items-center transition-all duration-200",
                  commentsOpen
                    ? "pointer-events-none translate-x-3 opacity-0"
                    : "pointer-events-auto translate-x-0 opacity-100",
                )}
                onClick={(event) => event.stopPropagation()}
                data-reel-interactive="true"
              >
                <button
                  type="button"
                  onClick={handleTalentEndorseAttempt}
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 active:scale-95",
                    animatedAction === "endorse" && "reel-action-pop",
                  )}
                  aria-label="Endorse creator"
                >
                  <ThumbsUpIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="text-sm font-bold text-white">{activeShort.endorsements ?? 0}</span>
                <button
                  type="button"
                  onClick={() => setCommentsOpen((current) => !current)}
                  className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 active:scale-95"
                  aria-label="Open comments"
                >
                  <MessageCircleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="text-sm font-bold text-white">{activeShort.comments}</span>
                <button
                  type="button"
                  onClick={() => void handleShareShort(activeShort.id)}
                  className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 active:scale-95"
                  aria-label="Share post"
                >
                  <Share2Icon className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="text-sm font-bold text-white">{activeShort.shares ?? 0}</span>
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
                className="absolute inset-x-0 bottom-0 z-10 px-4 pt-8"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="max-w-[12.75rem] space-y-2.5">
                  <Link
                    href={`/profile/${activeShort.authorId}`}
                    className="flex items-center gap-2.5 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                    data-reel-interactive="true"
                  >
                    <Avatar src={activeShort.authorAvatar} alt={activeShort.authorName} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-[0.98rem] font-bold text-white">
                        {activeShort.authorName}
                      </p>
                      <p className="truncate text-[0.78rem] text-white/72">
                        {activeShort.authorMeta}
                        {activeShort.locationLabel ? ` · ${activeShort.locationLabel}` : ""}
                      </p>
                    </div>
                  </Link>
                  <p className="text-[0.84rem] font-semibold leading-[1.45rem] text-white/96">
                    {activeShort.caption}
                  </p>
                  {activeShort.recommendationNote ? (
                    <p className="text-[0.78rem] leading-5 text-white/78">
                      {activeShort.recommendationNote}
                    </p>
                  ) : null}
                </div>
              </div>

              {commentsOpen ? (
                <div
                  className="ui-fade-up absolute inset-x-4 bottom-4 z-40 rounded-[1.5rem] bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.2)]"
                  style={{ bottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
                  onClick={(event) => event.stopPropagation()}
                  data-reel-interactive="true"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">Comments</p>
                      <p className="text-xs text-slate-500">
                        {(activeShort.commentItems ?? []).length} replies
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
                    {(activeShort.commentItems ?? []).length ? (
                      (activeShort.commentItems ?? []).map((comment) => (
                        <div key={comment.id} className="rounded-2xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900">{comment.author}</p>
                            <span className="text-[11px] text-slate-500">{comment.time}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        Start the conversation on this short.
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Avatar src={author.avatar} alt={author.name} size={40} />
                    <div className="flex-1">
                      <textarea
                        rows={3}
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                            event.preventDefault();
                            submitShortComment();
                          }
                        }}
                        placeholder="Add a thoughtful reply..."
                        className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={submitShortComment}
                          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {recruiterPromptOpen ? (
                <div
                  className="ui-fade-up absolute inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
                  onClick={(event) => {
                    event.stopPropagation();
                    setRecruiterPromptOpen(false);
                  }}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Recruiter endorsement required"
                    className="w-full max-w-sm rounded-[1.6rem] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                      Recruiter-only action
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      Register as a recruiter to endorse
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Endorsements are reserved for recruiter and enterprise accounts.
                      Create a recruiter profile to endorse talent from the feed.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href="/signup?role=recruiter"
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white"
                      >
                        Register as recruiter
                      </Link>
                      <button
                        type="button"
                        onClick={() => setRecruiterPromptOpen(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-bold text-slate-700"
                      >
                        Maybe later
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        ) : (
          <div className="grid h-[100svh] place-items-center bg-slate-950 px-6 text-center text-white">
            <div>
              <h2 className="font-display text-2xl font-bold">No shorts yet</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Publish the first short to activate the immersive mobile feed.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="hidden rounded-[2rem] border border-slate-200/90 bg-white/95 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:block">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
              FOR YOUR NEXT MOVE
            </p>
            <h1 className="mt-2 font-display text-[2.35rem] font-bold tracking-tight text-slate-950">
              Feed
            </h1>
          </div>
          <Button
            onClick={() =>
              setShortsMode((current) => (current === "curated" ? "latest" : "curated"))
            }
            className="rounded-full px-5"
          >
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            {shortsMode === "curated" ? "Curated" : "Latest"}
          </Button>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid gap-4">
            <div className="grid items-center gap-4 md:grid-cols-[3.5rem_minmax(0,1fr)_3.5rem]">
              <div className="hidden justify-items-center gap-3 md:grid">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                  aria-label="Move up to previous short"
                  disabled={!immersiveShorts.length}
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
                  className="mx-auto w-full max-w-[min(100%,calc(22rem+2cm))] rounded-[2rem] bg-slate-950 shadow-[0_32px_80px_rgba(15,23,42,0.22)] md:-translate-y-[1cm]"
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
                    className="relative overflow-hidden rounded-[2rem]"
                    onClick={() => {
                      if (activeShort.media?.type === "video") {
                        togglePlayback();
                      }
                    }}
                  >
                    {renderImmersiveMedia(activeShort, {
                      videoRef: desktopVideoRef,
                      autoPlay: true,
                      preload: "metadata",
                      sizes: "(max-width: 768px) 100vw, 31rem",
                      onPlay: () => setIsPlaying(true),
                      onPause: () => setIsPlaying(false),
                      className: "h-[33rem] sm:h-[38rem] md:h-[44rem] cursor-pointer",
                    })}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/75" />
                    {activeShort.media?.type === "video" && playbackIndicator ? (
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
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={handleTalentEndorseAttempt}
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 hover:scale-105 active:scale-95",
                          animatedAction === "endorse" && "reel-action-pop",
                        )}
                        aria-label="Endorse creator"
                      >
                        <ThumbsUpIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span className="text-sm font-bold text-white">
                        {activeShort.endorsements ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCommentsOpen((current) => !current)}
                        className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 hover:scale-105 active:scale-95"
                        aria-label="Open comments"
                      >
                        <MessageCircleIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span className="text-sm font-bold text-white">{activeShort.comments}</span>
                      <button
                        type="button"
                        onClick={() => void handleShareShort(activeShort.id)}
                        className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white transition-transform duration-200 hover:scale-105 active:scale-95"
                        aria-label="Share post"
                      >
                        <Share2Icon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span className="text-sm font-bold text-white">{activeShort.shares ?? 0}</span>
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
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Link
                        href={`/profile/${activeShort.authorId}`}
                        className="flex items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                        data-reel-interactive="true"
                      >
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
                      </Link>
                      <p className="mt-4 max-w-[16rem] text-[0.95rem] font-semibold leading-7 text-white">
                        {activeShort.caption}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700">
                          {activeShort.recommendationLabel}
                        </span>
                        {activeShort.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/12 px-3 py-1 text-sm font-semibold text-white"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {activeShort.recommendationNote ? (
                        <p className="mt-3 text-sm font-semibold text-white/85">
                          {activeShort.recommendationNote}
                        </p>
                      ) : null}
                    </div>

                    {commentsOpen ? (
                      <div
                        className="ui-fade-up absolute inset-x-4 bottom-4 z-40 rounded-[1.5rem] bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.2)]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-950">Comments</p>
                            <p className="text-xs text-slate-500">
                              {(activeShort.commentItems ?? []).length} replies
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
                          {(activeShort.commentItems ?? []).length ? (
                            (activeShort.commentItems ?? []).map((comment) => (
                              <div key={comment.id} className="rounded-2xl bg-slate-50 p-3">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-slate-900">{comment.author}</p>
                                  <span className="text-[11px] text-slate-500">{comment.time}</span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-700">{comment.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">
                              Start the conversation on this short.
                            </p>
                          )}
                        </div>
                        <div className="mt-3 flex gap-3">
                          <Avatar src={author.avatar} alt={author.name} size={40} />
                          <div className="flex-1">
                            <textarea
                              rows={3}
                              value={commentDraft}
                              onChange={(event) => setCommentDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                                  event.preventDefault();
                                  submitShortComment();
                                }
                              }}
                              placeholder="Add a thoughtful reply..."
                              className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                            />
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={submitShortComment}
                                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {recruiterPromptOpen ? (
                      <div
                        className="ui-fade-up absolute inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
                        onClick={(event) => {
                          event.stopPropagation();
                          setRecruiterPromptOpen(false);
                        }}
                      >
                        <div
                          role="dialog"
                          aria-modal="true"
                          aria-label="Recruiter endorsement required"
                          className="w-full max-w-sm rounded-[1.6rem] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                            Recruiter-only action
                          </p>
                          <h2 className="mt-2 text-xl font-bold text-slate-950">
                            Register as a recruiter to endorse
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            Endorsements are reserved for recruiter and enterprise accounts.
                            Create a recruiter profile to endorse talent from the feed.
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                              href="/signup?role=recruiter"
                              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white"
                            >
                              Register as recruiter
                            </Link>
                            <button
                              type="button"
                              onClick={() => setRecruiterPromptOpen(false)}
                              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-bold text-slate-700"
                            >
                              Maybe later
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : (
                <Card className="mx-auto max-w-[calc(22rem+2cm)] border-slate-200/90 bg-white/95 p-8 text-center">
                  <h2 className="font-display text-xl font-bold text-slate-950">
                    No shorts yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Create the first short or switch modes once your synced feed loads.
                  </p>
                </Card>
              )}
              <div className="hidden justify-items-center gap-3 md:grid">
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                  aria-label="Move down to next short"
                  disabled={!immersiveShorts.length}
                >
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Down
                </span>
              </div>
            </div>

            {immersiveShorts.length ? (
              <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white md:hidden"
                  aria-label="Previous short above"
                >
                  <ChevronDownIcon className="h-4 w-4 rotate-180" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-2">
                  {immersiveShorts.map((item, index) => (
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
                      aria-label={`Open short ${index + 1}`}
                    />
                  ))}
                </div>
                <span>
                  {safeActiveIndex + 1}/{immersiveShorts.length}
                </span>
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white md:hidden"
                  aria-label="Next short below"
                >
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-bold text-slate-950">Profile readiness</p>
                <span className="text-sm font-semibold text-slate-500">
                  {profileReadiness}% ready
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <Avatar src={author.avatar} alt={author.name} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">{author.name}</p>
                  <p className="truncate text-xs text-slate-600">{author.title}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-3xl font-display font-bold text-slate-950">
                    {immersiveShorts.length}
                  </p>
                  <p className="text-sm text-slate-500">Shorts live</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-slate-950">
                    {resume.skills.length}
                  </p>
                  <p className="text-sm text-slate-500">Core skills</p>
                </div>
              </div>
              <Link
                href="/resume"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Open resume studio
              </Link>
            </Card>

            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-bold text-slate-950">Quick access</p>
                <Link href="/jobs" className="text-sm font-bold text-indigo-700">
                  Jobs
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                <Link href="/network" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Network
                </Link>
                <Link href="/notifications" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Activity
                </Link>
                <Link href="/jobs" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Matches
                </Link>
              </div>
            </Card>

            <Card className="border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-bold text-slate-950">Recent momentum</p>
                <span className="text-sm font-semibold text-slate-500">
                  {streamItems.length} updates
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your feed now uses the same centered reel structure as the recruiter experience,
                while keeping talent-specific actions and profile tools.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section id="feed-tools" aria-label="Feed tools" className="hidden space-y-5 sm:block">
        <ProfileNudge avatarSrc={author.avatar} profileReadiness={profileReadiness} />
        <ComposeCard
          authorAvatar={author.avatar}
          authorName={author.name}
          body={composerText}
          onBodyChange={setComposerText}
          media={composerMedia}
          selectedChannel={composerChannel}
          onSelectChannel={(value) => {
            if (value !== "All") {
              setComposerChannel(value);
            }
          }}
          onCreateDraft={handleCreateDraft}
          onPickImages={(event) => handleMediaUpload(event, "image")}
          onPickVideos={(event) => handleMediaUpload(event, "video")}
          onRemoveMedia={(mediaId) =>
            setComposerMedia((current) => current.filter((item) => item.id !== mediaId))
          }
          onPublish={handlePublishPost}
          statusMessage={composerStatus}
        />
        {streamItems.length ? (
          streamItems.map((item) => (
            <FeedItemView
              key={item.id}
              item={item}
              viewerAvatar={author.avatar}
              viewerName={author.name}
              onToggleLike={handleToggleLike}
              onAddComment={handleAddComment}
            />
          ))
        ) : (
          <Card className="border-slate-200/90 bg-white/95 p-5">
            <p className="text-sm font-semibold text-slate-900">No feed updates yet.</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Publish the first update to activate the rest of your home stream.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
