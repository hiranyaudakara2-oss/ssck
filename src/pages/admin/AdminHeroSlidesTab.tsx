import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { HeroPhotoShowcase } from '../../components/HeroPhotoShowcase';
import { useData } from '../../context/DataContext';
import type { HeroSlide } from '../../types';
import { AdminActionAlert } from './AdminActionAlert';
import { AdminMediaInput } from './AdminMediaInput';

const MAX_HERO_PHOTOS = 5;

export function AdminHeroSlidesTab() {
  const {
    heroSlides,
    saveHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    restoreDefaultHeroSlides,
  } = useData();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [order, setOrder] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const slotsRemaining = Math.max(0, MAX_HERO_PHOTOS - heroSlides.length);
  const canAddMore = heroSlides.length < MAX_HERO_PHOTOS;

  const resetForm = () => {
    setEditingId(null);
    setImageUrl('');
    setCaption('');
    setSubtitle('');
    setOrder(Math.min(MAX_HERO_PHOTOS, heroSlides.length + 1));
    setShowForm(false);
  };

  const openCreateForm = () => {
    if (!canAddMore) {
      setActionError(
        `All ${MAX_HERO_PHOTOS} photo slots are currently filled. Edit, replace, or delete an existing slide first.`
      );
      return;
    }
    setActionError(null);
    setSavedNotice(null);
    setEditingId(null);
    setImageUrl('');
    setCaption('');
    setSubtitle('');
    setOrder(heroSlides.length + 1);
    setShowForm(true);
  };

  const openEditForm = (slide: HeroSlide, index: number) => {
    setActionError(null);
    setSavedNotice(null);
    setEditingId(slide.id);
    setImageUrl(slide.imageUrl || '');
    setCaption(slide.caption || '');
    setSubtitle(slide.subtitle || '');
    setOrder(slide.order || index + 1);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSavedNotice(null);

    if (!imageUrl.trim()) {
      setActionError('Please upload a photo from your device or paste a valid image URL.');
      return;
    }
    if (caption.trim().length < 2) {
      setActionError('Please enter a custom caption (at least 2 characters).');
      return;
    }

    setSaving(true);
    try {
      await saveHeroSlide({
        id: editingId ?? undefined,
        imageUrl: imageUrl.trim(),
        caption: caption.trim(),
        subtitle: subtitle.trim(),
        order,
      });
      setSavedNotice(
        editingId
          ? 'Photo slide updated and synced live to the homepage.'
          : 'New photo slide published live to the homepage.'
      );
      resetForm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save hero photo slide.');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveSlide = async (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= heroSlides.length || reordering) return;
    setActionError(null);
    setSavedNotice(null);
    setReordering(true);
    try {
      const nextOrder = [...heroSlides];
      const [moved] = nextOrder.splice(index, 1);
      nextOrder.splice(targetIdx, 0, moved);
      await reorderHeroSlides(nextOrder);
      setSavedNotice('Slide display order updated across all visitors.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reorder slides.');
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async (slide: HeroSlide) => {
    setActionError(null);
    setSavedNotice(null);
    try {
      await deleteHeroSlide(slide.id, slide.caption);
      setConfirmDeleteId(null);
      if (editingId === slide.id) {
        resetForm();
      }
      setSavedNotice('Photo slide removed. Slot is now available.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete photo slide.');
    }
  };

  const handleRestoreDefaults = async () => {
    setActionError(null);
    setSavedNotice(null);
    setRestoring(true);
    try {
      await restoreDefaultHeroSlides();
      setConfirmRestore(false);
      resetForm();
      setSavedNotice('Default 5 campus showcase photos restored.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to restore default photos.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Slot Capacity Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Homepage Hero Photo Showcase
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Upload up to {MAX_HERO_PHOTOS} photos with custom text captions. Changes animate and
            synchronize live inside the homepage hero spotlight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-blue-500/30 bg-blue-600/10 px-3.5 py-2 text-xs font-semibold text-blue-200">
            <span className="font-mono">{heroSlides.length}</span> / {MAX_HERO_PHOTOS} Photos Used
            {slotsRemaining > 0 && (
              <span className="ml-2 text-cyan-300">({slotsRemaining} slots free)</span>
            )}
          </div>

          {!confirmRestore ? (
            <button
              type="button"
              onClick={() => setConfirmRestore(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-1.5">
              <span className="text-xs text-amber-200">Restore 5 defaults?</span>
              <button
                type="button"
                disabled={restoring}
                onClick={() => void handleRestoreDefaults()}
                className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {restoring ? 'Restoring...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmRestore(false)}
                className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={!canAddMore}
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Add Photo ({slotsRemaining} left)</span>
          </button>
        </div>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-3 text-xs font-medium text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Upload / Caption Editor Form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-blue-500/30 bg-[#0b1328] p-5 shadow-xl sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <Upload className="h-4 w-4 text-blue-400" />
              <h3 className="font-display text-base font-bold text-white">
                {editingId ? 'Edit Photo & Custom Caption' : 'Upload New Hero Showcase Photo'}
              </h3>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <AdminMediaInput
                label="Showcase Photo (Upload from Device or Paste Image URL)"
                value={imageUrl}
                onChange={setImageUrl}
                folder="hero-slides"
                placeholder="Choose an image from your device or paste https://..."
              />

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Custom Photo Caption *
                  </label>
                  <span className="font-mono text-[11px] text-slate-400">
                    {caption.length}/220
                  </span>
                </div>
                <textarea
                  required
                  minLength={2}
                  maxLength={220}
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Students calibrating autonomous robotics inside the Engineering Lab"
                  className="w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Optional Kicker / Tag Line
                    </label>
                    <span className="font-mono text-[11px] text-slate-400">
                      {subtitle.length}/120
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Engineering Technology · Robotics Bay"
                    className="w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Display Order (1–5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={MAX_HERO_PHOTOS}
                    value={order}
                    onChange={(e) =>
                      setOrder(Math.max(1, Math.min(MAX_HERO_PHOTOS, Number(e.target.value) || 1)))
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {saving
                      ? 'Saving to Cloud...'
                      : editingId
                      ? 'Save Photo Changes'
                      : 'Publish Hero Photo'}
                  </span>
                </button>
              </div>
            </div>

            {/* Live Overlay Preview */}
            <div className="lg:col-span-5">
              <p className="mb-2 text-xs font-medium text-slate-400">Caption Overlay Preview</p>
              <div className="relative h-56 overflow-hidden rounded-xl border border-blue-500/25 bg-[#050914]">
                {imageUrl.trim() ? (
                  <img
                    src={imageUrl.trim()}
                    alt={caption || 'Preview'}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-slate-500">
                    <ImageIcon className="h-8 w-8 opacity-60" />
                    <span className="mt-2 text-xs">Upload a photo to preview</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#040814]/95 via-[#050914]/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  {subtitle.trim() && (
                    <p className="text-[11px] font-medium text-blue-300">{subtitle.trim()}</p>
                  )}
                  <p className="font-display mt-1 text-sm font-semibold text-white">
                    {caption.trim() || 'Your custom photo caption will appear here'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Active Photo Slots Management List */}
      <div className="grid gap-8 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">
              Active Slides ({heroSlides.length} / {MAX_HERO_PHOTOS})
            </h3>
            <p className="text-xs text-slate-400">
              Use arrows to reorder display sequence
            </p>
          </div>

          {heroSlides.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0b1328] p-8 text-center">
              <ImageIcon className="mx-auto h-9 w-9 text-blue-400/75" />
              <h4 className="font-display mt-3 text-base font-semibold text-white">
                No Hero Showcase Photos
              </h4>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-400">
                Upload up to 5 photos with custom captions or restore the default campus slides.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Photo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0b1328] p-4 transition-colors hover:border-blue-500/30 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-600/15 font-mono text-xs font-bold text-blue-200">
                      #{index + 1}
                    </span>
                    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#050914]">
                      <img
                        src={slide.imageUrl}
                        alt={slide.caption}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    {slide.subtitle && (
                      <p className="truncate text-[11px] font-medium text-blue-300">
                        {slide.subtitle}
                      </p>
                    )}
                    <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-white">
                      {slide.caption}
                    </p>
                    <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                      Order {slide.order ?? index + 1} · {slide.imageUrl}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <button
                      type="button"
                      disabled={index === 0 || reordering}
                      onClick={() => void handleMoveSlide(index, -1)}
                      aria-label={`Move photo ${index + 1} earlier`}
                      title="Move earlier"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === heroSlides.length - 1 || reordering}
                      onClick={() => void handleMoveSlide(index, 1)}
                      aria-label={`Move photo ${index + 1} later`}
                      title="Move later"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditForm(slide, index)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-600/15 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-600/25"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit / Replace</span>
                    </button>

                    {confirmDeleteId === slide.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleDelete(slide)}
                          className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(slide.id)}
                        aria-label={`Delete photo ${index + 1}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Homepage Component Preview */}
        <div className="space-y-3 xl:col-span-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">
              Live Homepage Animation Preview
            </h3>
            <span className="text-xs text-cyan-300">Real-Time Sync</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-blue-500/25 bg-[#050914] shadow-xl">
            <HeroPhotoShowcase />
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            This live preview shows the exact animated crossfade, Ken Burns motion, caption
            reveal, and progress controls visitors see on the homepage.
          </p>
        </div>
      </div>
    </div>
  );
}
