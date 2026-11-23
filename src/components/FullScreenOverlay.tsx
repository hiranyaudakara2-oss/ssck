import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useRegisterModalOpen } from '../context/DataContext';

export interface FullScreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  headerBadge?: React.ReactNode;
  headerActions?: React.ReactNode;
  closeLabel?: string;
  disableClose?: boolean;
  maxWidth?: 'md' | 'lg' | '2xl' | '4xl' | '5xl' | '6xl';
  zIndexClass?: string;
  accentBarClass?: string;
  tone?: 'default' | 'amber' | 'violet';
  children: React.ReactNode;
}

const MAX_WIDTH_CLASS: Record<NonNullable<FullScreenOverlayProps['maxWidth']>, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
};

export function FullScreenOverlay({
  isOpen,
  onClose,
  ariaLabel,
  ariaLabelledBy,
  headerBadge,
  headerActions,
  closeLabel = 'Close overlay',
  disableClose = false,
  maxWidth = '4xl',
  zIndexClass = 'z-[100]',
  accentBarClass = 'bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500',
  tone = 'default',
  children,
}: FullScreenOverlayProps) {
  const prefersReduced = useReducedMotion();
  const isActiveModal = useRegisterModalOpen(isOpen);
  const visible = isOpen && isActiveModal;

  useEffect(() => {
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || disableClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, disableClose, onClose]);

  const orbLeftClass =
    tone === 'amber'
      ? 'bg-amber-500/20'
      : tone === 'violet'
      ? 'bg-indigo-600/22'
      : 'bg-blue-600/22';

  const orbRightClass =
    tone === 'amber'
      ? 'bg-rose-600/18'
      : tone === 'violet'
      ? 'bg-violet-500/24'
      : 'bg-violet-600/22';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReduced ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed inset-0 ${zIndexClass} flex h-[100dvh] w-full flex-col overflow-hidden bg-[#040816]/82 backdrop-blur-xl`}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
        >
          {/* Rich Navy + Blue/Violet Gradient Mesh & Ambient Glow Orbs */}
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                backgroundImage:
                  tone === 'amber'
                    ? 'radial-gradient(ellipse 65% 55% at 15% 15%, rgba(245, 158, 11, 0.14), transparent 60%), radial-gradient(ellipse 60% 55% at 85% 85%, rgba(139, 92, 246, 0.16), transparent 60%)'
                    : 'radial-gradient(ellipse 65% 55% at 15% 15%, rgba(37, 99, 235, 0.22), transparent 60%), radial-gradient(ellipse 60% 55% at 85% 85%, rgba(139, 92, 246, 0.22), transparent 60%)',
              }}
            />
            <div
              className={`animate-ambient-slow absolute -left-28 -top-28 h-[28rem] w-[28rem] rounded-full ${orbLeftClass} blur-[110px]`}
            />
            <div
              className={`animate-ambient-slow absolute -bottom-28 -right-28 h-[28rem] w-[28rem] rounded-full ${orbRightClass} blur-[110px]`}
              style={{ animationDelay: '-7s' }}
            />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(148, 163, 184, 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.6) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            />
          </div>

          {/* Animated Top Gradient Accent Bar */}
          <motion.div
            initial={prefersReduced ? false : { scaleX: 0.35, opacity: 0.3 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-20 h-1 w-full shrink-0 origin-center ${accentBarClass} shadow-[0_0_20px_rgba(56,189,248,0.45)]`}
          />

          {/* Sticky Translucent Header with Context Label, Optional Controls & Stylish Close (X) */}
          <header className="relative z-20 shrink-0 border-b border-blue-400/15 bg-[#060c1f]/85 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8 sm:py-4">
              <div className="flex min-w-0 items-center gap-3 text-xs sm:text-sm">
                {headerBadge || (
                  <span className="font-display font-semibold tracking-tight text-slate-200">
                    SSCK TECH
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {headerActions}
                <motion.button
                  type="button"
                  disabled={disableClose}
                  onClick={onClose}
                  aria-label={closeLabel}
                  title="Close (Esc)"
                  whileHover={prefersReduced || disableClose ? undefined : { scale: 1.07 }}
                  whileTap={prefersReduced || disableClose ? undefined : { scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] text-slate-100 shadow-lg backdrop-blur-md transition-colors hover:border-cyan-400/60 hover:bg-gradient-to-br hover:from-blue-500/25 hover:to-violet-500/25 hover:text-white hover:shadow-[0_0_22px_rgba(34,211,238,0.32)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                >
                  <X className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
                </motion.button>
              </div>
            </div>
          </header>

          {/* Internally Scrollable Full-Screen Content Region (clicking outside panel closes modal) */}
          <div
            onClick={(e) => {
              if (!disableClose && e.target === e.currentTarget) {
                onClose();
              }
            }}
            className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-10"
          >
            <div
              onClick={(e) => {
                if (!disableClose && e.target === e.currentTarget) {
                  onClose();
                }
              }}
              className="flex min-h-full w-full flex-col"
            >
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 22, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReduced ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: prefersReduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={`my-auto mx-auto w-full ${MAX_WIDTH_CLASS[maxWidth]}`}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface OverlayPanelProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'amber';
}

export function OverlayPanel({
  children,
  className = '',
  tone = 'default',
}: OverlayPanelProps) {
  const borderAndGlow =
    tone === 'amber'
      ? 'border-amber-400/30 shadow-[0_0_75px_-16px_rgba(245,158,11,0.28),0_0_40px_-14px_rgba(139,92,246,0.22)]'
      : 'border-blue-400/20 shadow-[0_0_80px_-16px_rgba(59,130,246,0.34),0_0_45px_-14px_rgba(139,92,246,0.24)]';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0b1533]/95 via-[#070e22]/98 to-[#050a18] backdrop-blur-xl sm:rounded-3xl ${borderAndGlow} ${className}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
          tone === 'amber' ? 'via-amber-400/50' : 'via-cyan-400/45'
        } to-transparent`}
      />
      {children}
    </div>
  );
}

