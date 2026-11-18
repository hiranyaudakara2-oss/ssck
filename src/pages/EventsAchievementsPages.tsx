import { useMemo, useState } from 'react';
import { Calendar, ExternalLink, MapPin, Trophy } from 'lucide-react';
import {
  AchievementHero3DEmblem,
  resolveAchievementTier,
} from '../components/Achievement3DCelebration';
import { AchievementCard3D } from '../components/AchievementCard3D';
import { EventCountdown } from '../components/EventCountdown';
import {
  FullScreenOverlay,
  OverlayActionButton,
  OverlayMediaFrame,
  OverlayPanel,
  OverlayStagger,
} from '../components/FullScreenOverlay';
import {
  AnimatedCounter,
  MorphingBackdrop,
  RevealBlock,
  SafeImage,
} from '../components/MotionPrimitives';
import { SectionEmptyState } from '../components/SectionEmptyState';
import { useData } from '../context/DataContext';
import type { AchievementTier, CampusEvent } from '../types';

export function EventsPage() {
  const { events, eventsLoaded } = useData();
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);

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

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (statusFilter === 'upcoming' && !e.isUpcoming) return false;
      if (statusFilter === 'past' && e.isUpcoming) return false;
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
  }, [events, statusFilter, categoryFilter, yearFilter]);

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
          <h1
            className="font-display mt-3 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            Exhibitions, Workshops & Competitions
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Stay synchronized with Technology Section symposiums, hands-on bootcamps, and robotics challenges.
          </p>
        </RevealBlock>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex w-fit items-center gap-1 rounded-xl bg-white/5 p-1">
            {(
              [
                { id: 'all', label: 'All Events' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'past', label: 'Past Archive' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white'
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
              className="rounded-xl border border-white/10 bg-[#0b1328]/90 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors focus:border-blue-400/50 focus:outline-none"
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
              className="rounded-xl border border-white/10 bg-[#0b1328]/90 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors focus:border-blue-400/50 focus:outline-none"
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
            Loading events...
          </div>
        ) : filtered.length === 0 ? (
          <SectionEmptyState
            variant="events"
            className="mt-10"
            onResetFilters={hasActiveFilters && events.length > 0 ? resetFilters : undefined}
          />
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ev) => (
              <RevealBlock key={ev.id}>
                <article
                  onClick={() => setSelectedEvent(ev)}
                  className="glass-surface group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl transition-colors hover:border-blue-500/40"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <SafeImage
                      src={ev.imageUrl}
                      alt={ev.title}
                      fallbackLabel={ev.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-blue-300">{ev.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ev.isUpcoming ? 'Upcoming' : 'Completed'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{ev.eventDate}</span>
                    </div>
                    <h2 className="font-display mt-2 text-lg font-semibold text-white">
                      {ev.title}
                    </h2>
                    <p className="mt-2 flex-1 line-clamp-3 text-sm text-slate-300">
                      {ev.description}
                    </p>
                    {ev.isUpcoming && (
                      <div className="mt-4">
                        <EventCountdown event={ev} variant="compact" />
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-4 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>
                </article>
              </RevealBlock>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen Event Details Overlay */}
      <FullScreenOverlay
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        ariaLabel={selectedEvent ? `Event Details: ${selectedEvent.title}` : 'Event Details'}
        closeLabel="Close event details"
        maxWidth="4xl"
        headerBadge={
          selectedEvent && (
            <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
              <span className="font-semibold text-blue-300">{selectedEvent.category}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-cyan-300">
                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                {selectedEvent.eventDate}
              </span>
              {selectedEvent.timeLabel && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-300">{selectedEvent.timeLabel}</span>
                </>
              )}
            </div>
          )
        }
      >
        {selectedEvent && (
          <OverlayPanel>
            <OverlayMediaFrame className="aspect-[16/9] max-h-[380px] w-full border-b border-blue-400/15">
              <SafeImage
                src={selectedEvent.imageUrl}
                alt={selectedEvent.title}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081028] via-[#081028]/20 to-transparent" />
            </OverlayMediaFrame>

            <div className="p-6 sm:p-10">
              <OverlayStagger delay={0.07}>
                <h2 className="font-display bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-2xl font-bold text-transparent sm:text-4xl">
                  {selectedEvent.title}
                </h2>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-300 sm:text-base">
                  <MapPin className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span>{selectedEvent.location}</span>
                </p>
              </OverlayStagger>

              {selectedEvent.isUpcoming && (
                <OverlayStagger delay={0.14}>
                  <div className="mt-6">
                    <EventCountdown event={selectedEvent} variant="detailed" />
                  </div>
                </OverlayStagger>
              )}

              <OverlayStagger delay={0.21}>
                <p className="mt-6 text-sm leading-relaxed text-slate-200 whitespace-pre-line sm:text-base">
                  {selectedEvent.description}
                </p>
              </OverlayStagger>

              <OverlayStagger delay={0.27}>
                <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-6">
                  {selectedEvent.registrationLink && (
                    <OverlayActionButton
                      variant="primary"
                      href={selectedEvent.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Open Registration</span>
                      <ExternalLink className="h-4 w-4" />
                    </OverlayActionButton>
                  )}
                  <OverlayActionButton variant="secondary" onClick={() => setSelectedEvent(null)}>
                    Close
                  </OverlayActionButton>
                </div>
              </OverlayStagger>
            </div>
          </OverlayPanel>
        )}
      </FullScreenOverlay>
    </div>
  );
}

export function AchievementsPage() {
  const { achievements } = useData();
  const [levelFilter, setLevelFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState<'All' | AchievementTier>('All');

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
      unlocked: achievements.length,
    };
  }, [achievements]);

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
              Explore Platinum, Gold, Silver, and Bronze honors earned across national robotics championships, international Olympiads, and student research milestones.
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
                isUnlocked={true}
                onUnlockOrCelebrate={() => {}}
                onNavigateCard={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
