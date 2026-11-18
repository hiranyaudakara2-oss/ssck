import React, { useState } from 'react';
import {
  Clock,
  Database,
  Edit3,
  ExternalLink,
  Link2,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { SafeImage } from '../../components/MotionPrimitives';
import { useData } from '../../context/DataContext';
import type { CustomLink, CustomLinkIcon, CustomLinkTarget, HistoryMilestone } from '../../types';
import { AdminActionAlert } from './AdminActionAlert';
import { AdminMediaInput } from './AdminMediaInput';

export function HistoryTab() {
  const { historyEvents, saveHistoryMilestone, deleteHistoryMilestone, seedDefaultHistory } =
    useData();
  const [editing, setEditing] = useState<Partial<HistoryMilestone> | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openNew = () => {
    setActionError(null);
    setEditing({
      year: '',
      era: '',
      title: '',
      description: '',
      impactSummary: '',
      imageUrl: '',
      order: historyEvents.length + 1,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.year || editing.year.trim().length < 2) {
      setActionError('Year/Period must be at least 2 characters.');
      return;
    }
    if (!editing.era || editing.era.trim().length < 2) {
      setActionError('Era Label must be at least 2 characters.');
      return;
    }
    if (!editing.title || editing.title.trim().length < 2) {
      setActionError('Milestone Title must be at least 2 characters.');
      return;
    }
    if (!editing.description || editing.description.trim().length < 5) {
      setActionError('Detailed Description must be at least 5 characters.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await saveHistoryMilestone({
        id: editing.id,
        year: editing.year || '',
        era: editing.era || '',
        title: editing.title || '',
        description: editing.description || '',
        impactSummary: editing.impactSummary || '',
        imageUrl: editing.imageUrl || '',
        order: editing.order ?? 1,
      });
      setEditing(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save history milestone.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncDefaults = async () => {
    setSyncing(true);
    setActionError(null);
    try {
      await seedDefaultHistory();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to sync default history eras.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteHistoryMilestone(id, title);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete history milestone.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Technology History Timeline
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Manage historical technological eras, dates, imagery, and descriptions displayed on the History page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={() => void handleSyncDefaults()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <span>{syncing ? 'Syncing...' : 'Sync Default Eras'}</span>
          </button>

          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <h3 className="font-display text-lg font-semibold text-white">
            {editing.id ? `Edit ${editing.title}` : 'Add Historical Milestone'}
          </h3>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-slate-300">Year / Period</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={40}
                value={editing.year || ''}
                onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                placeholder="e.g., 1440"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Era Label</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={editing.era || ''}
                onChange={(e) => setEditing({ ...editing, era: e.target.value })}
                placeholder="e.g., Knowledge Revolution"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Order</label>
              <input
                type="number"
                min={0}
                max={1000}
                value={editing.order ?? 1}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs text-slate-300">Milestone ID</label>
              <input
                type="text"
                disabled
                value={editing.id || 'Auto-generated'}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d1e] px-3 py-2 text-xs text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300">Milestone Title</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={160}
              value={editing.title || ''}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300">Detailed Description</label>
            <textarea
              required
              minLength={5}
              rows={3}
              maxLength={2500}
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300">Historical Impact Summary</label>
            <input
              type="text"
              maxLength={500}
              value={editing.impactSummary || ''}
              onChange={(e) => setEditing({ ...editing, impactSummary: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <AdminMediaInput
            label="Historical Artwork / Image"
            value={editing.imageUrl || ''}
            onChange={(url) => setEditing({ ...editing, imageUrl: url })}
            folder="history"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {saving ? 'Saving...' : 'Save Milestone'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {[...historyEvents]
          .sort((a, b) => a.order - b.order)
          .map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#0b1328] p-5"
            >
              <div className="flex gap-4">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-blue-300">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono font-semibold tabular-nums">{item.year}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate text-slate-400">{item.era}</span>
                  </div>
                  <h3 className="font-display mt-1 text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                <span className="font-mono tabular-nums">Order #{item.order}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id, item.title)}
                    className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-950/50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export function CommunityModerationTab() {
  const { communityPosts, togglePinCommunityPost, deleteCommunityPost } = useData();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handleTogglePin = async (id: string, pinned: boolean, title: string) => {
    setActionError(null);
    try {
      await togglePinCommunityPost(id, pinned, title);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update pin state.');
    }
  };

  const handleDeletePost = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteCommunityPost(id, title);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete community post.');
    }
  };

  const filtered = communityPosts.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Community Moderation</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review member posts, pin featured technical threads, or remove policy-violating posts.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter posts or authors..."
            className="w-full rounded-xl border border-white/15 bg-[#0b1328] py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-8 text-center text-sm text-slate-400">
          No community posts found. Posts created by signed-in members appear here in real time.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#0b1328] p-5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
                  <span className="font-semibold text-white">{post.authorName}</span>
                  <span>({post.authorRole})</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-blue-300">{post.category}</span>
                  {post.pinned && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-amber-300">Pinned</span>
                    </>
                  )}
                </div>
                <h3 className="font-display mt-1.5 text-base font-semibold text-white">
                  {post.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">{post.content}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleTogglePin(post.id, !post.pinned, post.title)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    post.pinned
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                      : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Pin className="h-3.5 w-3.5" />
                  <span>{post.pinned ? 'Unpin' : 'Pin'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeletePost(post.id, post.title)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TARGET_SECTIONS: { id: CustomLinkTarget; label: string }[] = [
  { id: 'home-hero', label: 'Homepage Hero Action Bar' },
  { id: 'home-showcase', label: 'Homepage Featured Showcase' },
  { id: 'subjects', label: 'Subjects Directory' },
  { id: 'downloads', label: 'Downloads & Resources' },
  { id: 'community', label: 'Community Hub' },
  { id: 'history', label: 'History of Technology' },
  { id: 'contact', label: 'Contact Page' },
  { id: 'footer', label: 'Global Website Footer' },
];

const ICON_PRESETS: { id: CustomLinkIcon; label: string }[] = [
  { id: 'globe', label: 'Globe (Web)' },
  { id: 'book', label: 'Book (Guide / Syllabus)' },
  { id: 'code', label: 'Code (Repo / Lab)' },
  { id: 'cpu', label: 'CPU (Hardware / Robotics)' },
  { id: 'video', label: 'Video (Lecture / Demo)' },
  { id: 'file', label: 'File (Document / Form)' },
  { id: 'sparkles', label: 'Sparkles (Featured)' },
  { id: 'external-link', label: 'External Arrow' },
];

export function CustomLinksTab() {
  const { customLinks, saveCustomLink, deleteCustomLink } = useData();
  const [editing, setEditing] = useState<Partial<CustomLink> | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openNew = () => {
    setActionError(null);
    setEditing({
      title: '',
      url: '',
      description: '',
      targetSection: 'home-showcase',
      icon: 'globe',
      attachToElement: '',
      order: customLinks.length + 1,
      isActive: true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setActionError(null);
    try {
      await saveCustomLink({
        id: editing.id,
        title: editing.title || '',
        url: editing.url || '',
        description: editing.description || '',
        targetSection: (editing.targetSection || 'home-showcase') as CustomLinkTarget,
        icon: editing.icon || 'globe',
        attachToElement: editing.attachToElement || '',
        order: editing.order ?? 1,
        isActive: editing.isActive !== false,
      });
      setEditing(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save custom link.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteCustomLink(id, title);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete custom link.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Custom Website Links</h2>
          <p className="mt-1 text-sm text-slate-400">
            Attach curated external or internal links to homepage sections, academic pages, community, or the global footer with animated hover info boxes.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Link</span>
        </button>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <h3 className="font-display text-lg font-semibold text-white">
            {editing.id ? `Edit ${editing.title}` : 'Create Custom Link'}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-300">Link Title</label>
              <input
                type="text"
                required
                maxLength={100}
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="e.g., National Robotics Portal"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300">
                Destination URL (https://... or /route)
              </label>
              <input
                type="text"
                required
                maxLength={1000}
                value={editing.url || ''}
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                placeholder="https://... or /downloads"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Target Website Section</label>
              <select
                value={editing.targetSection || 'home-showcase'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    targetSection: e.target.value as CustomLinkTarget,
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                {TARGET_SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300">Icon</label>
              <select
                value={editing.icon || 'globe'}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                {ICON_PRESETS.map((ic) => (
                  <option key={ic.id} value={ic.id}>
                    {ic.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300">Display Order</label>
              <input
                type="number"
                min={0}
                max={1000}
                value={editing.order ?? 1}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-300">
                Hover Info Box Description (Optional)
              </label>
              <input
                type="text"
                maxLength={240}
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Shown smoothly when hovering over this link"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300">
                Element Context Badge (Optional)
              </label>
              <input
                type="text"
                maxLength={80}
                value={editing.attachToElement || ''}
                onChange={(e) => setEditing({ ...editing, attachToElement: e.target.value })}
                placeholder="e.g., Hero Quick Access, SFT Lab Portal"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={editing.isActive !== false}
              onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-white/20"
            />
            <span>Active & Visible on Public Website</span>
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {saving ? 'Saving...' : 'Save Custom Link'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {customLinks.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-8 text-center text-sm text-slate-400">
          No custom links published yet. Click “Add Custom Link” above to pin links to any section.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[...customLinks]
            .sort((a, b) => a.order - b.order)
            .map((link) => {
              const sectionLabel =
                TARGET_SECTIONS.find((s) => s.id === link.targetSection)?.label || link.targetSection;
              return (
                <div
                  key={link.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#0b1328] p-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-blue-300">
                        <Link2 className="h-3.5 w-3.5" />
                        <span>{sectionLabel}</span>
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          link.isActive
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-slate-700/40 text-slate-400'
                        }`}
                      >
                        {link.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <h3 className="font-display mt-2 text-base font-semibold text-white">
                      {link.title}
                    </h3>
                    <p className="mt-1 truncate font-mono text-xs text-slate-400">{link.url}</p>
                    {link.description && (
                      <p className="mt-2 text-xs text-slate-300">{link.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                    <span className="font-mono tabular-nums">
                      Order #{link.order} {link.attachToElement ? `· ${link.attachToElement}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/10 p-1.5 text-blue-300 hover:bg-white/10"
                        aria-label={`Open ${link.title}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setEditing(link)}
                        className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteLink(link.id, link.title)}
                        className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
