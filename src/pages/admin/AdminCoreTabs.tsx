import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Edit3,
  FileText,
  FolderOpen,
  Link2,
  Plus,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import {
  FullScreenOverlay,
  OverlayActionButton,
  OverlayPanel,
  OverlayStagger,
} from '../../components/FullScreenOverlay';
import { SectionEmptyState } from '../../components/SectionEmptyState';
import { useData } from '../../context/DataContext';
import type { Announcement, SiteSocialLinks, Subject } from '../../types';
import { AdminActionAlert } from './AdminActionAlert';
import { AdminMediaInput } from './AdminMediaInput';

const SOCIAL_PLATFORM_OPTIONS: {
  key: keyof SiteSocialLinks;
  label: string;
  placeholder: string;
}[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/sscktech' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/sscktech' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@sscktech' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@sscktech' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/94771234567 or channel link' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/sscktech' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/sscktech' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/sscktech' },
  { key: 'website', label: 'Website', placeholder: 'https://sscktech.lk' },
];

export function OverviewTab() {
  const {
    siteSettings,
    registeredMembersCount,
    downloads,
    gallery,
    events,
    achievements,
    projects,
    subjects,
    adminLogs,
  } = useData();

  const totalResources = downloads.length + gallery.length;

  const distribution = [
    { label: 'Subjects', count: subjects.length, color: 'bg-blue-500' },
    { label: 'Resources', count: totalResources, color: 'bg-sky-400' },
    { label: 'Projects', count: projects.length, color: 'bg-violet-500' },
    { label: 'Events', count: events.length, color: 'bg-indigo-400' },
    { label: 'Awards', count: achievements.length, color: 'bg-emerald-400' },
  ];
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Dashboard Analytics</h2>
        <p className="mt-1 text-sm text-slate-400">
          Real-time metrics across public academic collections, registered Community Members, and administrative logs.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Visitors</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-white">
            {(siteSettings.statsVisitors ?? 18420).toLocaleString('en-US')}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Community Members</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-white">
            {registeredMembersCount}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Uploaded Resources</span>
            <FolderOpen className="h-4 w-4 text-violet-400" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-white">
            {totalResources}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Events</span>
            <Calendar className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-white">
            {events.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Achievements</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-white">
            {achievements.length}
          </p>
        </div>
      </div>

      {/* Distribution & Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-6 lg:col-span-5">
          <h3 className="font-display text-base font-semibold text-white">
            Content Inventory Breakdown
          </h3>
          <div className="mt-6 space-y-4">
            {distribution.map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{row.label}</span>
                  <span className="font-mono tabular-nums text-slate-200">{row.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${Math.round((row.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1328] p-6 lg:col-span-7">
          <h3 className="font-display text-base font-semibold text-white">
            Recent Administrative Activities
          </h3>
          {adminLogs.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              No administrative actions logged yet. Updates you make in this dashboard appear here automatically.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 pr-3 font-medium">Action</th>
                    <th className="py-2.5 pr-3 font-medium">Target</th>
                    <th className="py-2.5 pr-3 font-medium">Administrator</th>
                    <th className="py-2.5 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {adminLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-3 font-medium text-blue-300">{log.action}</td>
                      <td className="py-2.5 pr-3 text-slate-200">{log.targetTitle}</td>
                      <td className="py-2.5 pr-3 text-slate-400">{log.adminName}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-400">
                        {log.createdAt?.toDate
                          ? log.createdAt.toDate().toLocaleDateString()
                          : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsTab() {
  const { siteSettings, saveSiteSettings, user, isAdmin, signInWithGoogle } = useData();
  const [form, setForm] = useState({
    siteTitle: siteSettings.siteTitle,
    tagline: siteSettings.tagline,
    heroTitle: siteSettings.heroTitle,
    heroSubtitle: siteSettings.heroSubtitle,
    heroBannerUrl: siteSettings.heroBannerUrl || '',
    logoUrl: siteSettings.logoUrl || '',
    aboutMission: siteSettings.aboutMission,
    aboutVision: siteSettings.aboutVision,
    footerAddress: siteSettings.footerAddress || '',
    footerEmail: siteSettings.footerEmail || '',
    footerPhone: siteSettings.footerPhone || '',
    footerCopyright: siteSettings.footerCopyright || '',
    statsStudents: siteSettings.statsStudents ?? 640,
    statsProjects: siteSettings.statsProjects ?? 128,
    statsAwards: siteSettings.statsAwards ?? 42,
    statsPassRate: siteSettings.statsPassRate ?? 98.4,
    statsVisitors: siteSettings.statsVisitors ?? 18420,
    maintenanceMode: siteSettings.maintenanceMode ?? false,
    maintenanceAnnouncement: siteSettings.maintenanceAnnouncement || '',
    maintenanceExpectedTime: siteSettings.maintenanceExpectedTime || '',
    socialLinks: (siteSettings.socialLinks || {}) as SiteSocialLinks,
  });
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingMaintenanceToggle, setPendingMaintenanceToggle] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState<keyof SiteSocialLinks>('facebook');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  useEffect(() => {
    setForm({
      siteTitle: siteSettings.siteTitle,
      tagline: siteSettings.tagline,
      heroTitle: siteSettings.heroTitle,
      heroSubtitle: siteSettings.heroSubtitle,
      heroBannerUrl: siteSettings.heroBannerUrl || '',
      logoUrl: siteSettings.logoUrl || '',
      aboutMission: siteSettings.aboutMission,
      aboutVision: siteSettings.aboutVision,
      footerAddress: siteSettings.footerAddress || '',
      footerEmail: siteSettings.footerEmail || '',
      footerPhone: siteSettings.footerPhone || '',
      footerCopyright: siteSettings.footerCopyright || '',
      statsStudents: siteSettings.statsStudents ?? 640,
      statsProjects: siteSettings.statsProjects ?? 128,
      statsAwards: siteSettings.statsAwards ?? 42,
      statsPassRate: siteSettings.statsPassRate ?? 98.4,
      statsVisitors: siteSettings.statsVisitors ?? 18420,
      maintenanceMode: siteSettings.maintenanceMode ?? false,
      maintenanceAnnouncement: siteSettings.maintenanceAnnouncement || '',
      maintenanceExpectedTime: siteSettings.maintenanceExpectedTime || '',
      socialLinks: siteSettings.socialLinks || {},
    });
  }, [siteSettings]);

  const persistForm = async (nextForm: typeof form) => {
    setSaving(true);
    setSavedNotice(false);
    setSaveError(null);
    try {
      await saveSiteSettings(nextForm);
      setSavedNotice(true);
      return true;
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Failed to publish settings to Firestore. Please ensure Cloud Auth is connected.'
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistForm(form);
  };

  const handleMaintenanceConfirmEnable = async () => {
    const prevMode = form.maintenanceMode;
    const nextForm = { ...form, maintenanceMode: true };
    setForm(nextForm);
    setPendingMaintenanceToggle(false);
    const ok = await persistForm(nextForm);
    if (!ok) {
      setForm((prev) => ({ ...prev, maintenanceMode: prevMode }));
    }
  };

  const handleMaintenanceDisable = async () => {
    const prevMode = form.maintenanceMode;
    const nextForm = { ...form, maintenanceMode: false };
    setForm(nextForm);
    const ok = await persistForm(nextForm);
    if (!ok) {
      setForm((prev) => ({ ...prev, maintenanceMode: prevMode }));
    }
  };

  const handleAddOrUpdateSocial = async () => {
    const trimmed = newSocialUrl.trim();
    if (!trimmed) return;
    const nextForm = {
      ...form,
      socialLinks: {
        ...form.socialLinks,
        [newSocialPlatform]: trimmed,
      },
    };
    setForm(nextForm);
    setNewSocialUrl('');
    await persistForm(nextForm);
  };

  const handleDeleteSocial = async (key: keyof SiteSocialLinks) => {
    const nextSocials = { ...form.socialLinks, [key]: '' };
    const nextForm = { ...form, socialLinks: nextSocials };
    setForm(nextForm);
    await persistForm(nextForm);
  };

  const activeSocialEntries = SOCIAL_PLATFORM_OPTIONS.filter(
    (opt) => (form.socialLinks?.[opt.key] || '').trim().length > 0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Website Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            Update titles, maintenance status, social media channels, statistics, and footer contact details live.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving Changes...' : 'Save Website Settings'}
        </button>
      </div>

      {saveError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs font-medium text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{saveError}</span>
          </div>
          {(!user || !isAdmin) && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100 ring-1 ring-rose-400/40 hover:bg-rose-500/30"
            >
              Connect Cloud Auth
            </button>
          )}
        </div>
      )}

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>Website settings published to Firestore and reflected live.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column 1: Maintenance Mode & Brand Content */}
        <div className="space-y-6">
          {/* Maintenance Mode System Card */}
          <div className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-amber-200">
                  System Maintenance Mode
                </h3>
                <p className="mt-0.5 text-xs text-slate-300">
                  Temporarily restrict regular user access and redirect visitors to the Maintenance page.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    form.maintenanceMode
                      ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40'
                      : 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30'
                  }`}
                >
                  {form.maintenanceMode ? 'ACTIVE' : 'LIVE'}
                </span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.maintenanceMode}
                    disabled={saving}
                    onChange={(e) => {
                      const val = e.target.checked;
                      if (val) {
                        setPendingMaintenanceToggle(true);
                      } else {
                        void handleMaintenanceDisable();
                      }
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-focus:outline-none" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">
                Custom Maintenance Announcement
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                value={form.maintenanceAnnouncement}
                onChange={(e) => setForm({ ...form, maintenanceAnnouncement: e.target.value })}
                placeholder="We are currently upgrading our laboratory servers..."
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">
                Expected Completion Message / Time
              </label>
              <input
                type="text"
                maxLength={200}
                value={form.maintenanceExpectedTime}
                onChange={(e) => setForm({ ...form, maintenanceExpectedTime: e.target.value })}
                placeholder="Expected completion: Today at 4:00 PM UTC"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 bg-[#0b1328] p-6">
            <h3 className="font-display text-base font-semibold text-white">Brand & Hero Content</h3>
            <div>
              <label className="block text-xs font-medium text-slate-300">Website Title</label>
              <input
                type="text"
                required
                maxLength={120}
                value={form.siteTitle}
                onChange={(e) => setForm({ ...form, siteTitle: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Tagline</label>
              <input
                type="text"
                required
                maxLength={180}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Hero Headline</label>
              <input
                type="text"
                required
                maxLength={160}
                value={form.heroTitle}
                onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Hero Introduction</label>
              <textarea
                required
                rows={3}
                maxLength={500}
                value={form.heroSubtitle}
                onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <AdminMediaInput
              label="Hero Banner Image"
              value={form.heroBannerUrl}
              onChange={(url) => setForm({ ...form, heroBannerUrl: url })}
              folder="banners"
            />
            <AdminMediaInput
              label="School Logo Image (Optional)"
              value={form.logoUrl}
              onChange={(url) => setForm({ ...form, logoUrl: url })}
              folder="logos"
            />
          </div>
        </div>

        {/* Column 2: About, Stats & Footer */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-[#0b1328] p-6">
          <h3 className="font-display text-base font-semibold text-white">About, Stats & Footer</h3>
          <div>
            <label className="block text-xs font-medium text-slate-300">Mission Statement</label>
            <textarea
              required
              rows={3}
              maxLength={2000}
              value={form.aboutMission}
              onChange={(e) => setForm({ ...form, aboutMission: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">Vision Statement</label>
            <textarea
              required
              rows={3}
              maxLength={2000}
              value={form.aboutVision}
              onChange={(e) => setForm({ ...form, aboutVision: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Cohort Baseline Size</label>
              <input
                type="number"
                value={form.statsStudents}
                onChange={(e) => setForm({ ...form, statsStudents: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm tabular-nums text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Projects</label>
              <input
                type="number"
                value={form.statsProjects}
                onChange={(e) => setForm({ ...form, statsProjects: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm tabular-nums text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Awards</label>
              <input
                type="number"
                value={form.statsAwards}
                onChange={(e) => setForm({ ...form, statsAwards: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm tabular-nums text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Pass Rate %</label>
              <input
                type="number"
                step="0.1"
                max={100}
                value={form.statsPassRate}
                onChange={(e) => setForm({ ...form, statsPassRate: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm tabular-nums text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Visitor Counter</label>
              <input
                type="number"
                value={form.statsVisitors}
                onChange={(e) => setForm({ ...form, statsVisitors: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm tabular-nums text-white"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-300">Footer Email</label>
              <input
                type="email"
                maxLength={150}
                value={form.footerEmail}
                onChange={(e) => setForm({ ...form, footerEmail: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Footer Phone</label>
              <input
                type="text"
                maxLength={60}
                value={form.footerPhone}
                onChange={(e) => setForm({ ...form, footerPhone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-300">Campus Address</label>
            <input
              type="text"
              maxLength={300}
              value={form.footerAddress}
              onChange={(e) => setForm({ ...form, footerAddress: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300">Footer Copyright</label>
            <input
              type="text"
              maxLength={200}
              value={form.footerCopyright}
              onChange={(e) => setForm({ ...form, footerCopyright: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          {/* Official Social Media Manager */}
          <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-cyan-400" />
                <h4 className="font-display text-sm font-semibold text-white">
                  Social Media Links (About Us Page)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                {activeSocialEntries.length} active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Add, edit, or delete social media links. Empty platforms are hidden automatically on the public About Us page.
            </p>

            {/* Add / Replace Platform Link */}
            <div className="grid gap-2 sm:grid-cols-12">
              <select
                value={newSocialPlatform}
                onChange={(e) =>
                  setNewSocialPlatform(e.target.value as keyof SiteSocialLinks)
                }
                className="rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-xs text-white sm:col-span-4"
              >
                {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                maxLength={500}
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder={
                  SOCIAL_PLATFORM_OPTIONS.find((o) => o.key === newSocialPlatform)
                    ?.placeholder || 'https://...'
                }
                className="rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-xs text-white sm:col-span-6"
              />
              <button
                type="button"
                disabled={saving || !newSocialUrl.trim()}
                onClick={() => void handleAddOrUpdateSocial()}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-45 sm:col-span-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Existing Configured Social Links (Inline Editable + Delete) */}
            {activeSocialEntries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-[#091022]/60 px-3 py-3 text-center text-xs text-slate-400">
                No social media links published yet. Select a platform above and paste a URL to display it on About Us.
              </div>
            ) : (
              <div className="space-y-2">
                {activeSocialEntries.map((opt) => (
                  <div
                    key={opt.key}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#091022] px-3 py-2"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    <span className="w-24 shrink-0 text-xs font-semibold text-slate-200">
                      {opt.label}
                    </span>
                    <input
                      type="text"
                      maxLength={500}
                      value={form.socialLinks?.[opt.key] || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: {
                            ...form.socialLinks,
                            [opt.key]: e.target.value,
                          },
                        })
                      }
                      className="min-w-0 flex-1 rounded border border-white/10 bg-[#0b1328] px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleDeleteSocial(opt.key)}
                      aria-label={`Remove ${opt.label} link`}
                      className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FullScreenOverlay
        isOpen={pendingMaintenanceToggle}
        onClose={() => !saving && setPendingMaintenanceToggle(false)}
        disableClose={saving}
        ariaLabelledBy="maintenance-confirm-title"
        closeLabel="Cancel maintenance mode confirmation"
        maxWidth="lg"
        tone="amber"
        accentBarClass="bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500"
        headerBadge={
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span>System Confirmation Required</span>
          </div>
        }
      >
        <OverlayPanel tone="amber" className="p-6 sm:p-10">
          <OverlayStagger delay={0.07}>
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/25 to-orange-500/15 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.28)]">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3
                  id="maintenance-confirm-title"
                  className="font-display text-2xl font-bold text-white sm:text-3xl"
                >
                  Enable Maintenance Mode?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base">
                  Enabling maintenance mode immediately updates live settings, redirecting regular visitors to the Maintenance page while administrators retain full Admin Portal access.
                </p>
              </div>
            </div>
          </OverlayStagger>

          <OverlayStagger delay={0.16}>
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-6">
              <OverlayActionButton
                variant="secondary"
                disabled={saving}
                onClick={() => setPendingMaintenanceToggle(false)}
              >
                Cancel
              </OverlayActionButton>
              <OverlayActionButton
                variant="amber"
                disabled={saving}
                onClick={() => void handleMaintenanceConfirmEnable()}
              >
                {saving ? 'Publishing...' : 'Confirm & Enable'}
              </OverlayActionButton>
            </div>
          </OverlayStagger>
        </OverlayPanel>
      </FullScreenOverlay>
    </form>
  );
}

export function SubjectsTab() {
  const { subjects, saveSubject, deleteSubject } = useData();
  const [editing, setEditing] = useState<Partial<Subject> | null>(null);
  const [highlightsText, setHighlightsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openNew = () => {
    setActionError(null);
    setEditing({
      code: '',
      name: '',
      shortDescription: '',
      fullDescription: '',
      imageUrl: '',
      headTeacherName: '',
      headTeacherTitle: '',
      labFacilities: '',
      order: subjects.length + 1,
    });
    setHighlightsText('');
  };

  const openEdit = (s: Subject) => {
    setActionError(null);
    setEditing(s);
    setHighlightsText((s.curriculumHighlights || []).join('\n'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.code || editing.code.trim().length < 2) {
      setActionError('Subject code must be at least 2 characters.');
      return;
    }
    if (!editing.name || editing.name.trim().length < 2) {
      setActionError('Subject name must be at least 2 characters.');
      return;
    }
    if (!editing.shortDescription || editing.shortDescription.trim().length < 2) {
      setActionError('Short description must be at least 2 characters.');
      return;
    }
    if (!editing.fullDescription || editing.fullDescription.trim().length < 2) {
      setActionError('Full curriculum description must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await saveSubject({
        id: editing.id,
        code: editing.code || 'TECH',
        name: editing.name || '',
        shortDescription: editing.shortDescription || '',
        fullDescription: editing.fullDescription || '',
        imageUrl: editing.imageUrl || '',
        headTeacherName: editing.headTeacherName || '',
        headTeacherTitle: editing.headTeacherTitle || '',
        labFacilities: editing.labFacilities || '',
        curriculumHighlights: highlightsText.split('\n').filter(Boolean),
        order: editing.order ?? 1,
      });
      setEditing(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to save subject. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    setActionError(null);
    try {
      await deleteSubject(id, name);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete subject. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Subjects Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            Add, edit, or delete academic technology subjects and their lab specifications.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Add Subject</span>
        </button>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <h3 className="font-display text-lg font-semibold text-white">
            {editing.id ? `Edit ${editing.name}` : 'Create New Subject'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Subject Code</label>
              <input
                type="text"
                required
                maxLength={20}
                value={editing.code || ''}
                onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                placeholder="e.g., SFT"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Subject Name</label>
              <input
                type="text"
                required
                maxLength={120}
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Head Teacher Name</label>
              <input
                type="text"
                maxLength={120}
                value={editing.headTeacherName || ''}
                onChange={(e) => setEditing({ ...editing, headTeacherName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Head Teacher Title</label>
              <input
                type="text"
                maxLength={120}
                value={editing.headTeacherTitle || ''}
                onChange={(e) => setEditing({ ...editing, headTeacherTitle: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Display Order</label>
              <input
                type="number"
                value={editing.order ?? 1}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300">Short Summary</label>
            <input
              type="text"
              required
              maxLength={300}
              value={editing.shortDescription || ''}
              onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300">Full Description</label>
            <textarea
              required
              rows={3}
              maxLength={3000}
              value={editing.fullDescription || ''}
              onChange={(e) => setEditing({ ...editing, fullDescription: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300">Lab Facilities</label>
            <input
              type="text"
              maxLength={600}
              value={editing.labFacilities || ''}
              onChange={(e) => setEditing({ ...editing, labFacilities: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300">
              Curriculum Highlights (One per line, max 10)
            </label>
            <textarea
              rows={3}
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <AdminMediaInput
            label="Subject Cover Image"
            value={editing.imageUrl || ''}
            onChange={(url) => setEditing({ ...editing, imageUrl: url })}
            folder="subjects"
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {saving ? 'Saving...' : 'Save Subject'}
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

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1328]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Subject Name</th>
              <th className="px-4 py-3 font-medium">Head Teacher</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {subjects.map((s) => (
              <tr key={s.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-300">
                  {s.code}
                </td>
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{s.headTeacherName || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                      aria-label={`Edit ${s.name}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSubject(s.id, s.name)}
                      className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-950/50"
                      aria-label={`Delete ${s.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnnouncementsTab() {
  const { announcements, saveAnnouncement, deleteAnnouncement } = useData();
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'urgent' | 'important' | 'general'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  const years = useMemo(() => {
    const set = new Set(['2024', '2025', '2026', '2027', '2028']);
    announcements.forEach((a) => {
      const match = a.publishDate?.match(/\b(20\d{2})\b/);
      if (match?.[1]) set.add(match[1]);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchesCat = categoryFilter === 'all' || a.priority === categoryFilter;
      const itemYear = a.publishDate?.match(/\b(20\d{2})\b/)?.[1] || '';
      const matchesYear = yearFilter === 'all' || itemYear === yearFilter;
      return matchesCat && matchesYear;
    });
  }, [announcements, categoryFilter, yearFilter]);

  const hasFilters = categoryFilter !== 'all' || yearFilter !== 'all';

  const openNew = () => {
    setActionError(null);
    setEditing({
      title: '',
      summary: '',
      body: '',
      imageUrl: '',
      priority: 'important',
      publishDate: new Date().toISOString().slice(0, 10),
      pinnedToHome: true,
      showAsPopup: true,
      authorName: 'Technology Office',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title || editing.title.trim().length < 2) {
      setActionError('Announcement title must be at least 2 characters.');
      return;
    }
    if (!editing.summary || editing.summary.trim().length < 2) {
      setActionError('Announcement summary must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await saveAnnouncement({
        id: editing.id,
        title: editing.title || '',
        summary: editing.summary || '',
        body: editing.body || '',
        imageUrl: editing.imageUrl || '',
        priority: editing.priority || 'general',
        publishDate: editing.publishDate || new Date().toISOString().slice(0, 10),
        pinnedToHome: Boolean(editing.pinnedToHome),
        showAsPopup: Boolean(editing.showAsPopup),
        authorName: editing.authorName || 'Technology Office',
      });
      setEditing(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to save announcement. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteAnnouncement(id, title);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete announcement. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Announcement Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            Publish official notices, attach images, pin updates, and trigger automatic homepage announcement popups.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Notice</span>
        </button>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Notice Title</label>
              <input
                type="text"
                required
                maxLength={160}
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Priority</label>
              <select
                value={editing.priority || 'general'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    priority: e.target.value as 'urgent' | 'important' | 'general',
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                <option value="urgent">Urgent</option>
                <option value="important">Important</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs text-slate-300">Publish Date</label>
              <input
                type="date"
                required
                value={editing.publishDate || ''}
                onChange={(e) => setEditing({ ...editing, publishDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Author / Issuer</label>
              <input
                type="text"
                maxLength={120}
                value={editing.authorName || ''}
                onChange={(e) => setEditing({ ...editing, authorName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <label className="flex items-center gap-2 pt-6 text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(editing.pinnedToHome)}
                onChange={(e) => setEditing({ ...editing, pinnedToHome: e.target.checked })}
                className="h-4 w-4 rounded border-white/20"
              />
              <span>Pin to Homepage</span>
            </label>
            <label className="flex items-center gap-2 pt-6 text-xs font-medium text-amber-300">
              <input
                type="checkbox"
                checked={Boolean(editing.showAsPopup)}
                onChange={(e) => setEditing({ ...editing, showAsPopup: e.target.checked })}
                className="h-4 w-4 rounded border-white/20"
              />
              <span>Show as Homepage Popup</span>
            </label>
          </div>

          <div>
            <label className="block text-xs text-slate-300">Summary</label>
            <input
              type="text"
              required
              maxLength={360}
              value={editing.summary || ''}
              onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300">Full Notice Body</label>
            <textarea
              rows={3}
              maxLength={3000}
              value={editing.body || ''}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <AdminMediaInput
            label="Announcement Image (Optional)"
            value={editing.imageUrl || ''}
            onChange={(url) => setEditing({ ...editing, imageUrl: url })}
            folder="announcements"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {saving ? 'Publishing...' : 'Save Announcement'}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-400">
          Showing {filteredAnnouncements.length} of {announcements.length} announcement(s)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter announcements by category"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | 'urgent' | 'important' | 'general')
            }
            className="rounded-lg border border-white/15 bg-[#091022] px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="urgent">Urgent</option>
            <option value="important">Important</option>
            <option value="general">General</option>
          </select>
          <select
            aria-label="Filter announcements by year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border border-white/15 bg-[#091022] px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="all">All Years</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <SectionEmptyState
          variant="announcements"
          compact
          onResetFilters={
            hasFilters && announcements.length > 0
              ? () => {
                  setCategoryFilter('all');
                  setYearFilter('all');
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((a) => (
            <div
              key={a.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#0b1328] p-5 sm:flex-row sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  <span className="font-semibold uppercase text-blue-300">{a.priority}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{a.publishDate}</span>
                  {a.pinnedToHome && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-300">Pinned to Homepage</span>
                    </>
                  )}
                  {a.showAsPopup && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-amber-300">Active Popup</span>
                    </>
                  )}
                </div>
                <h3 className="font-display mt-1 text-base font-semibold text-white">{a.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{a.summary}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(a)}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteAnnouncement(a.id, a.title)}
                  className="rounded-lg border border-white/10 p-2 text-rose-400 hover:bg-rose-950/50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
