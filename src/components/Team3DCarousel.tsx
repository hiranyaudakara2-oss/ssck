import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  ExternalLink,
  Github,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  Maximize2,
  Twitter,
  X,
} from 'lucide-react';
import { SafeImage } from './MotionPrimitives';

export interface TeamCarouselMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  secondaryPhotoUrl?: string;
  bio?: string;
  department?: string;
  year?: string;
  memberCode?: string;
  isExecutive?: boolean;
  officeRoom?: string;
  qualifications?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

interface Team3DCarouselProps {
  title: string;
  subtitle?: string;
  members: TeamCarouselMember[];
}

export function Team3DCarousel({ title, subtitle, members }: Team3DCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMember, setSelectedMember] = useState<TeamCarouselMember | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  const displayMembers = members.length > 0 ? members : [
    { id: '1', name: 'Senura Bandara', role: 'President', bio: 'Leading technology student council & robotics division.', department: 'ICT' },
    { id: '2', name: 'Dr. Anura Kumara', role: 'Senior Professor', bio: 'Head of Engineering Technology laboratory.', department: 'SFT' },
    { id: '3', name: 'Kavindu Perera', role: 'Vice President', bio: 'Organizing IoT hardware exhibitions.', department: 'ET' },
    { id: '4', name: 'Prof. Nimal Sirisena', role: 'Faculty Advisor', bio: 'Bio-systems research supervisor.', department: 'BST' },
    { id: '5', name: 'Pabasara Dilshan', role: 'Technical Lead', bio: 'Autonomous rover control specialist.', department: 'ICT' },
    { id: '6', name: 'Chamathka Jayasinghe', role: 'Secretary', bio: 'Documentation and circular coordinator.', department: 'SFT' }
  ];

  useEffect(() => {
    if (currentIndex >= displayMembers.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, displayMembers.length]);

  const updateCarousel = useCallback((newIndex: number) => {
    if (isAnimating || displayMembers.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((newIndex + displayMembers.length) % displayMembers.length);
    setTimeout(() => {
      setIsAnimating(false);
    }, 450);
  }, [isAnimating, displayMembers.length]);

  useEffect(() => {
    if (!selectedMember) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMember(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedMember]);

  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      updateCarousel(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      updateCarousel(currentIndex + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.changedTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        updateCarousel(currentIndex + 1);
      } else {
        updateCarousel(currentIndex - 1);
      }
    }
  };

  const currentMember = displayMembers[currentIndex] || displayMembers[0];

  return (
    <div
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label={`${title} showcase`}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b1530]/75 via-[#070f24]/70 to-[#050914]/80 px-4 py-6 shadow-[0_20px_50px_-24px_rgba(2,6,23,0.9)] backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:px-8 sm:py-7"
    >
      {/* Subtle Ambient Accent Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
      />

      {/* Compact Section Header */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-between gap-2 border-b border-white/10 pb-4 text-center sm:flex-row sm:text-left">
        <div>
          {subtitle && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
              {subtitle}
            </p>
          )}
          <h2 className="font-display mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h2>
        </div>
        <span className="font-mono text-xs font-medium tabular-nums text-slate-400">
          {String(currentIndex + 1).padStart(2, '0')} / {String(displayMembers.length).padStart(2, '0')}
        </span>
      </div>

      {/* Compact 3D Coverflow Stage */}
      <div
        className="relative z-10 mt-5 flex h-[250px] w-full max-w-4xl items-center justify-center sm:h-[285px]"
        style={{ perspective: '1100px' }}
      >
        {/* Left Arrow */}
        <button
          type="button"
          onClick={() => updateCarousel(currentIndex - 1)}
          aria-label="Previous member"
          className="absolute left-1 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#091229]/90 text-slate-100 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-400/60 hover:bg-blue-600/85 hover:text-white active:scale-95 sm:left-3 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Track */}
        <div
          className="relative flex h-full w-full items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {displayMembers.map((member, i) => {
            const offset = (i - currentIndex + displayMembers.length) % displayMembers.length;
            let filterStyle = 'brightness(0.55) saturate(0.4)';
            let zIndex = 1;
            let scale = 0.72;
            let translateX = '0px';
            let opacity = 0;

            const total = displayMembers.length;
            const normalizedOffset = offset > total / 2 ? offset - total : offset;

            if (normalizedOffset === 0) {
              zIndex = 20;
              scale = 1.04;
              translateX = '0px';
              filterStyle = 'none';
              opacity = 1;
            } else if (normalizedOffset === 1 || normalizedOffset === -(total - 1)) {
              zIndex = 10;
              scale = 0.86;
              translateX = '155px';
              filterStyle = 'brightness(0.75) saturate(0.7)';
              opacity = 0.76;
            } else if (normalizedOffset === 2 || normalizedOffset === -(total - 2)) {
              zIndex = 5;
              scale = 0.72;
              translateX = '285px';
              filterStyle = 'brightness(0.55) saturate(0.4)';
              opacity = 0.4;
            } else if (normalizedOffset === -1 || normalizedOffset === total - 1) {
              zIndex = 10;
              scale = 0.86;
              translateX = '-155px';
              filterStyle = 'brightness(0.75) saturate(0.7)';
              opacity = 0.76;
            } else if (normalizedOffset === -2 || normalizedOffset === total - 2) {
              zIndex = 5;
              scale = 0.72;
              translateX = '-285px';
              filterStyle = 'brightness(0.55) saturate(0.4)';
              opacity = 0.4;
            }

            const isVisible = Math.abs(normalizedOffset) <= 2;
            const isActive = normalizedOffset === 0;

            return (
              <div
                key={member.id}
                onClick={() => {
                  if (isActive) {
                    setSelectedMember(member);
                  } else {
                    updateCarousel(i);
                  }
                }}
                className={`group absolute h-[220px] w-[165px] cursor-pointer overflow-hidden rounded-2xl bg-[#0d1630] transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] sm:h-[252px] sm:w-[195px] ${
                  !isVisible ? 'pointer-events-none hidden opacity-0' : ''
                } ${
                  isActive
                    ? 'border border-cyan-400/50 shadow-[0_18px_40px_-10px_rgba(34,211,238,0.28)]'
                    : 'border border-white/15 shadow-xl'
                }`}
                style={{
                  zIndex,
                  opacity: isVisible ? opacity : 0,
                  transform: `translateX(${translateX}) scale(${scale})`,
                  filter: filterStyle,
                }}
              >
                <div className="relative h-full w-full">
                  <SafeImage
                    src={member.photoUrl}
                    alt={member.name}
                    fallbackLabel={member.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050914]/90 via-transparent to-transparent" />
                  {member.isExecutive && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-[#050914]/88 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                      <Crown className="h-2.5 w-2.5 text-cyan-300" />
                      <span>Exec</span>
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg border border-white/20 bg-[#050914]/80 px-2 py-1 text-[10px] font-medium text-slate-100 opacity-85 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-2.5 w-2.5 text-cyan-300" />
                      <span>Profile</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={() => updateCarousel(currentIndex + 1)}
          aria-label="Next member"
          className="absolute right-1 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#091229]/90 text-slate-100 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-400/60 hover:bg-blue-600/85 hover:text-white active:scale-95 sm:right-3 sm:h-10 sm:w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Compact Member Info Display */}
      <div className="relative z-10 mt-4 max-w-lg text-center transition-all duration-300">
        <h3 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
          {currentMember.name}
        </h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cyan-300 sm:text-sm">
          {currentMember.role}
          {currentMember.department ? ` · ${currentMember.department}` : ''}
          {!currentMember.department && currentMember.year ? ` · ${currentMember.year}` : ''}
        </p>
        {currentMember.bio && (
          <p className="mx-auto mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
            {currentMember.bio}
          </p>
        )}
      </div>

      {/* Compact Dots Indicator */}
      <div className="relative z-10 mt-4 flex items-center justify-center gap-1.5">
        {displayMembers.map((member, i) => (
          <button
            key={member.id}
            type="button"
            onClick={() => updateCarousel(i)}
            aria-label={`View ${member.name}`}
            className={`h-1.5 rounded-full transition-all ${
              currentIndex === i
                ? 'w-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.55)]'
                : 'w-1.5 bg-white/25 hover:bg-white/45'
            }`}
          />
        ))}
      </div>

      {/* Full Profile Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-[#0e1938] via-[#0a132c] to-[#13193b] p-6 sm:p-8 shadow-2xl text-white"
            >
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                aria-label="Close modal"
                className="absolute right-4 top-4 rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative aspect-[4/3] sm:aspect-square w-full sm:w-56 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-[#050914]">
                  <SafeImage
                    src={selectedMember.photoUrl}
                    alt={selectedMember.name}
                    fallbackLabel={selectedMember.name}
                    className="h-full w-full object-cover"
                  />
                  {selectedMember.isExecutive && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#050914]/88 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                      <Crown className="h-3 w-3 text-cyan-300" />
                      <span>Executive</span>
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-cyan-200">
                      {selectedMember.department || selectedMember.year || '2026'}
                    </span>
                    {selectedMember.memberCode && (
                      <span className="font-mono text-xs text-slate-300">#{selectedMember.memberCode}</span>
                    )}
                  </div>

                  <h3 className="font-display mt-2 text-2xl font-bold tracking-tight text-white">
                    {selectedMember.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-cyan-300">{selectedMember.role}</p>

                  <p className="mt-4 text-sm leading-relaxed text-slate-200">
                    {selectedMember.bio || 'Detailed member biography and achievements inside SSCK Technology Section.'}
                  </p>

                  {selectedMember.officeRoom && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{selectedMember.officeRoom}</span>
                    </div>
                  )}

                  {/* Social Links */}
                  {selectedMember.socialLinks && Object.values(selectedMember.socialLinks).some(Boolean) && (
                    <div className="mt-6 border-t border-white/10 pt-4">
                      <p className="text-xs font-semibold text-slate-300 mb-2">Connect &amp; Social</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedMember.socialLinks.linkedin && (
                          <a
                            href={selectedMember.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                          >
                            <Linkedin className="h-3.5 w-3.5" />
                            <span>LinkedIn</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {selectedMember.socialLinks.github && (
                          <a
                            href={selectedMember.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                          >
                            <Github className="h-3.5 w-3.5" />
                            <span>GitHub</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {selectedMember.socialLinks.twitter && (
                          <a
                            href={selectedMember.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                          >
                            <Twitter className="h-3.5 w-3.5" />
                            <span>Twitter</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {selectedMember.socialLinks.instagram && (
                          <a
                            href={selectedMember.socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                          >
                            <Instagram className="h-3.5 w-3.5" />
                            <span>Instagram</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {selectedMember.socialLinks.website && (
                          <a
                            href={selectedMember.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            <span>Website</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
