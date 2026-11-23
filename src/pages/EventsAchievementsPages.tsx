import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ExternalLink, MapPin, Radio, Trophy } from 'lucide-react';
import {
  AchievementHero3DEmblem,
  resolveAchievementTier,
} from '../components/Achievement3DCelebration';
import { AchievementCard3D } from '../components/AchievementCard3D';
import {
  EventCountdown,
  formatColomboDateLabel,
  resolveEffectiveEventStatus,
} from '../components/EventCountdown';
import {
  AnimatedCounter,
  MorphingBackdrop,
  RevealBlock,
  SafeImage,
} from '../components/MotionPrimitives';
import { SectionEmptyState } from '../components/SectionEmptyState';
import { useData } from '../context/DataContext';
import { useUnlockedAchievements } from '../hooks/useUnlockedAchievements';
import type { AchievementTier, EventStatus } from '../types';

function renderEventStatusBadge(status: EventStatus) {
  switch (status) {
    case 'live':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00FFFF]/60 bg-[#042331]/90 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-[#00FFFF] uppercase shadow-[0_0_16px_rgba(0,255,255,0.3)] backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-85" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00FFFF]" />
          </span>
          <span>● LIVE NOW</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/50 bg-rose-950/85 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-rose-300 uppercase backdrop-blur-md">
          EVENT CANCELLED
        </span>
      );
    case 'closed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#FFD700]/45 bg-[#141208]/85 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-[#FFD700] uppercase backdrop-blur-md">
          EVENT CLOSED / COMPLETED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00FFFF]/40 bg-[#07152e]/85 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-[#00FFFF] uppercase shadow-[0_0_14px_rgba(0,255,255,0.18)] backdrop-blur-md">
          UPCOMING
        </span>
      );
  }
}

