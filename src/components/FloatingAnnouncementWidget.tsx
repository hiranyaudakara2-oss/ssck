import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Calendar,
  ChevronDown,
  FileText,
  Info,
  Megaphone,
  User,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { DEFAULT_WEB_LOGO } from '../data/seedDefaults';
import type { Announcement, PageRoute } from '../types';
import { normalizeMediaUrl } from '../utils/validation';

interface FloatingAnnouncementWidgetProps {
  onNavigate: (route: PageRoute, subjectId?: string) => void;
}

const READ_IDS_STORAGE_KEY = 'ssck_tech_read_announcement_ids';

function loadReadAnnouncementIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(READ_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    return Array.from(new Set(valid));
  } catch {
    return [];
  }
}

function persistReadAnnouncementIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore restricted storage modes
  }
}

export function FloatingAnnouncementWidget({ onNavigate }: FloatingAnnouncementWidgetProps) {
  const { announcements, announcementsLoaded, siteSettings } = useData();
  const prefersReduced = Boolean(useReducedMotion());

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'important' | 'general'>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<string[]>(() => loadReadAnnouncementIds());
  const containerRef = useRef<HTMLDivElement>(null);

  const widgetImageUrl =
    normalizeMediaUrl(siteSettings.floatingWidgetImageUrl || siteSettings.logoUrl) ||
    DEFAULT_WEB_LOGO;

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.pinnedToHome !== b.pinnedToHome) return a.pinnedToHome ? -1 : 1;
      return (b.publishDate || '').localeCompare(a.publishDate || '');
    });
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return selectedFilter === 'all'
      ? sortedAnnouncements
      : sortedAnnouncements.filter((item) => item.priority === selectedFilter);
  }, [sortedAnnouncements, selectedFilter]);

  const readIdSet = useMemo(() => new Set(readIds), [readIds]);

  const unreadCount = useMemo(() => {
    if (!announcementsLoaded) return 0;
    return sortedAnnouncements.filter((item) => !readIdSet.has(item.id)).length;
  }, [announcementsLoaded, sortedAnnouncements, readIdSet]);

  const hasUnread = unreadCount > 0;

  const urgentCount = useMemo(
    () => sortedAnnouncements.filter((item) => item.priority === 'urgent').length,
    [sortedAnnouncements]
  );

  // Sync per-item read state across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === READ_IDS_STORAGE_KEY) {
        setReadIds(loadReadAnnouncementIds());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const markAnnouncementAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      persistReadAnnouncementIds(next);
      return next;
    });
  }, []);

  // Close on Escape key or clicking outside the widget card
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  // Toggle the announcements list without clearing any unread announcement badges
  const handleToggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggleItem = (id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
    markAnnouncementAsRead(id);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    onNavigate('home');
    window.setTimeout(() => {
      const el = document.getElementById('latest-announcements-section');
      if (el) {
        el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      }
    }, 140);
  };

  const renderPriorityMeta = (priority: Announcement['priority']) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Urgent Notice</span>
        </span>
      );
    }
    if (priority === 'important') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Important</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
        <FileText className="h-3.5 w-3.5 shrink-0" />
        <span>General Circular</span>
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-4 left-4 z-40 flex flex-col items-start gap-3 sm:bottom-5 sm:left-5"
    >
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            key="floating-announcement-card"
            role="dialog"
            aria-label="Latest announcements popup"
            initial={
              prefersReduced
                ? false
                : { opacity: 0, scale: 0.92, y: 18, x: -8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={
              prefersReduced
                ? undefined
                : { opacity: 0, scale: 0.92, y: 16, x: -8 }
            }
            transition={{
              type: prefersReduced ? 'tween' : 'spring',
              stiffness: 340,
              damping: 27,
              duration: prefersReduced ? 0 : undefined,
            }}
            style={{ transformOrigin: 'bottom left' }}
            className="pointer-events-auto relative flex max-h-[min(32rem,calc(100vh-8rem))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-cyan-400/35 bg-[#070f24]/95 shadow-[0_24px_64px_rgba(2,6,23,0.92),0_0_38px_rgba(34,211,238,0.18)] backdrop-blur-2xl"
          >
            {/* Top gradient accent hairline */}
            <div
              aria-hidden="true"
              className="h-[2px] w-full shrink-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
            />

            {/* Header with Provided Photo + Easy Close Button */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0a1430]/90 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-400/30 bg-[#050b1c] p-1 shadow-[0_0_16px_rgba(34,211,238,0.2)]">
                  <img
                    src={widgetImageUrl}
                    alt={siteSettings.siteTitle}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Megaphone className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    <h3 className="font-display truncate text-sm font-bold text-white sm:text-base">
                      Latest Announcements
                    </h3>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {sortedAnnouncements.length}{' '}
                    {sortedAnnouncements.length === 1 ? 'active notice' : 'active notices'}
                    {unreadCount > 0
                      ? ` · ${unreadCount} unread`
                      : sortedAnnouncements.length > 0
                        ? ' · All read'
                        : ''}
                    {urgentCount > 0 ? ` · ${urgentCount} urgent` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close announcements popup"
                title="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Segmented Priority Filter Bar */}
            {sortedAnnouncements.length > 1 && (
              <div className="shrink-0 border-b border-white/10 bg-[#081028] px-4 py-2">
                <div className="grid grid-cols-4 gap-1 rounded-lg bg-[#050b1c] p-1">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'urgent', label: 'Urgent' },
                      { id: 'important', label: 'Important' },
                      { id: 'general', label: 'General' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedFilter(tab.id)}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                        selectedFilter === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements Scrollable List */}
            <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-white/10">
              {!announcementsLoaded ? (
                <div className="px-5 py-10 text-center text-xs text-slate-400">
                  Loading latest announcements...
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                  <BellRing className="h-7 w-7 text-slate-500" />
                  <p className="mt-3 text-sm font-medium text-slate-200">
                    No announcements match this filter
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedFilter !== 'all'
                      ? 'Switch back to All to inspect every active notice.'
                      : 'New circulars and campus updates will appear here automatically.'}
                  </p>
                  {selectedFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedFilter('all')}
                      className="mt-4 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-white/10"
                    >
                      Show All Announcements
                    </button>
                  )}
                </div>
              ) : (
                filteredAnnouncements.map((item, idx) => {
                  const isExpanded = expandedItemId === item.id;
                  const isRead = readIdSet.has(item.id);
                  const cleanImage = normalizeMediaUrl(item.imageUrl);
                  return (
                    <motion.div
                      key={item.id}
                      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: prefersReduced ? 0 : 0.2,
                        delay: prefersReduced ? 0 : Math.min(idx * 0.04, 0.2),
                      }}
                      className={`transition-colors hover:bg-white/[0.03] ${
                        !isRead ? 'bg-cyan-500/[0.04]' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        aria-expanded={isExpanded}
                        className="w-full px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-cyan-400"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            {!isRead && (
                              <span
                                aria-label="Unread announcement"
                                className="inline-flex h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                              />
                            )}
                            {renderPriorityMeta(item.priority)}
                            {item.pinnedToHome && (
                              <>
                                <span aria-hidden="true" className="text-slate-600">
                                  ·
                                </span>
                                <span className="text-[11px] font-medium text-violet-300">
                                  Pinned
                                </span>
                              </>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {item.publishDate}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-start justify-between gap-2">
                          <h4
                            className={`font-display text-sm leading-snug ${
                              !isRead ? 'font-bold text-white' : 'font-semibold text-slate-200'
                            }`}
                          >
                            {item.title}
                          </h4>
                          <ChevronDown
                            className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-cyan-300' : ''
                            }`}
                          />
                        </div>

                        <p
                          className={`mt-1 text-xs leading-relaxed text-slate-300 ${
                            isExpanded ? '' : 'line-clamp-2'
                          }`}
                        >
                          {item.summary}
                        </p>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={prefersReduced ? false : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={prefersReduced ? undefined : { opacity: 0, height: 0 }}
                            transition={{
                              duration: prefersReduced ? 0 : 0.2,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2.5 px-4 pb-4">
                              {cleanImage && (
                                <img
                                  src={cleanImage}
                                  alt={item.title}
                                  referrerPolicy="no-referrer"
                                  className="max-h-40 w-full rounded-xl border border-white/10 object-cover"
                                />
                              )}
                              {item.body && item.body !== item.summary && (
                                <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                                  {item.body}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <User className="h-3 w-3 text-slate-500" />
                                <span>Issued by {item.authorName || 'Technology Office'}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Action */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#060c1f] px-4 py-3">
              <button
                type="button"
                onClick={handleViewAll}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <span>View Announcements Section</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/15 hover:text-white"
              >
                Close
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Announcements Launcher Button (badge stays visible until each announcement is opened) */}
      <motion.button
        key="floating-announcement-launcher"
        type="button"
        onClick={handleToggleOpen}
        aria-label={
          unreadCount > 0
            ? `Toggle latest announcements (${unreadCount} unread)`
            : 'Toggle latest announcements'
        }
        aria-expanded={isOpen}
        title="View Latest Announcements"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.7, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={prefersReduced ? undefined : { scale: 1.07, y: -3 }}
        whileTap={prefersReduced ? undefined : { scale: 0.94 }}
        transition={{
          type: prefersReduced ? 'tween' : 'spring',
          stiffness: 380,
          damping: 26,
          duration: prefersReduced ? 0 : undefined,
        }}
        className="pointer-events-auto group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/40 bg-[#070f26]/95 p-1.5 shadow-[0_14px_34px_rgba(3,7,18,0.85),0_0_26px_rgba(34,211,238,0.22)] backdrop-blur-xl transition-colors hover:border-cyan-300/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:h-16 sm:w-16"
      >
        {/* Ambient radial glow halo */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-blue-500/20 to-violet-500/25 blur-md transition-opacity duration-300 ${
            hasUnread ? 'opacity-90' : 'opacity-45 group-hover:opacity-85'
          }`}
        />

        {/* Subtle pulsing ring when unread announcements are present */}
        {hasUnread && !prefersReduced && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 animate-ping rounded-2xl border border-cyan-400/45 opacity-40"
            style={{ animationDuration: '2.6s' }}
          />
        )}

        {/* Inner framed neon blue Announcements logo surface */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-950/95 via-blue-900/80 to-indigo-950/95 p-1.5 shadow-[0_0_25px_rgba(34,211,238,0.8)]">
          <div className="absolute inset-0 bg-cyan-400/10 animate-pulse" />
          <Megaphone className="relative z-10 h-6 w-6 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,1)] transition-transform duration-300 group-hover:scale-110" />
        </div>

        {/* Live Unread Notification Counter Badge */}
        {unreadCount > 0 && (
          <span
            data-testid="announcements-unread-badge"
            aria-label={`${unreadCount} unread ${unreadCount === 1 ? 'announcement' : 'announcements'}`}
            className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-1.5 font-mono text-[10px] font-bold tabular-nums text-white shadow-lg shadow-cyan-500/40 ring-2 ring-[#050914]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
