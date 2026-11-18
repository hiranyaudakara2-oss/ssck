import { motion, useReducedMotion } from 'motion/react';
import { Calendar, Megaphone, RotateCcw } from 'lucide-react';

export interface SectionEmptyStateProps {
  variant: 'announcements' | 'events';
  onResetFilters?: () => void;
  compact?: boolean;
  className?: string;
}

const EMPTY_STATE_COPY = {
  announcements: {
    title: 'No Announcements Available',
    description: 'There are currently no announcements. Please check back later for updates.',
  },
  events: {
    title: 'No Upcoming Events',
    description: 'There are currently no events scheduled. Stay tuned for future updates.',
  },
} as const;

export function SectionEmptyState({
  variant,
  onResetFilters,
  compact = false,
  className = '',
}: SectionEmptyStateProps) {
  const prefersReduced = useReducedMotion();
  const copy = EMPTY_STATE_COPY[variant];
  const isEvents = variant === 'events';

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      aria-live="polite"
      className={`glass-surface relative overflow-hidden rounded-2xl border border-white/10 text-center ${
        compact ? 'px-6 py-10 sm:px-8 sm:py-12' : 'px-6 py-14 sm:px-10 sm:py-16'
      } ${className}`}
    >
      {/* Subtle Ambient Radial Glow */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-0 h-44 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${
          isEvents ? 'bg-blue-500/15' : 'bg-violet-500/15'
        }`}
      />

      {/* Animated SVG Illustration + Icon Centerpiece */}
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 120 120"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
        >
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            stroke={isEvents ? 'rgba(96, 165, 250, 0.22)' : 'rgba(167, 139, 250, 0.22)'}
            strokeWidth="1"
            strokeDasharray="6 6"
            animate={prefersReduced ? undefined : { rotate: 360 }}
            transition={
              prefersReduced
                ? undefined
                : { duration: 28, repeat: Infinity, ease: 'linear' }
            }
            style={{ transformOrigin: '60px 60px' }}
          />
          <motion.circle
            cx="60"
            cy="60"
            r="39"
            stroke={isEvents ? 'rgba(56, 189, 248, 0.26)' : 'rgba(139, 92, 246, 0.26)'}
            strokeWidth="1.25"
            animate={
              prefersReduced
                ? undefined
                : { scale: [0.96, 1.05, 0.96], opacity: [0.45, 0.9, 0.45] }
            }
            transition={
              prefersReduced
                ? undefined
                : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
            }
            style={{ transformOrigin: '60px 60px' }}
          />
        </svg>

        <motion.div
          animate={prefersReduced ? undefined : { y: [0, -4, 0] }}
          transition={
            prefersReduced
              ? undefined
              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
          }
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-[#0b142d]/90 shadow-lg ${
            isEvents
              ? 'border-blue-400/30 text-blue-300 shadow-blue-950/50'
              : 'border-violet-400/30 text-violet-300 shadow-violet-950/50'
          }`}
        >
          {isEvents ? (
            <Calendar className="h-6 w-6" strokeWidth={1.75} />
          ) : (
            <Megaphone className="h-6 w-6" strokeWidth={1.75} />
          )}
        </motion.div>
      </div>

      <h3 className="font-display relative mt-5 text-lg font-semibold tracking-tight text-white sm:text-xl">
        {copy.title}
      </h3>
      <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
        {copy.description}
      </p>

      {onResetFilters && (
        <div className="relative mt-6">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-400/40 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
