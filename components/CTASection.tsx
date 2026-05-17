'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Button from './Button';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.14 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function CTASection() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const loggedIn = Boolean(session?.user);
  const isAdmin = role === 'ADMIN';

  // ===== ROLE-AWARE CTA =====
  // Logged-out → sign up. Logged-in admin → dashboard. Logged-in user → feed.
  // A logged-in person never sees the "create free account" prompt.
  const cta = isAdmin
    ? {
        heading: 'Manage your content hub',
        accent: 'from one console',
        text: 'Create, update and delete videos and articles, and monitor view counts across the platform.',
        primaryLabel: 'Open admin dashboard',
        primaryHref: '/admin',
      }
    : loggedIn
      ? {
          heading: 'Your feed is',
          accent: 'waiting for you',
          text: 'Jump back into the infinite stream of videos and articles — right where you left off.',
          primaryLabel: 'Go to your feed →',
          primaryHref: '/feed',
        }
      : {
          heading: 'Start your feed in',
          accent: 'one click',
          text: 'Create an account and step into an infinite stream of video and articles — tuned to feel instant from the very first scroll.',
          primaryLabel: 'Create free account →',
          primaryHref: '/auth/signup',
        };
  // ==========================

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white dark:bg-gray-950">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-purple-300/40 dark:bg-purple-700/20 rounded-full blur-3xl animate-blob" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="glass rounded-3xl px-8 py-14 md:py-16 text-center shadow-2xl shadow-purple-500/15">
          <motion.div
            variants={item}
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-700 shadow-lg shadow-purple-500/40"
          >
            P
          </motion.div>

          <motion.h2 variants={item} className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            {cta.heading}{' '}
            <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-transparent bg-clip-text">
              {cta.accent}
            </span>
          </motion.h2>

          <motion.p variants={item} className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            {cta.text}
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col sm:flex-row gap-3.5 justify-center">
            <Button variant="primary" size="lg" href={cta.primaryHref}>
              {cta.primaryLabel}
            </Button>
            <Button variant="secondary" size="lg" href="#features">
              Explore features
            </Button>
          </motion.div>

          {!loggedIn && (
            <motion.p variants={item} className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Free to start · No credit card · Admins manage content from a dedicated console
            </motion.p>
          )}
        </div>
      </motion.div>
    </section>
  );
}
