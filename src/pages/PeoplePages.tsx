import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Calendar,
  Crown,
  ExternalLink,
  Github,
  Globe,
  GraduationCap,
  Hash,
  Instagram,
  Linkedin,
  RotateCcw,
  RotateCw,
  Search,
  ShieldCheck,
  Twitter,
  Users,
} from 'lucide-react';
import { Team3DCarousel } from '../components/Team3DCarousel';
import {
  AnimatedCounter,
  MorphingBackdrop,
  RevealBlock,
  SafeImage,
} from '../components/MotionPrimitives';
import { useData } from '../context/DataContext';
import { MEMBER_ARCHIVE_YEARS } from '../data/seedDefaults';
import type { CommunityDirectoryMember, PageRoute } from '../types';


const COMMITTEE_ONLY_POSITIONS = new Set(['Committee Member', 'General Community Member']);

function isMainCommitteeMember(member: CommunityDirectoryMember): boolean {
  return Boolean(member.isExecutive && !COMMITTEE_ONLY_POSITIONS.has(member.position));
}

function getPositionBadgeStyle(position: string, isExecutive: boolean) {
  if (position === 'President') {
    return 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200';
  }
  if (position === 'Vice President' || position === 'Secretary' || position === 'Treasurer') {
    return 'border-blue-400/45 bg-blue-500/15 text-blue-200';
  }
  if (isExecutive) {
    return 'border-violet-400/45 bg-violet-500/15 text-violet-200';
  }
  return 'border-white/15 bg-white/5 text-slate-300';
}

function normalizeUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

function MemberPhotoViewport({
  src,
  alt,
  fallbackLabel,
}: {
  src?: string;
  alt: string;
  fallbackLabel: string;
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060b19]">
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          loading="lazy"
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl"
        />
      )}
      <SafeImage
        src={src}
        alt={alt}
        fallbackLabel={fallbackLabel}
        className="relative z-10 h-full w-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-[#091127] via-[#091127]/45 to-transparent" />
    </div>
  );
}

