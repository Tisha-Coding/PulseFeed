'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const footerSections = [
  {
    title: 'Explore',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Live Demo', href: '#demo' },
      { label: 'Discovery Feed', href: '/feed' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Discovery Feed', href: '/feed' },
      { label: 'Admin Console', href: '/admin' },
      { label: 'Sign up', href: '/auth/signup' },
    ],
  },
  {
    title: 'Built with',
    links: [
      { label: 'Next.js', href: '#' },
      { label: 'Prisma + PostgreSQL', href: '#' },
      { label: 'Tailwind CSS', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-white to-purple-50 dark:from-gray-950 dark:to-purple-950/30 border-t border-purple-200/50 dark:border-purple-900/40">
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[30rem] h-60 bg-purple-300/30 dark:bg-purple-700/15 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-700 shadow-lg shadow-purple-500/40">
                P
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                Pulse<span className="text-purple-600">Feed</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              A cross-media content hub for video and long-form articles — built to feel instant.
            </p>
          </motion.div>

          {footerSections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <motion.span whileHover={{ x: 3 }} className="inline-block">
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </motion.span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-purple-200/50 dark:border-purple-900/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            &copy; 2026 PulseFeed. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <motion.a whileHover={{ y: -2 }} href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
              Privacy
            </motion.a>
            <motion.a whileHover={{ y: -2 }} href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
              Terms
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
}
