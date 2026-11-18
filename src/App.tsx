import React, {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react';
import { AnnouncementPopup } from './components/AnnouncementPopup';
import { BackgroundMusicPlayer } from './components/BackgroundMusicPlayer';
import { CinematicLoader } from './components/CinematicLoader';
import { CommandSearchModal } from './components/CommandSearchModal';
import { CustomCursor } from './components/CustomCursor';
import { Footer } from './components/Footer';
import { HeroParticleBackground } from './components/HeroParticleBackground';
import { Navbar } from './components/Navbar';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { DataProvider, useData } from './context/DataContext';
import { MusicProvider, useMusic } from './context/MusicContext';
import {
  ENGINEERING_LAB_IMAGE,
  HERO_CAMPUS_IMAGE,
  SCIENCE_BIO_IMAGE,
} from './data/seedDefaults';
import { HomePage } from './pages/HomePage';
import { MaintenancePage } from './pages/MaintenancePage';
import type { PageRoute } from './types';

// Shared chunk loaders so route navigation and prefetching never load a module twice
const loadAboutModule = () => import('./pages/AboutPage');
const loadHistoryModule = () => import('./pages/HistoryPage');
const loadCommunityModule = () => import('./pages/CommunityPage');
const loadSubjectsModule = () => import('./pages/SubjectsPage');
const loadPeopleModule = () => import('./pages/PeoplePages');
const loadEventsAchievementsModule = () => import('./pages/EventsAchievementsPages');
const loadShowcaseModule = () => import('./pages/ShowcasePages');
const loadDownloadsContactModule = () => import('./pages/DownloadsContactPages');
const loadAdminModule = () => import('./pages/admin/AdminDashboardPage');

const AboutPage = lazy(() => loadAboutModule().then((m) => ({ default: m.AboutPage })));
const HistoryPage = lazy(() => loadHistoryModule().then((m) => ({ default: m.HistoryPage })));
const CommunityPage = lazy(() => loadCommunityModule().then((m) => ({ default: m.CommunityPage })));
const SubjectsPage = lazy(() => loadSubjectsModule().then((m) => ({ default: m.SubjectsPage })));
const TeachersMembersPage = lazy(() =>
  loadPeopleModule().then((m) => ({ default: m.TeachersMembersPage }))
);
const EventsPage = lazy(() =>
  loadEventsAchievementsModule().then((m) => ({ default: m.EventsPage }))
);
const AchievementsPage = lazy(() =>
  loadEventsAchievementsModule().then((m) => ({ default: m.AchievementsPage }))
);
const GalleryPage = lazy(() => loadShowcaseModule().then((m) => ({ default: m.GalleryPage })));
const ProjectsPage = lazy(() => loadShowcaseModule().then((m) => ({ default: m.ProjectsPage })));
const DownloadsPage = lazy(() =>
  loadDownloadsContactModule().then((m) => ({ default: m.DownloadsPage }))
);
const ContactPage = lazy(() =>
  loadDownloadsContactModule().then((m) => ({ default: m.ContactPage }))
);
const AdminDashboardPage = lazy(() =>
  loadAdminModule().then((m) => ({ default: m.AdminDashboardPage }))
);

const ROUTE_CHUNK_LOADERS: Record<PageRoute, (() => Promise<unknown>) | null> = {
  home: null,
  about: loadAboutModule,
  history: loadHistoryModule,
  community: loadCommunityModule,
  subjects: loadSubjectsModule,
  'teachers-members': loadPeopleModule,
  teachers: loadPeopleModule,
  students: loadPeopleModule,
  'community-members': loadPeopleModule,
  events: loadEventsAchievementsModule,
  achievements: loadEventsAchievementsModule,
  gallery: loadShowcaseModule,
  projects: loadShowcaseModule,
  downloads: loadDownloadsContactModule,
  contact: loadDownloadsContactModule,
  admin: loadAdminModule,
};

const resolvedRouteModules = new Set<PageRoute>(['home']);
const pendingRouteModules = new Map<PageRoute, Promise<void>>();
const prefetchedImageUrls = new Set<string>();

function getChunkGroupRoutes(route: PageRoute): PageRoute[] {
  if (
    route === 'teachers-members' ||
    route === 'teachers' ||
    route === 'students' ||
    route === 'community-members'
  ) {
    return ['teachers-members', 'teachers', 'students', 'community-members'];
  }
  if (route === 'events' || route === 'achievements') {
    return ['events', 'achievements'];
  }
  if (route === 'gallery' || route === 'projects') {
    return ['gallery', 'projects'];
  }
  if (route === 'downloads' || route === 'contact') {
    return ['downloads', 'contact'];
  }
  return [route];
}

function loadRouteModule(route: PageRoute): Promise<void> {
  if (resolvedRouteModules.has(route)) {
    return Promise.resolve();
  }
  const existing = pendingRouteModules.get(route);
  if (existing) {
    return existing;
  }
  const loader = ROUTE_CHUNK_LOADERS[route];
  if (!loader) {
    resolvedRouteModules.add(route);
    return Promise.resolve();
  }

  const groupRoutes = getChunkGroupRoutes(route);
  const promise = loader()
    .then(() => {
      groupRoutes.forEach((r) => resolvedRouteModules.add(r));
    })
    .catch(() => {
      // Allow retry if a transient network glitch interrupted chunk fetch
    })
    .finally(() => {
      groupRoutes.forEach((r) => pendingRouteModules.delete(r));
    });

  groupRoutes.forEach((r) => pendingRouteModules.set(r, promise));
  return promise;
}

function prefetchImages(urls: Array<string | undefined | null>) {
  if (typeof window === 'undefined') return;
  for (const raw of urls) {
    const url = raw?.trim();
    if (!url || prefetchedImageUrls.has(url)) continue;
    prefetchedImageUrls.add(url);
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.src = url;
    if (typeof img.decode === 'function') {
      void img.decode().catch(() => undefined);
    }
  }
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050914] px-6 text-center text-white">
          <div className="glass-surface max-w-md rounded-2xl p-8">
            <h1 className="font-display text-xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-xs text-slate-400">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function parseRouteFromLocation(): { route: PageRoute; subjectId: string | null } {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '') return { route: 'home', subjectId: null };
  if (path === '/history') return { route: 'history', subjectId: null };
  if (
    path === '/teacher-member' ||
    path === '/teachers-members' ||
    path === '/teachers' ||
    path === '/community-members' ||
    path === '/students'
  ) {
    return { route: 'teachers-members', subjectId: null };
  }
  if (path === '/events' || path === '/event') return { route: 'events', subjectId: null };
  if (path === '/projects' || path === '/project') return { route: 'projects', subjectId: null };
  if (path === '/achievements' || path === '/achievement') return { route: 'achievements', subjectId: null };
  if (path === '/gallery') return { route: 'gallery', subjectId: null };
  if (path === '/about' || path === '/about-us') return { route: 'about', subjectId: null };
  if (path === '/admin' || path === '/admin-portal') return { route: 'admin', subjectId: null };
  if (path === '/community') return { route: 'community', subjectId: null };
  if (path === '/subjects') return { route: 'subjects', subjectId: null };
  if (path.startsWith('/subjects/')) {
    return { route: 'subjects', subjectId: decodeURIComponent(path.slice('/subjects/'.length)) };
  }
  if (path === '/downloads') return { route: 'downloads', subjectId: null };
  if (path === '/contact') return { route: 'contact', subjectId: null };
  return { route: 'home', subjectId: null };
}

