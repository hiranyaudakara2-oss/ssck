import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Award, Calendar, ChevronLeft, ChevronRight, FileBadge2, Medal, Trophy } from 'lucide-react';
import type { Achievement } from '../types';
import { resolveAchievementIconType, resolveAchievementTier, TIER_THEMES } from './Achievement3DCelebration';
import {
  FullScreenOverlay,
  OverlayActionButton,
  OverlayMediaFrame,
  OverlayPanel,
  OverlayStagger,
} from './FullScreenOverlay';
import { SafeImage } from './MotionPrimitives';

interface AchievementDetailModalProps {
  achievement: Achievement | null;
  allAchievements?: Achievement[];
  onClose: () => void;
  onSelectAchievement?: (achievement: Achievement) => void;
}

export function AchievementDetailModal({
  achievement,
  allAchievements = [],
  onClose,
  onSelectAchievement,
}: AchievementDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setActiveImageIndex(0);
  }, [achievement?.id]);

  useEffect(() => {
    if (!achievement) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && allAchievements.length > 0) {
        const idx = allAchievements.findIndex((a) => a.id === achievement.id);
        if (idx > 0) {
          onSelectAchievement?.(allAchievements[idx - 1]);
        }
      } else if (e.key === 'ArrowRight' && allAchievements.length > 0) {
        const idx = allAchievements.findIndex((a) => a.id === achievement.id);
        if (idx >= 0 && idx < allAchievements.length - 1) {
          onSelectAchievement?.(allAchievements[idx + 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [achievement, allAchievements, onSelectAchievement]);

  const tier = achievement ? resolveAchievementTier(achievement) : 'Gold';
  const theme = TIER_THEMES[tier];
  const iconType = achievement ? resolveAchievementIconType(achievement) : 'trophy';

  const allImages = achievement
    ? [
        ...(achievement.imageUrl ? [achievement.imageUrl] : []),
        ...(achievement.galleryImages || []),
      ]
    : [];
  const currentImage = allImages[activeImageIndex] || achievement?.imageUrl;

  const currentIndex = achievement ? allAchievements.findIndex((a) => a.id === achievement.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allAchievements.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSelectAchievement) {
      onSelectAchievement(allAchievements[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onSelectAchievement) {
      onSelectAchievement(allAchievements[currentIndex + 1]);
    }
  };

  const renderBadgeGlyph = () => {
    if (iconType === 'trophy') return <Trophy className="h-4 w-4" />;
    if (iconType === 'medal') return <Medal className="h-4 w-4" />;
    if (iconType === 'certificate') return <FileBadge2 className="h-4 w-4" />;
    return <Award className="h-4 w-4" />;
  };

  return (
    <FullScreenOverlay
      isOpen={Boolean(achievement)}
      onClose={onClose}
      ariaLabel={achievement ? `Achievement Details: ${achievement.title}` : 'Achievement Details'}
      closeLabel="Close achievement details modal"
      maxWidth="5xl"
      zIndexClass="z-[100]"
      tone="violet"
      headerBadge={
        achievement && (
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 font-semibold ${theme.badgeClass}`}>
              {renderBadgeGlyph()}
              <span>{tier} Tier</span>
            </span>
            <span className="font-semibold text-blue-300">{achievement.awardLevel}</span>
          </div>
        )
      }
      headerActions={
        allAchievements.length > 1 ? (
          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              disabled={!hasPrev}
              onClick={handlePrev}
              aria-label="Previous achievement"
              whileHover={prefersReduced || !hasPrev ? undefined : { scale: 1.07 }}
              whileTap={prefersReduced || !hasPrev ? undefined : { scale: 0.92 }}
              className="rounded-xl border border-white/15 bg-white/[0.06] p-2 text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-blue-500/20 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            <motion.button
              type="button"
              disabled={!hasNext}
              onClick={handleNext}
              aria-label="Next achievement"
              whileHover={prefersReduced || !hasNext ? undefined : { scale: 1.07 }}
              whileTap={prefersReduced || !hasNext ? undefined : { scale: 0.92 }}
              className="rounded-xl border border-white/15 bg-white/[0.06] p-2 text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-blue-500/20 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        ) : undefined
      }
    >
      {achievement && (
        <OverlayPanel className={theme.glowClass}>
          {allImages.length > 0 ? (
            <OverlayMediaFrame className="h-64 w-full border-b border-blue-400/15 bg-black/60 sm:h-80 md:h-96">
              <SafeImage
                src={currentImage}
                alt={achievement.title}
                fallbackLabel={achievement.title}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080f24] via-[#080f24]/25 to-transparent" />

              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-white/15 bg-black/65 p-1.5 backdrop-blur-md">
                  {allImages.map((img, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      whileHover={prefersReduced ? undefined : { scale: 1.06 }}
                      whileTap={prefersReduced ? undefined : { scale: 0.94 }}
                      className={`h-11 w-14 overflow-hidden rounded-lg border transition-all ${
                        activeImageIndex === idx
                          ? 'scale-105 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.45)]'
                          : 'border-white/20 opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              )}
            </OverlayMediaFrame>
          ) : (
            <OverlayMediaFrame className="flex h-44 w-full items-center justify-center border-b border-blue-400/15 bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-violet-950/60">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${theme.badgeClass}`}>
                {renderBadgeGlyph()}
              </div>
            </OverlayMediaFrame>
          )}

          <div className="p-6 sm:p-10">
            <OverlayStagger delay={0.08}>
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
                <span className="font-semibold text-violet-300">{achievement.category}</span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-cyan-300">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  {achievement.awardDate || achievement.year}
                </span>
              </div>
            </OverlayStagger>

            <OverlayStagger delay={0.14}>
              <h2
                className="font-display mt-3 bg-gradient-to-r from-white via-slate-100 to-violet-200 bg-clip-text text-2xl font-bold text-transparent sm:text-4xl"
                style={{ textWrap: 'balance' }}
              >
                {achievement.title}
              </h2>
            </OverlayStagger>

            <OverlayStagger delay={0.2}>
              <p className="mt-4 text-sm leading-relaxed text-slate-200 whitespace-pre-line sm:text-base">
                {achievement.description || 'No detailed description provided for this achievement.'}
              </p>
            </OverlayStagger>

            {achievement.recipients && (
              <OverlayStagger delay={0.26}>
                <div className="mt-6 rounded-xl border border-blue-400/20 bg-gradient-to-r from-blue-500/10 to-violet-500/10 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                    Award Recipients
                  </p>
                  <p className="mt-1 text-sm font-medium text-white sm:text-base">{achievement.recipients}</p>
                </div>
              </OverlayStagger>
            )}

            <OverlayStagger delay={0.31}>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <span className="font-mono text-xs text-cyan-300/90">
                  Registry #SSCK-{achievement.id.slice(0, 6)}
                </span>
                <OverlayActionButton variant="primary" onClick={onClose}>
                  Close
                </OverlayActionButton>
              </div>
            </OverlayStagger>
          </div>
        </OverlayPanel>
      )}
    </FullScreenOverlay>
  );
}
