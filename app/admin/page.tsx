'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminContent {
  id: number;
  title: string;
  slug: string;
  type: 'VIDEO' | 'ARTICLE';
  description?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  articleBody?: string | null;
  duration?: number | null;
  readTime?: number | null;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
}

type FormState = {
  title: string;
  type: 'VIDEO' | 'ARTICLE';
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  articleBody: string;
  duration: string;
  readTime: string;
  regenerateSlug: boolean;
};

const EMPTY_FORM: FormState = {
  title: '',
  type: 'VIDEO',
  description: '',
  thumbnailUrl: '',
  videoUrl: '',
  articleBody: '',
  duration: '',
  readTime: '',
  regenerateSlug: false,
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export default function AdminDashboard() {
  const [items, setItems] = useState<AdminContent[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminContent | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<AdminContent | null>(null);
  const [deleteError, setDeleteError] = useState('');

  /* ---- Load content ---- */
  const load = useCallback(async (reset: boolean, currentCursor?: number | null) => {
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const p = new URLSearchParams({ limit: '20', sort: 'latest' });
      if (!reset && currentCursor) p.set('cursor', String(currentCursor));
      const res = await fetch(`/api/content?${p}`);
      const json = await res.json();
      if (json.success) {
        setItems((prev) => (reset ? json.data : [...prev, ...json.data]));
        setCursor(json.pagination.nextCursor);
        setHasMore(json.pagination.hasMore);
      }
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  /* ---- Open form ---- */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (c: AdminContent) => {
    setEditing(c);
    setForm({
      title: c.title,
      type: c.type,
      description: c.description ?? '',
      thumbnailUrl: c.thumbnailUrl ?? '',
      videoUrl: c.videoUrl ?? '',
      articleBody: c.articleBody ?? '',
      duration: c.duration ? String(c.duration) : '',
      readTime: c.readTime ? String(c.readTime) : '',
      regenerateSlug: false,
    });
    setFormError('');
    setModalOpen(true);
  };

  /* ---- Save (create or update) ---- */
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const isVideo = form.type === 'VIDEO';

    // Required-field validation. Only the title is required for both types;
    // video/article-specific fields are required only for their own type.
    // Description and thumbnail stay optional.
    if (form.title.trim().length < 3) {
      setFormError('Title must be at least 3 characters.');
      return;
    }
    if (isVideo) {
      if (!form.videoUrl.trim()) {
        setFormError('Video URL is required for a video.');
        return;
      }
      if (!(Number(form.duration) > 0)) {
        setFormError('Duration (in seconds) is required for a video.');
        return;
      }
    } else {
      if (!form.articleBody.trim()) {
        setFormError('Article body is required for an article.');
        return;
      }
      if (!(Number(form.readTime) > 0)) {
        setFormError('Read time (in minutes) is required for an article.');
        return;
      }
    }
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      type: form.type,
      description: form.description || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      videoUrl: isVideo ? form.videoUrl || undefined : undefined,
      articleBody: isVideo ? undefined : form.articleBody || undefined,
      duration: isVideo && form.duration ? Number(form.duration) : undefined,
      readTime: !isVideo && form.readTime ? Number(form.readTime) : undefined,
    };

    setSaving(true);
    try {
      let res: Response;
      if (editing) {
        res = await fetch(`/api/content/${editing.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, regenerateSlug: form.regenerateSlug }),
        });
      } else {
        res = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(
          res.status === 403
            ? 'Admin access required. Log in as an admin.'
            : json.error ?? 'Could not save. Check the fields and try again.',
        );
        return;
      }
      setModalOpen(false);
      load(true);
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete (optimistic) ----
     The row vanishes and the modal closes the instant the admin confirms, so
     the slow DB round-trip never feels like a frozen UI. If the request fails
     the row is restored to its original position and an error is shown. */
  const doDelete = () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    const index = items.findIndex((i) => i.id === target.id);

    // Optimistic: close the modal + drop the row immediately.
    setConfirmDelete(null);
    setDeleteError('');
    setItems((prev) => prev.filter((i) => i.id !== target.id));

    // Fire the delete in the background; revert if it fails.
    fetch(`/api/content/${target.slug}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error();
      })
      .catch(() => {
        setItems((prev) => {
          if (prev.some((i) => i.id === target.id)) return prev; // already back
          const next = [...prev];
          next.splice(Math.max(0, index), 0, target); // restore in place
          return next;
        });
        setDeleteError(
          `Could not delete “${target.title}”. It has been restored — please try again.`,
        );
      });
  };

  /* ---- Stats (from loaded rows) ---- */
  const videos = items.filter((i) => i.type === 'VIDEO').length;
  const articles = items.length - videos;
  const totalViews = items.reduce((s, i) => s + i.viewCount, 0);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="fixed top-0 left-1/4 w-[30rem] h-[30rem] bg-purple-300/25 dark:bg-purple-800/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <header className="sticky top-0 z-40">
        <div className="absolute inset-0 glass border-b border-purple-200/40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-700">
              P
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              Pulse<span className="text-purple-600">Feed</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                Admin
              </span>
            </span>
          </Link>
          <Link
            href="/feed"
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
          >
            View feed →
          </Link>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Console</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create, edit, delete content and monitor view counts.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="px-5 py-2.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow"
          >
            + New content
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Loaded items', value: items.length, icon: '📚' },
            { label: 'Videos', value: videos, icon: '🎬' },
            { label: 'Articles', value: articles, icon: '📄' },
            { label: 'Total views', value: formatCount(totalViews), icon: '👁' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Delete-failed banner (optimistic delete reverted) */}
        {deleteError && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3">
            <span className="text-lg leading-none">⚠️</span>
            <p className="flex-1 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
            <button
              onClick={() => setDeleteError('')}
              aria-label="Dismiss"
              className="text-red-400 hover:text-red-600 text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content rows */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl h-20 skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-600 dark:text-gray-400">
              No content yet. Click “New content” to add the first item.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-4 flex items-center gap-4"
              >
                <span
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    c.type === 'VIDEO' ? 'bg-purple-600' : 'bg-fuchsia-600'
                  }`}
                >
                  {c.type === 'VIDEO' ? '🎬' : '📄'}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{c.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">/{c.slug}</p>
                </div>

                {/* Per-content engagement counters — view / like / bookmark.
                    Lets an admin monitor the atomically-maintained counts. */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      👁 {formatCount(c.viewCount)}
                    </p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      👍 {formatCount(c.likeCount)}
                    </p>
                    <p className="text-xs text-gray-400">likes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      🔖 {formatCount(c.bookmarkCount)}
                    </p>
                    <p className="text-xs text-gray-400">saves</p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/content/${c.slug}`}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium glass hover:border-purple-300 text-gray-700 dark:text-gray-300"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => openEdit(c)}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}

            {hasMore && (
              <div className="text-center pt-3">
                <button
                  onClick={() => load(false, cursor)}
                  disabled={loadingMore}
                  className="px-5 py-2 rounded-2xl text-sm font-semibold glass hover:border-purple-300 text-gray-700 dark:text-gray-300 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Create / Edit modal ---- */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="themed-scroll glass rounded-[2rem] w-full max-w-lg max-h-[88vh] overflow-y-auto p-6 sm:p-8 shadow-2xl shadow-purple-500/20"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                {editing ? 'Edit content' : 'Create new content'}
              </h2>

              <form onSubmit={save} className="space-y-3.5">
                <Field label="Title">
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="A clear, descriptive title"
                    className={inputCls}
                  />
                </Field>

                <Field label="Type">
                  <div className="flex gap-2">
                    {(['VIDEO', 'ARTICLE'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                          form.type === t
                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                            : 'glass text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {t === 'VIDEO' ? '🎬 Video' : '📄 Article'}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Short summary shown on feed cards"
                    className={inputCls}
                  />
                </Field>

                <Field label="Thumbnail URL">
                  <input
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                    placeholder="https://…"
                    className={inputCls}
                  />
                </Field>

                {form.type === 'VIDEO' ? (
                  <>
                    {/* ===== EDIT LOCK: Video URL & duration are fixed once
                         created — changing them would break viewers' saved
                         progress. Editable only while creating. ===== */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Video URL">
                        <input
                          value={form.videoUrl}
                          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                          placeholder="https://…"
                          disabled={Boolean(editing)}
                          className={`${inputCls} ${
                            editing ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        />
                      </Field>
                      <Field label="Duration (seconds)">
                        <input
                          type="number"
                          value={form.duration}
                          onChange={(e) => setForm({ ...form, duration: e.target.value })}
                          placeholder="600"
                          disabled={Boolean(editing)}
                          className={`${inputCls} ${
                            editing ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        />
                      </Field>
                    </div>
                    {editing && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        🔒 Video URL &amp; duration can&apos;t be changed. To use a different
                        video, delete this item and create new content.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Field label="Article body">
                      <textarea
                        value={form.articleBody}
                        onChange={(e) => setForm({ ...form, articleBody: e.target.value })}
                        rows={4}
                        placeholder="Full article text…"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Read time (minutes)">
                      <input
                        type="number"
                        value={form.readTime}
                        onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                        placeholder="6"
                        className={inputCls}
                      />
                    </Field>
                  </>
                )}

                {/* Slug integrity control */}
                {editing && (
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={form.regenerateSlug}
                      onChange={(e) => setForm({ ...form, regenerateSlug: e.target.checked })}
                      className="accent-purple-600 w-4 h-4"
                    />
                    Regenerate slug from title (off keeps existing links intact)
                  </label>
                )}

                {formError && (
                  <p className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
                    {formError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-semibold glass text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/30 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editing ? 'Save changes' : 'Create content'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Delete confirmation ---- */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-[2rem] w-full max-w-sm p-6 text-center shadow-2xl shadow-purple-500/20"
            >
              <div className="text-4xl mb-2">🗑️</div>
              <h3 className="font-bold text-gray-900 dark:text-white">Delete this content?</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                “{confirmDelete.title}” will be permanently removed.
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold glass text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={doDelete}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

const inputCls =
  'w-full rounded-xl bg-white/80 dark:bg-white/5 border border-purple-200/80 dark:border-purple-900/50 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all focus:ring-4 focus:ring-purple-500/15 focus:border-purple-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
