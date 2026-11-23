import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Crown, ExternalLink, Github, Globe, Instagram, Linkedin, Twitter, Users, X } from 'lucide-react';
import { SafeImage } from './MotionPrimitives';
import type { CommunityDirectoryMember } from '../types';

interface CommunityMembersSliderProps {
  members: CommunityDirectoryMember[];
}

export function CommunityMembersSlider({ members }: CommunityMembersSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMember, setSelectedMember] = useState<CommunityDirectoryMember | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const displayMembers = members.length > 0 ? members : [];

  useEffect(() => {
    if (displayMembers.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayMembers.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [displayMembers.length, isPaused]);

  if (displayMembers.length === 0) {
    return (
      <div className="glass-surface rounded-2xl p-8 text-center text-sm text-slate-400">
        No community members archived yet. Administrators can add members from the Admin Panel.
      </div>
    );
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayMembers.length) % displayMembers.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayMembers.length);
  };

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
            <Users className="h-3.5 w-3.5 text-violet-300" />
            <span>Community Directory &amp; Executive Cohorts</span>
          </div>
          <h3 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
            Community Members Slider
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous member"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next member"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div className="relative overflow-hidden rounded-2xl p-1">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayMembers.map((member, idx) => {
            const isFeatured = idx === currentIndex || idx === (currentIndex + 1) % displayMembers.length || idx === (currentIndex + 2) % displayMembers.length;
            if (!isFeatured && displayMembers.length > 3) return null;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedMember(member)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-[#0d1630]/95 to-[#091023]/95 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-400/50 hover:shadow-[0_20px_40px_-12px_rgba(34,211,238,0.3)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060b19]">
                  <SafeImage
                    src={member.photoUrl}
                    alt={member.fullName}
                    fallbackLabel={member.fullName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091127] via-transparent to-transparent" />
                  {member.isExecutive && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#050914]/88 px-3 py-1 text-[11px] font-semibold text-cyan-200 shadow-md backdrop-blur-sm">
                      <Crown className="h-3 w-3 text-cyan-300" />
                      <span>Executive</span>
                    </span>
                  )}
                  <span className="absolute right-3 top-3 rounded-full border border-white/25 bg-[#050914]/88 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-200 backdrop-blur-sm">
                    {member.year || '2026'}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-cyan-300">{member.position}</span>
                    {member.memberCode && (
                      <span className="font-mono text-[11px] text-slate-400">#{member.memberCode}</span>
                    )}
                  </div>
                  <h4 className="font-display mt-2 text-xl font-bold text-white group-hover:text-cyan-200">
                    {member.fullName}
                  </h4>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">
                    {member.bio}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold text-cyan-300">
                    <span>Click to view full profile</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {displayMembers.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              currentIndex === i ? 'w-8 bg-cyan-400' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Full Detail Modal */}
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
                    alt={selectedMember.fullName}
                    fallbackLabel={selectedMember.fullName}
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
                      {selectedMember.year || '2026'}
                    </span>
                    {selectedMember.memberCode && (
                      <span className="font-mono text-xs text-slate-300">#{selectedMember.memberCode}</span>
                    )}
                  </div>

                  <h3 className="font-display mt-2 text-2xl font-bold tracking-tight text-white">
                    {selectedMember.fullName}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-cyan-300">{selectedMember.position}</p>

                  <p className="mt-4 text-sm leading-relaxed text-slate-200">{selectedMember.bio}</p>

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
