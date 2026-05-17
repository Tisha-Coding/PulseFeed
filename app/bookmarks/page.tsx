'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import AppHeader from '@/components/AppHeader';
import ContentCard, { ContentItem } from '@/components/ContentCard';

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 w-4/5 rounded skeleton" />
        <div className="h-3 w-2/3 rounded skeleton" />
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  const { status } = useSession();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    setLoading(true);
    fetch('/api/bookmarks')
      .then((r) => r.json())
      .then((j) => active && setItems(j.success ? j.data : []))
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status]);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="fixed top-0 right-1/4 w-[30rem] h-[30rem] bg-purple-300/25 dark:bg-purple-800/15 rounded-full blur-3xl pointer-events-none" />
      <AppHeader />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔖 My Bookmarks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Everything you&apos;ve saved to revisit later.
          </p>
        </div>

        {/* Not logged in */}
        {status === 'unauthenticated' ? (
          <EmptyState
            icon="🔒"
            title="Log in to see your bookmarks"
            text="Bookmarks are tied to your account."
            action={
              <Link
                href="/auth/login"
                className="inline-block mt-4 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:shadow-lg hover:shadow-purple-500/30 transition-shadow"
              >
                Log in
              </Link>
            }
          />
        ) : loading || status === 'loading' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No bookmarks yet"
            text="Tap the 🔖 on any video or article and it will show up here."
            action={
              <Link
                href="/feed"
                className="inline-block mt-4 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:shadow-lg hover:shadow-purple-500/30 transition-shadow"
              >
                Browse the feed
              </Link>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item, i) => (
              <ContentCard
                key={item.id}
                item={item}
                index={i}
                onUnbookmark={(id) =>
                  setItems((prev) => prev.filter((it) => it.id !== id))
                }
                onUnbookmarkError={(restored) =>
                  setItems((prev) =>
                    prev.some((it) => it.id === restored.id)
                      ? prev
                      : [restored, ...prev],
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

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
  );
}
