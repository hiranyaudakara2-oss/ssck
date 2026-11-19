import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ShieldAlert, Sparkles, ChevronRight, X, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';

export function AnnouncementNotificationDropdown({ onNavigate }: { onNavigate: (route: any) => void }) {
  const { announcements } = useData();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track unread announcements using localStorage
  useEffect(() => {
    if (!announcements || announcements.length === 0) {
      setUnreadCount(0);
      return;
    }
    const lastReadId = localStorage.getItem('techsphere_last_read_announcement_id');
    if (!lastReadId) {
      setUnreadCount(announcements.length);
      return;
    }
    const index = announcements.findIndex((a) => a.id === lastReadId);
    if (index === -1) {
      setUnreadCount(announcements.length);
    } else {
      setUnreadCount(index);
    }
  }, [announcements]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && announcements.length > 0) {
      // Mark all as read up to the most recent announcement
      localStorage.setItem('techsphere_last_read_announcement_id', announcements[0].id);
      setUnreadCount(0);
    }
  };

  const handleItemClick = () => {
    setOpen(false);
    onNavigate('home');
    const el = document.getElementById('latest-announcements-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all focus-visible:outline-2 focus-visible:outline-cyan-400"
        aria-label="Announcements & Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-lg shadow-blue-600/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-3 w-80 sm:w-96 overflow-hidden rounded-2xl border border-blue-500/30 bg-[#081126] shadow-2xl shadow-blue-950/70 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0b142d] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h4 className="font-display text-sm font-bold text-white">Campus Notifications</h4>
              </div>
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                {announcements.length} Notices
              </span>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
              {announcements.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active announcements found.
                </div>
              ) : (
                announcements.slice(0, 5).map((item) => {
                  const isUrgent = item.priority === 'urgent';
                  return (
                    <div
                      key={item.id}
                      onClick={handleItemClick}
                      className="group cursor-pointer rounded-xl p-3 hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isUrgent ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {item.publishDate}
                        </span>
                      </div>
                      <h5 className="font-display text-xs font-bold text-white mt-1.5 group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-[#060d20] px-4 py-2.5 text-center">
              <button
                type="button"
                onClick={handleItemClick}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>View all announcements on homepage</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
