import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface HoverInfoBoxProps {
  title: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  placement?: 'top' | 'bottom';
}

export function HoverInfoBox({
  title,
  description,
  badge,
  icon,
  children,
  className = '',
  placement = 'top',
}: HoverInfoBoxProps) {
  const prefersReduced = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number; dir: 'top' | 'bottom' }>({
    left: 0,
    top: 0,
    dir: placement,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setSupportsHover(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const computePosition = () => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const boxWidth = 264;
    const margin = 12;

    const rawCenter = rect.left + rect.width / 2;
    const clampedLeft = Math.max(
      margin + boxWidth / 2,
      Math.min(window.innerWidth - margin - boxWidth / 2, rawCenter)
    );

    const spaceAbove = rect.top;
    const dir: 'top' | 'bottom' =
      placement === 'top' && spaceAbove < 120
        ? 'bottom'
        : placement === 'bottom' && window.innerHeight - rect.bottom < 120
        ? 'top'
        : placement;

    const top = dir === 'top' ? rect.top - 10 : rect.bottom + 10;
    setCoords({ left: clampedLeft, top, dir });
  };

  const handleOpen = () => {
    if (!supportsHover) return;
    computePosition();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
      className={`relative ${className}`}
    >
      {children}

      <AnimatePresence>
        {open && supportsHover && (
          <motion.div
            role="tooltip"
            initial={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 0, y: coords.dir === 'top' ? 6 : -6, scale: 0.96 }
            }
            animate={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, y: coords.dir === 'top' ? 4 : -4, scale: 0.96 }
            }
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: coords.left,
              top: coords.top,
              transform:
                coords.dir === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0%)',
              width: '264px',
            }}
            className="pointer-events-none z-[90]"
          >
            <div className="rounded-xl border border-blue-400/35 bg-[#081026]/95 p-3.5 shadow-[0_14px_38px_rgba(3,7,18,0.82)] backdrop-blur-xl">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-600/20 text-blue-300">
                  {icon || <Sparkles className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  {badge && (
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                      {badge}
                    </span>
                  )}
                  <p className="font-display text-xs font-semibold leading-snug text-white">
                    {title}
                  </p>
                  {description && (
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
