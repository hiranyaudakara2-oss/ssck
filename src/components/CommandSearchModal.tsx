import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Cpu,
  Download,
  MessageSquare,
  Search,
  User,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { PageRoute } from '../types';
import { FullScreenOverlay, OverlayPanel, OverlayStagger } from './FullScreenOverlay';

interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: PageRoute, subjectId?: string) => void;
}

interface SearchEntry {
  id: string;
  kind: 'Subject' | 'Project' | 'Teacher' | 'Event' | 'Download' | 'History' | 'Community' | 'Member';
  title: string;
  subtitle: string;
  route: PageRoute;
  subjectId?: string;
  externalUrl?: string;
}

export function CommandSearchModal({ open, onClose, onNavigate }: CommandSearchModalProps) {
  const { subjects, projects, teachers, events, downloads, historyEvents, communityPosts, communityDirectory } =
    useData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (open) {
      setQuery('');
      const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const allEntries = useMemo<SearchEntry[]>(() => {
    return [
      ...subjects.map((s) => ({
        id: `subj-${s.id}`,
        kind: 'Subject' as const,
        title: `${s.code} — ${s.name}`,
        subtitle: s.shortDescription,
        route: 'subjects' as PageRoute,
        subjectId: s.id,
      })),
      ...projects.map((p) => ({
        id: `proj-${p.id}`,
        kind: 'Project' as const,
        title: p.title,
        subtitle: `${p.subjectCode} · ${p.studentTeam}`,
        route: 'projects' as PageRoute,
      })),
      ...teachers.map((t) => ({
        id: `teach-${t.id}`,
        kind: 'Teacher' as const,
        title: t.name,
        subtitle: `${t.department} · ${t.role}`,
        route: 'teachers-members' as PageRoute,
      })),
      ...events.map((ev) => ({
        id: `ev-${ev.id}`,
        kind: 'Event' as const,
        title: ev.title,
        subtitle: `${ev.eventDate} · ${ev.location}`,
        route: 'events' as PageRoute,
      })),
      ...downloads.map((dl) => ({
        id: `dl-${dl.id}`,
        kind: 'Download' as const,
        title: dl.title,
        subtitle: `${dl.subjectCode} · ${dl.resourceType} (${dl.fileFormat})`,
        route: 'downloads' as PageRoute,
        externalUrl: dl.fileUrl,
      })),
      ...historyEvents.map((h) => ({
        id: `hist-${h.id}`,
        kind: 'History' as const,
        title: `${h.year} — ${h.title}`,
        subtitle: h.era,
        route: 'history' as PageRoute,
      })),
      ...communityPosts.map((p) => ({
        id: `post-${p.id}`,
        kind: 'Community' as const,
        title: p.title,
        subtitle: `${p.category} · by ${p.authorName}`,
        route: 'community' as PageRoute,
      })),
      ...communityDirectory.map((m) => ({
        id: `dir-${m.id}`,
        kind: 'Member' as const,
        title: m.fullName,
        subtitle: `${m.position}${m.memberCode ? ` · ${m.memberCode}` : ''}`,
        route: 'teachers-members' as PageRoute,
      })),
    ];
  }, [subjects, projects, teachers, events, downloads, historyEvents, communityPosts, communityDirectory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allEntries.slice(0, 12);
    return allEntries
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.kind.toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [allEntries, query]);

  const renderIcon = (kind: SearchEntry['kind']) => {
    switch (kind) {
      case 'Subject':
        return <BookOpen className="h-4 w-4 text-blue-400" />;
      case 'Project':
        return <Cpu className="h-4 w-4 text-violet-400" />;
      case 'Teacher':
        return <User className="h-4 w-4 text-sky-400" />;
      case 'Event':
        return <Calendar className="h-4 w-4 text-indigo-400" />;
      case 'Download':
        return <Download className="h-4 w-4 text-emerald-400" />;
      case 'History':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'Community':
        return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      case 'Member':
        return <User className="h-4 w-4 text-cyan-300" />;
    }
  };

  const handleSelect = (entry: SearchEntry) => {
    onClose();
    if (entry.externalUrl) {
      onNavigate('downloads');
      return;
    }
    onNavigate(entry.route, entry.subjectId);
  };

  return (
    <FullScreenOverlay
      isOpen={open}
      onClose={onClose}
      ariaLabel="Quick Search"
      closeLabel="Close search"
      maxWidth="4xl"
      headerBadge={
        <div className="flex items-center gap-2 font-semibold text-blue-300">
          <Search className="h-4 w-4 text-cyan-400" />
          <span>SSCK TECH Global Search</span>
        </div>
      }
    >
      <div className="space-y-6">
        <OverlayStagger delay={0.06}>
          <OverlayPanel className="p-2 transition-shadow focus-within:border-cyan-400/50 focus-within:shadow-[0_0_50px_-10px_rgba(34,211,238,0.45)]">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-cyan-400" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subjects, faculty, projects, events, history, or members..."
                className="w-full bg-transparent text-base text-white placeholder:text-slate-400 focus:outline-none sm:text-lg"
              />
            </div>
          </OverlayPanel>
        </OverlayStagger>

        <OverlayStagger delay={0.14}>
          {filtered.length === 0 ? (
            <OverlayPanel className="py-14 text-center text-sm text-slate-400">
              No matching records found for &ldquo;{query}&rdquo;.
            </OverlayPanel>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {filtered.map((item, idx) => (
                <motion.li
                  key={item.id}
                  initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReduced ? 0 : 0.24,
                    delay: prefersReduced ? 0 : Math.min(idx * 0.025, 0.25),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <motion.button
                    type="button"
                    onClick={() => handleSelect(item)}
                    whileHover={prefersReduced ? undefined : { y: -2, scale: 1.01 }}
                    whileTap={prefersReduced ? undefined : { scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    className="group flex h-full w-full items-center justify-between gap-3 rounded-2xl border border-blue-400/15 bg-gradient-to-br from-[#0b1533]/90 to-[#070e22]/95 p-4 text-left shadow-lg backdrop-blur-md transition-colors hover:border-cyan-400/45 hover:shadow-[0_12px_28px_-10px_rgba(59,130,246,0.35)]"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] transition-colors group-hover:border-cyan-400/35 group-hover:bg-blue-500/15">
                        {renderIcon(item.kind)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white group-hover:text-cyan-100">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {item.kind} · {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-cyan-300" />
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          )}
        </OverlayStagger>
      </div>
    </FullScreenOverlay>
  );
}
