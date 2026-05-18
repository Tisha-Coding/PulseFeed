'use client';

import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';
import ThumbsUpIcon from '@/components/ThumbsUpIcon';

interface Detail {
  id: number;
  title: string;
  slug: string;
  type: 'VIDEO' | 'ARTICLE';
  description?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  articleBody?: string | null;
  duration?: number | null;
  readTime?: number | null;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  createdAt: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Debounced progress sync — never on every frame.
function saveProgress(contentId: number, lastPosition: number, isCompleted: boolean) {
  return fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentId, lastPosition, isCompleted }),
    keepalive: true, // lets the write survive an unmount/navigation
  }).catch(() => {});
}

// Counts ONE view — fired only after real watch/read time has passed.
// Resolves to the server's new viewCount so the page can update it live.
function countView(slug: string): Promise<number | undefined> {
  return fetch(`/api/content/${slug}/view`, {
    method: 'POST',
    keepalive: true,
  })
    .then((r) => r.json())
    .then((j) =>
      j?.success && typeof j.viewCount === 'number' ? j.viewCount : undefined,
    )
    .catch(() => undefined);
}

export default function ContentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const loggedIn = Boolean(session?.user);

  // "Back to feed" must pop history (not push a new /feed entry), otherwise a
  // browser-back from the feed would land back on this detail page.
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed');
    }
  };
  // Admins manage content — engagement (like/bookmark) is disabled for them.
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  const [content, setContent] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    fetch(`/api/content/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        if (j.success) setContent(j.data);
        else setNotFound(true);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <DetailSkeleton />;
  if (notFound || !content) return <NotFoundState />;

  const isVideo = content.type === 'VIDEO';

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="fixed top-0 right-1/4 w-[28rem] h-[28rem] bg-purple-300/25 dark:bg-purple-800/15 rounded-full blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-40">
        <div className="absolute inset-0 glass border-b border-purple-200/40" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
          >
            ← Back to feed
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-700">
              P
            </div>
            <span className="font-bold text-gray-900 dark:text-white hidden sm:inline">
              Pulse<span className="text-purple-600">Feed</span>
            </span>
          </Link>
        </div>
      </header>

      <article className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span
            className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-lg text-white ${
              isVideo ? 'bg-purple-600' : 'bg-fuchsia-600'
            }`}
          >
            {content.type}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            👁 {formatCount(content.viewCount)} views
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(content.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight"
        >
          {content.title}
        </motion.h1>

        {content.description && (
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">{content.description}</p>
        )}

        <div className="mt-6">
          {isVideo ? (
            <VideoPlayer
              content={content}
              loggedIn={loggedIn}
              isAdmin={isAdmin}
              onViewCounted={(viewCount) =>
                setContent((c) => (c ? { ...c, viewCount } : c))
              }
            />
          ) : (
            <ArticleReader
              content={content}
              loggedIn={loggedIn}
              isAdmin={isAdmin}
              onViewCounted={(viewCount) =>
                setContent((c) => (c ? { ...c, viewCount } : c))
              }
            />
          )}
        </div>

        <EngagementBar
          contentId={content.id}
          baseLikeCount={content.likeCount}
          loggedIn={loggedIn}
          isAdmin={isAdmin}
        />
      </article>
    </main>
  );
}

