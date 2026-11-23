import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronDown } from 'lucide-react';
import { DEFAULT_WEB_LOGO } from '../data/seedDefaults';
import { normalizeMediaUrl } from '../utils/validation';

interface CinematicLoaderProps {
  siteTitle: string;
  logoUrl?: string;
  onRevealStart?: () => void;
  onComplete: () => void;
}

const BRAND_LETTERS = ['S', 'S', 'C', 'K', 'T', 'E', 'C', 'H'];

export function CinematicLoader({
  siteTitle,
  logoUrl,
  onRevealStart,
  onComplete,
}: CinematicLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const glowLeftRef = useRef<HTMLDivElement>(null);
  const glowRightRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isReadyRef = useRef(false);
  const isExitingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const revealCalledRef = useRef(false);

  const [isReady, setIsReady] = useState(false);

  const triggerExit = useCallback(() => {
    if (!isReadyRef.current || isExitingRef.current) return;
    isExitingRef.current = true;

    const container = containerRef.current;
    const content = contentRef.current;
    const prompt = promptRef.current;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const notifyRevealStart = () => {
      if (!revealCalledRef.current) {
        revealCalledRef.current = true;
        onRevealStart?.();
      }
    };

    const finish = () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      notifyRevealStart();
      onComplete();
    };

    if (!container || prefersReduced) {
      if (container) {
        gsap.to(container, {
          opacity: 0,
          duration: 0.25,
          ease: 'power2.out',
          onStart: notifyRevealStart,
          onComplete: finish,
        });
      } else {
        finish();
      }
      return;
    }

    const exitTl = gsap.timeline({
      onComplete: finish,
    });

    if (prompt) {
      prompt.style.transition = 'none';
      exitTl.to(
        prompt,
        {
          y: 16,
          opacity: 0,
          duration: 0.28,
          ease: 'power2.in',
        },
        0
      );
    }

    if (content) {
      exitTl.to(
        content,
        {
          scale: 1.06,
          y: -28,
          opacity: 0,
          duration: 0.48,
          ease: 'power3.in',
        },
        0.04
      );
    }

    exitTl.to(
      container,
      {
        yPercent: -100,
        duration: 0.92,
        ease: 'power4.inOut',
        onStart: () => {
          window.setTimeout(notifyRevealStart, 220);
        },
      },
      0.16
    );
  }, [onComplete, onRevealStart]);

  // Subtle interactive particle-grid canvas for deep futuristic atmosphere
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: -9999, y: -9999 };

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      blue: boolean;
    }

    let particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(48, Math.max(22, Math.floor((width * height) / 36000)));
      particles = Array.from({ length: count }, (_, idx) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.5 + 0.7,
        alpha: Math.random() * 0.45 + 0.18,
        blue: idx % 3 !== 0,
      }));
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        const dxPtr = p.x - pointer.x;
        const dyPtr = p.y - pointer.y;
        const distPtr = Math.hypot(dxPtr, dyPtr);
        const boost = distPtr < 160 ? (1 - distPtr / 160) * 0.45 : 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + boost * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = p.blue
          ? `rgba(0, 180, 255, ${Math.min(0.9, p.alpha + boost)})`
          : `rgba(255, 255, 255, ${Math.min(0.88, p.alpha + boost)})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 130) * 0.16})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      if (!prefersReduced) {
        rafId = window.requestAnimationFrame(draw);
      }
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  // Lock page scrolling & run GSAP preloader reveal timeline
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const container = containerRef.current;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        if (progressTextRef.current) {
          progressTextRef.current.textContent = '100%';
        }
        if (progressBarRef.current) {
          gsap.set(progressBarRef.current, { scaleX: 1 });
        }
        isReadyRef.current = true;
        setIsReady(true);
        return;
      }

      // Ambient glow breathing
      if (glowLeftRef.current) {
        gsap.to(glowLeftRef.current, {
          x: 40,
          y: 30,
          scale: 1.12,
          duration: 5.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
      if (glowRightRef.current) {
        gsap.to(glowRightRef.current, {
          x: -40,
          y: -30,
          scale: 1.14,
          duration: 6.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      const counter = { value: 0 };
      const tl = gsap.timeline();

      tl.from('.preloader-emblem', {
        scale: 0.75,
        opacity: 0,
        y: 18,
        duration: 0.65,
        ease: 'power3.out',
      })
        .from(
          '.preloader-char',
          {
            y: 44,
            opacity: 0,
            rotateX: -40,
            scale: 0.88,
            duration: 0.7,
            stagger: 0.055,
            ease: 'power4.out',
          },
          '-=0.35'
        )
        .from(
          '.preloader-sub',
          {
            y: 12,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
          },
          '-=0.35'
        )
        .from(
          '.preloader-progress-wrap',
          {
            y: 14,
            opacity: 0,
            duration: 0.45,
            ease: 'power2.out',
          },
          '-=0.3'
        )
        .to(
          counter,
          {
            value: 100,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
              const pct = Math.round(counter.value);
              if (progressTextRef.current) {
                progressTextRef.current.textContent = `${pct}%`;
              }
            },
          },
          '-=0.2'
        )
        .to(
          progressBarRef.current,
          {
            scaleX: 1,
            duration: 1.5,
            ease: 'power2.inOut',
          },
          '<'
        )
        .add(() => {
          if (progressTextRef.current) {
            progressTextRef.current.textContent = '100%';
          }
          isReadyRef.current = true;
          setIsReady(true);
        });
    }, container ?? undefined);

    return () => {
      ctx.revert();
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Animate internal mouse dot & chevron once "Scroll to Explore" indicator becomes ready
  useEffect(() => {
    if (!isReady || !promptRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.to('.preloader-scroll-dot', {
        y: 8,
        opacity: 0.25,
        duration: 1.1,
        repeat: -1,
        ease: 'power1.inOut',
      });
      gsap.to('.preloader-chevron', {
        y: 5,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, promptRef);

    return () => ctx.revert();
  }, [isReady]);

  // Listen for wheel, touch swipe, and keyboard scroll intent to dismiss the preloader
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!isReadyRef.current || isExitingRef.current) return;
      if (e.deltaY > 6) {
        triggerExit();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target;
      const touchingPrompt =
        target instanceof Node && Boolean(promptRef.current?.contains(target));
      if (!touchingPrompt) {
        e.preventDefault();
      }
      if (!isReadyRef.current || isExitingRef.current || touchStartYRef.current === null) return;
      if (e.touches.length > 0) {
        const deltaY = touchStartYRef.current - e.touches[0].clientY;
        if (deltaY > 24) {
          triggerExit();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isReadyRef.current || isExitingRef.current || touchStartYRef.current === null) {
        touchStartYRef.current = null;
        return;
      }
      if (e.changedTouches.length > 0) {
        const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
        if (deltaY > 24) {
          triggerExit();
        }
      }
      touchStartYRef.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space', ' '].includes(e.key) ||
        e.code === 'Space'
      ) {
        e.preventDefault();
        if (
          isReadyRef.current &&
          !isExitingRef.current &&
          (e.key === 'ArrowDown' || e.key === 'PageDown' || e.code === 'Space' || e.key === 'Enter')
        ) {
          triggerExit();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [triggerExit]);

  const resolvedLogo = normalizeMediaUrl(logoUrl) || DEFAULT_WEB_LOGO;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${(siteTitle || 'SSCKTECH').toUpperCase()} INTERACTIVE PRELOADER`}
      className="fixed inset-0 z-50 flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#040711] px-6 text-white select-none uppercase"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 45%, rgba(12, 32, 74, 0.78) 0%, #050a18 55%, #03060f 100%)',
      }}
    >
      {/* Ambient Neon Blue & White Radial Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          ref={glowLeftRef}
          className="absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full opacity-30 blur-[135px]"
          style={{ background: 'radial-gradient(circle, #00b4ff 0%, transparent 70%)' }}
        />
        <div
          ref={glowRightRef}
          className="absolute -right-24 bottom-1/4 h-[30rem] w-[30rem] rounded-full opacity-25 blur-[140px]"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, rgba(255,255,255,0.25) 35%, transparent 72%)' }}
        />
        {/* Minimal Tech Coordinate Grid */}
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(56, 189, 248, 0.38) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.28) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Lightweight Interactive Particle Network */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Centered Brand Reveal & Progress */}
      <div
        ref={contentRef}
        className="relative z-10 my-auto flex w-full max-w-2xl flex-col items-center pt-6 text-center uppercase"
      >
        <div className="preloader-emblem mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#38bdf8]/45 bg-[#07142b]/85 shadow-[0_0_40px_rgba(0,180,255,0.34)] backdrop-blur-xl sm:h-20 sm:w-20">
          <img
            src={resolvedLogo}
            alt={(siteTitle || 'SSCKTECH').toUpperCase()}
            referrerPolicy="no-referrer"
            className="h-10 w-10 object-contain drop-shadow-[0_0_14px_rgba(56,189,248,0.75)] sm:h-12 sm:w-12"
          />
        </div>

        <h1
          className="font-display flex items-center justify-center text-5xl font-bold tracking-[0.06em] uppercase sm:text-7xl md:text-8xl"
          style={{ perspective: '900px' }}
          aria-label="SSCKTECH"
        >
          {BRAND_LETTERS.map((char, idx) => {
            const isTech = idx >= 4;
            return (
              <span
                key={`${char}-${idx}`}
                className={`preloader-char inline-block will-change-transform uppercase ${
                  isTech
                    ? 'bg-gradient-to-br from-white via-[#7dd3fc] to-[#0099ff] bg-clip-text text-transparent drop-shadow-[0_0_26px_rgba(0,180,255,0.65)]'
                    : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.36)]'
                }`}
              >
                {char}
              </span>
            );
          })}
        </h1>

        <p className="preloader-sub mt-4 max-w-md text-xs font-medium tracking-[0.22em] text-white/75 uppercase sm:text-sm">
          SCIENCE · ENGINEERING · FUTURE INNOVATION
        </p>

        {/* Thin Glowing Progress Line & Counter */}
        <div className="preloader-progress-wrap mt-8 w-full max-w-xs uppercase sm:mt-10 sm:max-w-sm">
          <div className="mb-2.5 flex items-center justify-between text-xs">
            <span className="font-mono tracking-wider text-white/75 uppercase">
              {isReady ? 'EXPERIENCE READY' : 'INITIALIZING'}
            </span>
            <span
              ref={progressTextRef}
              className="font-mono font-semibold tabular-nums text-[#38bdf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.65)]"
            >
              0%
            </span>
          </div>

          <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/15">
            <div
              ref={progressBarRef}
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-white via-[#38bdf8] to-[#0095ff] shadow-[0_0_18px_rgba(0,180,255,0.95)]"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Interactive Scroll to Explore Indicator */}
      <div className="pointer-events-none relative z-20 flex w-full shrink-0 justify-center pt-4 pb-6 uppercase sm:pb-8">
        <button
          ref={promptRef}
          type="button"
          onClick={triggerExit}
          disabled={!isReady}
          aria-hidden={!isReady}
          aria-label="SCROLL TO EXPLORE MAIN PAGE"
          className={`group flex flex-col items-center gap-2.5 rounded-2xl px-6 py-3 uppercase transition-[opacity,transform] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-[#38bdf8] ${
            isReady
              ? 'pointer-events-auto translate-y-0 cursor-pointer opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          {/* Animated Mouse Scroll Icon */}
          <span
            aria-hidden="true"
            className="flex h-9 w-5.5 items-start justify-center rounded-full border border-[#38bdf8]/75 bg-[#050c1d]/80 p-1.5 shadow-[0_0_24px_rgba(0,180,255,0.42)] transition-colors group-hover:border-white group-hover:shadow-[0_0_32px_rgba(56,189,248,0.7)]"
          >
            <span className="preloader-scroll-dot h-1.5 w-1 rounded-full bg-white shadow-[0_0_8px_#38bdf8]" />
          </span>

          <span className="font-mono text-xs font-semibold tracking-[0.22em] text-white whitespace-nowrap uppercase drop-shadow-[0_0_14px_rgba(0,180,255,0.8)] transition-colors group-hover:text-[#7dd3fc]">
            SCROLL TO EXPLORE
          </span>

          <ChevronDown
            aria-hidden="true"
            className="preloader-chevron h-4 w-4 text-[#38bdf8] drop-shadow-[0_0_10px_rgba(0,180,255,0.75)] transition-colors group-hover:text-white"
          />
        </button>
      </div>
    </div>
  );
}
