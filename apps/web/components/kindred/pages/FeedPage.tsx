"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import Link from "next/link";
import {
  ArrowRightIcon,
  BellIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  MapPinIcon,
  MessageCircleIcon,
  Share2Icon,
  SparklesIcon,
  FileTextIcon,
  UploadCloudIcon,
  UserIcon,
  VideoIcon,
  UsersIcon,
} from "../icons";

import { motion, useReducedMotion } from "../motion";
import { feed, me, type FeedItem } from "../mock";
import { useKindredAuth } from "../app/kindred-provider";
import { Avatar, Badge, Button, Card, MatchRing, cn } from "../primitives";
import { ImmersiveShortsHome, type ImmersiveShortItem } from "./ImmersiveShortsHome";
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
                    <img src={item.src} alt={item.alt} className="h-48 w-full object-cover" />
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
                <img
                  key={media.src}
                  src={media.src}
                  alt={media.alt}
                  className="max-h-[32rem] w-full rounded-[1.5rem] bg-slate-200 object-cover"
                />
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
  const { token } = useKindredAuth();
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
  const [discoveryLocation, setDiscoveryLocation] = useState("All locations");
  const [discoverySector, setDiscoverySector] = useState("All sectors");
  const [discoveryRating, setDiscoveryRating] = useState("All ratings");
  const [sharedShortIds, setSharedShortIds] = useState<Record<string, boolean>>({});
  const [profile] = useState(() => getStoredProfileWorkspace());
  const [resume] = useState(() => getStoredResumeWorkspace());
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
  const discoveryLocationOptions = useMemo(() => {
    const uniqueLocations = Array.from(
      new Set(mediaPosts.map((item) => item.author.location).filter(Boolean)),
    ).slice(0, 4);

    return ["All locations", ...uniqueLocations];
  }, [mediaPosts]);
  const discoverySectorOptions = useMemo(() => {
    const uniqueSectors = Array.from(
      new Set(
        mediaPosts
          .map((item) => item.tags[0])
          .filter((tag): tag is string => Boolean(tag)),
      ),
    ).slice(0, 4);

    return ["All sectors", ...uniqueSectors];
  }, [mediaPosts]);
  const discoveryRatingOptions = ["All ratings", "4.0★+", "4.5★+"];

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
          shares: estimatedShares + (sharedShortIds[item.id] ? 1 : 0),
          shared: Boolean(sharedShortIds[item.id]),
          liked: item.liked,
          commentItems: item.commentItems ?? [],
          searchText: `${item.author.location} ${item.tags.join(" ")}`,
        };
      }),
    [sharedShortIds, shortsItems, shortsMode],
  );

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

  return (
    <ImmersiveShortsHome
      brandLabel="Talent side"
      navLabel="Talent navigation"
      navItems={[
        { href: "/", label: "Shorts", icon: <HomeIcon className="h-5 w-5" />, active: true },
        { href: "/jobs", label: "Matches", icon: <SparklesIcon className="h-5 w-5" /> },
        { href: "/network", label: "Network", icon: <UsersIcon className="h-5 w-5" /> },
        { href: "/notifications", label: "Alerts", icon: <BellIcon className="h-5 w-5" /> },
        { href: "/profile", label: "You", icon: <UserIcon className="h-5 w-5" /> },
      ]}
      searchPlaceholder="Search the home feed"
      eyebrow="FOR YOUR NEXT MOVE"
      title="CareerShorts"
      modeLabel={shortsMode === "curated" ? "Curated" : "Latest"}
      onToggleMode={() =>
        setShortsMode((current) => (current === "curated" ? "latest" : "curated"))
      }
      dockItems={[
        ...discoveryLocationOptions.map((option) => ({
          key: `location-${option}`,
          label: option,
          active: discoveryLocation === option,
          onClick: () => setDiscoveryLocation(option),
        })),
        ...discoverySectorOptions.map((option) => ({
          key: `sector-${option}`,
          label: option,
          active: discoverySector === option,
          onClick: () => setDiscoverySector(option),
        })),
        ...discoveryRatingOptions.map((option) => ({
          key: `rating-${option}`,
          label: option,
          active: discoveryRating === option,
          onClick: () => setDiscoveryRating(option),
        })),
        {
          key: "resume",
          label: "Resume",
          icon: <FileTextIcon className="h-4 w-4" />,
          href: "/resume",
          tone: "accent",
        },
      ]}
      shorts={immersiveShorts}
      viewerName={author.name}
      viewerAvatar={author.avatar}
      emptyTitle="No shorts yet"
      emptyBody="Create the first short or switch back once your synced feed loads."
      commentPlaceholder="Add a thoughtful reply..."
      onToggleLike={handleToggleLike}
      onAddComment={handleAddComment}
      onShare={(shortId) => void handleShareShort(shortId)}
      topBarActions={
        <>
          <Link href="/jobs" className="immersive-dock-chip is-active">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            <span>Matches</span>
          </Link>
          <a
            href="#feed-tools"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-bold text-white"
          >
            + Post
          </a>
          <Link
            href="/notifications"
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700"
            aria-label="Open notifications"
          >
            <BellIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/profile" className="rounded-full" aria-label="Open your profile">
            <Avatar src={author.avatar} alt={author.name} size={44} />
          </Link>
        </>
      }
      sidePanel={
        <div className="space-y-4">
          <Card className="border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
              Feed visibility
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-950">
              {profileReadiness}%
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep your profile fresh so your clips, portfolio, and availability stand out.
            </p>
          </Card>
          <Card className="border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
              Quick access
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/resume" className="immersive-rail-link">
                Resume
              </Link>
              <Link href="/notifications" className="immersive-rail-link">
                Notifications
              </Link>
              <Link href="/jobs" className="immersive-rail-link">
                Matches
              </Link>
            </div>
          </Card>
          <Card className="border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-bold text-slate-950">Mobile-aligned labels</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              `CareerShorts`, `Curated`, `Latest`, and `Resume` now mirror the mobile
              feed language on web.
            </p>
          </Card>
        </div>
      }
      belowFeed={
        <section id="feed-tools" aria-label="Feed tools" className="space-y-5">
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
      }
    />
  );
}
