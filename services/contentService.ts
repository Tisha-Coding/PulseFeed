import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

/**
 * Content data-access layer. API routes stay thin and call into here.
 */

interface FeedParams {
  cursor?: number | null;
  limit: number;
  type?: "VIDEO" | "ARTICLE" | null;
  sort?: "trending" | "latest" | null;
  userId?: number | null;
}

// Cursor-based feed. When a userId is known, only that user's engagement is
// joined in — one query, no N+1, and the card knows the viewer's like state.
export async function getFeed({ cursor, limit, type, sort, userId }: FeedParams) {
  const items = await prisma.content.findMany({
    take: limit + 1, // one extra row tells us whether more pages exist
    // `skip: 1` steps over the cursor row itself — it was the last item of the
    // previous page, so including it again would duplicate a card.
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: type ? { type } : {},
    orderBy:
      sort === "trending"
        ? [{ viewCount: "desc" }, { id: "desc" }]
        : { id: "desc" },
    ...(userId
      ? {
          include: {
            engagements: {
              where: { userId },
              select: { isLiked: true, isBookmarked: true },
            },
          },
        }
      : {}),
  });

  const hasMore = items.length > limit;
  const data = items.slice(0, limit);
  return {
    data,
    nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
    hasMore,
  };
}

// Fetch a content item WITHOUT touching the view count.
// Opening the page no longer counts as a view — see registerView().
export async function getContentBySlug(slug: string) {
  return prisma.content.findUniqueOrThrow({ where: { slug } });
}

// Atomically count ONE view. Called only after the viewer has actually
// spent time on the content (watched a video / read an article).
export async function registerView(slug: string) {
  return prisma.content.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });
}

// Builds a slug that is guaranteed unique by appending -2, -3, … on collision.
async function uniqueSlug(title: string, keepSlug?: string): Promise<string> {
  const base = generateSlug(title) || "content";
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (candidate === keepSlug) return candidate;
    const taken = await prisma.content.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export async function createContent(input: {
  title: string;
  type: "VIDEO" | "ARTICLE";
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  articleBody?: string;
  duration?: number;
  readTime?: number;
}) {
  return prisma.content.create({
    data: { ...input, slug: await uniqueSlug(input.title) },
  });
}

export async function updateContentBySlug(
  slug: string,
  fields: Prisma.ContentUpdateInput,
  regenerateSlug: boolean,
) {
  const data: Prisma.ContentUpdateInput = { ...fields };
  // Slug integrity: only regenerate when explicitly requested, and even then
  // keep it unique so existing links never collide.
  if (regenerateSlug && typeof fields.title === "string") {
    data.slug = await uniqueSlug(fields.title, slug);
  }
  return prisma.content.update({ where: { slug }, data });
}

export async function deleteContentBySlug(slug: string) {
  return prisma.content.delete({ where: { slug } });
}

// Title-only search (per the spec: "finds content by title"),
// backed by the GIN trigram index on Content.title.
export async function searchContent(query: string, userId?: number | null) {
  return prisma.content.findMany({
    where: {
      title: { contains: query, mode: "insensitive" },
    },
    take: 20,
    orderBy: { viewCount: "desc" },
    ...(userId
      ? {
          include: {
            engagements: {
              where: { userId },
              select: { isLiked: true, isBookmarked: true },
            },
          },
        }
      : {}),
  });
}
