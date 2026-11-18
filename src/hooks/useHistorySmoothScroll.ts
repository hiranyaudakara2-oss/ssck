import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'motion/react';

export interface UseHistorySmoothScrollOptions {
  enabled: boolean;
  speedPxPerSec: number;
  reducedMotion: boolean;
  scrollCanvasRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
  milestoneRefs: RefObject<(HTMLDivElement | null)[]>;
  milestoneCount: number;
  progressBarRef?: RefObject<HTMLDivElement | null>;
  progressTextRef?: RefObject<HTMLSpanElement | null>;
  onActiveIndexChange: (index: number) => void;
  onReachEnd: () => void;
  onUserInterrupt: () => void;
}

interface CachedGeometry {
  maxScrollY: number;
  trackTop: number;
  trackHeight: number;
  milestoneCenters: number[];
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

export function useHistorySmoothScroll({
  enabled,
  speedPxPerSec,
  reducedMotion,
  scrollCanvasRef,
  trackRef,
  milestoneRefs,
  milestoneCount,
  progressBarRef,
  progressTextRef,
  onActiveIndexChange,
  onReachEnd,
  onUserInterrupt,
}: UseHistorySmoothScrollOptions): {
  spineScaleY: MotionValue<number>;
  syncPositionNow: () => number;
} {
  const spineProgressMV = useMotionValue(0);
  const spineScaleY = useSpring(spineProgressMV, {
    stiffness: 200,
    damping: 32,
    restDelta: 0.001,
  });

  const geometryRef = useRef<CachedGeometry>({
    maxScrollY: 0,
    trackTop: 0,
    trackHeight: 1,
    milestoneCenters: [],
  });

  const offsetDeltaRef = useRef(0);
  const startWindowYRef = useRef(0);
  const lastActiveIdxRef = useRef(-1);
  const speedRef = useRef(speedPxPerSec);
  const enabledRef = useRef(enabled);

  const onActiveIndexChangeRef = useRef(onActiveIndexChange);
  const onReachEndRef = useRef(onReachEnd);
  const onUserInterruptRef = useRef(onUserInterrupt);

  useEffect(() => {
    speedRef.current = speedPxPerSec;
  }, [speedPxPerSec]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onActiveIndexChangeRef.current = onActiveIndexChange;
  }, [onActiveIndexChange]);

  useEffect(() => {
    onReachEndRef.current = onReachEnd;
  }, [onReachEnd]);

  useEffect(() => {
    onUserInterruptRef.current = onUserInterrupt;
  }, [onUserInterrupt]);

