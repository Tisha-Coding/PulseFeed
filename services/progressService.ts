import { prisma } from "@/lib/db";

/**
 * Progress ("Continue Watching / Reading") data-access layer.
 * upsert keeps repeated debounced writes safe and idempotent.
 */

interface SaveProgressInput {
  userId: number;
  contentId: number;
  lastPosition: number;
  isCompleted?: boolean;
}

export async function saveProgress({
  userId,
  contentId,
  lastPosition,
  isCompleted,
}: SaveProgressInput) {
  return prisma.progress.upsert({
    where: { userId_contentId: { userId, contentId } },
    update: { lastPosition, isCompleted: isCompleted ?? false },
    create: {
      userId,
      contentId,
      lastPosition,
      isCompleted: isCompleted ?? false,
    },
  });
}

export async function getProgress(userId: number, contentId: number) {
  return prisma.progress.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
}

// Unfinished items for the "Continue Watching / Reading" rail.
export async function getContinueList(userId: number) {
  return prisma.progress.findMany({
    where: { userId, isCompleted: false, lastPosition: { gt: 0 } },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: { content: true },
  });
}
