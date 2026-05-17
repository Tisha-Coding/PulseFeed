'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

// Makes the NextAuth session available to every client component via
// useSession(). The `session` prop is fetched on the server (see layout.tsx)
// and seeded here, so the first client render already knows the auth state —
// no "logged-out → logged-in" flicker on load/refresh.
export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
