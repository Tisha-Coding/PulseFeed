'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950 px-4 py-12">
      {/* Purple gradient glow field */}
      <div className="absolute -top-24 left-1/4 w-[28rem] h-[28rem] bg-purple-300/50 dark:bg-purple-700/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-0 right-1/4 w-[24rem] h-[24rem] bg-fuchsia-300/40 dark:bg-fuchsia-700/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.12),transparent_55%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative w-full max-w-md glass rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-purple-500/20 overflow-hidden"
      >
        {/* Animated gradient accent strip along the top edge */}
        <span className="absolute top-0 inset-x-0 h-1 bg-[linear-gradient(90deg,#a855f7,#d946ef,#7e22ce,#d946ef,#a855f7)] bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
        {/* Soft corner glow */}
        <span className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl" />

        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-7">
          <div className="relative w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg text-white bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-700 shadow-lg shadow-purple-500/40">
            P
            <span className="absolute inset-0 rounded-xl bg-purple-400/40 animate-[pulse-ring_2.5s_ease-out_infinite]" />
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">
            Pulse<span className="text-purple-600">Feed</span>
          </span>
        </Link>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        {children}

        <p className="mt-7 text-center text-sm text-gray-600 dark:text-gray-400">{footer}</p>
      </motion.div>
    </main>
  );
}
