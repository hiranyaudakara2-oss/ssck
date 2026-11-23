import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
  Pause,
  Play,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { HERO_CAMPUS_IMAGE } from '../data/seedDefaults';
import { FullScreenOverlay, OverlayMediaFrame, OverlayPanel, OverlayStagger } from './FullScreenOverlay';

const SLIDE_DURATION_MS = 5500;

interface DisplaySlide {
  id: string;
  imageUrl: string;
  caption: string;
  subtitle?: string;
}

function SlideImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0c193d] via-[#09122c] to-[#050914] p-6 text-center ${className}`}
      >
        <ImageIcon className="h-9 w-9 text-blue-400/70" />
        <p className="mt-2 max-w-xs text-xs font-medium text-slate-300">{alt}</p>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#0d193b] via-[#091229] to-[#050914]"
        />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}

export function HeroPhotoShowcase() {
  const { heroSlides, siteSettings } = useData();
  const prefersReduced = useReducedMotion();

  const slides: DisplaySlide[] =
    heroSlides.length > 0
      ? heroSlides
      : [
          {
            id: 'hero-fallback',
            imageUrl: siteSettings.heroBannerUrl || HERO_CAMPUS_IMAGE,
            subtitle: 'Applied Laboratories · SFT · ET · ICT · BST · Agriculture · Geography',
            caption: 'Interdisciplinary Engineering & Bio-Systems Campus',
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const totalSlides = slides.length;
  const safeIndex = activeIndex >= totalSlides ? 0 : activeIndex;
  const currentSlide = slides[safeIndex];

  useEffect(() => {
    if (activeIndex >= totalSlides) {
      setActiveIndex(0);
    }
  }, [activeIndex, totalSlides]);

  const goToSlide = useCallback(
    (nextIdx: number, explicitDirection?: 1 | -1) => {
      if (totalSlides <= 1) return;
      const wrapped = (nextIdx + totalSlides) % totalSlides;
      if (wrapped === safeIndex) return;
      setDirection(explicitDirection ?? (nextIdx > safeIndex ? 1 : -1));
      setActiveIndex(wrapped);
    },
    [safeIndex, totalSlides]
  );

  const handleNext = useCallback(() => {
    goToSlide(safeIndex + 1, 1);
  }, [goToSlide, safeIndex]);

  const handlePrev = useCallback(() => {
    goToSlide(safeIndex - 1, -1);
  }, [goToSlide, safeIndex]);

  // Automatic smooth slide progression
  const autoAdvanceActive =
    totalSlides > 1 && !isPaused && !isHovered && !lightboxOpen && !prefersReduced;

  useEffect(() => {
    if (!autoAdvanceActive) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [autoAdvanceActive, totalSlides]);

  // Keyboard navigation while lightbox is open
  useEffect(() => {
    if (!lightboxOpen || totalSlides <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, totalSlides, handleNext, handlePrev]);

  const slideVariants = {
    enter: (dir: 1 | -1) =>
      prefersReduced
        ? { opacity: 1 }
        : {
            opacity: 0,
            x: dir > 0 ? 36 : -36,
            scale: 1.04,
          },
    center: prefersReduced
      ? { opacity: 1 }
      : {
          opacity: 1,
          x: 0,
          scale: 1,
          transition: {
            opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
            x: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
            scale: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
          },
        },
    exit: (dir: 1 | -1) =>
      prefersReduced
        ? { opacity: 0 }
        : {
            opacity: 0,
            x: dir > 0 ? -28 : 28,
            scale: 0.985,
            transition: {
              opacity: { duration: 0.45, ease: [0.4, 0, 1, 1] as const },
              x: { duration: 0.5, ease: [0.4, 0, 1, 1] as const },
            },
          },
  };

  return (
    <>
      <div
        className="group relative h-[340px] w-full select-none overflow-hidden sm:h-[400px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsHovered(true)}
        onBlurCapture={() => setIsHovered(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured campus and laboratory photography"
      >
        {/* Animated Photo Stage */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={`${currentSlide.id}-${safeIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0 cursor-zoom-in will-change-transform"
          >
            {/* Subtle Ken Burns Slow Drift */}
            <motion.div
              key={`kb-${currentSlide.id}-${safeIndex}`}
              initial={prefersReduced ? false : { scale: 1 }}
              animate={prefersReduced ? undefined : { scale: 1.07 }}
              transition={
                prefersReduced
                  ? undefined
                  : { duration: SLIDE_DURATION_MS / 1000 + 1.2, ease: 'linear' }
              }
              className="h-full w-full will-change-transform"
            >
              <SlideImage
                src={currentSlide.imageUrl}
                alt={currentSlide.caption}
                className="h-full w-full object-cover"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Measured Contrast Dark Scrim (Guarantees >= 4.5:1 Caption Legibility) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040814]/95 via-[#050914]/45 to-[#050914]/25"
        />

        {/* Top Bar Controls: Slide Counter + Pause + Fullscreen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4">
          {totalSlides > 1 ? (
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#050914]/80 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-slate-100">
              <span>{String(safeIndex + 1).padStart(2, '0')}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{String(totalSlides).padStart(2, '0')}</span>
            </div>
          ) : (
            <span />
          )}

          <div className="pointer-events-auto flex items-center gap-1.5">
            {totalSlides > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((prev) => !prev);
                }}
                aria-label={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
                title={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#050914]/80 text-slate-200 transition-colors hover:border-blue-400/50 hover:bg-blue-600/30 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              aria-label="Expand photo to full view"
              title="Expand photo"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#050914]/80 text-slate-200 transition-colors hover:border-blue-400/50 hover:bg-blue-600/30 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Left / Right Edge Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#050914]/75 text-white opacity-85 transition-all duration-200 hover:scale-105 hover:border-blue-400/60 hover:bg-blue-600/40 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-blue-400 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#050914]/75 text-white opacity-85 transition-all duration-200 hover:scale-105 hover:border-blue-400/60 hover:bg-blue-600/40 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-blue-400 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Animated Custom Caption & Progress Bar Strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`cap-${currentSlide.id}-${safeIndex}`}
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: prefersReduced ? 0 : 0.36, ease: [0.16, 1, 0.3, 1] }}
              aria-live="polite"
            >
              {currentSlide.subtitle && (
                <p className="text-xs font-medium tracking-wide text-blue-300">
                  {currentSlide.subtitle}
                </p>
              )}
              <p className="font-display mt-1.5 text-base font-semibold leading-snug text-white sm:text-lg">
                {currentSlide.caption}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Interactive Progress Indicator Bars */}
          {totalSlides > 1 && (
            <div
              className="pointer-events-auto mt-4 grid gap-2"
              style={{ gridTemplateColumns: `repeat(${totalSlides}, minmax(0, 1fr))` }}
            >
              {slides.map((slide, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(idx);
                    }}
                    aria-label={`View photo ${idx + 1}: ${slide.caption}`}
                    aria-current={isActive ? 'true' : undefined}
                    className="group/bar py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                  >
                    <span className="relative block h-1 w-full overflow-hidden rounded-full bg-white/20 transition-colors group-hover/bar:bg-white/35">
                      {isActive && (
                        <motion.span
                          key={`prog-${slide.id}-${safeIndex}-${autoAdvanceActive ? 'run' : 'hold'}`}
                          initial={{ scaleX: autoAdvanceActive ? 0 : 1 }}
                          animate={{ scaleX: 1 }}
                          transition={
                            autoAdvanceActive
                              ? { duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }
                              : { duration: 0.2 }
                          }
                          className="block h-full w-full origin-left rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen High-Resolution Photo Lightbox */}
      <FullScreenOverlay
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        ariaLabel={currentSlide.caption}
        maxWidth="5xl"
        headerBadge={
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <span className="font-mono font-semibold text-cyan-300">
              {String(safeIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
            </span>
            <span className="text-slate-500">·</span>
            <span className="truncate font-semibold text-white">Featured Gallery Showcase</span>
          </div>
        }
        headerActions={
          totalSlides > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous photo"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next photo"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null
        }
      >
        <OverlayPanel className="p-4 sm:p-6">
          <OverlayMediaFrame className="aspect-[16/10] w-full rounded-xl bg-[#040814]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`lb-${currentSlide.id}-${safeIndex}`}
                initial={prefersReduced ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? undefined : { opacity: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.25 }}
                className="relative h-full w-full"
              >
                <SlideImage
                  src={currentSlide.imageUrl}
                  alt={currentSlide.caption}
                  className="h-full w-full object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </OverlayMediaFrame>

          <OverlayStagger className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {currentSlide.subtitle && (
                <p className="text-xs font-medium text-blue-300">{currentSlide.subtitle}</p>
              )}
              <h2 className="font-display mt-1 text-lg font-semibold text-white sm:text-2xl">
                {currentSlide.caption}
              </h2>
            </div>

            {totalSlides > 1 && (
              <div className="flex flex-wrap gap-2">
                {slides.map((slide, idx) => (
                  <button
                    key={`lb-dot-${slide.id}`}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    aria-label={`Jump to photo ${idx + 1}`}
                    className={`h-8 w-8 rounded-lg border font-mono text-xs font-semibold transition-colors ${
                      idx === safeIndex
                        ? 'border-blue-400 bg-blue-600 text-white'
                        : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </OverlayStagger>
        </OverlayPanel>
      </FullScreenOverlay>
    </>
  );
}
