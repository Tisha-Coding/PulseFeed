'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentCard, { ContentItem } from '@/components/ContentCard';
import AppHeader from '@/components/AppHeader';

interface ContinueEntry {
  id: number;
  lastPosition: number;
  content: {
    slug: string;
    title: string;
    type: 'VIDEO' | 'ARTICLE';
    duration?: number | null;
  };
}

const TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Videos', value: 'VIDEO' },
  { label: 'Articles', value: 'ARTICLE' },
];

const PAGE_SIZE = 12;

/* ---- Skeleton card (perceived performance) ---- */
function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 w-4/5 rounded skeleton" />
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-2/3 rounded skeleton" />
        <div className="flex justify-between pt-2">
          <div className="h-3 w-16 rounded skeleton" />
          <div className="h-3 w-16 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [type, setType] = useState('');
  const [sort, setSort] = useState<'trending' | 'latest'>('trending');

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[] | null>(null);
  const [searching, setSearching] = useState(false);

  const { data: session } = useSession();
  const [continueList, setContinueList] = useState<ContinueEntry[]>([]);
  const reqId = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ---- Initial / filtered feed load ---- */
  const fetchFirst = useCallback(async () => {
    const myId = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams({ limit: String(PAGE_SIZE), sort });
      if (type) p.set('type', type);
      const res = await fetch(`/api/content?${p}`);
      const json = await res.json();
      if (myId !== reqId.current) return; // a newer request superseded this one
      if (!res.ok || !json.success) throw new Error();
      setItems(json.data);
      setCursor(json.pagination.nextCursor);
      setHasMore(json.pagination.hasMore);
    } catch {
      if (myId === reqId.current) {
        setError('Could not load the feed. Make sure the database is connected.');
        setItems([]);
        setHasMore(false);
      }
    } finally {
      if (myId === reqId.current) setLoading(false);
    }
  }, [type, sort]);

  useEffect(() => {
    fetchFirst();
  }, [fetchFirst]);

  /* ---- Cursor-based "load more" for infinite scroll ---- */
  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore || cursor == null) return;
    setLoadingMore(true);
    try {
      const p = new URLSearchParams({ limit: String(PAGE_SIZE), sort, cursor: String(cursor) });
      if (type) p.set('type', type);
      const res = await fetch(`/api/content?${p}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error();
      setItems((prev) => [...prev, ...json.data]);
      setCursor(json.pagination.nextCursor);
      setHasMore(json.pagination.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, cursor, sort, type]);

  /* ---- IntersectionObserver drives infinite scroll ---- */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || searchResults !== null) return;
    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && fetchMore(),
      { rootMargin: '500px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchMore, searchResults]);

  /* ---- Debounced search ---- */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setSearchResults(null);
      return;
    }
    let active = true;
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((j) => active && setSearchResults(j.success ? j.data : []))
      .catch(() => active && setSearchResults([]))
      .finally(() => active && setSearching(false));
    return () => {
      active = false;
    };
  }, [debounced]);

  // Real "Continue Watching/Reading" — the logged-in user's unfinished items.
  // ===== ADMIN VIEW-ONLY: no personalized continue list for admins =====
  useEffect(() => {
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || role === 'ADMIN') {
      setContinueList([]);
      return;
    }
    let active = true;
    fetch('/api/progress')
      .then((r) => r.json())
      .then((j) => active && setContinueList(j.success ? j.data : []))
      .catch(() => active && setContinueList([]));
    return () => {
      active = false;
    };
  }, [session]);

  const searchActive = searchResults !== null;
  // Search is "pending" from the first keystroke: during the debounce wait
  // (typed text !== debounced) and during the actual fetch (searching).
  const isSearchPending =
    query.trim() !== '' && (searching || query.trim() !== debounced);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* background glow */}
      <div className="fixed top-0 left-1/4 w-[30rem] h-[30rem] bg-purple-300/30 dark:bg-purple-800/15 rounded-full blur-3xl pointer-events-none" />

      {/* ---- Top bar (shared) with the feed search in its slot ---- */}
      <AppHeader
        searchSlot={
          <div className="relative max-w-xl">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos & articles by title…"
              className="w-full rounded-2xl bg-white/80 dark:bg-white/5 border border-purple-200/80 dark:border-purple-900/50 pl-10 pr-9 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm outline-none transition-all focus:ring-4 focus:ring-purple-500/15 focus:border-purple-500"
            />
            {/* Right side: spinner while a search is in progress, else a clear (✕) button. */}
            {isSearchPending ? (
              <span
                aria-label="Searching"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-purple-300 border-t-purple-600 animate-spin"
              />
            ) : (
              query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                >
                  ✕
                </button>
              )
            )}
          </div>
        }
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ================= SEARCH RESULTS ================= */}
        {searchActive ? (
          <section>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {searching ? 'Searching…' : `Results for “${debounced}”`}
            </h1>
            {!searching && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {searchResults!.length} {searchResults!.length === 1 ? 'match' : 'matches'} found
              </p>
            )}

            {searching ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : searchResults!.length === 0 ? (
              <EmptyState
                icon="🔎"
                title="No matches found"
                text={`Nothing matched “${debounced}”. Try a different title.`}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {searchResults!.map((item, i) => (
                  <ContentCard key={item.id} item={item} index={i} />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* ================= DISCOVERY FEED ================= */
          <>
            {/* Continue Watching / Reading — real progress from the DB */}
            {continueList.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  ⏯️ Continue Watching &amp; Reading
                </h2>
                <div className="themed-scroll flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
                  {continueList.map((entry) => {
                    const isVideo = entry.content.type === 'VIDEO';
                    // Videos store seconds; articles store a percentage.
                    const progress = isVideo
                      ? entry.content.duration
                        ? Math.min(100, Math.round((entry.lastPosition / entry.content.duration) * 100))
                        : 0
                      : Math.min(100, entry.lastPosition);
                    return (
                      <Link
                        key={entry.id}
                        href={`/content/${entry.content.slug}`}
                        className="group shrink-0 w-60 glass rounded-2xl p-3 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 shrink-0">
                            {isVideo ? '🎬' : '📄'}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-600 transition-colors">
                            {entry.content.title}
                          </p>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {progress}% {isVideo ? 'watched' : 'read'}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Heading + filters */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discovery Feed</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Videos and articles, intermingled in one infinite stream.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* type pills */}
                <div className="flex gap-1 p-1 rounded-2xl glass">
                  {TYPE_FILTERS.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setType(t.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                        type === t.value
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow'
                          : 'text-gray-600 dark:text-gray-300 hover:text-purple-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* sort */}
                <div className="flex gap-1 p-1 rounded-2xl glass">
                  {(['trending', 'latest'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`px-3.5 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${
                        sort === s
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow'
                          : 'text-gray-600 dark:text-gray-300 hover:text-purple-600'
                      }`}
                    >
                      {s === 'trending' ? '🔥 Trending' : '🆕 Latest'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <EmptyState
                icon="⚠️"
                title="Feed unavailable"
                text={error}
                action={
                  <button
                    onClick={fetchFirst}
                    className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:shadow-lg hover:shadow-purple-500/30 transition-shadow"
                  >
                    Retry
                  </button>
                }
              />
            )}

            {/* Loading skeletons */}
            {loading && !error && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && items.length === 0 && (
              <EmptyState
                icon="📭"
                title="Nothing here yet"
                text="No content has been published. Seed the database to populate the feed."
              />
            )}

            {/* Feed grid */}
            {!loading && !error && items.length > 0 && (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {items.map((item, i) => (
                    <ContentCard key={item.id} item={item} index={i} />
                  ))}
                </div>

                {/* infinite-scroll sentinel + loaders */}
                <div ref={sentinelRef} className="h-px" />

                {loadingMore && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                )}

                {!hasMore && (
                  <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-10">
                    ✨ You&apos;ve reached the end of the feed.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ---- Shared empty / error state ---- */
function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl py-16 px-6 text-center max-w-md mx-auto mt-6"
      >
        <div className="text-5xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{text}</p>
        {action}
      </motion.div>
    </AnimatePresence>
  );
}
