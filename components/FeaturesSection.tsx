'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: '🧭',
    title: 'Personalized Discovery Feed',
    description:
      'Videos and articles intermingled in one infinite stream. Filter by content type or sort by what is trending right now.',
  },
  {
    icon: '💜',
    title: 'Like & Bookmark, Instantly',
    description:
      'Optimistic UI updates the moment you tap — the heart fills before the database even replies. Tap twice and nothing breaks.',
  },
  {
    icon: '⏯️',
    title: 'Continue Watching & Reading',
    description:
      'Leave mid-video or mid-article and return to your exact spot. Progress is tracked quietly in the background.',
  },
  {
    icon: '🔍',
    title: 'Seamless Title Search',
    description:
      'A search bar that stays instant whether the library holds ten entries or ten thousand. Results land as you type.',
  },
  {
    icon: '🎛️',
    title: 'Admin Content Console',
    description:
      'Create, update and delete content, manage SEO-friendly slugs, and monitor view counts across the whole platform.',
  },
  {
    icon: '🌗',
    title: 'Adaptive, Responsive UI',
    description:
      'A Tailwind layout that flows from phone to ultra-wide, system-aware dark mode, and skeleton screens while content loads.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32 overflow-hidden bg-white dark:bg-gray-950">
      <div className="absolute top-10 left-0 w-96 h-96 bg-purple-200/40 dark:bg-purple-800/15 rounded-full blur-3xl animate-blob" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <span className="text-sm font-semibold tracking-wide text-purple-600 uppercase">
            What you get
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Everything in{' '}
            <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-transparent bg-clip-text">
              one stream
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            A cross-media hub that fuses the best of video and long-form reading — without the wait.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="group relative glass rounded-2xl p-7 overflow-hidden hover:border-purple-400/70 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
            >
              {/* gradient sheen that sweeps in on hover */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_60%)]" />
              {/* accent line that grows along the top edge */}
              <span className="absolute top-0 left-0 h-[3px] w-0 group-hover:w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500 rounded-full" />

              {/* faint index number */}
              <span className="absolute top-5 right-6 text-5xl font-bold text-purple-500/10 dark:text-purple-400/10 group-hover:text-purple-500/20 transition-colors select-none">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="relative">
                <div className="relative w-14 h-14">
                  {/* glowing ring behind the icon */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-300" />
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/50 dark:to-fuchsia-900/40 ring-1 ring-purple-300/40 dark:ring-purple-700/40 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                    {f.icon}
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">{f.description}</p>

                {/* arrow reveal on hover */}
                <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-purple-600 dark:text-purple-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Learn more
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
