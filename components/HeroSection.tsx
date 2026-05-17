'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Button from './Button';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function HeroSection() {
  const { status } = useSession();
  // Logged in → straight to the feed; otherwise → sign up.
  const exploreHref = status === 'authenticated' ? '/feed' : '/auth/signup';

  return (
    <section id="home" className="relative overflow-hidden bg-white dark:bg-gray-950 pt-20 pb-24 md:pt-28 md:pb-32">
      {/* Purple gradient glow field */}
      <div className="absolute -top-20 left-1/4 w-[28rem] h-[28rem] bg-purple-300/50 dark:bg-purple-700/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-40 right-0 w-[24rem] h-[24rem] bg-fuchsia-300/40 dark:bg-fuchsia-700/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(168,85,247,0.12),transparent_55%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
        {/* Left: copy */}
        <motion.div variants={container} initial="hidden" animate="visible" className="space-y-7">
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-semibold text-purple-700 dark:text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              One feed for video & long-form articles
            </span>
          </motion.div>

          <motion.h1 variants={item} className="text-5xl md:text-6xl font-bold leading-[1.08] text-gray-900 dark:text-white">
            The content hub that feels{' '}
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-500 text-transparent bg-clip-text">
              instant.
            </span>
          </motion.h1>

          <motion.p variants={item} className="text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
            PulseFeed blends videos and articles into a single infinite stream. Like and bookmark
            with zero wait, and pick up watching or reading exactly where you left off.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3.5">
            <Button variant="primary" size="lg" href={exploreHref}>
              Start exploring →
            </Button>
            <Button variant="secondary" size="lg" href="#demo">
              Try the live demo
            </Button>
          </motion.div>

          <motion.div variants={item} className="flex items-center gap-6 pt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">✦ Optimistic UI</span>
            <span className="flex items-center gap-1.5">✦ Sub-10ms search</span>
            <span className="flex items-center gap-1.5">✦ Built to scale</span>
          </motion.div>
        </motion.div>

        {/* Right: glass feed preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateY: -12 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
          className="relative"
          style={{ perspective: 1000 }}
        >
          <div className="glass rounded-3xl p-5 shadow-2xl shadow-purple-500/20 animate-float">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Your Discovery Feed</span>
              <span className="text-xs px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                Trending
              </span>
            </div>

            <div className="space-y-3">
              {[
                { icon: '▶', label: 'VIDEO', title: 'Scaling Postgres to 10M rows', meta: '14:02 · 60% watched' },
                { icon: '✎', label: 'ARTICLE', title: 'Why cursor pagination wins', meta: '7 min read · bookmarked' },
                { icon: '▶', label: 'VIDEO', title: 'Designing an infinite feed', meta: '09:30 · new' },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-purple-100 dark:border-purple-900/40"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br from-purple-500 to-fuchsia-600 text-sm">
                    {c.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold tracking-wider text-purple-500">{c.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.meta}</p>
                  </div>
                  <span className="text-purple-400">{i === 1 ? '🔖' : '🤍'}</span>
                </motion.div>
              ))}

              {/* Skeleton row — perceived performance */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-100 dark:border-purple-900/40">
                <div className="w-10 h-10 rounded-lg skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-1/3 rounded skeleton" />
                  <div className="h-2.5 w-2/3 rounded skeleton" />
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">Loading more as you scroll…</p>
          </div>

          {/* floating badge */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -left-5 -bottom-5 glass rounded-2xl px-4 py-3 shadow-xl"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">Like registered in</p>
            <p className="text-lg font-bold text-purple-600">~0 ms</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
