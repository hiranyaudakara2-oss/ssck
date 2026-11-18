import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Crown,
  Database,
  Edit3,
  Hash,
  Images,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { SafeImage } from '../../components/MotionPrimitives';
import { useData } from '../../context/DataContext';
import { EXECUTIVE_POSITIONS, MEMBER_ARCHIVE_YEARS } from '../../data/seedDefaults';
import type { CommunityDirectoryMember, ExecutivePosition } from '../../types';
import { AdminActionAlert } from './AdminActionAlert';
import { AdminMediaInput } from './AdminMediaInput';

const NON_EXECUTIVE_DEFAULT_POSITIONS: ExecutivePosition[] = ['General Community Member'];

export function AdminCommunityMembersTab() {
  const {
    communityDirectory,
    saveCommunityDirectoryMember,
    deleteCommunityDirectoryMember,
    seedDefaultCommunityDirectory,
  } = useData();

  const [filterMode, setFilterMode] = useState<'all' | 'executive' | 'general'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [editing, setEditing] = useState<Partial<CommunityDirectoryMember> | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const yearSet = new Set<string>(MEMBER_ARCHIVE_YEARS);
    communityDirectory.forEach((m) => {
      if (m.year && m.year.trim()) {
        yearSet.add(m.year.trim());
      }
    });
    return Array.from(yearSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [communityDirectory]);

  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    communityDirectory.forEach((m) => {
      const y = (m.year || '2026').trim();
      counts[y] = (counts[y] || 0) + 1;
    });
    return counts;
  }, [communityDirectory]);

  const sortedMembers = useMemo(
    () => [...communityDirectory].sort((a, b) => (a.order ?? 10) - (b.order ?? 10)),
    [communityDirectory]
  );

  const yearFilteredMembers = useMemo(() => {
    if (selectedYear === 'All') return sortedMembers;
    return sortedMembers.filter((m) => (m.year || '2026') === selectedYear);
  }, [sortedMembers, selectedYear]);

  const filteredMembers = useMemo(() => {
    if (filterMode === 'executive') return yearFilteredMembers.filter((m) => m.isExecutive);
    if (filterMode === 'general') return yearFilteredMembers.filter((m) => !m.isExecutive);
    return yearFilteredMembers;
  }, [yearFilteredMembers, filterMode]);

  const execCount = useMemo(
    () => yearFilteredMembers.filter((m) => m.isExecutive).length,
    [yearFilteredMembers]
  );

  const startNewMember = (defaultExecutive = true) => {
    const nextOrder =
      communityDirectory.length > 0
        ? Math.max(...communityDirectory.map((m) => m.order || 0)) + 1
        : 1;
    setEditing({
      fullName: '',
      position: defaultExecutive ? 'Committee Member' : 'General Community Member',
      year: selectedYear !== 'All' ? selectedYear : '2026',
      bio: '',
      photoUrl: '',
      secondaryPhotoUrl: '',
      memberCode: '',
      isExecutive: defaultExecutive,
      order: nextOrder,
      socialLinks: {},
    });
    setNotice(null);
  };

  const handlePositionChange = (nextPos: ExecutivePosition) => {
    if (!editing) return;
    const isExecRole = !NON_EXECUTIVE_DEFAULT_POSITIONS.includes(nextPos);
    setEditing({
      ...editing,
      position: nextPos,
      isExecutive: isExecRole,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.fullName?.trim() || !editing.bio?.trim()) return;
    setSaving(true);
    setNotice(null);
    setActionError(null);
    try {
      const targetYear = (editing.year || '2026').trim();
      await saveCommunityDirectoryMember({
        id: editing.id,
        fullName: editing.fullName.trim(),
        position: editing.position || 'Committee Member',
        year: targetYear,
        bio: editing.bio.trim(),
        photoUrl: editing.photoUrl || '',
        secondaryPhotoUrl: editing.secondaryPhotoUrl || '',
        memberCode: editing.memberCode || '',
        isExecutive: Boolean(editing.isExecutive),
        order: Number(editing.order ?? 10),
        socialLinks: editing.socialLinks || {},
      });
      setNotice(
        `${editing.fullName.trim()} (${targetYear} · ${editing.position || 'Member'}) saved to Cloud Firestore.`
      );
      setEditing(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save community member.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickFieldUpdate = async (
    member: CommunityDirectoryMember,
    updates: { position?: ExecutivePosition; year?: string }
  ) => {
    setActionError(null);
    const nextPosition = updates.position ?? member.position;
    const nextYear = updates.year ?? (member.year || '2026');
    const isExecRole = updates.position
      ? !NON_EXECUTIVE_DEFAULT_POSITIONS.includes(nextPosition)
      : member.isExecutive;
    try {
      await saveCommunityDirectoryMember({
        id: member.id,
        fullName: member.fullName,
        position: nextPosition,
        year: nextYear,
        bio: member.bio,
        photoUrl: member.photoUrl || '',
        secondaryPhotoUrl: member.secondaryPhotoUrl || '',
        memberCode: member.memberCode || '',
        isExecutive: isExecRole,
        order: member.order ?? 10,
        socialLinks: member.socialLinks || {},
      });
      setNotice(`Updated ${member.fullName} (${nextYear} · ${nextPosition}).`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update member details.');
    }
  };

  const handleDeleteMember = async (id: string, fullName: string) => {
    setActionError(null);
    try {
      await deleteCommunityDirectoryMember(id, fullName);
      setConfirmDeleteId(null);
      setNotice(`Removed ${fullName} from Community Directory.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to remove member.');
    }
  };

  const handleSeedSamples = async () => {
    setSeeding(true);
    setActionError(null);
    try {
      await seedDefaultCommunityDirectory();
      setNotice('Seeded sample Executive Committee & Community Members into Firestore.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to seed community directory.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Manage Community Members & Year Archive
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Organize members by year, upload or replace primary and secondary flip photos, assign positions, and sync live to the public gallery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {communityDirectory.length === 0 && (
            <button
              type="button"
              disabled={seeding}
              onClick={() => void handleSeedSamples()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
            >
              <Database className="h-3.5 w-3.5" />
              <span>{seeding ? 'Seeding...' : 'Seed Sample Committee'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => startNewMember(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add Community Member</span>
          </button>
        </div>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/35 px-4 py-3 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Add / Edit Member Form */}
      {editing && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-cyan-500/35 bg-[#0b1328] p-6"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-display text-base font-semibold text-white">
              {editing.id ? `Edit Member: ${editing.fullName}` : 'Add Community / Executive Member'}
            </h3>
            <span className="text-xs text-cyan-300">
              {editing.year || '2026'} ·{' '}
              {editing.isExecutive ? 'Executive Committee' : 'General Community Member'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={editing.fullName || ''}
                onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                placeholder="e.g., Senura Bandara"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Year</label>
              <select
                value={editing.year || '2026'}
                onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Official Position</label>
              <select
                value={editing.position || 'Committee Member'}
                onChange={(e) => handlePositionChange(e.target.value as ExecutivePosition)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {EXECUTIVE_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Display Order</label>
              <input
                type="number"
                min={0}
                max={10000}
                value={editing.order ?? 1}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Member ID (Optional)
              </label>
              <input
                type="text"
                maxLength={40}
                value={editing.memberCode || ''}
                onChange={(e) => setEditing({ ...editing, memberCode: e.target.value })}
                placeholder="e.g., SSCK-EX-001"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-[#091022] px-3.5 py-2 text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isExecutive)}
                  onChange={(e) => setEditing({ ...editing, isExecutive: e.target.checked })}
                  className="h-4 w-4 rounded accent-cyan-500"
                />
                <span>Executive Committee Member</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Position Description / Biography (Displayed on Flip Reverse Side)
            </label>
            <textarea
              rows={3}
              required
              minLength={2}
              maxLength={1200}
              value={editing.bio || ''}
              onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
              placeholder="Summarize responsibilities, technical track, achievements, or contributions..."
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Two Photographs Upload / Replace Grid */}
          <div className="grid gap-4 rounded-xl border border-cyan-500/20 bg-[#081024] p-4 lg:grid-cols-2">
            <AdminMediaInput
              label="Primary Photograph (Card Front)"
              value={editing.photoUrl || ''}
              onChange={(url) => setEditing({ ...editing, photoUrl: url })}
              folder="community-members-front"
            />
            <AdminMediaInput
              label="Second Photograph (Card Back · Revealed on 3D Flip)"
              value={editing.secondaryPhotoUrl || ''}
              onChange={(url) => setEditing({ ...editing, secondaryPhotoUrl: url })}
              folder="community-members-back"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#080f21] p-4">
            <p className="text-xs font-semibold text-slate-300">Social Media Links (Optional)</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                type="url"
                maxLength={500}
                value={editing.socialLinks?.linkedin || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    socialLinks: { ...editing.socialLinks, linkedin: e.target.value },
                  })
                }
                placeholder="LinkedIn URL"
                className="rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-xs text-white"
              />
              <input
                type="url"
                maxLength={500}
                value={editing.socialLinks?.github || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    socialLinks: { ...editing.socialLinks, github: e.target.value },
                  })
                }
                placeholder="GitHub URL"
                className="rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-xs text-white"
              />
              <input
                type="url"
                maxLength={500}
                value={editing.socialLinks?.twitter || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    socialLinks: { ...editing.socialLinks, twitter: e.target.value },
                  })
                }
                placeholder="Twitter / X URL"
                className="rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-xs text-white"
              />
              <input
                type="url"
                maxLength={500}
                value={editing.socialLinks?.instagram || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    socialLinks: { ...editing.socialLinks, instagram: e.target.value },
                  })
                }
                placeholder="Instagram URL"
                className="rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-xs text-white"
              />
              <input
                type="url"
                maxLength={500}
                value={editing.socialLinks?.website || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    socialLinks: { ...editing.socialLinks, website: e.target.value },
                  })
                }
                placeholder="Portfolio / Website URL"
                className="rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving Member...' : 'Save Member Profile'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Year & Role Filter Bars */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#080f21]/80 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>Year:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear('All')}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                selectedYear === 'All'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Years ({communityDirectory.length})
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  selectedYear === yr
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {yr} ({yearCounts[yr] || 0})
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Changes sync immediately to the public interactive archive.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                filterMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              All ({yearFilteredMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('executive')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                filterMode === 'executive' ? 'bg-cyan-600 text-white' : 'text-slate-300'
              }`}
            >
              Executive Committee ({execCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('general')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                filterMode === 'general' ? 'bg-violet-600 text-white' : 'text-slate-300'
              }`}
            >
              General Members ({yearFilteredMembers.length - execCount})
            </button>
          </div>
        </div>
      </div>

      {/* Member Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0b1328] p-10 text-center">
          <Users className="mx-auto h-9 w-9 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-200">
            {selectedYear === 'All'
              ? 'No directory members found in this filter'
              : `No community members recorded for ${selectedYear}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Click &ldquo;Add Community Member&rdquo; above to add a profile{selectedYear !== 'All' ? ` to ${selectedYear}` : ''}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className={`flex flex-col justify-between rounded-xl border p-4 ${
                member.isExecutive
                  ? 'border-cyan-500/30 bg-[#0b1328]'
                  : 'border-white/10 bg-[#0b1328]'
              }`}
            >
              <div>
                <div className="flex items-start gap-3">
                  {/* Dual Photo Preview Pair */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <SafeImage
                      src={member.photoUrl}
                      alt={`${member.fullName} front`}
                      fallbackLabel={member.fullName}
                      className="h-14 w-14 rounded-xl border border-white/10 bg-[#050914] object-contain p-0.5"
                    />
                    <SafeImage
                      src={member.secondaryPhotoUrl || member.photoUrl}
                      alt={`${member.fullName} back`}
                      fallbackLabel="2nd"
                      className="h-14 w-14 rounded-xl border border-cyan-500/25 bg-[#050914] object-contain p-0.5 opacity-85"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md border border-blue-400/30 bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-200">
                        {member.year || '2026'}
                      </span>
                      {member.isExecutive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                          <Crown className="h-2.5 w-2.5" />
                          Executive
                        </span>
                      )}
                      {member.secondaryPhotoUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300" title="Two photos configured">
                          <Images className="h-3 w-3" />
                        </span>
                      )}
                      {member.memberCode && (
                        <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-blue-300">
                          <Hash className="h-2.5 w-2.5" />
                          {member.memberCode}
                        </span>
                      )}
                    </div>
                    <h4 className="font-display mt-1 truncate text-base font-semibold text-white">
                      {member.fullName}
                    </h4>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-300">
                  {member.bio}
                </p>

                {/* Quick Year & Role Dropdowns */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Year
                    </label>
                    <select
                      value={member.year || '2026'}
                      onChange={(e) =>
                        void handleQuickFieldUpdate(member, { year: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-2 py-1.5 font-mono text-xs font-medium text-blue-200 focus:border-cyan-400 focus:outline-none"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Official Position
                    </label>
                    <select
                      value={member.position}
                      onChange={(e) =>
                        void handleQuickFieldUpdate(member, {
                          position: e.target.value as ExecutivePosition,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-2.5 py-1.5 text-xs font-medium text-cyan-200 focus:border-cyan-400 focus:outline-none"
                    >
                      {EXECUTIVE_POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing({
                      ...member,
                      year: member.year || '2026',
                      secondaryPhotoUrl: member.secondaryPhotoUrl || '',
                    });
                    setNotice(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile & Photos</span>
                </button>

                {confirmDeleteId === member.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDeleteMember(member.id, member.fullName)}
                      className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(member.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
