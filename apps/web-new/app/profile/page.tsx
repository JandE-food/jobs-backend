import Link from "next/link";
import { notFound } from "next/navigation";

import { MapPinIcon } from "@/components/kindred/icons";
import { feed, people } from "@/components/kindred/mock";
import { Avatar, Badge, Card } from "@/components/kindred/primitives";
import { ProfilePage } from "@/components/kindred/pages/ProfilePage";

export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ creator?: string }>;
}) {
  const { creator } = await searchParams;

  if (creator) {
    const profile = people.find((person) => person.id === creator);

    if (!profile) {
      notFound();
    }

    const creatorPosts = feed.filter(
      (item): item is Extract<(typeof feed)[number], { kind: "post" }> =>
        item.kind === "post" && item.author.id === profile.id,
    );
    const creatorHighlights = Array.from(
      new Set(creatorPosts.flatMap((post) => post.tags)),
    ).slice(0, 5);
    const creatorMediaPosts = creatorPosts.filter((post) => post.media?.length);

    return (
      <div className="space-y-6 pb-8 pt-4">
        <Card className="overflow-hidden border-slate-200/90 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(15,23,42,0.96)_48%,_rgba(2,6,23,1))] p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/12 px-4 text-sm font-bold text-white transition-colors hover:bg-white/18"
            >
              Back to feed
            </Link>
            <Badge tone="indigo" className="border border-white/15 bg-white/10 text-white">
              Creator profile
            </Badge>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Avatar src={profile.avatar} alt={profile.name} size={88} ring />
            <div className="min-w-0">
              <h1 className="truncate text-[2rem] font-bold tracking-tight text-white">
                {profile.name}
              </h1>
              <p className="mt-2 text-lg text-white/86">
                {profile.title} · {profile.company}
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-white/72">
                <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                <span>{profile.location}</span>
                <span>·</span>
                <span>{profile.mutuals ?? 0} mutual connections</span>
              </div>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/82">
            Discover recent creator posts, focus areas, and short-form updates from {profile.name}.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {creatorHighlights.length ? (
              creatorHighlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-semibold text-white/88"
                >
                  #{highlight}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-semibold text-white/88">
                #OpenToCollaborate
              </span>
            )}
          </div>
        </Card>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                  Recent posts
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">From the feed</h2>
              </div>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                Open feed
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {creatorPosts.length ? (
                creatorPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        {post.channel}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">{post.time}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{post.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-5 text-xs font-semibold text-slate-500">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-500">
                  No public posts are available for this creator yet.
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-5">
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                Quick stats
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-950">{creatorPosts.length}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Posts</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-950">{creatorMediaPosts.length}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Media posts</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                Creator focus
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {creatorHighlights.length ? (
                  creatorHighlights.map((highlight) => (
                    <Badge key={highlight} tone="indigo">
                      {highlight}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="slate">Professional updates</Badge>
                )}
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return <ProfilePage />;
}
