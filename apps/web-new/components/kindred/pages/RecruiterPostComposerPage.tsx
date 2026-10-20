"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { apiUrl } from "../../api";
import { useKindredAuth } from "../app/kindred-provider";
import { ArrowRightIcon, CheckCircle2Icon, UploadCloudIcon, VideoIcon } from "../icons";
import { me } from "../mock";
import { Avatar, Badge, Button, Card } from "../primitives";
import { readFileAsDataUrl, getStoredProfileWorkspace } from "../workspace-state";

type RecruiterSyncedFeedPost = {
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
  media: Array<{
    kind: "image" | "video";
    uri: string;
    alt?: string;
    fileName?: string;
  }>;
};

async function upsertRecruiterPost(token: string, post: RecruiterSyncedFeedPost) {
  const response = await fetch(`${apiUrl}/feed/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post }),
  });

  if (!response.ok) {
    throw new Error("Unable to publish recruiter video post.");
  }
}

export function RecruiterPostComposerPage() {
  const router = useRouter();
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
  const [caption, setCaption] = useState("");
  const [tagDraft, setTagDraft] = useState("Hiring, Recruiter update");
  const [videoSrc, setVideoSrc] = useState("");
  const [videoName, setVideoName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const authorName = user?.fullName ?? profile.fullName ?? me.name;
  const authorAvatar = profile.avatarSrc || me.avatar;
  const authorLocation = profile.location || me.location;
  const authorTitle = profile.headline || "Recruiter update";

  async function handleVideoPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setStatusMessage("Preparing recruiter video post...");

    try {
      const nextSrc = await readFileAsDataUrl(file);
      setVideoSrc(nextSrc);
      setVideoName(file.name);
      setStatusMessage("Video ready for posting.");
    } catch (caughtError) {
      setStatusMessage(
        caughtError instanceof Error ? caughtError.message : "Unable to prepare your video.",
      );
    }
  }

  async function handlePublish() {
    if (!token) {
      setStatusMessage("Sign in again before publishing a recruiter post.");
      return;
    }

    if (!videoSrc) {
      setStatusMessage("Upload a video before publishing.");
      return;
    }

    const tags = tagDraft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const nextPost: RecruiterSyncedFeedPost = {
      id: `recruiter-post-${Date.now()}`,
      channel: "Showcase",
      body: caption.trim() || "Recruiter update",
      tags: tags.length ? tags : ["Recruiter update", "Hiring"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      edited: false,
      authorName,
      authorTitle,
      authorLocation,
      authorAvatarUri: authorAvatar,
      media: [
        {
          kind: "video",
          uri: videoSrc,
          alt: videoName || "Recruiter video post",
          fileName: videoName || "recruiter-video.mp4",
        },
      ],
    };

    setBusy(true);
    setStatusMessage("");

    try {
      await upsertRecruiterPost(token, nextPost);
      router.push("/recruiter");
    } catch (caughtError) {
      setStatusMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to publish recruiter video post.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-5">
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <VideoIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                Recruiter video post
              </span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
              Record or upload a recruiter video update
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Publish a short recruiter-facing update for hiring campaigns, employer branding, or open-role visibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/recruiter"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Back to feed
            </Link>
            <Link
              href="/companies#posting-queue"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              Posting queue
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Avatar src={authorAvatar} alt={authorName} size={48} />
            <div>
              <p className="font-bold text-slate-950">{authorName}</p>
              <p className="text-sm text-slate-600">{authorTitle}</p>
            </div>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-800">
            Caption
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={5}
              placeholder="Share what you're hiring for, the type of talent you want to attract, or a quick employer-branding message."
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-slate-800">
            Tags
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none"
              placeholder="Hiring, Remote, Engineering"
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(79,70,229,0.28)]">
              <UploadCloudIcon className="h-4 w-4" aria-hidden="true" />
              Upload video
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
            </label>
            <Button onClick={() => void handlePublish()} disabled={busy}>
              <CheckCircle2Icon className="h-4 w-4" aria-hidden="true" />
              {busy ? "Publishing..." : "Publish video post"}
            </Button>
          </div>

          {statusMessage ? (
            <p className="mt-4 text-sm font-semibold text-indigo-800">{statusMessage}</p>
          ) : null}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <VideoIcon className="h-5 w-5 text-indigo-700" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
              Preview
            </h2>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950">
            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                className="h-[34rem] w-full object-cover"
              />
            ) : (
              <div className="grid h-[34rem] place-items-center text-center text-white/80">
                <div>
                  <VideoIcon className="mx-auto h-10 w-10" aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold">Upload a recruiter video to preview it here.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(tagDraft
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean) || []
            ).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Published recruiter videos use the shared feed post API, so they go through a real post-creation flow.
          </p>
          <Link
            href="/recruiter"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-50"
          >
            Return to recruiter feed <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      </section>
    </div>
  );
}