function DirectoryMemberCard({ member }: { member: CommunityDirectoryMember }) {
  const prefersReduced = useReducedMotion();
  const [isFlipped, setIsFlipped] = useState(false);

  const linkedin = normalizeUrl(member.socialLinks?.linkedin);
  const github = normalizeUrl(member.socialLinks?.github);
  const twitter = normalizeUrl(member.socialLinks?.twitter);
  const instagram = normalizeUrl(member.socialLinks?.instagram);
  const website = normalizeUrl(member.socialLinks?.website);
  const hasSocial = Boolean(linkedin || github || twitter || instagram || website);

  const memberYear = member.year || '2026';
  const backPhotoSrc = member.secondaryPhotoUrl?.trim() || member.photoUrl;
  const hasDistinctSecondPhoto = Boolean(
    member.secondaryPhotoUrl?.trim() && member.secondaryPhotoUrl.trim() !== member.photoUrl?.trim()
  );

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    }
  };

  const stopCardFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`${member.fullName} (${memberYear}) — ${
        isFlipped
          ? 'Showing second photograph and member details. Click or press Enter to return to front photograph.'
          : 'Click or press Enter to flip card and reveal second photograph and details.'
      }`}
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
      className={`flip-perspective group relative h-full cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 ${
        prefersReduced ? '' : 'transition-transform duration-300 hover:-translate-y-1'
      }`}
    >
      <div className={`flip-card-inner h-full ${isFlipped && !prefersReduced ? 'is-flipped' : ''}`}>
        {/* FRONT SIDE: Primary Photo + Name, Year & Position */}
        <article
          className={`flip-card-face flex h-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-[#0d1630]/95 to-[#091023]/95 shadow-lg transition-all duration-300 group-hover:border-cyan-400/50 group-hover:shadow-[0_18px_40px_-12px_rgba(34,211,238,0.28)] ${
            isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
          } ${prefersReduced && isFlipped ? 'hidden' : ''}`}
        >
          <div className="relative">
            <MemberPhotoViewport
              src={member.photoUrl}
              alt={`${member.fullName} — front portrait`}
              fallbackLabel={member.fullName}
            />

            {member.isExecutive && (
              <span className="absolute left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#050914]/88 px-3 py-1 text-[11px] font-semibold text-cyan-200 shadow-lg backdrop-blur-sm">
                <Crown className="h-3 w-3 text-cyan-300" />
                <span>Executive</span>
              </span>
            )}

            <span className="absolute right-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#050914]/88 px-2.5 py-1 text-[11px] font-medium text-slate-200 shadow-md backdrop-blur-sm transition-colors group-hover:border-cyan-400/50 group-hover:text-cyan-200">
              <RotateCw className="h-3 w-3 text-cyan-300" />
              <span>{hasDistinctSecondPhoto ? '2nd Photo' : 'Flip Card'}</span>
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPositionBadgeStyle(
                    member.position,
                    member.isExecutive
                  )}`}
                >
                  {member.isExecutive && <ShieldCheck className="h-3 w-3" />}
                  <span>{member.position}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-md border border-blue-400/30 bg-blue-500/12 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-200">
                  <Calendar className="h-3 w-3 text-blue-300" />
                  <span>{memberYear}</span>
                </span>
              </div>

              <h3 className="font-display mt-3.5 text-xl font-bold tracking-tight text-white">
                {member.fullName}
              </h3>

              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">
                {member.bio}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-cyan-300/90 group-hover:text-cyan-200">
                <RotateCw className="h-3.5 w-3.5" />
                <span>Click or tap to view 2nd photo &amp; details</span>
              </span>
              {member.memberCode && (
                <span className="font-mono text-[11px] text-slate-400">#{member.memberCode}</span>
              )}
            </div>
          </div>
        </article>

        {/* BACK SIDE: Second Photograph + Additional Member Information */}
        <article
          className={`flip-card-face flip-card-back flex h-full flex-col overflow-hidden rounded-2xl border border-cyan-400/50 bg-gradient-to-br from-[#0e1938] via-[#0a132c] to-[#13193b] shadow-[0_20px_46px_-12px_rgba(59,130,246,0.34)] ${
            isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
          } ${prefersReduced && !isFlipped ? 'hidden' : ''}`}
        >
          <div className="relative">
            <MemberPhotoViewport
              src={backPhotoSrc}
              alt={`${member.fullName} — secondary archive photograph`}
              fallbackLabel={member.fullName}
            />

            <span className="absolute left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-[#050914]/88 px-3 py-1 font-mono text-[11px] font-semibold text-blue-200 backdrop-blur-sm">
              <span>{hasDistinctSecondPhoto ? 'Archive Photo · 2/2' : `Class of ${memberYear}`}</span>
            </span>

            <span className="absolute right-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/45 bg-[#050914]/90 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 backdrop-blur-sm">
              <RotateCcw className="h-3 w-3" />
              <span>Flip Back</span>
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold tracking-tight text-white">
                  {member.fullName}
                </h3>
                <span className="rounded-md border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-200">
                  {memberYear}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-cyan-300">{member.position}</span>
                {member.memberCode && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="inline-flex items-center gap-0.5 font-mono text-slate-300">
                      <Hash className="h-3 w-3 text-blue-300" />
                      {member.memberCode}
                    </span>
                  </>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-200">{member.bio}</p>
            </div>

            <div className="mt-5 space-y-3 border-t border-white/10 pt-3.5">
              {hasSocial && (
                <div className="flex flex-wrap items-center gap-2" onClick={stopCardFlip}>
                  {linkedin && (
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.fullName} on LinkedIn`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {github && (
                    <a
                      href={github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.fullName} on GitHub`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                    >
                      <Github className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {twitter && (
                    <a
                      href={twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.fullName} on X / Twitter`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                    >
                      <Twitter className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {instagram && (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.fullName} on Instagram`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {website && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.fullName} Personal Website`}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                    >
                      <Globe className="h-3 w-3" />
                      <span>Portfolio</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-cyan-200/90">
                <span className="inline-flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Click or tap to return to front photo</span>
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export function TeachersMembersPage({
  initialTab = 'all',
  onNavigate: _onNavigate,
}: {
  initialTab?: 'all' | 'teachers' | 'members';
  onNavigate?: (route: PageRoute) => void;
}) {
  const { teachers, communityDirectory, registeredMembersCount, loadingData } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'teachers' | 'members'>(initialTab);
  const [queryText, setQueryText] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'executive' | 'general'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  const availableYears = useMemo(() => {
    const set = new Set<string>(MEMBER_ARCHIVE_YEARS);
    communityDirectory.forEach((m) => {
      if (m.year && m.year.trim()) {
        set.add(m.year.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [communityDirectory]);

  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    communityDirectory.forEach((m) => {
      const yr = (m.year || '2026').trim();
      counts[yr] = (counts[yr] || 0) + 1;
    });
    return counts;
  }, [communityDirectory]);

  const sortedDirectory = useMemo(() => {
    return [...communityDirectory].sort((a, b) => (a.order ?? 10) - (b.order ?? 10));
  }, [communityDirectory]);

  const yearScopedMembers = useMemo(() => {
    if (selectedYear === 'All') return sortedDirectory;
    return sortedDirectory.filter((m) => (m.year || '2026') === selectedYear);
  }, [sortedDirectory, selectedYear]);

  const filteredMembers = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return yearScopedMembers.filter((member) => {
      const isMain = isMainCommitteeMember(member);
      if (groupFilter === 'executive' && !isMain) return false;
      if (groupFilter === 'general' && isMain) return false;
      if (!q) return true;
      return (
        member.fullName.toLowerCase().includes(q) ||
        member.position.toLowerCase().includes(q) ||
        (member.year || '').toLowerCase().includes(q) ||
        member.bio.toLowerCase().includes(q) ||
        (member.memberCode || '').toLowerCase().includes(q)
      );
    });
  }, [yearScopedMembers, groupFilter, queryText]);

  const mainCommitteeDirectory = useMemo(
    () => sortedDirectory.filter(isMainCommitteeMember),
    [sortedDirectory]
  );

  const filteredMainCommittee = useMemo(
    () => filteredMembers.filter(isMainCommitteeMember),
    [filteredMembers]
  );

  const filteredCommitteeMembers = useMemo(
    () => filteredMembers.filter((m) => !isMainCommitteeMember(m)),
    [filteredMembers]
  );

  const executiveCount = useMemo(
    () => yearScopedMembers.filter(isMainCommitteeMember).length,
    [yearScopedMembers]
  );

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <RevealBlock className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-200">
            <Users className="h-3.5 w-3.5 text-cyan-300" />
            <span>Faculty &amp; Community Digital Archive</span>
          </div>
          <h1
            className="font-display mt-4 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.35rem)', textWrap: 'balance' }}
          >
            Teacher &amp; Member Directory
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Meet SSCK TECH faculty instructors, laboratory mentors, elected Executive Committee officers, and yearly community cohorts. Click or tap any member card to flip and inspect their second archive photograph and details.
          </p>
        </RevealBlock>

        {/* Quick KPI Strip */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="glass-surface rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Faculty Instructors</span>
              <GraduationCap className="h-4 w-4 text-blue-400" />
            </div>
            <p className="font-display mt-2 text-2xl font-bold text-white">
              <AnimatedCounter value={teachers.length} />
            </p>
          </div>
          <div className="glass-surface rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Executive Board</span>
              <Crown className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="font-display mt-2 text-2xl font-bold text-white">
              <AnimatedCounter value={mainCommitteeDirectory.length} />
            </p>
          </div>
          <div className="glass-surface rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Directory Profiles</span>
              <Users className="h-4 w-4 text-violet-400" />
            </div>
            <p className="font-display mt-2 text-2xl font-bold text-white">
              <AnimatedCounter value={communityDirectory.length} />
            </p>
          </div>
          <div className="glass-surface rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Registered Network</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="font-display mt-2 text-2xl font-bold text-white">
              <AnimatedCounter value={registeredMembersCount} />
            </p>
          </div>
        </div>

        {/* View Segment Tabs & Search */}
        <div className="mt-10 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All (Teachers &amp; Members)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teachers')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'teachers'
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Teachers &amp; Faculty ({teachers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'members'
                  ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Community Members ({communityDirectory.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search faculty, members, or year..."
              className="w-full rounded-xl border border-white/10 bg-[#0d152c] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Teachers 3D Coverflow Carousel Section */}
        {(activeTab === 'all' || activeTab === 'teachers') && (
          <div className="mt-6 mb-10">
            <Team3DCarousel
              title="OUR TEACHERS"
              subtitle="Instructional Faculty &amp; Lab Mentors"
              members={teachers.map((t) => ({
                id: t.id,
                name: t.name,
                role: t.role,
                photoUrl: t.photoUrl,
                bio: t.bio,
                department: t.department,
                qualifications: t.qualifications,
                officeRoom: t.officeRoom,
              }))}
            />
          </div>
        )}

        {/* Main Committee / Executive Board 3D Coverflow Carousel Section */}
        {(activeTab === 'all' || activeTab === 'members') && (
          <div className="mt-6 mb-10">
            <Team3DCarousel
              title="MAIN COMMITTEE"
              subtitle="Executive Board Officers &amp; Leadership"
              members={mainCommitteeDirectory.map((m) => ({
                id: m.id,
                name: m.fullName,
                role: m.position,
                photoUrl: m.photoUrl,
                secondaryPhotoUrl: m.secondaryPhotoUrl,
                bio: m.bio,
                year: m.year,
                memberCode: m.memberCode,
                isExecutive: m.isExecutive,
                socialLinks: m.socialLinks,
              }))}
            />
          </div>
        )}

        {/* Section 2: Two-Tier Committee Hierarchy */}
        {(activeTab === 'all' || activeTab === 'members') && (
          <section
            className={`${activeTab === 'all' ? 'mt-18 border-t border-white/10 pt-14' : 'mt-10'}`}
            aria-labelledby="members-heading"
          >
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                  Interactive Yearly Committee Archive
                </p>
                <h2
                  id="members-heading"
                  className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl"
                >
                  Main Committee / Executive Board
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  Select a cohort year below and click or tap any Executive Board card to reveal their second photograph and profile details.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setGroupFilter('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    groupFilter === 'all'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  All ({yearScopedMembers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupFilter('executive')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    groupFilter === 'executive'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Executive Board ({executiveCount})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupFilter('general')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    groupFilter === 'general'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Committee Members ({yearScopedMembers.length - executiveCount})
                </button>
              </div>
            </div>

            {/* Year Selection Filter */}
            <div
              className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#080f23]/80 p-3 backdrop-blur-md"
              role="group"
              aria-label="Filter community members by year"
            >
              <span className="inline-flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>Cohort Year</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedYear('All')}
                className={`rounded-xl px-3.5 py-2 font-mono text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedYear === 'All'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                }`}
              >
                All Years ({communityDirectory.length})
              </button>

              {availableYears.map((yr) => {
                const count = yearCounts[yr] || 0;
                const active = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`rounded-xl px-3.5 py-2 font-mono text-xs font-semibold transition-all whitespace-nowrap ${
                      active
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                        : 'border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                    }`}
                  >
                    {yr}
                    <span className={`ml-1.5 text-[11px] ${active ? 'text-cyan-100' : 'text-slate-400'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {!loadingData && filteredMembers.length === 0 ? (
              <div className="glass-surface rounded-2xl border border-white/10 p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-display mt-4 text-lg font-semibold text-white">
                  {selectedYear === 'All'
                    ? 'No Community Members Match Your Filter'
                    : `No Community Members Recorded for ${selectedYear}`}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                  {selectedYear === 'All'
                    ? 'Try clearing your search term or switching the group filter above.'
                    : `Members for the ${selectedYear} cohort have not been archived yet. Administrators can add ${selectedYear} profiles anytime from the Admin Portal.`}
                </p>
                {selectedYear !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setSelectedYear('All')}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25"
                  >
                    <span>View All Years</span>
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedYear}-${groupFilter}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-12"
                >
                  {/* Tier 1: Main Committee / Executive Board — Full Detailed Cards */}
                  {filteredMainCommittee.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMainCommittee.map((member) => (
                        <DirectoryMemberCard key={member.id} member={member} />
                      ))}
                    </div>
                  )}

                  {/* Tier 2: Committee Members — Minimalist Multi-Column Plain-Names Grid */}
                  {filteredCommitteeMembers.length > 0 && (
                    <div
                      aria-labelledby="committee-members-subheading"
                      className={filteredMainCommittee.length > 0 ? 'border-t border-white/10 pt-10' : ''}
                    >
                      <div className="mb-5 flex items-baseline justify-between gap-4">
                        <h3
                          id="committee-members-subheading"
                          className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl"
                        >
                          Committee Members
                        </h3>
                        <span className="font-mono text-xs tabular-nums text-slate-400">
                          {filteredCommitteeMembers.length}{' '}
                          {filteredCommitteeMembers.length === 1 ? 'Member' : 'Members'}
                        </span>
                      </div>

                      <ul
                        aria-label="Committee Members"
                        className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      >
                        {filteredCommitteeMembers.map((member) => (
                          <li
                            key={member.id}
                            className="border-b border-white/[0.06] py-2 text-sm font-medium text-slate-200"
                          >
                            {member.fullName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
