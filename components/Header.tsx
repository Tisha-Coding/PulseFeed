'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import Button from './Button';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Live Demo', href: '#demo' },
];

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string }
    | undefined;
  const isAdmin = user?.role === 'ADMIN';
  const displayName = user?.name || user?.email || 'You';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 glass border-b border-purple-200/40" />

      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.12, rotate: 8 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-700 shadow-lg shadow-purple-500/40"
          >
            P
            <span className="absolute inset-0 rounded-xl bg-purple-400/40 animate-[pulse-ring_2.5s_ease-out_infinite]" />
          </motion.div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">
            Pulse<span className="text-purple-600">Feed</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              whileHover={{ y: -2 }}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {item.label}
            </motion.a>
          ))}
          <Link
            href="/feed"
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            Feed
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.08, rotate: 12 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-lg glass hover:border-purple-300"
          >
            {isDark ? '☀️' : '🌙'}
          </motion.button>

          {/* Auth-aware controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            {status === 'loading' ? (
              <div className="w-20 h-8 rounded-lg skeleton" />
            ) : user ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" href="/admin">
                    Admin
                  </Button>
                )}
                <div className="flex items-center gap-2 pl-1">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-purple-500 to-fuchsia-600"
                    title={displayName}
                  >
                    {initial}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[8rem] truncate">
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 px-2 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" href="/auth/login">
                  Log in
                </Button>
                <Button variant="primary" size="sm" href="/auth/signup">
                  Get Started
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-purple-100/60"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden relative glass border-b border-purple-200/40 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/feed"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
              >
                Feed
              </Link>

              {user ? (
                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Signed in as <strong>{displayName}</strong>
                  </span>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" href="/admin">Admin dashboard</Button>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-left text-sm font-medium text-purple-600"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" size="sm" href="/auth/login">Log in</Button>
                  <Button variant="primary" size="sm" href="/auth/signup">Get Started</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