export function EventsPage() {
  const { events, eventsLoaded } = useData();
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(['Exhibition', 'Workshop', 'Competition', 'Symposium']);
    events.forEach((e) => {
      if (e.category?.trim()) cats.add(e.category.trim());
    });
    return ['All', ...Array.from(cats)];
  }, [events]);

  const years = useMemo(() => {
    const set = new Set(['2024', '2025', '2026', '2027', '2028']);
    events.forEach((e) => {
      const match = e.eventDate?.match(/\b(20\d{2})\b/);
      if (match?.[1]) set.add(match[1]);
    });
    return ['All', ...Array.from(set).sort((a, b) => b.localeCompare(a))];
  }, [events]);

  const liveCount = useMemo(
    () => events.filter((e) => resolveEffectiveEventStatus(e, nowMs) === 'live').length,
    [events, nowMs]
  );

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const effectiveStatus = resolveEffectiveEventStatus(e, nowMs);
      if (statusFilter === 'live' && effectiveStatus !== 'live') return false;
      if (statusFilter === 'upcoming' && effectiveStatus !== 'scheduled') return false;
      if (
        statusFilter === 'past' &&
        effectiveStatus !== 'closed' &&
        effectiveStatus !== 'cancelled'
      ) {
        return false;
      }
      if (
        categoryFilter !== 'All' &&
        e.category?.trim().toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (yearFilter !== 'All') {
        const evYear = e.eventDate?.match(/\b(20\d{2})\b/)?.[1] || '';
        if (evYear !== yearFilter) return false;
      }
      return true;
    });
  }, [events, statusFilter, categoryFilter, yearFilter, nowMs]);

  const hasActiveFilters =
    statusFilter !== 'all' || categoryFilter !== 'All' || yearFilter !== 'All';

  const resetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('All');
    setYearFilter('All');
  };

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealBlock className="max-w-3xl">
          <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.2em] text-[#00FFFF] uppercase">
            <Radio className="h-3.5 w-3.5 text-[#FFD700]" />
            <span>Real-Time Event Hub · Asia/Colombo</span>
          </p>
          <h1
            className="font-display mt-3 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            Exhibitions, Workshops &amp; Competitions
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Explore our upcoming technology days, hands-on workshops, competitions, and key highlights from the Technology Section.
          </p>
        </RevealBlock>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex w-fit flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#071024]/80 p-1 backdrop-blur-md">
            {(
              [
                { id: 'all', label: 'All Events' },
                { id: 'live', label: liveCount > 0 ? `Live Now (${liveCount})` : 'Live Now' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'past', label: 'Closed & Cancelled' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? tab.id === 'live'
                      ? 'bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40'
                      : 'bg-gradient-to-r from-[#00FFFF]/20 to-blue-600/40 text-white border border-[#00FFFF]/35'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter events by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1328]/90 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors focus:border-[#00FFFF]/60 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter events by year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1328]/90 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors focus:border-[#00FFFF]/60 focus:outline-none"
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr === 'All' ? 'All Years' : yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!eventsLoaded ? (
          <div className="mt-10 py-14 text-center text-sm font-medium text-slate-400">
            Loading live event schedule...
          </div>
        ) : filtered.length === 0 ? (
          <SectionEmptyState
            variant="events"
            className="mt-10"
            onResetFilters={hasActiveFilters && events.length > 0 ? resetFilters : undefined}
          />
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ev) => {
              const effectiveStatus = resolveEffectiveEventStatus(ev, nowMs);
              const isCancelled = effectiveStatus === 'cancelled';
              const isClosed = effectiveStatus === 'closed';
              const isLive = effectiveStatus === 'live';
              const actionLink = ev.liveStreamUrl?.trim() || ev.registrationLink?.trim();

              return (
                <RevealBlock key={ev.id}>
                  <article
                    className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
                      isLive
                        ? 'border-[#00FFFF]/55 bg-[#06142b]/85 shadow-[0_0_32px_rgba(0,255,255,0.14)]'
                        : isCancelled
                        ? 'border-rose-500/30 bg-[#0b1022]/65 opacity-80'
                        : isClosed
                        ? 'border-[#FFD700]/25 bg-[#091124]/75 opacity-90'
                        : 'border-white/15 bg-[#071127]/80 hover:border-[#00FFFF]/45 hover:shadow-[0_12px_36px_rgba(0,255,255,0.1)]'
                    }`}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <SafeImage
                        src={ev.imageUrl}
                        alt={ev.title}
                        fallbackLabel={ev.title}
                        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          isCancelled ? 'grayscale-[45%]' : isClosed ? 'grayscale-[25%]' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071127] via-transparent to-black/35" />

                      <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-[#FFD700]/40 bg-[#071127]/85 px-2.5 py-1 text-[11px] font-semibold text-[#FFD700] backdrop-blur-md">
                          {ev.category}
                        </span>
                      </div>

                      <div className="absolute right-3.5 top-3.5">
                        {renderEventStatusBadge(effectiveStatus)}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#00FFFF]" />
                        <span className="font-mono tabular-nums">
                          {formatColomboDateLabel(ev.eventDate, ev.startTime, ev.timeLabel)}
                        </span>
                      </div>

                      <h2
                        className={`font-display mt-2.5 text-lg font-semibold ${
                          isCancelled
                            ? 'text-slate-300 line-through decoration-rose-400/75 decoration-2'
                            : 'text-white'
                        }`}
                      >
                        {ev.title}
                      </h2>

                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                        {ev.description}
                      </p>

                      <div className="mt-4">
                        <EventCountdown event={ev} variant="detailed" />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-slate-400">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FFD700]" />
                          <span className="truncate text-slate-300">{ev.location}</span>
                        </span>
                        {actionLink && !isCancelled && !isClosed && (
                          <a
                            href={actionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#00FFFF] transition-colors hover:text-white"
                          >
                            <span>{ev.liveStreamUrl?.trim() ? 'Live Link' : 'Register'}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </RevealBlock>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function AchievementsPage() {
  const { user, achievements } = useData();
  const [levelFilter, setLevelFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState<'All' | AchievementTier>('All');

  const {
    unlockedIds,
    toggleUnlock,
  } = useUnlockedAchievements(achievements, user?.uid);

  const levels = ['All', 'International', 'National', 'Provincial', 'School'];
  const tiers: Array<'All' | AchievementTier> = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze'];

  const stats = useMemo(() => {
    const platinumOrGold = achievements.filter((a) => {
      const t = resolveAchievementTier(a);
      return t === 'Platinum' || t === 'Gold';
    }).length;
    const globalOrNational = achievements.filter(
      (a) => a.awardLevel === 'International' || a.awardLevel === 'National'
    ).length;
    return {
      total: achievements.length,
      platinumOrGold,
      globalOrNational,
      unlocked: unlockedIds.length,
    };
  }, [achievements, unlockedIds.length]);

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      const matchesLevel = levelFilter === 'All' || a.awardLevel === levelFilter;
      const matchesTier = tierFilter === 'All' || resolveAchievementTier(a) === tierFilter;
      return matchesLevel && matchesTier;
    });
  }, [achievements, levelFilter, tierFilter]);

  const activeShowcaseTier: AchievementTier = tierFilter === 'All' ? 'Gold' : tierFilter;

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Split with Animated Counters & Interactive 3D Trophy Stage */}
        <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          <RevealBlock className="flex flex-col justify-center lg:col-span-7">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-violet-300">
              <Trophy className="h-4 w-4 text-amber-300" />
              <span>Honors, Medals &amp; Recognition</span>
            </p>
            <h1
              className="font-display mt-3 font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
            >
              Technology Section Achievements
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              Celebrating the awards, competition victories, and academic milestones earned by our innovators in the Technology stream
            </p>
          </RevealBlock>

          <RevealBlock delay={0.08} className="lg:col-span-5">
            <div className="relative flex h-64 w-full flex-col justify-between overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-b from-[#0f1938] via-[#091026] to-[#050914] sm:h-72 lg:h-full lg:min-h-[260px]">
              <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 text-xs font-semibold text-blue-200">
                <Trophy className="h-4 w-4 text-violet-300" />
                <span>{activeShowcaseTier} Tier 3D Emblem</span>
              </div>
              <AchievementHero3DEmblem tier={activeShowcaseTier} />
            </div>
          </RevealBlock>
        </div>

        {/* Animated Achievement Statistics Strip */}
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="glass-surface rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-400">Total Honors</p>
            <p className="font-display mt-2 text-3xl font-bold text-white">
              <AnimatedCounter value={stats.total} />
            </p>
            <p className="mt-1 text-xs text-blue-300">Recorded Awards</p>
          </div>
          <div className="glass-surface rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-400">Platinum &amp; Gold</p>
            <p className="font-display mt-2 text-3xl font-bold text-amber-300">
              <AnimatedCounter value={stats.platinumOrGold} />
            </p>
            <p className="mt-1 text-xs text-slate-400">Top Tier Distinctions</p>
          </div>
          <div className="glass-surface rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-400">Global &amp; National</p>
            <p className="font-display mt-2 text-3xl font-bold text-violet-300">
              <AnimatedCounter value={stats.globalOrNational} />
            </p>
            <p className="mt-1 text-xs text-slate-400">Championship Citations</p>
          </div>
          <div className="glass-surface rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-400">Unlocked Milestones</p>
            <p className="font-display mt-2 text-3xl font-bold text-emerald-300">
              <AnimatedCounter value={stats.unlocked} />
            </p>
            <p className="mt-1 text-xs text-slate-400">Personal Celebrations</p>
          </div>
        </div>

        {/* Interactive Tier & Competition Level Filters */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-fit flex-wrap items-center gap-1 rounded-xl bg-white/5 p-1">
            {tiers.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  tierFilter === tier
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tier === 'All' ? 'All Tiers' : `${tier} Tier`}
              </button>
            ))}
          </div>

          <div className="flex w-fit flex-wrap items-center gap-1 rounded-xl bg-white/5 p-1">
            {levels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  levelFilter === lvl
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Animated Achievement Grid */}
        {filtered.length === 0 ? (
          <div className="mt-10 glass-surface rounded-2xl p-10 text-center text-sm text-slate-400">
            No achievements recorded matching the selected filters yet.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ach, idx) => (
              <AchievementCard3D
                key={ach.id}
                achievement={ach}
                index={idx}
                isUnlocked={unlockedIds.includes(ach.id)}
                onUnlockOrCelebrate={toggleUnlock}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
