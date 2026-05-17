'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthShell from '@/components/AuthShell';
import AuthField from '@/components/AuthField';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);

  // Auto-dismiss the error banner after 5s so it doesn't linger forever.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError('Incorrect email or password. Please try again.');
    } else {
      // Admins land on the dashboard, everyone else on the feed.
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      router.push(role === 'ADMIN' ? '/admin' : '/feed');
      router.refresh();
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue your feed where you left off"
      footer={
        <>
          New to PulseFeed?{' '}
          <Link href="/auth/signup" className="font-semibold text-purple-600 hover:text-purple-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error shown at the TOP of the form (better UX than at the bottom). */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div>
          <AuthField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <div className="mt-1.5 text-right">
            <button
              type="button"
              onClick={() => setComingSoon(true)}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Forgot password — coming soon notice */}
        <AnimatePresence>
          {comingSoon && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="flex items-start gap-2.5 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/80 dark:bg-purple-900/20 px-3.5 py-3"
            >
              <span className="text-lg leading-none">🚧</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Password recovery is coming soon!
                </p>
                <p className="text-xs text-purple-600/80 dark:text-purple-400/80">
                  We&apos;re still building this feature. For now, please log in with your
                  existing password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComingSoon(false)}
                className="text-purple-400 hover:text-purple-600 text-sm"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full rounded-2xl py-3 font-semibold text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-[length:200%_auto] hover:bg-[position:right_center] shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-500 disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </motion.button>
      </form>
    </AuthShell>
  );
}