  // Pre-cache untransformed document coordinates to guarantee zero layout reflows inside rAF
  const measureGeometry = useCallback(() => {
    const canvasEl = scrollCanvasRef.current;
    if (!canvasEl) return;

    const winY = window.scrollY;
    const activeDelta = offsetDeltaRef.current;

    const canvasRect = canvasEl.getBoundingClientRect();
    const canvasTopDoc = canvasRect.top + winY + activeDelta;
    const canvasBottomDoc = canvasTopDoc + canvasEl.offsetHeight;
    const maxScrollY = Math.max(0, canvasBottomDoc - window.innerHeight);

    let trackTop = canvasTopDoc;
    let trackHeight = Math.max(1, canvasEl.offsetHeight);
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      trackTop = trackRect.top + winY + activeDelta;
      trackHeight = Math.max(1, trackRect.height);
    }

    const milestoneCenters = (milestoneRefs.current || []).map((el) => {
      if (!el) return Number.POSITIVE_INFINITY;
      const r = el.getBoundingClientRect();
      return r.top + winY + activeDelta + r.height * 0.5;
    });

    geometryRef.current = {
      maxScrollY,
      trackTop,
      trackHeight,
      milestoneCenters,
    };
  }, [scrollCanvasRef, trackRef, milestoneRefs]);

  // Apply progress indicators & active milestone from any virtual scroll Y without React churn
  const updateVisualMetrics = useCallback(
    (virtualScrollY: number) => {
      const { maxScrollY, trackTop, trackHeight, milestoneCenters } = geometryRef.current;
      const vh = window.innerHeight;

      const pageProgress = maxScrollY > 0 ? clamp(virtualScrollY / maxScrollY, 0, 1) : 0;
      if (progressBarRef?.current) {
        progressBarRef.current.style.transform = `scaleX(${pageProgress.toFixed(4)})`;
      }
      if (progressTextRef?.current) {
        const nextLabel = `${Math.round(pageProgress * 100)}%`;
        if (progressTextRef.current.textContent !== nextLabel) {
          progressTextRef.current.textContent = nextLabel;
        }
      }

      // Spine progress matches Framer Motion offset ['start 75%', 'end 80%']
      const spineStart = trackTop - vh * 0.75;
      const spineEnd = trackTop + trackHeight - vh * 0.8;
      const spineRange = Math.max(1, spineEnd - spineStart);
      const nextSpine = clamp((virtualScrollY - spineStart) / spineRange, 0, 1);
      spineProgressMV.set(nextSpine);

      if (milestoneCenters.length > 0) {
        const viewportMid = virtualScrollY + vh * 0.45;
        let closestIdx = 0;
        let closestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < milestoneCenters.length; i++) {
          const center = milestoneCenters[i];
          if (!Number.isFinite(center)) continue;
          const dist = Math.abs(center - viewportMid);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
        if (lastActiveIdxRef.current !== closestIdx) {
          lastActiveIdxRef.current = closestIdx;
          onActiveIndexChangeRef.current(closestIdx);
        }
      }
    },
    [progressBarRef, progressTextRef, spineProgressMV]
  );

  // Measure geometry initially, on milestone count changes, and on layout resizes
  useEffect(() => {
    measureGeometry();
    updateVisualMetrics(window.scrollY + offsetDeltaRef.current);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && scrollCanvasRef.current) {
      ro = new ResizeObserver(() => {
        measureGeometry();
        updateVisualMetrics(window.scrollY + offsetDeltaRef.current);
      });
      ro.observe(scrollCanvasRef.current);
    }

    const onResize = () => {
      measureGeometry();
      updateVisualMetrics(window.scrollY + offsetDeltaRef.current);
    };

    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [milestoneCount, measureGeometry, updateVisualMetrics, scrollCanvasRef]);

  // Native browsing listener (rAF-coalesced) when custom auto-scroll is inactive
  useEffect(() => {
    if (enabled) return;

    let rafId = 0;
    const scheduleUpdate = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateVisualMetrics(window.scrollY);
      });
    };

    updateVisualMetrics(window.scrollY);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
    };
  }, [enabled, updateVisualMetrics]);

  // Synchronizes native window scroll position cleanly when handing back from GPU transform
  const syncPositionNow = useCallback(() => {
    const canvasEl = scrollCanvasRef.current;
    const delta = offsetDeltaRef.current;
    const syncedY = Math.round(startWindowYRef.current + delta);

    if (canvasEl) {
      canvasEl.style.transform = '';
      canvasEl.style.willChange = '';
      canvasEl.style.pointerEvents = '';
    }

    offsetDeltaRef.current = 0;

    const prevDocOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    if (prevDocOverflow === 'hidden') document.documentElement.style.overflow = '';
    if (prevBodyOverflow === 'hidden') document.body.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';

    if (delta !== 0) {
      const prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, syncedY);
      startWindowYRef.current = syncedY;
      window.requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = prevBehavior;
      });
    }

    return syncedY;
  }, [scrollCanvasRef]);

  // Custom high-performance requestAnimationFrame virtual scroll engine when auto-scroll is enabled
  useEffect(() => {
    if (!enabled) return;
    const canvasEl = scrollCanvasRef.current;
    if (!canvasEl) return;

    measureGeometry();
    const { maxScrollY } = geometryRef.current;

    // If user starts auto-scroll while already resting at the bottom, reset smoothly to top
    let startY = window.scrollY;
    if (maxScrollY > 0 && startY >= maxScrollY - 4) {
      const prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      document.documentElement.style.scrollBehavior = prevBehavior;
      startY = 0;
    }

    startWindowYRef.current = startY;
    offsetDeltaRef.current = 0;

    // Replace native scrolling: lock viewport overflow and promote canvas to its own GPU layer
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevOverscroll = document.documentElement.style.overscrollBehavior;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    canvasEl.style.willChange = 'transform';
    canvasEl.style.pointerEvents = 'none';
    canvasEl.style.transform = 'translate3d(0, 0px, 0)';

    let rafId = 0;
    let cleanedUp = false;
    let startTime = performance.now();
    let lastTime = startTime;
    let currentDelta = 0;
    let targetDelta = 0;

    const teardown = (restoreScroll = true) => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      const canvas = scrollCanvasRef.current;
      const committedDelta = offsetDeltaRef.current;
      const finalY = Math.round(startWindowYRef.current + committedDelta);

      if (canvas) {
        canvas.style.transform = '';
        canvas.style.willChange = '';
        canvas.style.pointerEvents = '';
      }

      offsetDeltaRef.current = 0;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehavior = prevOverscroll;

      if (restoreScroll && committedDelta !== 0) {
        const prevBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, finalY);
        window.requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior = prevBehavior;
        });
      }
    };

    const tick = (now: number) => {
      if (cleanedUp || !enabledRef.current) return;

      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      // Gentle 450ms ease-in ramp so playback starts smoothly without an abrupt jump
      const elapsedSec = (now - startTime) / 1000;
      const rampFactor = reducedMotion ? 1 : Math.min(1, elapsedSec / 0.45);
      const easedVelocityFactor = rampFactor * (2 - rampFactor);

      const currentMaxDelta = Math.max(0, geometryRef.current.maxScrollY - startWindowYRef.current);

      targetDelta = Math.min(currentMaxDelta, targetDelta + speedRef.current * easedVelocityFactor * dt);

      // Sub-pixel exponential smoothing on the compositor target
      const smoothingAlpha = reducedMotion ? 1 : 1 - Math.exp(-14 * dt);
      currentDelta += (targetDelta - currentDelta) * smoothingAlpha;
      if (currentMaxDelta - currentDelta < 0.35 && targetDelta >= currentMaxDelta) {
        currentDelta = currentMaxDelta;
      }

      offsetDeltaRef.current = currentDelta;
      canvasEl.style.transform = `translate3d(0, ${(-currentDelta).toFixed(3)}px, 0)`;

      updateVisualMetrics(startWindowYRef.current + currentDelta);

      if (currentMaxDelta <= 0 || currentDelta >= currentMaxDelta - 0.35) {
        teardown(true);
        onReachEndRef.current();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    // Pause and hand back seamlessly to native scrolling when the user manually scrolls or hits Stop keys
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      teardown(true);
      onUserInterruptRef.current();
    };

    const handleTouchMove = () => {
      teardown(true);
      onUserInterruptRef.current();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' ||
        e.key === ' ' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp'
      ) {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (e.key === ' ' && (activeTag === 'button' || activeTag === 'input')) {
          return;
        }
        if (e.key !== 'Escape') e.preventDefault();
        teardown(true);
        onUserInterruptRef.current();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      teardown(false);
    };
  }, [enabled, reducedMotion, scrollCanvasRef, measureGeometry, updateVisualMetrics]);

  return {
    spineScaleY,
    syncPositionNow,
  };
}
