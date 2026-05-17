'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import ThumbsUpIcon from './ThumbsUpIcon';

export interface ContentItem {
  id: number;
  title: string;
  slug: string;
  type: 'VIDEO' | 'ARTICLE';
  description?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  readTime?: number | null;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  engagements?: { isLiked: boolean; isBookmarked: boolean }[];
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// One object holds everything that engagement can change.
interface EngState {
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
}

export default function ContentCard({
  item,
  index = 0,
  onUnbookmark,
  onUnbookmarkError,
}: {
  item: ContentItem;
  index?: number;
  // Called the instant the user un-bookmarks this card (optimistically, before
  // the server confirms) so a bookmarks list can drop the card immediately.
  onUnbookmark?: (id: number) => void;
  // Called if that un-bookmark request fails — the list should restore the
  // card. On the feed/search neither is passed, so nothing happens there.
  onUnbookmarkError?: (item: ContentItem) => void;
}) {
  const isVideo = item.type === 'VIDEO';
  const router = useRouter();
  const { data: session } = useSession();

  // Admins manage content; liking/bookmarking is a reader-only action.
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  /* ===== ENGAGEMENT — single source of truth + correct useOptimistic =====
     - `engagement` is the committed (server-confirmed) state.
     - `optimistic` is what the UI renders: the committed state with the
       in-flight change applied on top. It flips INSTANTLY on click and, if
       the request fails, reverts on its own when the transition ends. */
  const [engagement, setEngagement] = useState<EngState>({
    liked: Boolean(item.engagements?.[0]?.isLiked),
    bookmarked: Boolean(item.engagements?.[0]?.isBookmarked),
    likeCount: item.likeCount,
  });

  // Actions carry ABSOLUTE values, so committing the same value never flickers.
  const [optimistic, applyOptimistic] = useOptimistic(
    engagement,
    (state: EngState, patch: Partial<EngState>) => ({ ...state, ...patch }),
  );
  const [isPending, startTransition] = useTransition();

  const meta = isVideo
    ? item.duration
      ? formatDuration(item.duration)
      : 'Video'
    : item.readTime
      ? `${item.readTime} min read`
      : 'Article';

  const toggleLike = () => {
    if (isAdmin || isPending) return; // admins cannot like; ignore while in flight
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }
    const liked = !engagement.liked;
    const likeCount = engagement.likeCount + (liked ? 1 : -1);
    startTransition(async () => {
      applyOptimistic({ liked, likeCount }); // instant flip
      const res = await fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: item.id, isLiked: liked }),
      });
      // Commit on success; on failure the optimistic value reverts itself.
      if (res.ok) setEngagement((s) => ({ ...s, liked, likeCount }));
    });
  };

  const toggleBookmark = () => {
    if (isAdmin || isPending) return; // admins cannot bookmark; ignore while in flight
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }
    const bookmarked = !engagement.bookmarked;
    startTransition(async () => {
      applyOptimistic({ bookmarked }); // instant flip
      // Optimistically drop the card from a bookmarks list right away.
      if (!bookmarked) onUnbookmark?.(item.id);
      const res = await fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: item.id, isBookmarked: bookmarked }),
      });
      if (res.ok) {
        setEngagement((s) => ({ ...s, bookmarked }));
      } else if (!bookmarked) {
        // Request failed → ask the bookmarks list to restore the card.
        onUnbookmarkError?.(item);
      }
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 12) * 0.04, duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="group glass rounded-2xl overflow-hidden hover:border-purple-400/70 hover:shadow-xl hover:shadow-purple-500/15 transition-all duration-300 flex flex-col"
    >
      {/* Thumbnail */}
      <Link href={`/content/${item.slug}`} className="relative aspect-video overflow-hidden block">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-200 via-fuchsia-200 to-purple-300 dark:from-purple-900/60 dark:via-fuchsia-900/40 dark:to-purple-800/60">
            <span className="text-5xl opacity-70 group-hover:scale-110 transition-transform duration-300">
              {isVideo ? '🎬' : '📄'}
            </span>
          </div>
        )}

        <span
          className={`absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md text-white ${
            isVideo ? 'bg-purple-600/85' : 'bg-fuchsia-600/85'
          }`}
        >
          {item.type}
        </span>

        <span className="absolute bottom-3 right-3 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/65 text-white backdrop-blur-sm">
          {meta}
        </span>

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center text-purple-600 text-xl shadow-lg">
              ▶
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/content/${item.slug}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {item.description}
            </p>
          )}
        </Link>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            👁 {formatCount(item.viewCount)} views
          </span>

          {/* ===== ADMIN ENGAGEMENT LOCK: buttons disabled for admins ===== */}
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: isAdmin ? 1 : 0.8 }}
              onClick={toggleLike}
              disabled={isAdmin || isPending}
              aria-label="Like"
              title={isAdmin ? 'Liking is disabled for admin accounts' : 'Like'}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                isAdmin
                  ? 'text-gray-400 opacity-50 cursor-not-allowed'
                  : optimistic.liked
                    ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/40'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              <ThumbsUpIcon filled={optimistic.liked} className="w-4 h-4" />
              {formatCount(Math.max(0, optimistic.likeCount))}
            </motion.button>

            <motion.button
              whileTap={{ scale: isAdmin ? 1 : 0.8 }}
              onClick={toggleBookmark}
              disabled={isAdmin || isPending}
              aria-label="Bookmark"
              title={isAdmin ? 'Bookmarking is disabled for admin accounts' : 'Bookmark'}
              className={`px-2 py-1 rounded-lg text-sm transition-colors ${
                isAdmin
                  ? 'opacity-40 grayscale cursor-not-allowed'
                  : optimistic.bookmarked
                    ? 'bg-purple-100 dark:bg-purple-950/40'
                    : 'grayscale opacity-60 hover:opacity-100 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              🔖
            </motion.button>
          </div>
          {/* ============================================================== */}
        </div>
      </div>
    </motion.article>
  );
}
