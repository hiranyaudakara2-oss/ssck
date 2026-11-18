import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Calendar,
  Clock,
  Cpu,
  Cuboid,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Info,
  MapPin,
  Search,
  Trophy,
  Users,
} from 'lucide-react';
import {
  AchievementUnlockModal,
  resolveAchievementTier,
} from '../components/Achievement3DCelebration';
import { AchievementCard3D } from '../components/AchievementCard3D';
import { CustomLinksSlot } from '../components/CustomLinksSlot';
import { EventCountdown } from '../components/EventCountdown';
import { Hero3DObject } from '../components/Hero3DObject';
import { HoverInfoBox } from '../components/HoverInfoBox';
import {
  AnimatedCounter,
  MagneticButton,
  MorphingBackdrop,
  RevealBlock,
  SafeImage,
  TiltCard,
} from '../components/MotionPrimitives';
import { Robotics3DShowcase } from '../components/Robotics3DShowcase';
import { Scroll3DShowcase } from '../components/Scroll3DShowcase';
import { SectionEmptyState } from '../components/SectionEmptyState';
import { useData } from '../context/DataContext';
import { HERO_CAMPUS_IMAGE } from '../data/seedDefaults';
import { useUnlockedAchievements } from '../hooks/useUnlockedAchievements';
import type { PageRoute } from '../types';

interface HomePageProps {
  onNavigate: (route: PageRoute, subjectId?: string) => void;
  onOpenSearch?: () => void;
  defer3D?: boolean;
}

