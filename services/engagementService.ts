import { prisma } from "@/lib/db";

/**
 * Engagement (Like / Bookmark) data-access layer.
 *
 * - Idempotent: a rapid double-click never crashes the API — the row is
 *   created via `upsert` on the composite unique key, and each toggle is a
 *   conditional `updateMany` that simply matches zero rows when the state is
 *   already what was requested.
 * - Atomic counters via PostgreSQL `increment` (per spec — never
 *   fetch-add-save). The counter only moves when the conditional update
 *   actually flips a row, and "did it flip?" is read from that same atomic
 *   statement's row count — not from a separate, stale read. So the counter
 *   moves exactly once per real toggle, even under concurrency, and never
 *   drifts out of sync with the Engagement rows.
 * - No interactive transaction: Neon's pooled connection cannot start one
 *   within Prisma's default window (error P2028), so each step is its own
 *   individually-atomic statement.
 */

interface ToggleInput {
  userId: number;
  contentId: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export async function toggleEngagement({
  userId,
  contentId,
  isLiked,
  isBookmarked,
}: ToggleInput) {
  // 1) Make sure the engagement row exists. `update: {}` means a repeated
  //    click never crashes on the unique constraint; the row's like/bookmark
  //    flags are changed by the conditional updates below, not here.
  const engagement = await prisma.engagement.upsert({
    where: { userId_contentId: { userId, contentId } },
    update: {},
    create: { userId, contentId, isLiked: false, isBookmarked: false },
  });

  // 2) Flip the like flag ONLY if it actually differs from the request, in a
  //    single atomic WHERE+SET statement. `count` tells us whether a real
  //    flip happened — if so (and only then) move the counter by ±1.
  if (isLiked !== undefined) {
    const flipped = await prisma.engagement.updateMany({
      where: { userId, contentId, isLiked: !isLiked },
      data: { isLiked },
    });
    if (flipped.count > 0) {
      await prisma.content.update({
        where: { id: contentId },
        data: { likeCount: { increment: isLiked ? 1 : -1 } },
      });
    }
  }

  // 3) Same atomic conditional toggle for bookmarks.
  if (isBookmarked !== undefined) {
    const flipped = await prisma.engagement.updateMany({
      where: { userId, contentId, isBookmarked: !isBookmarked },
      data: { isBookmarked },
    });
    if (flipped.count > 0) {
      await prisma.content.update({
        where: { id: contentId },
        data: { bookmarkCount: { increment: isBookmarked ? 1 : -1 } },
      });
    }
  }

  // Return the freshly-toggled row so callers see the committed state.
  const fresh = await prisma.engagement.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
  return fresh ?? engagement;
}

export async function getEngagement(userId: number, contentId: number) {
  return prisma.engagement.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
}

/** All content a user has bookmarked, newest first. */
export async function getUserBookmarks(userId: number) {
  const rows = await prisma.engagement.findMany({
    where: { userId, isBookmarked: true },
    orderBy: { updatedAt: "desc" },
    include: { content: true },
  });
  // Shape each row like a feed item so <ContentCard> can render it directly.
  return rows.map((r) => ({
    ...r.content,
    engagements: [{ isLiked: r.isLiked, isBookmarked: r.isBookmarked }],
  }));
}
