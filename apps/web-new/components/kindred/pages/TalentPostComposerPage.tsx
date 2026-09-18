"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { apiUrl } from "../../api";
import { useKindredAuth } from "../app/kindred-provider";
import {
  ImageIcon,
  SparklesIcon,
  UploadCloudIcon,
  VideoIcon,
} from "../icons";
import { me } from "../mock";
import { Avatar, Badge, Button, Card, cn } from "../primitives";
import {
  getStoredProfileWorkspace,
  getStoredResumeWorkspace,
  readFileAsDataUrl,
  type ProfileWorkspace,
  type ResumeWorkspace,
} from "../workspace-state";

type FeedMode = "Work" | "Showcase" | "Local";

type ComposerMedia = {
  id: string;
  type: "image" | "video";
  src: string;
  alt: string;
  name: string;
};

type SyncedFeedPost = {
  id: string;
  channel: FeedMode;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  authorName: string;
  authorTitle: string;
  authorLocation: string;
  authorAvatarUri?: string;
  media: Array<{
    kind: "image" | "video";
    uri: string;
    alt?: string;
    fileName?: string;
  }>;
};

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

function buildAiDraft(channel: FeedMode, profile: ProfileWorkspace, resume: ResumeWorkspace) {
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

async function upsertSyncedFeedPost(token: string, post: SyncedFeedPost) {
  const response = await fetch(`${apiUrl}/feed/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post }),
  });

  if (!response.ok) {
    throw new Error("Unable to publish your post right now.");
  }
}

export function TalentPostComposerPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const { token, user } = useKindredAuth();
  const profile = useMemo(
    () =>
      getStoredProfileWorkspace({
        userId: user?.id,
        userFullName: user?.fullName,
        userEmail: user?.email,
      }),
    [user?.email, user?.fullName, user?.id],
  );
  const resume = useMemo(
    () =>
      getStoredResumeWorkspace({
        userId: user?.id,
        userFullName: user?.fullName,
        userEmail: user?.email,
      }),
    [user?.email, user?.fullName, user?.id],
  );
  const author = useMemo(() => buildCurrentAuthor(profile), [profile]);
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<ComposerMedia[]>([]);
  const [channel, setChannel] = useState<FeedMode>("Work");
  const [statusMessage, setStatusMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleMediaUpload(
    event: ChangeEvent<HTMLInputElement>,
    mediaType: ComposerMedia["type"],
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    setStatusMessage("Preparing media...");

    try {
      const nextMedia = await Promise.all(
        files.map(async (file, index) => ({
          id: `${mediaType}-${Date.now()}-${index}`,
          type: mediaType,
          src: await readFileAsDataUrl(file),
          alt: file.name,
          name: file.name,
        })),
      );

      setMedia((current) => [...current, ...nextMedia]);
      setStatusMessage(`${nextMedia.length} ${mediaType === "image" ? "image" : "video"} item(s) ready.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to prepare your media.");
    }
  }

  async function handlePublish() {
    const normalized = body.trim();

    if (!token) {
      setStatusMessage("Log in again before posting.");
      return;
    }

    if (!normalized && !media.length) {
      setStatusMessage("Add text, a photo, or a video before posting.");
      return;
    }

    const nextPost: SyncedFeedPost = {
      id: `post-${Date.now()}`,
      channel,
      body: normalized || "Shared a media update.",
      tags:
        channel === "Showcase"
          ? ["Portfolio", media.length ? "Media update" : "Creator post"]
          : channel === "Local"
            ? ["Local talent", "Availability"]
            : media.length
              ? ["Media update", "Work graph"]
              : ["New post", "Work graph"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      edited: false,
      authorName: author.name,
      authorTitle: author.title,
      authorLocation: author.location,
      authorAvatarUri: author.avatar,
      media: media.map((item) => ({
        kind: item.type,
        uri: item.src,
        alt: item.alt,
        fileName: item.name,
      })),
    };

    setBusy(true);
    setStatusMessage("");

    try {
      await upsertSyncedFeedPost(token, nextPost);
      router.push("/");
      router.refresh();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to publish your post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-5">
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
              Create a post
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
              Publish to your feed from a dedicated page
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Draft a work update, upload media, and post straight back into the shared talent feed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Back to feed
            </Link>
            <Link
              href="/profile"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              Profile
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Avatar src={author.avatar} alt={author.name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{author.name}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Post to your feed
                  </p>
                </div>
                <Badge tone="indigo">Creator mode</Badge>
              </div>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                placeholder="Share an update, a role, or a win..."
                className="mt-3 min-h-32 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition-colors placeholder:text-slate-500 focus:border-slate-300 focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {(["Work", "Showcase", "Local"] as FeedMode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setChannel(value)}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors",
                  channel === value
                    ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
              >
                {value}
              </button>
            ))}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ImageIcon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              Photos
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <VideoIcon className="h-4 w-4 text-indigo-700" aria-hidden="true" />
              Videos
            </button>
            <button
              type="button"
              onClick={() => {
                setBody(buildAiDraft(channel, profile, resume));
                setStatusMessage(`AI draft prepared for the ${channel.toLowerCase()} channel.`);
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              AI draft
            </button>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => void handleMediaUpload(event, "image")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(event) => void handleMediaUpload(event, "video")}
          />

          {media.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {media.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-50">
                  {item.type === "image" ? (
                    <img src={item.src} alt={item.alt} className="h-48 w-full object-cover" />
                  ) : (
                    <video src={item.src} controls className="h-48 w-full object-cover" />
                  )}
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {item.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setMedia((current) => current.filter((entry) => entry.id !== item.id))}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void handlePublish()} disabled={busy}>
              <UploadCloudIcon className="h-4 w-4" aria-hidden="true" />
              {busy ? "Publishing..." : "Post update"}
            </Button>
          </div>

          {statusMessage ? (
            <p className="mt-4 text-sm font-semibold text-indigo-800">{statusMessage}</p>
          ) : null}
        </Card>

        <Card className="p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
            Preview
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">
            Your feed post
          </h2>
          <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <Avatar src={author.avatar} alt={author.name} size={44} />
              <div>
                <p className="font-bold text-slate-950">{author.name}</p>
                <p className="text-sm text-slate-600">{author.title}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {body.trim() || "Your post preview appears here as you type."}
            </p>
            {media.length ? (
              <div className="mt-4 grid gap-3">
                {media.slice(0, 2).map((item) =>
                  item.type === "image" ? (
                    <img
                      key={item.id}
                      src={item.src}
                      alt={item.alt}
                      className="h-52 w-full rounded-[1.35rem] object-cover"
                    />
                  ) : (
                    <video
                      key={item.id}
                      src={item.src}
                      controls
                      className="h-52 w-full rounded-[1.35rem] object-cover"
                    />
                  ),
                )}
              </div>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
