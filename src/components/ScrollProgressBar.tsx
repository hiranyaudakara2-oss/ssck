import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export function ScrollProgressBar() {
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 480);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {!prefersReduced && (
        <motion.div
          style={{ scaleX }}
          className="fixed left-0 right-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-blue-500 via-sky-400 to-violet-500 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })}
          aria-label="Scroll to top"
          className="fixed bottom-5 right-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#0a1226]/90 text-slate-200 shadow-lg transition-colors hover:bg-blue-600 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
