import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const MORPH_SHAPES_A = [
  'M 120 40 C 210 10, 340 50, 380 140 C 420 230, 360 350, 260 380 C 160 410, 50 340, 30 230 C 10 120, 30 70, 120 40 Z',
  'M 160 25 C 270 30, 360 95, 390 190 C 415 280, 310 385, 210 390 C 110 395, 35 300, 40 200 C 45 100, 70 20, 160 25 Z',
  'M 140 50 C 240 5, 370 70, 375 170 C 380 270, 330 370, 225 375 C 120 380, 20 315, 25 210 C 30 105, 65 85, 140 50 Z',
];

const MORPH_SHAPES_B = [
  'M 200 20 L 340 100 L 360 260 L 220 370 L 60 290 L 50 120 Z',
  'M 210 35 L 365 130 L 325 300 L 185 385 L 40 265 L 85 95 Z',
  'M 180 25 L 345 110 L 350 275 L 210 365 L 55 275 L 70 105 Z',
];

export function MorphingBackdrop({ variant = 'hero' }: { variant?: 'hero' | 'section' }) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Deep ambient gradient fields */}
      <div
        className={`absolute -top-36 -left-24 h-[460px] w-[460px] rounded-full bg-blue-600/18 blur-[120px] ${
          prefersReduced ? '' : 'animate-ambient-slow'
        }`}
      />
      <div
        className={`absolute top-1/4 -right-24 h-[420px] w-[420px] rounded-full bg-violet-600/16 blur-[130px] ${
          prefersReduced ? '' : 'animate-ambient-slow'
        }`}
        style={{ animationDelay: '-6s' }}
      />

      {variant === 'hero' && (
        <svg
          viewBox="0 0 420 420"
          className="absolute -right-20 -top-12 h-[540px] w-[540px] opacity-30 md:right-6 md:top-0"
          fill="none"
        >
          <defs>
            <linearGradient id="morphGradA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="morphGradB" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <motion.path
            d={MORPH_SHAPES_A[0]}
            stroke="url(#morphGradA)"
            strokeWidth="1.25"
            fill="url(#morphGradA)"
            fillOpacity="0.06"
            animate={
              prefersReduced
                ? undefined
                : {
                    d: MORPH_SHAPES_A,
                    rotate: [0, 8, 0],
                  }
            }
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.path
            d={MORPH_SHAPES_B[0]}
            stroke="url(#morphGradB)"
            strokeWidth="1"
            strokeDasharray="5 5"
            animate={
              prefersReduced
                ? undefined
                : {
                    d: MORPH_SHAPES_B,
                    rotate: [0, -10, 0],
                  }
            }
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      )}
    </div>
  );
}

export function TiltCard({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (!prefersReduced) setIsHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 6, ry: x * 6 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        transform: prefersReduced
          ? undefined
          : `perspective(1000px) translate3d(0, ${isHovered ? -4 : 0}px, 0) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 260ms ease',
      }}
      className={`animated-border-card ${
        onClick
          ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function MagneticButton({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (prefersReduced || disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
    setOffset({ x: dx, y: dy });
  };

  const handleLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform: prefersReduced ? undefined : `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 180ms ease, border-color 180ms ease',
      }}
      className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${className}`}
    >
      {children}
    </button>
  );
}

export function AnimatedCounter({
  value,
  suffix = '',
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(prefersReduced ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  const currentDisplayRef = useRef(prefersReduced ? value : 0);

  useEffect(() => {
    if (prefersReduced) {
      currentDisplayRef.current = value;
      setDisplay(value);
      return;
    }

    const animateToTarget = (fromVal: number, toVal: number) => {
      const duration = 750;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextVal = fromVal + (toVal - fromVal) * eased;
        currentDisplayRef.current = nextVal;
        setDisplay(nextVal);
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          currentDisplayRef.current = toVal;
          setDisplay(toVal);
        }
      };
      requestAnimationFrame(tick);
    };

    if (started.current) {
      animateToTarget(currentDisplayRef.current, value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          animateToTarget(0, value);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, prefersReduced]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString('en-US');

  return (
    <span ref={ref} className="tabular-nums">
      {formatted}
      {suffix}
    </span>
  );
}

export function RevealBlock({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  const normalizedSrc =
    typeof src === 'string' && src.trim().startsWith('/src/assets/images/')
      ? src.trim().replace(/^\/src\/assets\/images\//, '/assets/images/')
      : typeof src === 'string'
      ? src.trim()
      : '';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0c1633] via-[#132046] to-[#1e1b4b] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg className="mb-2 h-8 w-8 text-blue-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span className="text-xs font-medium text-slate-300">{fallbackLabel || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
