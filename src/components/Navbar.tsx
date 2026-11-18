import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Calendar,
  Clock,
  Cpu,
  Home,
  Image as ImageIcon,
  Info,
  Menu,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { DEFAULT_WEB_LOGO } from '../data/seedDefaults';
import type { PageRoute } from '../types';

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute, subjectId?: string) => void;
  onPrefetch?: (route: PageRoute) => void;
  hidden?: boolean;
}

export interface NavItemConfig {
  number: number;
  route: PageRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { number: 1, route: 'home', label: 'Home', icon: Home },
  { number: 2, route: 'history', label: 'History', icon: Clock },
  { number: 3, route: 'teachers-members', label: 'Teacher & Member', icon: Users },
  { number: 4, route: 'events', label: 'Event', icon: Calendar },
  { number: 5, route: 'projects', label: 'Project', icon: Cpu },
  { number: 6, route: 'achievements', label: 'Achievements', icon: Trophy },
  { number: 7, route: 'gallery', label: 'Gallery', icon: ImageIcon },
  { number: 8, route: 'about', label: 'About us', icon: Info },
  { number: 9, route: 'admin', label: 'Admin portal', icon: ShieldCheck },
];

export function Navbar({ currentRoute, onNavigate, onPrefetch, hidden = false }: NavbarProps) {
  const { siteSettings } = useData();
  const prefersReduced = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hidden) {
      setMobileOpen(false);
    }
  }, [hidden]);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentRoute]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inNav = Boolean(navRef.current?.contains(target));
      const inDrawer = Boolean(drawerRef.current?.contains(target));
      if (!inNav && !inDrawer) {
        setMobileOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleLinkClick = (route: PageRoute) => {
    setMobileOpen(false);
    onNavigate(route);
  };

  const isRouteActive = (route: PageRoute): boolean => {
    if (route === 'home') return currentRoute === 'home';
    if (route === 'history') return currentRoute === 'history';
    if (route === 'teachers-members') {
      return ['teachers-members', 'teachers', 'students', 'community-members'].includes(currentRoute);
    }
    if (route === 'events') return currentRoute === 'events';
    if (route === 'projects') return currentRoute === 'projects';
    if (route === 'achievements') return currentRoute === 'achievements';
    if (route === 'gallery') return currentRoute === 'gallery';
    if (route === 'about') return currentRoute === 'about';
    if (route === 'admin') return currentRoute === 'admin';
    return route === currentRoute;
  };

  // Nav links for desktop center zone (Items 1 to 8)
  const desktopLinks = NAV_ITEMS.slice(0, 8);
  // Item 9 is the Admin portal
  const adminItem = NAV_ITEMS[8];
  const isAdminActive = isRouteActive('admin');

  return (
    <>
      <motion.header
      ref={navRef}
      initial={false}
      animate={{
        y: hidden ? '-110%' : '0%',
        opacity: hidden ? 0 : 1,
      }}
      transition={{ duration: prefersReduced ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden={hidden}
      className={`sticky top-0 z-40 border-b border-white/10 bg-[#050914]/90 backdrop-blur-xl transition-colors duration-200 ${
        hidden ? 'invisible pointer-events-none select-none' : ''
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          onMouseEnter={() => onPrefetch?.('home')}
          onFocus={() => onPrefetch?.('home')}
          className="group flex items-center gap-3 text-left whitespace-nowrap shrink-0 rounded-xl p-1 focus-visible:outline-2 focus-visible:outline-cyan-400"
          aria-label={`${siteSettings.siteTitle} Home`}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-transform duration-300 group-hover:scale-105">
            <img
              src={siteSettings.logoUrl || DEFAULT_WEB_LOGO}
              alt={siteSettings.siteTitle}
              referrerPolicy="no-referrer"
              className="h-7 w-7 object-contain drop-shadow-[0_2px_8px_rgba(34,211,238,0.4)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display bg-gradient-to-r from-white via-cyan-100 to-blue-300 bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-lg">
              {siteSettings.siteTitle}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/80">
              Technology Section
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Items 1 to 8: Home, History, Teacher & Member, Event, Project, Achievements, Gallery, About us) */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs xl:text-sm font-semibold"
          aria-label="Main Navigation"
        >
          {desktopLinks.map((item) => {
            const active = isRouteActive(item.route);
            return (
              <button
                key={item.number}
                type="button"
                onClick={() => handleLinkClick(item.route)}
                onMouseEnter={() => onPrefetch?.(item.route)}
                onFocus={() => onPrefetch?.(item.route)}
                onTouchStart={() => onPrefetch?.(item.route)}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-xl px-2.5 xl:px-3 py-2 transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                  active
                    ? 'text-cyan-300 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>{item.label}</span>
                {active && (
                  <motion.span
                    layoutId="navbarActiveIndicator"
                    className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Item 9 (Admin portal - Desktop/Laptop Only) & Mobile Hamburger Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick(adminItem.route)}
            onMouseEnter={() => onPrefetch?.(adminItem.route)}
            onFocus={() => onPrefetch?.(adminItem.route)}
            data-nav-item="9"
            aria-label="Admin portal"
            aria-current={isAdminActive ? 'page' : undefined}
            className={`hidden lg:inline-flex group relative items-center gap-2 rounded-xl border px-3.5 xl:px-4 py-2 text-xs xl:text-sm font-bold tracking-wide transition-all duration-200 whitespace-nowrap shrink-0 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
              isAdminActive
                ? 'border-cyan-400 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-blue-500/30'
                : 'border-cyan-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-violet-950/40 text-slate-100 hover:border-cyan-400/60 hover:bg-cyan-500/15 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-cyan-400 transition-transform group-hover:scale-110" />
            <span>Admin portal</span>
            {isAdminActive && (
              <motion.span
                layoutId="navbarActiveIndicator"
                className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => {
              setMobileOpen((prev) => {
                const next = !prev;
                if (next && onPrefetch) {
                  desktopLinks.forEach((item) => onPrefetch(item.route));
                }
                return next;
              });
            }}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-slide-drawer"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-cyan-400/40 hover:bg-white/10 hover:text-white lg:hidden focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </motion.header>

    {/* Mobile Slide-Out Navigation Drawer (Public Links Only — Admin Portal Excluded on Mobile) */}
    <AnimatePresence>
      {mobileOpen && (
        <div
          id="mobile-slide-drawer"
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          {/* Dimmed Backdrop */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-[#02050e]/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Right Slide-Out Panel */}
          <motion.aside
            ref={drawerRef}
            initial={prefersReduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={prefersReduced ? undefined : { x: '100%' }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 flex w-full max-w-[320px] flex-col border-l border-white/10 bg-[#070d1e]/98 shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={siteSettings.logoUrl || DEFAULT_WEB_LOGO}
                  alt={siteSettings.siteTitle}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 shrink-0 object-contain"
                />
                <span className="font-display truncate text-base font-bold text-white">
                  {siteSettings.siteTitle}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5" aria-label="Mobile Navigation">
              {desktopLinks.map((item) => {
                const active = isRouteActive(item.route);
                const Icon = item.icon;

                return (
                  <button
                    key={item.number}
                    type="button"
                    onClick={() => handleLinkClick(item.route)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                      active
                        ? 'border-cyan-500/45 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.16)]'
                        : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-slate-400">
                        {String(item.number).padStart(2, '0')}.
                      </span>
                      <Icon
                        className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-400'}`}
                      />
                      <span className="truncate text-sm font-medium">{item.label}</span>
                    </div>

                    {active && (
                      <span className="ml-2 shrink-0 text-[11px] font-medium text-cyan-300 whitespace-nowrap">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Clean Footer Caption */}
            <div className="border-t border-white/10 px-5 py-4">
              <p className="text-xs text-slate-400">
                {siteSettings.tagline}
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