function Lazy3DViewport({
  disabled = false,
  minHeight = '520px',
  children,
}: {
  disabled?: boolean;
  minHeight?: string;
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (disabled || activated) return;
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setActivated(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActivated(true);
          io.disconnect();
        }
      },
      { rootMargin: '500px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [disabled, activated]);

  return (
    <div ref={hostRef} style={!activated ? { minHeight } : undefined}>
      {activated ? children : null}
    </div>
  );
}

export function HomePage({ onNavigate, onOpenSearch, defer3D = false }: HomePageProps) {
  const {
    user,
    siteSettings,
    subjects,
    announcements,
    announcementsLoaded,
    events,
    eventsLoaded,
    achievements,
    projects,
    historyEvents,
  } = useData();

  const {
    unlockedIds,
    celebratingAchievement,
    unlockAndCelebrate,
    dismissCelebration,
  } = useUnlockedAchievements(achievements, user?.uid);

  const [heroView, setHeroView] = useState<'3d' | 'campus'>('3d');
  const [annCategoryFilter, setAnnCategoryFilter] = useState<'all' | 'urgent' | 'important' | 'general'>('all');
  const [annYearFilter, setAnnYearFilter] = useState<string>('all');
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');
  const [eventYearFilter, setEventYearFilter] = useState<string>('all');
  const prefersReduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroRotateX = useTransform(heroScroll, [0, 1], [0, 7]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.96]);
  const heroY = useTransform(heroScroll, [0, 1], [0, 26]);

  const announcementYears = useMemo(() => {
    const years = new Set(['2024', '2025', '2026', '2027', '2028']);
    announcements.forEach((a) => {
      const match = a.publishDate?.match(/\b(20\d{2})\b/);
      if (match?.[1]) years.add(match[1]);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [announcements]);

  const eventCategories = useMemo(() => {
    const cats = new Set(['Exhibition', 'Workshop', 'Competition', 'Symposium']);
    events.forEach((e) => {
      if (e.category?.trim()) cats.add(e.category.trim());
    });
    return Array.from(cats);
  }, [events]);

  const eventYears = useMemo(() => {
    const years = new Set(['2024', '2025', '2026', '2027', '2028']);
    events.forEach((e) => {
      const match = e.eventDate?.match(/\b(20\d{2})\b/);
      if (match?.[1]) years.add(match[1]);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [events]);

  const pinnedAnnouncements = useMemo(() => {
    return announcements
      .filter((item) => {
        const matchesCat = annCategoryFilter === 'all' || item.priority === annCategoryFilter;
        const itemYear = item.publishDate?.match(/\b(20\d{2})\b/)?.[1] || '';
        const matchesYear = annYearFilter === 'all' || itemYear === annYearFilter;
        return matchesCat && matchesYear;
      })
      .slice(0, 3);
  }, [announcements, annCategoryFilter, annYearFilter]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (!e.isUpcoming) return false;
        const matchesCat =
          eventCategoryFilter === 'all' ||
          e.category?.trim().toLowerCase() === eventCategoryFilter.toLowerCase();
        const evYear = e.eventDate?.match(/\b(20\d{2})\b/)?.[1] || '';
        const matchesYear = eventYearFilter === 'all' || evYear === eventYearFilter;
        return matchesCat && matchesYear;
      })
      .slice(0, 3);
  }, [events, eventCategoryFilter, eventYearFilter]);

  const hasAnnFilter = annCategoryFilter !== 'all' || annYearFilter !== 'all';
  const hasEventFilter = eventCategoryFilter !== 'all' || eventYearFilter !== 'all';
  const featuredAchievements = achievements.slice(0, 3);
  const featuredProjects = projects.slice(0, 3);

  const renderPriorityLabel = (priority: string) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" />
          Urgent Notice
        </span>
      );
    }
    if (priority === 'important') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300">
          <Info className="h-3.5 w-3.5" />
          Important
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <FileText className="h-3.5 w-3.5" />
        General Circular
      </span>
    );
  };

  return (
    <div className="relative overflow-x-clip">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative overflow-hidden border-b border-white/10 bg-transparent pt-14 pb-16 sm:pt-20 sm:pb-24"
      >
        <MorphingBackdrop variant="hero" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Copy Column */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-sm font-medium text-blue-300">
                {siteSettings.tagline}
              </p>

              <h1
                className="font-display mt-4 font-bold tracking-tight text-white"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.65rem)',
                  lineHeight: 1.08,
                  textWrap: 'balance',
                }}
              >
                {siteSettings.heroTitle}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Journey into the SSCK Technology Section—where scientific exploration meets engineering creativity across six core technology disciplines. Celebrating student projects, innovations, and competition milestones, we inspire young minds, nurture teamwork and practical skills, and empower future innovators to build a smarter, sustainable world.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <HoverInfoBox
                  className="inline-block"
                  title="Explore Academic Curriculum"
                  badge="6 Core Streams"
                  description="Inspect SFT, Engineering Technology, ICT, Bio Systems, Agriculture & Geography syllabi and lab specs."
                  icon={<GraduationCap className="h-3.5 w-3.5" />}
                >
                  <MagneticButton
                    onClick={() => onNavigate('subjects')}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500"
                  >
                    <span>Explore Subjects</span>
                    <ArrowRight className="h-4 w-4" />
                  </MagneticButton>
                </HoverInfoBox>

                <HoverInfoBox
                  className="inline-block"
                  title="Engineering & Bio-Tech Showcase"
                  badge="Capstone Builds"
                  description="Browse robotics prototypes, autonomous farm sensors, and student software systems."
                  icon={<Cpu className="h-3.5 w-3.5" />}
                >
                  <MagneticButton
                    onClick={() => onNavigate('projects')}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <span>View Student Projects</span>
                  </MagneticButton>
                </HoverInfoBox>

                {onOpenSearch && (
                  <button
                    type="button"
                    onClick={onOpenSearch}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:text-white whitespace-nowrap shrink-0"
                  >
                    <Search className="h-3.5 w-3.5 text-blue-400" />
                    <span>Quick Search (Ctrl+K)</span>
                  </button>
                )}
              </div>

              <CustomLinksSlot targetSection="home-hero" onNavigate={onNavigate} />
            </div>

            {/* Right Interactive 3D Gyroscope + Campus Visual Column with Scroll Depth Parallax */}
            <div className="relative lg:col-span-6" style={{ perspective: '1200px' }}>
              <motion.div
                style={
                  prefersReduced
                    ? undefined
                    : {
                        rotateX: heroRotateX,
                        scale: heroScale,
                        y: heroY,
                      }
                }
                className="relative h-full min-h-[340px] overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-b from-[#0b1533] via-[#070d1f] to-[#050914] will-change-transform sm:min-h-[390px]"
              >
                {/* Top-Right Compact Mode Switcher (No backdrop-filter over WebGL) */}
                <div className="absolute right-4 top-4 z-20 inline-flex items-center gap-1 rounded-xl border border-white/15 bg-[#070d1e]/92 p-1">
                  <button
                    type="button"
                    onClick={() => setHeroView('3d')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      heroView === '3d'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Cuboid className="h-3.5 w-3.5" />
                    <span>3D Gyro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroView('campus')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      heroView === 'campus'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Campus</span>
                  </button>
                </div>

                {heroView === '3d' ? (
                  <div className="relative flex h-[340px] w-full flex-col justify-between sm:h-[400px]">
                    {!defer3D ? (
                      <Hero3DObject className="h-full w-full" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-950/40 via-[#070d1f] to-violet-950/30" />
                    )}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#050914] via-[#050914]/70 to-transparent p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-blue-300">
                        <span>Interactive 3D Core</span>
                        <span aria-hidden="true">·</span>
                        <span>Drag to Orbit · Click to Energize</span>
                      </div>
                      <p className="font-display mt-1.5 text-lg font-semibold text-white">
                        SSCK TECH Quantum & Mechatronics Telemetry
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-[340px] w-full sm:h-[400px]">
                    <SafeImage
                      src={siteSettings.heroBannerUrl || HERO_CAMPUS_IMAGE}
                      alt="School Technology Section Innovation Center"
                      fallbackLabel={siteSettings.siteTitle}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050914]/90 via-[#050914]/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        <span>Applied Laboratories</span>
                        <span aria-hidden="true">·</span>
                        <span>SFT · ET · ICT · BST · Agriculture · Geography</span>
                      </div>
                      <p className="font-display mt-1.5 text-lg font-semibold text-white">
                        Interdisciplinary Engineering & Bio-Systems Campus
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Full-Width Animated KPI Strip */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-white/10 pt-10 md:grid-cols-4 md:gap-8">
            <HoverInfoBox
              title="Technology Students"
              badge="ET & BST Cohort"
              description="Active students enrolled across Engineering Technology and Bio Systems Technology streams."
              icon={<Users className="h-3.5 w-3.5" />}
            >
              <div
                onClick={() => onNavigate('teachers-members')}
                className="glass-surface h-full cursor-pointer rounded-xl p-5 transition-colors hover:border-blue-400/40"
              >
                <p className="text-xs font-medium text-slate-400">Technology Students</p>
                <p className="font-display mt-2 text-3xl font-bold text-white">
                  <AnimatedCounter value={siteSettings.statsStudents ?? 640} suffix="+" />
                </p>
                <p className="mt-1 text-xs text-slate-400">Active ET &amp; BST Scholars</p>
              </div>
            </HoverInfoBox>

            <HoverInfoBox
              title="Engineering & Research Prototypes"
              badge="Innovation Index"
              description="Hardware controllers, automation rigs, and digital systems engineered inside our laboratories."
              icon={<Cpu className="h-3.5 w-3.5" />}
            >
              <div className="glass-surface h-full rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400">Student Prototypes</p>
                <p className="font-display mt-2 text-3xl font-bold text-white">
                  <AnimatedCounter value={siteSettings.statsProjects ?? 128} suffix="+" />
                </p>
                <p className="mt-1 text-xs text-slate-400">Hardware & Software Builds</p>
              </div>
            </HoverInfoBox>

            <HoverInfoBox
              title="Institutional Honors & Medals"
              badge="Awards Record"
              description="National engineering competitions, science fairs, and international robotics medals."
              icon={<Trophy className="h-3.5 w-3.5" />}
            >
              <div className="glass-surface h-full rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400">Honors & Medals</p>
                <p className="font-display mt-2 text-3xl font-bold text-white">
                  <AnimatedCounter value={siteSettings.statsAwards ?? 42} />
                </p>
                <p className="mt-1 text-xs text-slate-400">National & Global Awards</p>
              </div>
            </HoverInfoBox>

            <HoverInfoBox
              title="University Qualification Benchmark"
              badge="Academic Excellence"
              description="Percentage of technology stream graduates qualifying for engineering and applied science faculties."
              icon={<Award className="h-3.5 w-3.5" />}
            >
              <div className="glass-surface h-full rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400">University Qualification</p>
                <p className="font-display mt-2 text-3xl font-bold text-white">
                  <AnimatedCounter value={siteSettings.statsPassRate ?? 98.4} suffix="%" decimals={1} />
                </p>
                <p className="mt-1 text-xs text-slate-400">Cohort Assessment Rate</p>
              </div>
            </HoverInfoBox>
          </div>
        </div>
      </section>

      {/* Scroll-Driven 3D Engineering Showcase */}
      <Lazy3DViewport disabled={defer3D} minHeight="560px">
        <Scroll3DShowcase onNavigate={onNavigate} />
      </Lazy3DViewport>

      {/* Featured Technology Subjects */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <MorphingBackdrop variant="section" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealBlock className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-blue-400">Academic Programs</p>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
                Six Core Technology Disciplines
              </h2>
            </div>
          </RevealBlock>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, idx) => (
              <RevealBlock key={subject.id} delay={idx * 0.04}>
                <HoverInfoBox
                  className="h-full"
                  title={`${subject.code} · ${subject.name}`}
                  badge={subject.headTeacherName || 'Technology Faculty'}
                  description={
                    subject.labFacilities ||
                    'Click to inspect curriculum modules, lab resources, and downloadable materials.'
                  }
                  icon={<GraduationCap className="h-3.5 w-3.5" />}
                >
                  <TiltCard
                    onClick={() => onNavigate('subjects', subject.id)}
                    className="group flex h-full flex-col overflow-hidden"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <SafeImage
                        src={subject.imageUrl}
                        alt={subject.name}
                        fallbackLabel={`${subject.code} · ${subject.name}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d152c] via-transparent to-transparent" />
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-2 text-xs text-blue-300">
                        <span className="font-mono font-semibold">{subject.code}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate text-slate-400">
                          {subject.headTeacherName || 'Technology Faculty'}
                        </span>
                      </div>

                      <h3 className="font-display mt-2 text-xl font-semibold text-white">
                        {subject.name}
                      </h3>

                      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-300">
                        {subject.shortDescription}
                      </p>

                      <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-blue-300 group-hover:text-white">
                        <span>Open Subject Resources</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </TiltCard>
                </HoverInfoBox>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Announcements & Upcoming Events */}
      <section className="border-y border-white/10 bg-[#080f23]/45 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Announcements Column */}
            <div className="lg:col-span-6">
              <RevealBlock className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-violet-300">Department Circulars</p>
                  <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
                    Latest Announcements
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter announcements by category"
                    value={annCategoryFilter}
                    onChange={(e) =>
                      setAnnCategoryFilter(
                        e.target.value as 'all' | 'urgent' | 'important' | 'general'
                      )
                    }
                    className="rounded-lg border border-white/10 bg-[#0b1328]/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:border-violet-400/50 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="urgent">Urgent</option>
                    <option value="important">Important</option>
                    <option value="general">General</option>
                  </select>
                  <select
                    aria-label="Filter announcements by year"
                    value={annYearFilter}
                    onChange={(e) => setAnnYearFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0b1328]/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:border-violet-400/50 focus:outline-none"
                  >
                    <option value="all">All Years</option>
                    {announcementYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </RevealBlock>

              <div className="mt-8 space-y-4">
                {!announcementsLoaded ? (
                  <div className="py-10 text-center text-xs font-medium text-slate-400">
                    Loading announcements...
                  </div>
                ) : pinnedAnnouncements.length === 0 ? (
                  <SectionEmptyState
                    variant="announcements"
                    compact
                    onResetFilters={
                      hasAnnFilter && announcements.length > 0
                        ? () => {
                            setAnnCategoryFilter('all');
                            setAnnYearFilter('all');
                          }
                        : undefined
                    }
                  />
                ) : (
                  pinnedAnnouncements.map((item) => (
                    <RevealBlock key={item.id}>
                      <article className="glass-surface rounded-xl p-5 transition-colors hover:border-blue-500/35">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {renderPriorityLabel(item.priority)}
                          <span className="font-mono text-xs tabular-nums text-slate-400">
                            {item.publishDate}
                          </span>
                        </div>
                        <h3 className="font-display mt-2.5 text-lg font-semibold text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                          {item.summary}
                        </p>
                        <p className="mt-3 text-xs text-slate-400">
                          Issued by {item.authorName || 'Technology Office'}
                        </p>
                      </article>
                    </RevealBlock>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events Column */}
            <div className="lg:col-span-6">
              <RevealBlock className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-300">Tech Calendar</p>
                  <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
                    Upcoming Events
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter upcoming events by category"
                    value={eventCategoryFilter}
                    onChange={(e) => setEventCategoryFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0b1328]/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:border-blue-400/50 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {eventCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter upcoming events by year"
                    value={eventYearFilter}
                    onChange={(e) => setEventYearFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0b1328]/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:border-blue-400/50 focus:outline-none"
                  >
                    <option value="all">All Years</option>
                    {eventYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onNavigate('events')}
                    className="inline-flex items-center gap-1.5 pl-1 text-xs font-semibold text-blue-300 hover:text-white whitespace-nowrap shrink-0"
                  >
                    <span>All Events</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </RevealBlock>

              <div className="mt-8 space-y-4">
                {!eventsLoaded ? (
                  <div className="py-10 text-center text-xs font-medium text-slate-400">
                    Loading events...
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <SectionEmptyState
                    variant="events"
                    compact
                    onResetFilters={
                      hasEventFilter && events.some((e) => e.isUpcoming)
                        ? () => {
                            setEventCategoryFilter('all');
                            setEventYearFilter('all');
                          }
                        : undefined
                    }
                  />
                ) : (
                  upcomingEvents.map((ev) => (
                    <RevealBlock key={ev.id}>
                      <article
                        onClick={() => onNavigate('events')}
                        className="glass-surface group cursor-pointer rounded-xl p-5 transition-colors hover:border-blue-400/40"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-semibold text-blue-300">{ev.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                            <Calendar className="h-3.5 w-3.5" />
                            {ev.eventDate}
                          </span>
                          {ev.timeLabel && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{ev.timeLabel}</span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display mt-2 text-lg font-semibold text-white group-hover:text-blue-200">
                          {ev.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-sm text-slate-300">
                          {ev.description}
                        </p>
                        <div className="mt-3.5">
                          <EventCountdown event={ev} variant="compact" />
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-blue-400" />
                          <span>{ev.location}</span>
                        </div>
                      </article>
                    </RevealBlock>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 3D Robotic Calibration Studio Animation */}
      <Lazy3DViewport disabled={defer3D} minHeight="560px">
        <Robotics3DShowcase onNavigate={onNavigate} />
      </Lazy3DViewport>

      {/* Featured Student Projects & Recent Achievements */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealBlock className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-blue-400">Student Innovation</p>
              <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-4xl">
                Featured Student Projects
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-white whitespace-nowrap shrink-0"
            >
              <span>Explore All Projects</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </RevealBlock>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <RevealBlock key={project.id}>
                <HoverInfoBox
                  className="h-full"
                  title={project.title}
                  badge={`${project.subjectCode} · ${project.year}`}
                  description={project.technicalDetails || project.summary}
                  icon={<Cpu className="h-3.5 w-3.5" />}
                >
                  <TiltCard
                    onClick={() => onNavigate('projects')}
                    className="flex h-full flex-col overflow-hidden"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <SafeImage
                        src={project.imageUrl}
                        alt={project.title}
                        fallbackLabel={project.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono font-semibold text-violet-300">
                          {project.subjectCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{project.year}</span>
                      </div>
                      <h3 className="font-display mt-2 text-lg font-semibold text-white">
                        {project.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                        {project.summary}
                      </p>
                      <p className="mt-4 text-xs text-slate-400">Team: {project.studentTeam}</p>
                    </div>
                  </TiltCard>
                </HoverInfoBox>
              </RevealBlock>
            ))}
          </div>

          {/* Recent Achievements Strip */}
          <div className="mt-20 border-t border-white/10 pt-16">
            <RevealBlock className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-violet-300">Recognition &amp; Honors</p>
                <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Recent Achievements
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('achievements')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-white whitespace-nowrap shrink-0"
              >
                <span>View Trophy Record</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </RevealBlock>

            {/* Compact Animated Honors Telemetry */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="glass-surface rounded-xl p-4 sm:p-5">
                <p className="text-xs font-medium text-slate-400">Total Honors</p>
                <p className="font-display mt-1.5 text-2xl font-bold text-white sm:text-3xl">
                  <AnimatedCounter value={achievements.length} />
                </p>
              </div>
              <div className="glass-surface rounded-xl p-4 sm:p-5">
                <p className="text-xs font-medium text-slate-400">Platinum &amp; Gold</p>
                <p className="font-display mt-1.5 text-2xl font-bold text-amber-300 sm:text-3xl">
                  <AnimatedCounter
                    value={
                      achievements.filter((a) => {
                        const t = resolveAchievementTier(a);
                        return t === 'Platinum' || t === 'Gold';
                      }).length
                    }
                  />
                </p>
              </div>
              <div className="glass-surface rounded-xl p-4 sm:p-5">
                <p className="text-xs font-medium text-slate-400">Unlocked</p>
                <p className="font-display mt-1.5 text-2xl font-bold text-emerald-300 sm:text-3xl">
                  <AnimatedCounter value={unlockedIds.length} />
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {featuredAchievements.map((ach, idx) => (
                <AchievementCard3D
                  key={ach.id}
                  achievement={ach}
                  index={idx}
                  isUnlocked={unlockedIds.includes(ach.id)}
                  onUnlockOrCelebrate={unlockAndCelebrate}
                  onNavigateCard={() => onNavigate('achievements')}
                />
              ))}
            </div>
          </div>

          <AchievementUnlockModal
            achievement={celebratingAchievement}
            onClose={dismissCelebration}
          />

          <CustomLinksSlot
            targetSection="home-showcase"
            variant="cards"
            heading="Featured Technology Links"
            onNavigate={onNavigate}
          />

          {/* Technology History Exploration Band */}
          <div className="mt-20 border-t border-white/10 pt-16">
            <div className="grid gap-6">
              <RevealBlock>
                <HoverInfoBox
                  className="h-full"
                  title="History of Technology Timeline"
                  badge={`${historyEvents.length} Landmark Eras`}
                  description="Switch between vertical scroll-animated and horizontal milestone views spanning ancient mechanics to AI & robotics."
                  icon={<Clock className="h-3.5 w-3.5" />}
                >
                  <TiltCard
                    onClick={() => onNavigate('history')}
                    className="flex h-full flex-col justify-between p-7"
                  >
                    <div>
                      <p className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300">
                        <Clock className="h-4 w-4" />
                        <span>Interactive Timeline Archive</span>
                      </p>
                      <h3 className="font-display mt-3 text-2xl font-bold text-white">
                        History of Technology
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                        Journey across {historyEvents.length} landmark eras—from ancient mechanical inventions and Gutenberg’s printing press to the telephone, ENIAC computers, the Internet, AI, and autonomous robotics.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-blue-300">
                      <span>Explore Interactive Timeline</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </TiltCard>
                </HoverInfoBox>
              </RevealBlock>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