function buildPath(route: PageRoute, subjectId?: string | null): string {
  if (route === 'home') return '/';
  if (route === 'history') return '/history';
  if (route === 'teachers-members') return '/teacher-member';
  if (route === 'events') return '/event';
  if (route === 'projects') return '/project';
  if (route === 'achievements') return '/achievements';
  if (route === 'gallery') return '/gallery';
  if (route === 'about') return '/about-us';
  if (route === 'admin') return '/admin-portal';
  if (route === 'subjects' && subjectId) return `/subjects/${encodeURIComponent(subjectId)}`;
  return `/${route}`;
}

function scrollToTopInstant() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const prevBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  if (root.style.overflow === 'hidden') root.style.overflow = '';
  if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
  window.scrollTo(0, 0);
  root.scrollTop = 0;
  document.body.scrollTop = 0;
  window.requestAnimationFrame(() => {
    root.style.scrollBehavior = prevBehavior;
  });
}

function AppShell() {
  const {
    siteSettings,
    isAdmin,
    adminAuthenticated,
    hasOpenModal,
    historyEvents,
    events,
    projects,
    gallery,
    achievements,
    teachers,
    subjects,
  } = useData();
  const { setRouteSuspended } = useMusic();
  const prefersReduced = useReducedMotion();
  const [showLoader, setShowLoader] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navState, setNavState] = useState<{ route: PageRoute; subjectId: string | null }>(() =>
    parseRouteFromLocation()
  );
  const navigationTokenRef = useRef(0);
  const hasOpenModalRef = useRef(hasOpenModal);
  hasOpenModalRef.current = hasOpenModal;

  // Pre-fetch both lazy React route modules and key visible imagery before transition begins
  const prefetchRoute = useCallback(
    (route: PageRoute) => {
      void loadRouteModule(route);

      switch (route) {
        case 'home':
          prefetchImages([siteSettings.heroBannerUrl || HERO_CAMPUS_IMAGE, siteSettings.logoUrl]);
          break;
        case 'about':
          prefetchImages([
            siteSettings.heroBannerUrl || HERO_CAMPUS_IMAGE,
            ENGINEERING_LAB_IMAGE,
            SCIENCE_BIO_IMAGE,
          ]);
          break;
        case 'history':
          prefetchImages(historyEvents.slice(0, 4).map((item) => item.imageUrl));
          break;
        case 'teachers-members':
        case 'teachers':
        case 'students':
        case 'community-members':
          prefetchImages(teachers.slice(0, 4).map((item) => item.photoUrl));
          break;
        case 'events':
          prefetchImages(events.slice(0, 4).map((item) => item.imageUrl));
          break;
        case 'projects':
          prefetchImages(projects.slice(0, 4).map((item) => item.imageUrl));
          break;
        case 'achievements':
          prefetchImages(achievements.slice(0, 4).map((item) => item.imageUrl));
          break;
        case 'gallery':
          prefetchImages(
            gallery
              .filter((item) => item.mediaType === 'image')
              .slice(0, 6)
              .map((item) => item.mediaUrl)
          );
          break;
        case 'subjects':
          prefetchImages(subjects.slice(0, 6).map((item) => item.imageUrl));
          break;
        default:
          break;
      }
    },
    [
      siteSettings.heroBannerUrl,
      siteSettings.logoUrl,
      historyEvents,
      teachers,
      events,
      projects,
      achievements,
      gallery,
      subjects,
    ]
  );

  // Warm-up primary route bundles & hero imagery in background right after initial load completes
  useEffect(() => {
    if (showLoader) return;

    const primaryRoutes: PageRoute[] = [
      'history',
      'teachers-members',
      'events',
      'projects',
      'achievements',
      'gallery',
      'about',
      'subjects',
    ];

    let cancelled = false;
    const warmQueue = () => {
      primaryRoutes.forEach((route, idx) => {
        window.setTimeout(() => {
          if (!cancelled) prefetchRoute(route);
        }, idx * 90);
      });
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(warmQueue, { timeout: 1200 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(idleId);
      };
    }

    const timerId = window.setTimeout(warmQueue, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [showLoader, prefetchRoute]);

  useEffect(() => {
    setRouteSuspended(navState.route === 'history');
  }, [navState.route, setRouteSuspended]);

  // Prevent browser auto scroll restoration on Back/Forward so every page opens cleanly at y=0
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;
    const prevRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = prevRestoration;
    };
  }, []);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const state = e.state as { route?: PageRoute; subjectId?: string | null } | null;
      const next =
        state && state.route
          ? { route: state.route, subjectId: state.subjectId ?? null }
          : parseRouteFromLocation();
      const token = ++navigationTokenRef.current;

      prefetchRoute(next.route);

      const commitPopState = () => {
        if (navigationTokenRef.current !== token) return;
        scrollToTopInstant();
        startTransition(() => {
          setNavState(next);
        });
      };

      if (resolvedRouteModules.has(next.route)) {
        commitPopState();
      } else {
        void loadRouteModule(next.route).then(commitPopState);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [prefetchRoute]);

  // Guarantee scroll position 0 as soon as route key commits to DOM
  useLayoutEffect(() => {
    scrollToTopInstant();
  }, [navState.route, navState.subjectId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => {
          if (prev) return false;
          return hasOpenModalRef.current ? false : true;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    document.title = `${siteSettings.siteTitle} — School Technology Section`;
  }, [siteSettings.siteTitle]);

  const navigate = useCallback(
    (route: PageRoute, subjectId?: string) => {
      const nextSubjectId = route === 'subjects' ? subjectId || null : null;
      const targetPath = buildPath(route, nextSubjectId);

      // Clicking the active navigation item returns smoothly to top without duplicate history entries
      if (navState.route === route && navState.subjectId === nextSubjectId) {
        if (window.location.pathname !== targetPath) {
          window.history.replaceState({ route, subjectId: nextSubjectId }, '', targetPath);
        }
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
        return;
      }

      const token = ++navigationTokenRef.current;
      prefetchRoute(route);

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ route, subjectId: nextSubjectId }, '', targetPath);
      }

      const commitNavigation = () => {
        if (navigationTokenRef.current !== token) return;
        scrollToTopInstant();
        startTransition(() => {
          setNavState({ route, subjectId: nextSubjectId });
        });
      };

      // Pre-fetch module readiness before transitioning so Suspense never flashes a blank frame
      if (resolvedRouteModules.has(route)) {
        commitNavigation();
      } else {
        void loadRouteModule(route).then(commitNavigation);
      }
    },
    [navState.route, navState.subjectId, prefersReduced, prefetchRoute]
  );

  const handleSelectSubject = useCallback(
    (subjectId: string | null) => {
      navigate('subjects', subjectId || undefined);
    },
    [navigate]
  );

  const renderPage = () => {
    const isMaintenanceActive = Boolean(siteSettings.maintenanceMode);
    const canBypass = isAdmin || adminAuthenticated || navState.route === 'admin';
    if (isMaintenanceActive && !canBypass) {
      return <MaintenancePage onNavigate={navigate} />;
    }

    switch (navState.route) {
      case 'home':
        return (
          <HomePage
            onNavigate={navigate}
            onOpenSearch={() => setSearchOpen(true)}
            defer3D={showLoader}
          />
        );
      case 'about':
        return <AboutPage onNavigate={navigate} />;
      case 'history':
        return <HistoryPage onNavigate={navigate} />;
      case 'community':
        return <CommunityPage onNavigate={navigate} />;
      case 'subjects':
        return (
          <SubjectsPage
            selectedSubjectId={navState.subjectId}
            onSelectSubject={handleSelectSubject}
            onNavigate={navigate}
          />
        );
      case 'teachers-members':
      case 'teachers':
      case 'students':
      case 'community-members':
        return <TeachersMembersPage onNavigate={navigate} />;
      case 'events':
        return <EventsPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'downloads':
        return <DownloadsPage onNavigate={navigate} />;
      case 'contact':
        return <ContactPage onNavigate={navigate} />;
      case 'admin':
        return <AdminDashboardPage onNavigate={navigate} />;
      default:
        return (
          <HomePage
            onNavigate={navigate}
            onOpenSearch={() => setSearchOpen(true)}
            defer3D={showLoader}
          />
        );
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#050914] text-slate-100">
      <div
        id="home-particle-portal"
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      />
      {!showLoader && <HeroParticleBackground fullPage />}
      <CustomCursor />
      <ScrollProgressBar />

      {showLoader && (
        <CinematicLoader
          siteTitle={siteSettings.siteTitle}
          logoUrl={siteSettings.logoUrl}
          onComplete={() => setShowLoader(false)}
        />
      )}

      {navState.route === 'home' && !showLoader && <AnnouncementPopup />}

      <CommandSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
      />

      <Navbar
        currentRoute={navState.route}
        onNavigate={navigate}
        onPrefetch={prefetchRoute}
        hidden={hasOpenModal}
      />

      <main className={`relative z-10 flex-1 ${navState.route === 'admin' ? '' : 'pb-24'}`}>
        {/* overflow-clip isolates exiting popLayout frames without disabling sticky children */}
        <div className="relative overflow-clip">
          <Suspense fallback={<div className="min-h-[65vh]" aria-hidden="true" />}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`${navState.route}-${navState.subjectId || ''}`}
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={
                  prefersReduced
                    ? undefined
                    : {
                        opacity: 0,
                        y: -4,
                        transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
                      }
                }
                style={prefersReduced ? undefined : { willChange: 'transform, opacity' }}
                className="relative z-10 w-full"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      {navState.route !== 'admin' && <Footer onNavigate={navigate} onPrefetch={prefetchRoute} />}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        <DataProvider>
          <MusicProvider>
            <AppShell />
          </MusicProvider>
        </DataProvider>
      </MotionConfig>
    </AppErrorBoundary>
  );
}
