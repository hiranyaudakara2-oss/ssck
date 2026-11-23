import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Award, Calendar, CheckCircle2, FileBadge2, Medal, Sparkles, Trophy } from 'lucide-react';
import type { Achievement, AchievementIconType } from '../types';
import {
  resolveAchievementIconType,
  resolveAchievementTier,
  TIER_THEMES,
} from './Achievement3DCelebration';
import { SafeImage } from './MotionPrimitives';

export function AchievementAnimatedEmblem({
  iconType,
  accentClass,
  compact = false,
}: {
  iconType: AchievementIconType;
  accentClass: string;
  compact?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const sizeClass = compact ? 'h-9 w-9' : 'h-12 w-12';
  const iconClass = compact ? 'h-4.5 w-4.5' : 'h-6 w-6';

  const renderGraphic = () => {
    switch (iconType) {
      case 'trophy':
        return <Trophy className={`${iconClass} ${accentClass}`} />;
      case 'medal':
        return <Medal className={`${iconClass} ${accentClass}`} />;
      case 'certificate':
        return <FileBadge2 className={`${iconClass} ${accentClass}`} />;
      default:
        return <Award className={`${iconClass} ${accentClass}`} />;
    }
  };

  return (
    <motion.div
      animate={
        prefersReduced
          ? undefined
          : {
              y: [0, -4, 0],
              rotate: iconType === 'medal' ? [-2, 2, -2] : [0, 1.5, 0],
            }
      }
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative flex ${sizeClass} shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#091229]/90 shadow-inner`}
    >
      {renderGraphic()}
    </motion.div>
  );
}

interface AchievementCard3DProps {
  achievement: Achievement;
  index?: number;
  isUnlocked?: boolean;
  onUnlockOrCelebrate: (achievement: Achievement) => void;
}

export function AchievementCard3D({
  achievement,
  index = 0,
  isUnlocked = false,
  onUnlockOrCelebrate,
}: AchievementCard3DProps) {
  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const [hoverState, setHoverState] = useState({
    rx: 0,
    ry: 0,
    spotX: 50,
    spotY: 50,
    hovered: false,
  });

  const tier = resolveAchievementTier(achievement);
  const iconType = resolveAchievementIconType(achievement);
  const theme = TIER_THEMES[tier];

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / Math.max(1, rect.width);
    const py = (e.clientY - rect.top) / Math.max(1, rect.height);
    setHoverState({
      rx: -(py - 0.5) * 9,
      ry: (px - 0.5) * 10,
      spotX: px * 100,
      spotY: py * 100,
      hovered: true,
    });
  };

  const handleMouseLeave = () => {
    setHoverState({
      rx: 0,
      ry: 0,
      spotX: 50,
      spotY: 50,
      hovered: false,
    });
  };

  const formatTierLabel = () => {
    if (iconType === 'trophy') return <Trophy className="h-3 w-3" />;
    if (iconType === 'medal') return <Medal className="h-3 w-3" />;
    if (iconType === 'certificate') return <FileBadge2 className="h-3 w-3" />;
    return <Award className="h-3 w-3" />;
  };

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 24, scale: 0.97 }}
      whileInView={prefersReduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.06, 0.24),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="h-full"
    >
      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          prefersReduced
            ? undefined
            : {
                transform: hoverState.hovered
                  ? `perspective(1100px) rotateX(${hoverState.rx}deg) rotateY(${hoverState.ry}deg) translateY(-6px) scale(1.015)`
                  : 'perspective(1100px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)',
                transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease',
              }
        }
        className={`animated-border-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b132b]/90 ${
          hoverState.hovered ? theme.glowClass : ''
        }`}
      >
        {/* Dynamic Tier Gradient Border Overlay on Hover */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${theme.borderGradient} p-[1px] transition-opacity duration-200 ${
            hoverState.hovered ? 'opacity-45' : 'opacity-15'
          }`}
          style={{
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Cursor-Tracking Radial Spotlight Sheen */}
        {!prefersReduced && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
            style={{
              opacity: hoverState.hovered ? 1 : 0,
              background: `radial-gradient(280px circle at ${hoverState.spotX}% ${hoverState.spotY}%, rgba(96, 165, 250, 0.14), transparent 70%)`,
            }}
          />
        )}

        {/* Top Media Visual with Animated Emblem */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <SafeImage
            src={achievement.imageUrl}
            alt={achievement.title}
            fallbackLabel={achievement.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b132b] via-[#0b132b]/35 to-transparent" />

          {/* Floating Animated Trophy/Medal/Certificate/Award Graphic */}
          <div className="absolute bottom-3 left-4 z-10 flex items-center gap-3">
            <AchievementAnimatedEmblem
              iconType={iconType}
              accentClass={theme.textAccentClass}
            />
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-xs ${theme.badgeClass}`}
            >
              {formatTierLabel()}
              <span>{tier}</span>
            </span>
          </div>

          <span className="absolute right-4 top-3.5 z-10 font-mono text-xs font-medium tabular-nums text-slate-200 drop-shadow">
            {achievement.awardDate || achievement.year}
          </span>
        </div>

        {/* Body Content */}
        <div className="relative z-10 flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-violet-300">{achievement.awardLevel}</span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-300">{achievement.category}</span>
          </div>

          <h3 className="font-display mt-2 text-lg font-bold leading-snug text-white">
            {achievement.title}
          </h3>

          <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-300">
            {achievement.description}
          </p>

          {achievement.recipients && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              <span className="truncate">Recipients: {achievement.recipients}</span>
            </p>
          )}

          {/* Interactive Unlock Action Footer */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => onUnlockOrCelebrate(achievement)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isUnlocked
                  ? 'border border-emerald-400/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                  : 'bg-blue-600/20 text-blue-200 hover:bg-blue-600 hover:text-white'
              }`}
            >
              {isUnlocked ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Unlocked</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                  <span>Unlock</span>
                </>
              )}
            </button>

            <span className="font-mono text-[11px] tabular-nums text-slate-400">
              {achievement.year}
            </span>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
