import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import "./globals.css";
import Providers from "@/components/Providers";
import { authOptions } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PulseFeed — One instant feed for video & articles",
  description:
    "A cross-media content hub that blends videos and long-form articles into a single infinite stream — built to feel instant.",
};

// Applies the theme before first paint to avoid a flash.
// Uses the saved choice, otherwise falls back to the OS (system-level) setting.
const themeScript = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the session on the server so <SessionProvider> starts already
  // authenticated — avoids the brief logged-out flash on the client.
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* suppressHydrationWarning: browser extensions (password managers,
          Grammarly, etc.) inject attributes into <body> before React loads —
          this stops those harmless injections from throwing hydration errors. */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
