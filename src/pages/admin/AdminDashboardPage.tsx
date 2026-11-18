import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Clock,
  Cpu,
  Crown,
  Database,
  Eye,
  EyeOff,
  FileDown,
  Globe,
  Image as ImageIcon,
  Link2,
  Lock,
  LogOut,
  Mail,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DEFAULT_WEB_LOGO } from '../../data/seedDefaults';
import type { PageRoute } from '../../types';
import {
  DownloadsTab,
  EventsAchievementsTab,
  GalleryTab,
  PeopleTab,
  ProjectsTab,
  UsersInquiriesTab,
} from './AdminContentTabs';
import { AdminCommunityMembersTab } from './AdminCommunityMembersTab';
import { AnnouncementsTab, OverviewTab, SettingsTab, SubjectsTab } from './AdminCoreTabs';
import { CommunityModerationTab, CustomLinksTab, HistoryTab } from './AdminFeatureTabs';

type AdminTabId =
  | 'overview'
  | 'settings'
  | 'subjects'
  | 'directory'
  | 'announcements'
  | 'history'
  | 'community'
  | 'links'
  | 'people'
  | 'events'
  | 'projects'
  | 'gallery'
  | 'downloads'
  | 'users';

const ADMIN_TABS: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Analytics & Logs', icon: BarChart3 },
  { id: 'settings', label: 'Website Settings', icon: Globe },
  { id: 'directory', label: 'Manage Community Members', icon: Crown },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'announcements', label: 'Announcements & Popups', icon: Megaphone },
  { id: 'history', label: 'History Timeline', icon: Clock },
  { id: 'community', label: 'Community Posts', icon: MessageSquare },
  { id: 'links', label: 'Custom Links', icon: Link2 },
  { id: 'people', label: 'Teachers & Scholars', icon: Users },
  { id: 'events', label: 'Events & Awards', icon: Award },
  { id: 'projects', label: 'Student Projects', icon: Cpu },
  { id: 'gallery', label: 'Gallery Media', icon: ImageIcon },
  { id: 'downloads', label: 'Downloads & Drive', icon: FileDown },
  { id: 'users', label: 'Accounts & Inquiries', icon: ShieldCheck },
];

export function AdminDashboardPage({ onNavigate }: { onNavigate: (route: PageRoute) => void }) {
  const {
    user,
    isAdmin,
    adminAuthenticated,
    adminAuthReady,
    adminEmail,
    siteSettings,
    isFirestoreSeeded,
    seedingInProgress,
    seedDatabase,
    signInWithGoogle,
    loginAdminWithCredentials,
    logoutAdminSession,
  } = useData();

  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!emailInput.trim() || !passwordInput) {
      setLoginError('Please enter both your administrator email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginAdminWithCredentials(emailInput.trim(), passwordInput);
      setPasswordInput('');
      onNavigate('admin');
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Invalid administrator username/email or password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setLoginError(null);
    setSubmitting(true);
    try {
      const signedIn = await signInWithGoogle();
      if (!signedIn) {
        return;
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!adminAuthReady) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4">
        <div className="text-sm text-slate-400">Verifying administrator session...</div>
      </div>
    );
  }

  // Dedicated Admin Login Gate (Blocks unauthorized access to Admin Dashboard & features)
  if (!adminAuthenticated) {
    return (
      <div className="relative flex min-h-[82vh] items-center justify-center overflow-hidden px-4 py-16">
        <div className="glass-surface-elevated w-full max-w-md rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <img
              src={siteSettings.logoUrl || DEFAULT_WEB_LOGO}
              alt={siteSettings.siteTitle}
              referrerPolicy="no-referrer"
              className="h-14 w-14 object-contain drop-shadow-[0_4px_14px_rgba(96,165,250,0.35)]"
            />
            <p className="mt-4 text-xs font-semibold tracking-wide text-blue-300">
              {siteSettings.siteTitle}
            </p>
            <h1 className="font-display mt-1.5 text-2xl font-bold text-white">
              Admin Portal Login
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Sign in with your authorized administrator email and password to access the control dashboard.
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-950/50 px-3.5 py-3 text-xs text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-login-email"
                className="block text-xs font-medium text-slate-300"
              >
                Username / Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-login-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter administrator email"
                  className="w-full rounded-xl border border-white/15 bg-[#070d1e] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-login-password"
                className="block text-xs font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full rounded-xl border border-white/15 bg-[#070d1e] py-2.5 pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Admin Dashboard'}</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <div className="h-px flex-1 bg-white/10" />
            <span>OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleGoogleAdminLogin()}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>Sign in with Google (Cloud Admin)</span>
          </button>

          {user && !isAdmin && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/35 px-3 py-2 text-center text-[11px] text-amber-200">
              Currently signed in as {user.email} (not an administrator). Switch to an authorized Google admin account or sign in above.
            </p>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Public Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeTabMeta = ADMIN_TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#050914]/50 text-slate-100">
      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-b border-white/10 bg-[#070d1e]/85 backdrop-blur-md p-4 lg:min-h-[calc(100vh-4rem)] lg:w-[260px] lg:border-b-0 lg:border-r">
          <div className="mb-4 px-2">
            <p className="text-xs font-medium text-cyan-300">SSCK TECH Control Center</p>
            <p className="font-display mt-0.5 truncate text-sm font-semibold text-white">
              {adminEmail || user?.email || 'Administrator'}
            </p>
          </div>

          <nav className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 hidden border-t border-white/10 pt-4 lg:block">
            <button
              type="button"
              onClick={() => void logoutAdminSession()}
              className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of Admin</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          {/* Top Breadcrumb Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="text-xs text-slate-400">
              <span>Admin Portal</span>
              <span className="mx-2">/</span>
              <span className="font-semibold text-white">{activeTabMeta.label}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && !isFirestoreSeeded && (
                <button
                  type="button"
                  disabled={seedingInProgress}
                  onClick={() => void seedDatabase()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/20 px-3.5 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-600/30"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>{seedingInProgress ? 'Initializing...' : 'Initialize Cloud Data'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void logoutAdminSession()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white lg:hidden"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 whitespace-nowrap"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>View Public Website</span>
              </button>
            </div>
          </div>

          {!isAdmin && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-950/45 px-4 py-3.5 text-xs text-amber-100 shadow-lg">
              <div>
                <p className="font-semibold text-amber-200">
                  Cloud Firestore Write Authorization Required
                </p>
                <p className="mt-0.5 text-amber-100/85">
                  {user
                    ? `Signed in with ${user.email}, which lacks Cloud Firestore admin write permissions. Connect your authorized Google admin account (e.g. sscktechsociety@gmail.com or project owner).`
                    : `Connect your authorized Google account (${adminEmail || 'sscktechsociety@gmail.com'} or project owner) before creating, editing, or deleting Cloud Firestore records.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap"
              >
                {user ? 'Switch Google Account' : 'Connect Cloud Auth'}
              </button>
            </div>
          )}

          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'directory' && <AdminCommunityMembersTab />}
          {activeTab === 'subjects' && <SubjectsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'community' && <CommunityModerationTab />}
          {activeTab === 'links' && <CustomLinksTab />}
          {activeTab === 'people' && <PeopleTab />}
          {activeTab === 'events' && <EventsAchievementsTab />}
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'gallery' && <GalleryTab />}
          {activeTab === 'downloads' && <DownloadsTab />}
          {activeTab === 'users' && <UsersInquiriesTab />}
        </main>
      </div>
    </div>
  );
}
