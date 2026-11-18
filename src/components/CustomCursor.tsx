import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export function CustomCursor() {
  const prefersReduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReduced || typeof window === 'undefined') {
      setEnabled(false);
      return;
    }

    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const checkPointer = () => {
      const hasTouchOnly =
        !mq.matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setEnabled(mq.matches && !hasTouchOnly);
    };

    checkPointer();
    mq.addEventListener('change', checkPointer);
    return () => mq.removeEventListener('change', checkPointer);
  }, [prefersReduced]);

  useEffect(() => {
    if (!enabled) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let trailX = targetX;
    let trailY = targetY;
    let visible = false;
    let hoveringInteractive = false;
    let hoveringMedia = false;
    let pressing = false;
    let rafId = 0;

    const applyVisuals = () => {
      const ringEl = ringRef.current;
      const trailEl = trailRef.current;
      const dotEl = dotRef.current;
      if (!ringEl || !trailEl || !dotEl) return;

      const opacity = visible ? '1' : '0';
      ringEl.style.opacity = opacity;
      trailEl.style.opacity = visible ? (hoveringInteractive ? '0.85' : '0.45') : '0';
      dotEl.style.opacity = opacity;

      const ringScale = pressing ? 0.82 : hoveringInteractive ? 1.55 : hoveringMedia ? 1.35 : 1;
      const dotScale = pressing ? 1.4 : hoveringInteractive ? 0.6 : 1;

      ringEl.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${ringScale})`;
      trailEl.style.transform = `translate3d(${trailX}px, ${trailY}px, 0) translate(-50%, -50%) scale(${hoveringInteractive ? 1.35 : 1})`;
      dotEl.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(${dotScale})`;

      if (hoveringInteractive) {
        ringEl.style.borderColor = 'rgba(34, 211, 238, 0.95)';
        ringEl.style.backgroundColor = 'rgba(6, 182, 212, 0.12)';
        ringEl.style.boxShadow = '0 0 24px rgba(34, 211, 238, 0.48)';
      } else if (hoveringMedia) {
        ringEl.style.borderColor = 'rgba(167, 139, 250, 0.9)';
        ringEl.style.backgroundColor = 'rgba(139, 92, 246, 0.12)';
        ringEl.style.boxShadow = '0 0 22px rgba(139, 92, 246, 0.38)';
      } else {
        ringEl.style.borderColor = 'rgba(96, 165, 250, 0.6)';
        ringEl.style.backgroundColor = 'transparent';
        ringEl.style.boxShadow = '0 0 14px rgba(59, 130, 246, 0.25)';
      }
    };

    const tick = () => {
      ringX += (targetX - ringX) * 0.22;
      ringY += (targetY - ringY) * 0.22;
      trailX += (targetX - trailX) * 0.11;
      trailY += (targetY - trailY) * 0.11;
      applyVisuals();
      rafId = window.requestAnimationFrame(tick);
    };

    const updateTargetFlags = (el: EventTarget | null) => {
      if (!(el instanceof Element)) {
        hoveringInteractive = false;
        hoveringMedia = false;
        return;
      }
      hoveringInteractive = Boolean(
        el.closest(
          'a, button, [role="button"], select, input, textarea, label[for], [data-cursor="interactive"]'
        )
      );
      hoveringMedia =
        !hoveringInteractive &&
        Boolean(el.closest('img, canvas, article, [data-cursor="card"], .animated-border-card'));
    };

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      visible = true;
      updateTargetFlags(e.target);
    };

    const onMouseDown = () => {
      pressing = true;
    };
    const onMouseUp = () => {
      pressing = false;
    };
    const onMouseLeave = () => {
      visible = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {/* Glowing ambient trailing aura */}
      <div
        ref={trailRef}
        className="pointer-events-none fixed left-0 top-0 h-14 w-14 rounded-full bg-gradient-to-tr from-blue-500/25 via-violet-500/20 to-sky-400/25 blur-md transition-opacity duration-200 will-change-transform"
        style={{ opacity: 0 }}
      />
      {/* Smooth spring reticle ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 h-8 w-8 rounded-full border transition-[border-color,background-color,box-shadow,opacity] duration-150 will-change-transform"
        style={{ opacity: 0 }}
      />
      {/* Precision center pointer dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)] transition-opacity duration-150 will-change-transform"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