export interface OverlayStaggerProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function OverlayStagger({
  children,
  delay = 0.06,
  className = '',
}: OverlayStaggerProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReduced ? 0 : 0.34,
        delay: prefersReduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface OverlayMediaFrameProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function OverlayMediaFrame({
  children,
  className = '',
  delay = 0.05,
}: OverlayMediaFrameProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: prefersReduced ? 0 : 0.5,
        delay: prefersReduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

export interface OverlayActionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'amber';
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const ACTION_VARIANT_CLASSES: Record<
  NonNullable<OverlayActionButtonProps['variant']>,
  string
> = {
  primary:
    'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white border border-blue-400/35 shadow-[0_10px_28px_-6px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 hover:shadow-[0_14px_34px_-6px_rgba(99,102,241,0.65)]',
  secondary:
    'border border-white/20 bg-white/[0.06] text-slate-100 hover:border-blue-400/45 hover:bg-white/[0.12] hover:text-white',
  amber:
    'bg-gradient-to-r from-amber-500 to-orange-600 text-white border border-amber-300/35 shadow-[0_10px_28px_-6px_rgba(245,158,11,0.45)] hover:from-amber-400 hover:to-orange-500 hover:shadow-[0_14px_32px_-6px_rgba(245,158,11,0.6)]',
};

export function OverlayActionButton({
  children,
  variant = 'primary',
  onClick,
  href,
  target,
  rel,
  disabled = false,
  className = '',
  type = 'button',
}: OverlayActionButtonProps) {
  const prefersReduced = useReducedMotion();
  const baseClass = `inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 ${ACTION_VARIANT_CLASSES[variant]} ${className}`;

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        whileHover={prefersReduced ? undefined : { y: -1.5, scale: 1.02 }}
        whileTap={prefersReduced ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 25 }}
        className={baseClass}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={prefersReduced || disabled ? undefined : { y: -1.5, scale: 1.02 }}
      whileTap={prefersReduced || disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 25 }}
      className={baseClass}
    >
      {children}
    </motion.button>
  );
}
