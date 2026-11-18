import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DEFAULT_WEB_LOGO } from '../data/seedDefaults';

export function CinematicLoader({
  siteTitle,
  logoUrl,
  onComplete,
}: {
  siteTitle: string;
  logoUrl?: string;
  onComplete: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [progress, setProgress] = useState(prefersReduced ? 100 : 4);
  const [phase, setPhase] = useState<'loading' | 'scrolling' | 'done'>('loading');

  useEffect(() => {
    if (prefersReduced) {
      const quick = setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 300);
      return () => clearTimeout(quick);
    }

    const start = performance.now();
    const duration = 1800; // 1.8 seconds loading experience
    let rafId = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      const ratio = Math.min(1, elapsed / duration);
      // Smooth ease-out curve
      const eased = 1 - Math.pow(1 - ratio, 2.5);
      const currentPct = Math.round(4 + eased * 96);
      setProgress(currentPct);

      if (ratio < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        // Reached 100%! Trigger upward smooth scroll transition reveal
        setPhase('scrolling');
        const transitionTimer = window.setTimeout(() => {
          setPhase('done');
          onComplete();
        }, 750); // duration of smooth scroll up animation
        return () => window.clearTimeout(transitionTimer);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete, prefersReduced]);

  const handleSkip = () => {
    setPhase('scrolling');
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 400);
  };

  const brandName = siteTitle || 'SSCK TECH';

  if (phase === 'done') return null;

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      animate={
        phase === 'scrolling'
          ? prefersReduced
            ? { opacity: 0 }
            : { y: '-100%', opacity: 0.95 }
          : { y: 0, opacity: 1 }
      }
      transition={
        prefersReduced
          ? { duration: 0.3 }
          : { duration: 0.72, ease: [0.16, 1, 0.3, 1] }
      }
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#050914] px-6 text-white"
      role="dialog"
      aria-label="Loading SSCK TECH Platform"
    >
      {/* Futuristic Electric-Blue & Violet Ambient Background Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[140px] animate-ambient-slow" />
        <div className="absolute -right-32 -bottom-32 h-[32rem] w-[32rem] rounded-full bg-violet-600/15 blur-[140px] animate-ambient-slow" style={{ animationDelay: '-8s' }} />
        {/* Subtle geometric tech grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(56, 189, 248, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.4) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* Centered Cinematic Loading Container */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        {/* Glowing Logo Badge */}
        <motion.div
          initial={prefersReduced ? false : { scale: 0.85, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-3xl border border-cyan-400/30 bg-[#081028]/90 shadow-[0_0_50px_rgba(59,130,246,0.3)] backdrop-blur-xl"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/25 via-transparent to-violet-500/25" />
          <img
            src={logoUrl || DEFAULT_WEB_LOGO}
            alt={brandName}
            referrerPolicy="no-referrer"
            className="relative z-10 h-16 w-16 object-contain drop-shadow-[0_2px_14px_rgba(34,211,238,0.6)]"
          />
        </motion.div>

        <motion.p
          initial={prefersReduced ? false : { opacity: 0, letterSpacing: '0.3em' }}
          animate={{ opacity: 1, letterSpacing: '0.22em' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400"
        >
          WELCOME TO SSCK TECH
        </motion.p>

        <motion.h1
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="font-display mt-3 bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl"
        >
          {brandName}
        </motion.h1>

        <motion.p
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3 max-w-md text-sm font-medium text-slate-300 sm:text-base"
          style={{ textWrap: 'balance' }}
        >
          Explore Technology. Inspire Innovation. Engineer the Future.
        </motion.p>

        {/* Progress Bar & Percentage */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-10 w-full max-w-xs"
        >
          <div className="mb-2.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Loading Environment</span>
            <span className="font-mono font-semibold tabular-nums text-cyan-300">
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 transition-[width] duration-100 ease-out shadow-[0_0_16px_rgba(34,211,238,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>

        <motion.button
          type="button"
          onClick={handleSkip}
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-8 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all hover:border-cyan-400/50 hover:bg-white/15 hover:text-white"
        >
          Skip Intro &amp; Enter Platform
        </motion.button>
      </div>
    </motion.div>
  );
}
