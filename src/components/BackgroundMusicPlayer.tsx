import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Disc3,
  EyeOff,
  Music,
  Pause,
  Play,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';

const BAR_COUNT = 12;

export function BackgroundMusicPlayer() {
  const {
    isPlaying,
    isMuted,
    volume,
    analyserNode,
    isPlayerHidden,
    togglePlay,
    toggleMute,
    setVolume,
    hidePlayer,
    showPlayer,
  } = useMusic();

  const prefersReduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Live frequency visualizer driven by AnalyserNode when music is playing and visible
  useEffect(() => {
    if (isPlayerHidden || !isPlaying || isMuted || prefersReduced) {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.transform = 'scaleY(0.22)';
      });
      return;
    }

    let rafId = 0;
    const freqData = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;
    let phase = 0;

    const tick = () => {
      phase += 0.09;
      if (analyserNode && freqData) {
        analyserNode.getByteFrequencyData(freqData);
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        const bar = barsRef.current[i];
        if (!bar) continue;

        let level = 0.25;
        if (freqData && freqData.length > 0) {
          const binIdx = Math.min(
            freqData.length - 1,
            Math.floor((i / BAR_COUNT) * (freqData.length * 0.65))
          );
          const normalized = freqData[binIdx] / 255;
          // Blend live FFT amplitude with subtle wave floor so ambient notes look fluid
          level = Math.max(
            0.2,
            Math.min(1, normalized * 1.35 + (Math.sin(phase + i * 0.55) * 0.12 + 0.16))
          );
        } else {
          level = 0.26 + Math.abs(Math.sin(phase + i * 0.5)) * 0.68;
        }

        bar.style.transform = `scaleY(${level.toFixed(3)})`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlayerHidden, isPlaying, isMuted, prefersReduced, analyserNode]);

  const handleHide = () => {
    setExpanded(false);
    hidePlayer();
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-5 sm:right-5">
      <AnimatePresence mode="wait" initial={false}>
        {isPlayerHidden ? (
          <motion.button
            key="floating-music-restore"
            type="button"
            onClick={showPlayer}
            aria-label="Show music player"
            title="Show music player"
            initial={prefersReduced ? false : { opacity: 0, scale: 0.72, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, scale: 0.72, y: 10 }}
            whileHover={prefersReduced ? undefined : { scale: 1.07, y: -2 }}
            whileTap={prefersReduced ? undefined : { scale: 0.94 }}
            transition={{ duration: prefersReduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto group relative inline-flex h-11 w-11 items-center justify-center rounded-full border bg-[#070f26]/95 text-white backdrop-blur-xl transition-colors sm:h-12 sm:w-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
              isPlaying && !isMuted
                ? 'border-cyan-400/55 shadow-[0_10px_28px_rgba(3,7,18,0.8),0_0_24px_rgba(34,211,238,0.3)]'
                : 'border-white/20 shadow-[0_10px_28px_rgba(3,7,18,0.75)] hover:border-cyan-400/50'
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute inset-1 rounded-full bg-gradient-to-tr from-blue-600/30 via-cyan-500/20 to-violet-600/30 transition-opacity ${
                isPlaying && !isMuted ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'
              }`}
            />
            <Music
              className={`relative h-5 w-5 transition-colors ${
                isPlaying && !isMuted
                  ? 'text-cyan-300'
                  : 'text-slate-200 group-hover:text-cyan-300'
              }`}
            />
          </motion.button>
        ) : (
          <motion.div
            key="music-player-bar-container"
            initial={prefersReduced ? false : { opacity: 0, x: 42, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0, x: 48, scale: 0.92 }}
            transition={{ duration: prefersReduced ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2"
          >
            {/* Expandable Volume Drawer */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={prefersReduced ? undefined : { opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: prefersReduced ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-auto glass-surface-elevated w-64 rounded-2xl border border-cyan-400/25 p-3.5 shadow-2xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-xs font-semibold text-white">SSCK TECH Audio</p>
                      <p className="text-[11px] text-cyan-300/85">Ambient Tech Synth</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      aria-label="Collapse music controls"
                      className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-rose-400" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-cyan-300" />
                      )}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      aria-label="Background music volume"
                      value={isMuted ? 0 : Math.round(volume * 100)}
                      onChange={(e) => setVolume(Number(e.target.value) / 100)}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
                    />

                    <span className="w-8 text-right font-mono text-[11px] tabular-nums text-slate-300">
                      {isMuted ? 0 : Math.round(volume * 100)}%
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Compact Persistent Floating Music Bar */}
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-[#070d1e]/95 px-2.5 py-1.5 shadow-[0_10px_30px_rgba(3,7,18,0.7)] backdrop-blur-xl sm:gap-2">
              <button
                type="button"
                onClick={() => void togglePlay()}
                aria-label={isPlaying ? 'Pause background music' : 'Play background music'}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-violet-600 text-white shadow-md shadow-blue-600/25 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="ml-0.5 h-3.5 w-3.5" />
                )}
              </button>

              {/* Live Animated Visualizer */}
              <div
                className="flex h-5 items-end gap-[2px] px-1"
                aria-hidden="true"
                title={isPlaying ? 'Music playing' : 'Music paused'}
              >
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                  <span
                    key={i}
                    ref={(el) => {
                      barsRef.current[i] = el;
                    }}
                    className={`h-full w-[2.5px] origin-bottom rounded-full transition-colors ${
                      isPlaying && !isMuted
                        ? i % 3 === 0
                          ? 'bg-cyan-400'
                          : i % 3 === 1
                          ? 'bg-blue-400'
                          : 'bg-violet-400'
                        : 'bg-slate-600'
                    }`}
                    style={{ transform: 'scaleY(0.22)' }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-cyan-300" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                aria-label="Audio mixer and volume controls"
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 text-[11px] font-medium text-slate-200 transition-colors hover:bg-white/10 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                {isPlaying && !prefersReduced ? (
                  <Disc3
                    className="h-3.5 w-3.5 animate-spin text-cyan-400"
                    style={{ animationDuration: '5s' }}
                  />
                ) : (
                  <SlidersHorizontal className="h-3.5 w-3.5 text-blue-300" />
                )}
                <span className="hidden sm:inline">{isPlaying ? 'Audio' : 'Music'}</span>
              </button>

              <span aria-hidden="true" className="h-4 w-px shrink-0 bg-white/15" />

              {/* Hide Music Player Bar Button */}
              <button
                type="button"
                onClick={handleHide}
                aria-label="Hide music player"
                title="Hide music player"
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 text-[11px] font-semibold text-slate-200 transition-colors hover:border-cyan-400/45 hover:bg-white/15 hover:text-white whitespace-nowrap focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <EyeOff className="h-3.5 w-3.5 text-slate-300" />
                <span>Hide</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