/* ============ ENGAGEMENT BAR (DB-backed, useOptimistic) ============ */
function EngagementBar({
  contentId,
  baseLikeCount,
  loggedIn,
  isAdmin,
}: {
  contentId: number;
  baseLikeCount: number;
  loggedIn: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();

  /* ===== ENGAGEMENT — single source of truth + correct useOptimistic =====
     `engagement` is the committed state; `optimistic` is what the UI shows
     (committed state + the in-flight change). Flips instantly, auto-reverts
     on failure. Actions carry absolute values so committing never flickers. */
  const [engagement, setEngagement] = useState({
    liked: false,
    bookmarked: false,
    likeCount: baseLikeCount,
  });
  const [optimistic, applyOptimistic] = useOptimistic(
    engagement,
    (state, patch: Partial<typeof engagement>) => ({ ...state, ...patch }),
  );
  const [isPending, startTransition] = useTransition();

  // Load this user's existing like/bookmark state.
  useEffect(() => {
    if (!loggedIn) return;
    let active = true;
    fetch(`/api/engagement?contentId=${contentId}`)
      .then((r) => r.json())
      .then((j) => {
        if (active && j.success && j.data) {
          setEngagement((s) => ({
            ...s,
            liked: j.data.isLiked,
            bookmarked: j.data.isBookmarked,
          }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [contentId, loggedIn]);

  const send = (body: Record<string, unknown>) =>
    fetch('/api/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, ...body }),
    });

  const toggleLike = () => {
    if (isAdmin || isPending) return; // admins cannot like; ignore while in flight
    if (!loggedIn) return router.push('/auth/login');
    const liked = !engagement.liked;
    const likeCount = engagement.likeCount + (liked ? 1 : -1);
    startTransition(async () => {
      applyOptimistic({ liked, likeCount }); // instant flip
      const res = await send({ isLiked: liked });
      if (res.ok) setEngagement((s) => ({ ...s, liked, likeCount }));
    });
  };

  const toggleBookmark = () => {
    if (isAdmin || isPending) return; // admins cannot bookmark; ignore while in flight
    if (!loggedIn) return router.push('/auth/login');
    const bookmarked = !engagement.bookmarked;
    startTransition(async () => {
      applyOptimistic({ bookmarked }); // instant flip
      const res = await send({ isBookmarked: bookmarked });
      if (res.ok) setEngagement((s) => ({ ...s, bookmarked }));
    });
  };

  return (
    <div className="mt-8">
      {/* ===== ADMIN ENGAGEMENT LOCK: buttons disabled for admins ===== */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: isAdmin ? 1 : 0.9 }}
          onClick={toggleLike}
          disabled={isAdmin || isPending}
          title={isAdmin ? 'Liking is disabled for admin accounts' : 'Like'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium transition-colors ${
            isAdmin
              ? 'glass text-gray-400 opacity-50 cursor-not-allowed'
              : optimistic.liked
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600'
                : 'glass text-gray-700 dark:text-gray-300 hover:border-purple-300'
          }`}
        >
          <ThumbsUpIcon filled={optimistic.liked} className="w-5 h-5" />
          {formatCount(Math.max(0, optimistic.likeCount))} Likes
        </motion.button>

        <motion.button
          whileTap={{ scale: isAdmin ? 1 : 0.9 }}
          onClick={toggleBookmark}
          disabled={isAdmin || isPending}
          title={isAdmin ? 'Bookmarking is disabled for admin accounts' : 'Bookmark'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium transition-colors ${
            isAdmin
              ? 'glass text-gray-400 opacity-50 cursor-not-allowed'
              : optimistic.bookmarked
                ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                : 'glass text-gray-700 dark:text-gray-300 hover:border-purple-300'
          }`}
        >
          🔖 {optimistic.bookmarked ? 'Saved' : 'Bookmark'}
        </motion.button>
      </div>

      {isAdmin && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Liking &amp; bookmarking are disabled for admin accounts.
        </p>
      )}
      {/* ============================================================== */}
    </div>
  );
}

/* ============ VIDEO PLAYER (video.js — real playback, DB progress) ============ */
function isYouTube(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

// Seek a player to `seconds` — but only once the media metadata is loaded.
// Seeking before `loadedmetadata` is silently ignored by the browser (it
// doesn't yet know the video's duration/seekable range), which is why a
// resumed video would otherwise start from 0. `seekedRef` is flipped to true
// only AFTER the seek actually lands, so a too-early call can't "use up" the
// one-shot resume.
function resumeVideoTo(
  player: ReturnType<typeof videojs>,
  seconds: number,
  seekedRef: { current: boolean },
) {
  if (seconds <= 0 || seekedRef.current) return;
  const apply = () => {
    if (seekedRef.current) return;
    player.currentTime(seconds);
    seekedRef.current = true;
  };
  // readyState >= 1 (HAVE_METADATA) → safe to seek right now; else wait.
  if ((player.readyState() ?? 0) >= 1) apply();
  else player.one('loadedmetadata', apply);
}

function VideoPlayer({
  content,
  loggedIn,
  isAdmin,
  onViewCounted,
}: {
  content: Detail;
  loggedIn: boolean;
  isAdmin: boolean;
  onViewCounted: (viewCount: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  // ===== ADMIN VIEW-ONLY: progress is tracked for readers, never admins =====
  const track = loggedIn && !isAdmin;
  const trackRef = useRef(track);
  trackRef.current = track;

  const savedPosRef = useRef(0); // position to resume from
  const seekedRef = useRef(false); // resume applied only once
  const lastSaveRef = useRef(0); // last currentTime we synced to the DB
  const [restoredAt, setRestoredAt] = useState(0);

  // ===== VIEW COUNT: only after real watch time, once, never for admins =====
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;
  const viewedRef = useRef(false);
  // Ref so the player effect always calls the latest callback.
  const onViewCountedRef = useRef(onViewCounted);
  onViewCountedRef.current = onViewCounted;

  const url = content.videoUrl ?? '';

  // Restore the saved watch position from the DB (readers only).
  useEffect(() => {
    if (!track) return;
    let active = true;
    fetch(`/api/progress?contentId=${content.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active || !j.success || !j.data || j.data.lastPosition <= 0) return;
        savedPosRef.current = j.data.lastPosition;
        setRestoredAt(j.data.lastPosition);
        // If the player already exists, resume now; resumeVideoTo waits for
        // metadata internally. If it doesn't exist yet, the init effect below
        // picks up savedPosRef once the player is created.
        const p = playerRef.current;
        if (p) resumeVideoTo(p, j.data.lastPosition, seekedRef);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [content.id, track]);

  // Initialise video.js once; dispose + flush progress on unmount.
  useEffect(() => {
    if (!url || playerRef.current || !containerRef.current) return;

    // Show only real errors — silences video.js deprecation WARN noise
    // (e.g. the videojs-youtube plugin's use of the deprecated createTimeRange).
    videojs.log.level('error');

    const videoEl = document.createElement('video-js');
    videoEl.classList.add('vjs-big-play-centered');
    containerRef.current.appendChild(videoEl);

    const youtube = isYouTube(url);
    const player = videojs(videoEl, {
      controls: true,
      fluid: true,
      responsive: true,
      preload: 'auto',
      poster: content.thumbnailUrl ?? undefined,
      ...(youtube ? { techOrder: ['youtube'] } : {}),
      sources: [{ src: url, ...(youtube ? { type: 'video/youtube' } : {}) }],
    });
    playerRef.current = player;

    // Once the metadata is loaded: resume to the saved point (if known by
    // then), then start MUTED autoplay. We drive play() ourselves instead of
    // the `autoplay` option — that option races the resume seek and often
    // leaves the video paused. Browsers allow autoplay only while muted; the
    // viewer unmutes via the player's volume control. The play() promise can
    // still reject on strict browsers, so it is caught harmlessly.
    const beginPlayback = () => {
      if (savedPosRef.current > 0 && !seekedRef.current) {
        player.currentTime(savedPosRef.current);
        seekedRef.current = true;
      }
      player.muted(true);
      const playPromise = player.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };
    if ((player.readyState() ?? 0) >= 1) beginPlayback();
    else player.one('loadedmetadata', beginPlayback);

    player.on('timeupdate', () => {
      const t = player.currentTime() ?? 0;

      // Count ONE view once 5s of real playback has happened (skip admins).
      if (!isAdminRef.current && !viewedRef.current && t >= 5) {
        viewedRef.current = true;
        countView(content.slug).then((viewCount) => {
          // Live-update the on-page count with the server's new total.
          if (typeof viewCount === 'number') onViewCountedRef.current(viewCount);
        });
      }

      // Debounced sync: write to PostgreSQL only every ~8s of playback.
      if (!trackRef.current) return;
      if (Math.abs(t - lastSaveRef.current) >= 8) {
        lastSaveRef.current = t;
        const dur = player.duration() ?? 0;
        saveProgress(content.id, Math.round(t), dur > 0 && t >= dur - 2);
      }
    });

    return () => {
      const p = playerRef.current;
      if (p) {
        // Final flush on unmount.
        if (trackRef.current) {
          const t = p.currentTime() ?? 0;
          if (t > 0) saveProgress(content.id, Math.round(t), false);
        }
        p.dispose();
        playerRef.current = null;
      }
    };
  }, [url, content.id, content.thumbnailUrl]);

  if (!url) {
    return (
      <div className="aspect-video rounded-2xl glass flex items-center justify-center text-gray-400">
        🎬 No video source provided for this item.
      </div>
    );
  }

  return (
    <div>
      <div
        data-vjs-player
        className="rounded-2xl overflow-hidden glass [&_.video-js]:rounded-2xl"
      >
        <div ref={containerRef} />
      </div>

      {restoredAt > 0 && (
        <p className="mt-3 text-sm text-purple-600 dark:text-purple-400">
          ⏯️ Resumed from {clock(restoredAt)} — progress syncs to your account every few seconds.
        </p>
      )}
      {!loggedIn && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/auth/login" className="text-purple-600 font-medium">
            Log in
          </Link>{' '}
          to save your watch progress.
        </p>
      )}
    </div>
  );
}

/* ============ ARTICLE READER (DB-backed reading progress) ============ */
function ArticleReader({
  content,
  loggedIn,
  isAdmin,
  onViewCounted,
}: {
  content: Detail;
  loggedIn: boolean;
  isAdmin: boolean;
  onViewCounted: (viewCount: number) => void;
}) {
  const [readPct, setReadPct] = useState(0);
  const [restored, setRestored] = useState(0);
  const pctRef = useRef(0);
  pctRef.current = readPct;
  const lastSavedRef = useRef(0); // last percentage synced to the DB
  // ===== ADMIN VIEW-ONLY: reading progress is tracked for readers only =====
  const track = loggedIn && !isAdmin;
  // Ref so the 10s timer always calls the latest callback.
  const onViewCountedRef = useRef(onViewCounted);
  onViewCountedRef.current = onViewCounted;

  // ===== VIEW COUNT: count one view after 10s of reading (skip admins). =====
  useEffect(() => {
    if (isAdmin) return;
    const timer = setTimeout(() => {
      countView(content.slug).then((viewCount) => {
        // Live-update the on-page count with the server's new total.
        if (typeof viewCount === 'number') onViewCountedRef.current(viewCount);
      });
    }, 10000);
    return () => clearTimeout(timer); // left early → no view counted
  }, [isAdmin, content.slug]);

  const paragraphs = (content.articleBody ?? content.description ?? '')
    .split(/\n+/)
    .filter(Boolean);

  // Restore saved reading position (stored as a percentage) — readers only.
  useEffect(() => {
    if (!track) return;
    let active = true;
    fetch(`/api/progress?contentId=${content.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (active && j.success && j.data && j.data.lastPosition > 0) {
          setRestored(j.data.lastPosition);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [content.id, track]);

  // Track scroll-through as reading progress.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setReadPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Debounced sync — exactly like the video player: write to the DB every
  // ~8 seconds of reading (within the spec's 5–10s window), and only when the
  // position has actually moved since the last save. The unmount flush below
  // captures the final position when the reader leaves.
  useEffect(() => {
    if (!track) return;
    const interval = setInterval(() => {
      const pct = Math.round(pctRef.current);
      if (pct !== lastSavedRef.current) {
        lastSavedRef.current = pct;
        saveProgress(content.id, pct, pct > 95);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [track, content.id]);

  // Flush on unmount.
  useEffect(() => {
    return () => {
      if (track && pctRef.current > 0) {
        saveProgress(content.id, Math.round(pctRef.current), pctRef.current > 95);
      }
    };
  }, [track, content.id]);

  const resume = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (restored / 100) * max, behavior: 'smooth' });
    setRestored(0);
  };

  return (
    <div>
      {/* Fixed reading-progress bar */}
      <div className="fixed top-0 inset-x-0 z-50 h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-[width] duration-150"
          style={{ width: `${readPct}%` }}
        />
      </div>

      {restored > 5 && (
        <button
          onClick={resume}
          className="mb-4 w-full glass rounded-2xl px-4 py-3 text-sm font-medium text-purple-700 dark:text-purple-300 hover:border-purple-300 transition-colors text-left"
        >
          ⏯️ Continue reading — you left off around {Math.round(restored)}%. Tap to jump there.
        </button>
      )}

      <div className="glass rounded-2xl p-6 sm:p-8">
        <p className="text-xs font-semibold text-purple-600 mb-4">
          📖 {content.readTime ?? Math.max(2, Math.round(paragraphs.length * 0.6))} min read
        </p>
        <div className="space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>

      {!loggedIn && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/auth/login" className="text-purple-600 font-medium">
            Log in
          </Link>{' '}
          to save your reading progress.
        </p>
      )}
    </div>
  );
}

/* ============ States ============ */
function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <div className="h-4 w-24 rounded skeleton" />
        <div className="h-9 w-3/4 rounded skeleton" />
        <div className="h-4 w-1/2 rounded skeleton" />
        <div className="aspect-video rounded-2xl skeleton mt-4" />
        <div className="h-4 w-full rounded skeleton" />
        <div className="h-4 w-5/6 rounded skeleton" />
      </div>
    </main>
  );
}

function NotFoundState() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="glass rounded-2xl py-16 px-8 text-center max-w-md">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Content not found</h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          This article or video may have been removed or the link is broken.
        </p>
        <Link
          href="/feed"
          className="inline-block mt-5 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:shadow-lg hover:shadow-purple-500/30 transition-shadow"
        >
          Back to feed
        </Link>
      </div>
    </main>
  );
}
