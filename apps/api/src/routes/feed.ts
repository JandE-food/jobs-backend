import { FastifyInstance } from "fastify";

import { recordAdminAudit } from "../lib/admin.js";
import { pool } from "../lib/db.js";
import {
  getAuthenticatedUserFromRequest,
  requireAdmin,
  requireUser,
} from "../lib/request-context.js";

type SharedFeedMedia = {
  kind: "image" | "video";
  uri: string;
  alt?: string;
  fileName?: string;
};

type SharedFeedPost = {
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
  media: SharedFeedMedia[];
};

type AdminFeedPostRecord = {
  id: string;
  userId: number;
  userEmail: string;
  userRole: string;
  userFullName: string;
  post: SharedFeedPost;
  updatedAt: string;
};

function isSharedFeedMedia(value: unknown): value is SharedFeedMedia {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SharedFeedMedia>;

  return (
    (candidate.kind === "image" || candidate.kind === "video") &&
    typeof candidate.uri === "string" &&
    candidate.uri.length > 0
  );
}

function normalizeSharedFeedPost(
  input: Partial<SharedFeedPost>,
  fallbackAuthor: {
    name: string;
    title: string;
    location: string;
  },
): SharedFeedPost | null {
  if (!input.id || typeof input.id !== "string") {
    return null;
  }

  const createdAt =
    typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString();
  const updatedAt =
    typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : createdAt;

  return {
    id: input.id,
    channel:
      input.channel === "Showcase" || input.channel === "Local" ? input.channel : "Work",
    body: typeof input.body === "string" ? input.body : "",
    tags: Array.isArray(input.tags)
      ? input.tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
      : [],
    createdAt,
    updatedAt,
    edited: Boolean(input.edited),
    authorName:
      typeof input.authorName === "string" && input.authorName ? input.authorName : fallbackAuthor.name,
    authorTitle:
      typeof input.authorTitle === "string" && input.authorTitle ? input.authorTitle : fallbackAuthor.title,
    authorLocation:
      typeof input.authorLocation === "string" && input.authorLocation
        ? input.authorLocation
        : fallbackAuthor.location,
    authorAvatarUri:
      typeof input.authorAvatarUri === "string" && input.authorAvatarUri ? input.authorAvatarUri : undefined,
    media: Array.isArray(input.media) ? input.media.filter(isSharedFeedMedia) : [],
  };
}

export async function registerFeedRoutes(app: FastifyInstance) {
  app.get("/feed/posts", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    const result = await pool.query<{
      payload: SharedFeedPost;
      updated_at: string;
    }>(
      `SELECT payload, updated_at
       FROM social_posts
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [user.id],
    );

    reply.send({
      posts: result.rows.map((row: { payload: SharedFeedPost }) => row.payload),
    });
  });

  app.post("/feed/posts", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    const body = request.body as { post?: Partial<SharedFeedPost> } | undefined;
    const normalized = normalizeSharedFeedPost(body?.post ?? {}, {
      name: user.full_name ?? user.email,
      title: user.role === "recruiter" ? "Recruiter" : "Professional",
      location: "",
    });

    if (!normalized) {
      reply.code(400).send({
        error: "Bad Request",
        message: "A valid post payload is required.",
      });
      return;
    }

    const now = new Date().toISOString();
    const nextPost = {
      ...normalized,
      updatedAt: now,
      createdAt: normalized.createdAt || now,
    };

    const result = await pool.query<{ payload: SharedFeedPost }>(
      `INSERT INTO social_posts (id, user_id, payload, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (id)
       DO UPDATE SET
         user_id = EXCLUDED.user_id,
         payload = EXCLUDED.payload,
         updated_at = EXCLUDED.updated_at
       WHERE social_posts.user_id = EXCLUDED.user_id
       RETURNING payload`,
      [nextPost.id, user.id, JSON.stringify(nextPost), nextPost.createdAt, nextPost.updatedAt],
    );

    reply.send({
      post: result.rows[0]?.payload ?? nextPost,
    });
  });

  app.delete("/feed/posts/:postId", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    const params = request.params as { postId?: string };

    if (!params.postId) {
      reply.code(400).send({
        error: "Bad Request",
        message: "A post id is required.",
      });
      return;
    }

    await pool.query(`DELETE FROM social_posts WHERE id = $1 AND user_id = $2`, [
      params.postId,
      user.id,
    ]);

    reply.code(204).send();
  });

  app.get(
    "/admin/feed/posts",
    {
      preHandler: requireAdmin,
    },
    async (_request, reply) => {
      const result = await pool.query<{
        id: string;
        user_id: number;
        updated_at: string;
        payload: SharedFeedPost;
        email: string;
        role: string;
        full_name: string | null;
      }>(
        `SELECT social_posts.id,
                social_posts.user_id,
                social_posts.updated_at,
                social_posts.payload,
                users.email,
                users.role,
                users.full_name
         FROM social_posts
         JOIN users ON users.id = social_posts.user_id
         WHERE users.deleted_at IS NULL
         ORDER BY social_posts.updated_at DESC`,
      );

      const posts: AdminFeedPostRecord[] = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.email,
        userRole: row.role,
        userFullName: row.full_name ?? row.email,
        post: row.payload,
        updatedAt: row.updated_at,
      }));

      reply.send({ posts });
    },
  );

  app.delete(
    "/admin/feed/posts/:postId",
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const admin = await getAuthenticatedUserFromRequest(request);

      const params = request.params as { postId?: string };

      if (!params.postId) {
        reply.code(400).send({
          error: "Bad Request",
          message: "A post id is required.",
        });
        return;
      }

      const result = await pool.query(
        `DELETE FROM social_posts
         WHERE id = $1`,
        [params.postId],
      );

      if (!result.rowCount) {
        reply.code(404).send({
          error: "Not Found",
          message: "Post not found.",
        });
        return;
      }

      await recordAdminAudit({
        actorId: admin ? Number(admin.id) : null,
        actorLabel: admin?.full_name ?? admin?.email ?? "Admin token",
        actionType: "content.post.deleted",
        entityType: "social_post",
        entityId: params.postId,
        reason: "Post removed from the shared feed by admin.",
        severity: "elevated",
      });

      reply.send({
        message: "Post removed from the shared feed.",
      });
    },
  );
}
