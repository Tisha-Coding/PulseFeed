'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AuthShell from '@/components/AuthShell';
import AuthField from '@/components/AuthField';
import { signupSchema } from '@/lib/validators';

type Fields = 'name' | 'email' | 'password' | 'confirmPassword';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-dismiss the server error banner after 5s so it doesn't linger.
  useEffect(() => {
    if (!serverError) return;
    const t = setTimeout(() => setServerError(''), 5000);
    return () => clearTimeout(t);
  }, [serverError]);

  const update = (key: Fields) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    // Client-side validation with the shared Zod schema.
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<Fields, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Fields;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      router.push('/auth/login');
    } catch {
      setServerError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join PulseFeed and start your infinite feed"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-purple-600 hover:text-purple-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error shown at the TOP of the form (better UX than at the bottom). */}
        <AnimatePresence>
          {serverError && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400"
            >
              {serverError}
            </motion.p>
          )}
        </AnimatePresence>

        <AuthField
          id="name"
          label="Name"
          type="text"
          value={form.name}
          onChange={update('name')}
          placeholder="Your name"
          error={errors.name}
          autoComplete="name"
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          placeholder="••••••••"
          error={errors.password}
          hint="8+ characters with an uppercase, lowercase, digit & symbol."
          autoComplete="new-password"
        />
        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          placeholder="••••••••"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full rounded-2xl py-3 font-semibold text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-[length:200%_auto] hover:bg-[position:right_center] shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-500 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </motion.button>
      </form>
    </AuthShell>
  );
}
