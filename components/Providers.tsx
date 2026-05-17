'use client';

import { SessionProvider } from 'next-auth/react';

// Makes the NextAuth session available to every client component via useSession().
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
