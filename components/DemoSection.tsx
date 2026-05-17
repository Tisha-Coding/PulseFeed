'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

type Item = {
  id: number;
  type: 'video' | 'article';
  title: string;
  meta: string;
  baseLikes: number;
};

const initialFeed: Item[] = [
  { id: 1, type: 'video', title: 'React Performance Optimization', meta: '12:45', baseLikes: 1240 },
  { id: 2, type: 'article', title: 'Building Scalable APIs with Node.js', meta: '8 min read', baseLikes: 870 },
  { id: 3, type: 'video', title: 'PostgreSQL Indexing Strategies', meta: '18:20', baseLikes: 612 },
];

export default function DemoSection() {
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});
  const [synced, setSynced] = useState<Record<number, boolean>>({});

  // Optimistic UI: flip state instantly, then "confirm" with the DB after a beat.
  const optimistic = (
    id: number,
    setter: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
  ) => {
    setter((prev) => ({ ...prev, [id]: !prev[id] }));
    setSynced((prev) => ({ ...prev, [id]: false }));
    setTimeout(() => setSynced((prev) => ({ ...prev, [id]: true })), 650);
  };

  return (
    <section id="demo" className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-white via-purple-50/60 to-white dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
      <div className="absolute top-1/3 -right-10 w-96 h-96 bg-fuchsia-300/40 dark:bg-fuchsia-800/15 rounded-full blur-3xl animate-blob animation-delay-2000" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold tracking-wide text-purple-600 uppercase">
            Try it yourself
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Feel the optimistic UI
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Tap a heart or bookmark. The interface reacts instantly — then a quiet badge
            confirms the database caught up.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="space-y-3"
        >
          {initialFeed.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, x: -24 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.45 } },
              }}
              whileHover={{ x: 5 }}
              className="group glass rounded-2xl p-5 flex items-center gap-4 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0 bg-gradient-to-br from-purple-500 to-fuchsia-600">
                {item.type === 'video' ? '▶' : '✎'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-wider text-purple-500">
                  {item.type.toUpperCase()}
                </p>
                <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-600 transition-colors">
                  {item.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.meta} · {(item.baseLikes + (likes[item.id] ? 1 : 0)).toLocaleString()} likes
                </p>
              </div>

              {/* Sync confirmation badge */}
              <AnimatePresence>
                {(likes[item.id] || bookmarks[item.id]) && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className={`hidden sm:inline text-[10px] font-semibold px-2 py-1 rounded-md ${
                      synced[item.id]
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    }`}
                  >
                    {synced[item.id] ? '✓ synced' : '⟳ saving'}
                  </motion.span>
                )}
              </AnimatePresence>

              <div className="flex gap-1.5 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => optimistic(item.id, setLikes)}
                  aria-label="Like"
                  className={`p-2.5 rounded-xl text-lg transition-colors ${
                    likes[item.id]
                      ? 'bg-red-50 dark:bg-red-950/40'
                      : 'hover:bg-red-50 dark:hover:bg-red-950/30'
                  }`}
                >
                  {likes[item.id] ? '❤️' : '🤍'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => optimistic(item.id, setBookmarks)}
                  aria-label="Bookmark"
                  className={`p-2.5 rounded-xl text-lg transition-colors ${
                    bookmarks[item.id]
                      ? 'bg-purple-100 dark:bg-purple-950/40 grayscale-0'
                      : 'grayscale opacity-60 hover:opacity-100 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                  }`}
                >
                  🔖
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Continue reading progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-4 glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ⏯️ Continue: “Designing an infinite feed”
            </span>
            <span className="text-xs font-semibold text-purple-600">62%</span>
          </div>
          <div className="h-2 rounded-full bg-purple-100 dark:bg-purple-900/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '62%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Progress is debounced — saved every few seconds of playback, never on every frame.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
