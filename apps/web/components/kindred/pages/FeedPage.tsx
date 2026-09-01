"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import Link from "next/link";
import {
  ArrowRightIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  HeartIcon,
  ImageIcon,
  MapPinIcon,
  MessageCircleIcon,
  Share2Icon,
  SparklesIcon,
  FileTextIcon,
  UploadCloudIcon,
  VideoIcon,
} from "../icons";

import { motion, useReducedMotion } from "../motion";
import { feed, me, type FeedItem } from "../mock";
import { useKindredAuth } from "../app/kindred-provider";
import { Avatar, Badge, Button, Card, MatchRing, cn } from "../primitives";
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
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Avatar src={authorAvatar} alt={authorName} size={46} />
        <div className="min-w-0 flex-1">
          <textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            rows={4}
            placeholder="Share an update, a role, or a win..."
            className="min-h-28 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition-colors placeholder:text-slate-500 focus:border-slate-300 focus:bg-white focus-visible:outline-none"
          />
          {media.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {media.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
                  {item.type === "image" ? (
                    <img src={item.src} alt={item.alt} className="h-48 w-full object-cover" />
                  ) : (
                    <video src={item.src} controls className="h-48 w-full object-cover" />
                  )}
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="min-w-0 truncate text-xs font-semibold text-slate-600">{item.name}</p>
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
    <Card className="border-indigo-200 bg-indigo-50/70 p-5">
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

function FeedHighlights({
  profileReadiness,
  skillsCount,
  portfolioCount,
}: {
  profileReadiness: number;
  skillsCount: number;
  portfolioCount: number;
}) {
  const stats = [
    {
      label: "Profile score",
      value: `${profileReadiness}%`,
      detail: "Ranked for recruiter trust",
    },
    { label: "Connections", value: `${me.connections}`, detail: "Warm network signal" },
    {
      label: "Visible proof",
      value: `${portfolioCount + skillsCount}`,
      detail: `${portfolioCount} clips and ${skillsCount} structured skills`,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-950">{stat.value}</p>
          <p className="mt-1 text-sm text-slate-600">{stat.detail}</p>
        </Card>
      ))}
    </section>
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
      <Card className="p-4 sm:p-5">
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
        <p className="mt-3 text-[15px] leading-relaxed text-slate-700">{item.body}</p>
        {item.media?.length ? (
          <div className={cn("mt-4 grid gap-3", item.media.length > 1 && "sm:grid-cols-2")}>
            {item.media.map((media) =>
              media.type === "image" ? (
                <img
                  key={media.src}
                  src={media.src}
                  alt={media.alt}
                  className="max-h-[26rem] w-full rounded-[1.25rem] object-cover"
                />
              ) : (
                <video
                  key={media.src}
                  src={media.src}
                  controls
                  className="max-h-[26rem] w-full rounded-[1.25rem] bg-slate-950 object-cover"
                />
              ),
            )}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <Badge key={tag} tone="indigo">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => {
              onToggleLike(item.id);
            }}
            aria-pressed={Boolean(item.liked)}
            aria-label={`${item.liked ? "Unlike" : "Like"} post, ${item.likes} likes`}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <MessageCircleIcon className="h-4 w-4" aria-hidden="true" />
            {comments.length}
          </button>
          <button
            type="button"
            aria-label="Share post"
            onClick={() => void handleShare()}
            className="grid h-11 w-11 place-items-center rounded-xl text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Share2Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {commentsOpen ? (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
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
  const [feedItems, setFeedItems] = useState<FeedItem[]>(feed);
  const [composerText, setComposerText] = useState("");
  const [composerMedia, setComposerMedia] = useState<ComposerMedia[]>([]);
  const [composerStatus, setComposerStatus] = useState("");
  const [feedMode, setFeedMode] = useState<FeedMode>("All");
  const [profile] = useState(() => getStoredProfileWorkspace());
  const [resume] = useState(() => getStoredResumeWorkspace());
  const author = useMemo(() => buildCurrentAuthor(profile), [profile]);
  const selectedChannel = feedMode === "All" ? "Work" : feedMode;
  const profileReadiness = useMemo(
    () =>
      Math.min(
        98,
        60 + Math.min(20, resume.skills.length * 2) + Math.min(18, profile.portfolio.length * 3),
      ),
    [profile.portfolio.length, resume.skills.length],
  );
  const filteredFeed = useMemo(() => {
    if (feedMode === "All") {
      return feedItems;
    }

    return feedItems.filter((item) => item.channel === feedMode);
  }, [feedItems, feedMode]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(feedStorageKey);

      if (raw) {
        setFeedItems(JSON.parse(raw) as FeedItem[]);
      }
    } catch {
      // Ignore malformed local state and fall back to seeded feed.
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
    setComposerText(buildAiDraft(selectedChannel, profile, resume));
    setComposerStatus(`AI draft prepared for the ${selectedChannel.toLowerCase()} channel.`);
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
      channel: selectedChannel,
      author,
      time: "Just now",
      body: normalized || "Shared a media update.",
      tags:
        selectedChannel === "Showcase"
          ? ["Portfolio", composerMedia.length ? "Media update" : "Creator post"]
          : selectedChannel === "Local"
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
    setFeedMode("All");
    setComposerStatus("Post published to your feed.");
  }

  return (
    <div className="ui-fade-up space-y-8 xl:space-y-10">
      <section aria-labelledby="feed-title" className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              Curated for you
            </p>
            <h1
              id="feed-title"
              className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
            >
              Professional signal, now in a real web workspace
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Track role matches, people activity, and recruiter intent in a desktop
              feed built for deeper browsing instead of phone-width scrolling.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald" className="shrink-0">
              <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Ranked and filtered
            </Badge>
            <Badge tone="indigo">Video-first discovery</Badge>
            <Badge tone="amber">Work + creator graph</Badge>
          </div>
        </div>
      </section>
      <FeedHighlights
        profileReadiness={profileReadiness}
        skillsCount={resume.skills.length}
        portfolioCount={profile.portfolio.length}
      />
      <section aria-label="Feed modes">
        <div className="flex flex-wrap gap-2">
          {(["All", "Work", "Showcase", "Local"] as FeedMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFeedMode(mode)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                feedMode === mode
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {mode === "All" ? "For you" : mode}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              Video portfolio
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Showcase short-form clips, process videos, and work snapshots without losing professional context.
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
              Work graph
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Keep job matches, hiring posts, and recruiter trust signals in the same scrolling workspace.
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
              Local visibility
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Surface availability and local-ready talent posts for faster blue-collar and shift discovery patterns.
            </p>
          </Card>
        </div>
      </section>
      <section aria-label="Feed updates" className="space-y-5">
        <ProfileNudge avatarSrc={author.avatar} profileReadiness={profileReadiness} />
        <ComposeCard
          authorAvatar={author.avatar}
          authorName={author.name}
          body={composerText}
          onBodyChange={setComposerText}
          media={composerMedia}
          selectedChannel={selectedChannel}
          onSelectChannel={setFeedMode}
          onCreateDraft={handleCreateDraft}
          onPickImages={(event) => handleMediaUpload(event, "image")}
          onPickVideos={(event) => handleMediaUpload(event, "video")}
          onRemoveMedia={(mediaId) =>
            setComposerMedia((current) => current.filter((item) => item.id !== mediaId))
          }
          onPublish={handlePublishPost}
          statusMessage={composerStatus}
        />
        {filteredFeed.length ? (
          filteredFeed.map((item) => (
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
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900">
              No posts yet in {feedMode === "All" ? "your filtered feed" : `${feedMode.toLowerCase()} mode`}.
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Switch channels or publish the first update to activate this stream.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
