# PulseFeed

A high-performance, cross-media content hub — a hybrid of **YouTube + Medium** that serves
videos and long-form articles in a single, infinite, instant-feeling stream.

Built with the **T3-style stack**: Next.js · Prisma · PostgreSQL · Tailwind CSS · Zod · NextAuth.

---

## ✨ Features

**Reader experience**
- **Discovery feed** — videos and articles intermingled in one infinite-scrolling stream, filterable by type and sortable by *Trending* / *Latest*.
- **Optimistic engagement** — Like & Bookmark update instantly (React `useOptimistic`) while the database write happens in the background.
- **Continue Watching / Reading** — playback & reading progress is saved to PostgreSQL (debounced) so you resume exactly where you left off.
- **Instant search** — title search backed by a PostgreSQL **GIN trigram** index, fast even with thousands of rows.
- **Skeleton loading states**, fully responsive layout (mobile → ultra-wide), and **system-aware dark mode**.

**Admin experience**
- A dedicated **Content Console** (`/admin`) to create, edit and delete content, manage SEO-friendly slugs, and monitor view / like / bookmark counts. Protected by role-based middleware.

## 🏗 Performance & data-integrity highlights

- **Cursor-based pagination** for infinite scroll (no slow `OFFSET`).
- **Atomic counters** — view / like / bookmark counts move via PostgreSQL `increment`, never a read-modify-write — so simultaneous likes can never lose an update.
- **No N+1 queries** — the feed joins each viewer's engagement in a single query.
- **Idempotent engagement** — `upsert` on a composite unique key; rapid double-clicks never crash the API.
- **Debounced progress tracking** — synced every few seconds of playback / on unmount, not every frame.
- **Zod validation** on every API route; **slug integrity** (slugs only change when explicitly requested).

---

## 🔒 Data integrity — how the like / bookmark counter stays correct

The like and bookmark counters are kept correct under concurrency, which is one
of the assignment's core requirements.

**The problem (a race condition).** Say a post has **10** likes and two users
like it at the same instant. A naive "read-modify-write" handler would have
both requests read `10`, both compute `10 + 1 = 11`, and both save `11` — one
like is silently lost. The count should be **12**.

**How PulseFeed prevents it.** The engagement handler (`services/engagementService.ts`)
never reads-then-writes the counter. For each toggle it:

1. Ensures the user's `Engagement` row exists via `upsert` on the composite
   unique key `[userId, contentId]` — so a rapid double-click can never crash
   the API on a constraint violation (idempotency).
2. Flips the like/bookmark flag with a **conditional `updateMany`** that only
   matches when the value actually changes. Its returned row `count` tells us
   whether a real toggle happened — read straight from that atomic statement,
   never from a stale separate query.
3. Moves the counter **only when a real flip happened**, using PostgreSQL's
   atomic `increment` (`{ likeCount: { increment: ±1 } }`).

Because the database performs the `increment` atomically, two simultaneous
likes each apply their `+1` independently — `10 → 12`, never `11`. And because
the counter only moves when the conditional update truly flipped a row, a
double-click or a duplicate request never double-counts.

**Where to see it.** Live like counts are shown on every feed card and on the
content detail page; the **Admin → Content Console** lists the view, like and
bookmark count for each item, so the maintained counters can be monitored
directly.

---

## 📁 Project structure

```
app/            Next.js routes (pages + API route handlers)
  api/          REST endpoints (content, engagement, bookmarks, progress, search, auth)
  feed/         Discovery feed
  content/      Content detail pages (video & article)
  admin/        Admin content console
  auth/         Login & signup pages
components/     Reusable UI components
lib/            Prisma client, auth config, validators, utils, session helper
services/       Data-access layer (content, engagement, progress, user)
prisma/         schema.prisma, migrations, seed script
```

---

## 🚀 Getting started

### 1. Prerequisites
- Node.js 20+
- A PostgreSQL database — a free [Neon](https://neon.tech) instance works well.

### 2. Install dependencies
```bash
npm install
```

### 3. Environment variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
NEXTAUTH_SECRET="a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
```
> Generate a secret with: `openssl rand -base64 32`

### 4. Run the database migrations
This creates all tables and the GIN/trigram search indexes:
```bash
npx prisma migrate deploy
npx prisma generate
```
> For local schema changes during development, use `npx prisma migrate dev` instead.

### 5. Seed the database (optional but recommended)
Populates content + two demo accounts so the feed isn't empty:
```bash
npm run seed
# inject more rows to stress-test the indexes:
SEED_COUNT=10000 npm run seed
```

### 6. Start the app
```bash
npm run dev
```
Open **http://localhost:3000**.

---

## 🧭 How to use the application

1. **Landing page** (`/`) — overview of the product; toggle light/dark from the header.
2. **Sign up / Log in** (`/auth/signup`, `/auth/login`) — create an account or use a seeded demo account.
3. **Discovery feed** (`/feed`) — scroll the infinite stream, filter by **Videos / Articles**, sort by **Trending / Latest**, or search by title. Like 👍 and bookmark 🔖 any card — the UI reacts instantly.
4. **Content detail** (`/content/[slug]`) — open any card to watch a video or read an article. Progress is saved automatically; come back later and the **Continue Watching/Reading** rail on the feed brings you straight back.
5. **Admin console** (`/admin`) — log in as an admin to create, edit and delete content and monitor view / like / bookmark counts. Non-admins are redirected away.

### Demo accounts (created by the seed script)
| Role  | Email                  | Password       |
|-------|------------------------|----------------|
| Admin | `admin@pulsefeed.com`  | `Password@123` |
| User  | `user@pulsefeed.com`   | `Password@123` |

Admins land on `/admin` after login; regular users land on `/feed`.

---

## 🗄 Database schema

| Model        | Purpose |
|--------------|---------|
| `User`       | Accounts with a `USER` / `ADMIN` role, unique email. |
| `Content`    | Videos & articles — `VIDEO`/`ARTICLE` type, unique slug, view/like/bookmark counts. |
| `Engagement` | Join table for likes & bookmarks — composite unique `[userId, contentId]`. |
| `Progress`   | Per-user `lastPosition` + `isCompleted` for resume support. |

---

## 🛠 Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | Next.js (App Router) |
| Styling    | Tailwind CSS + Framer Motion |
| ORM        | Prisma (with the `@prisma/adapter-pg` driver adapter) |
| Database   | PostgreSQL (Neon) |
| Validation | Zod |
| Auth       | NextAuth (credentials, JWT sessions) |

---

## 📜 Scripts

| Command           | Description |
|-------------------|-------------|
| `npm run dev`     | Start the dev server |
| `npm run build`   | Production build |
| `npm run start`   | Run the production build |
| `npm run lint`    | Lint the project |
| `npm run seed`    | Seed the database with demo content & accounts |
