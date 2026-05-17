'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Shared top bar for the logged-in app pages (feed, bookmarks).
 * Holds the logo, an optional search slot, the theme toggle and the user menu.
 */
export default function AppHeader({ searchSlot }: { searchSlot?: React.ReactNode }) {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // Close the dropdown on an outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string }
    | undefined;
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 glass border-b border-purple-200/40" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 sm:gap-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-700 shadow-lg shadow-purple-500/40">
            P
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white hidden md:inline">
            Pulse<span className="text-purple-600">Feed</span>
          </span>
        </Link>

        {/* Search slot (or spacer) */}
        {searchSlot ? <div className="flex-1 min-w-0">{searchSlot}</div> : <div className="flex-1" />}

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl glass hover:border-purple-300"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-md shadow-purple-500/30 hover:scale-105 transition-transform"
              >
                {initial}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    className="absolute right-0 mt-2 w-56 glass rounded-2xl p-2 shadow-xl shadow-purple-500/15"
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user.name || 'Your account'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="h-px bg-purple-200/50 dark:bg-purple-900/40 my-1" />

                    <MenuLink href="/feed" icon="🧭" label="Discovery Feed" onClick={() => setMenuOpen(false)} />
                    {/* ===== ADMIN VIEW-ONLY: no bookmarks section for admins ===== */}
                    {user.role !== 'ADMIN' && (
                      <MenuLink href="/bookmarks" icon="🔖" label="My Bookmarks" onClick={() => setMenuOpen(false)} />
                    )}
                    {user.role === 'ADMIN' && (
                      <MenuLink href="/admin" icon="🎛️" label="Admin Console" onClick={() => setMenuOpen(false)} />
                    )}

                    <div className="h-px bg-purple-200/50 dark:bg-purple-900/40 my-1" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <span>↩</span> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-md shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-100/70 dark:hover:bg-purple-900/30 transition-colors"
    >
      <span>{icon}</span> {label}
    </Link>
  );
}
