import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Clock,
  Pause,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CustomLinksSlot } from '../components/CustomLinksSlot';
import { HoverInfoBox } from '../components/HoverInfoBox';
import {
  MorphingBackdrop,
  RevealBlock,
  SafeImage,
  TiltCard,
} from '../components/MotionPrimitives';
import { useData } from '../context/DataContext';
import { useHistorySmoothScroll } from '../hooks/useHistorySmoothScroll';
import { useHistorySoundtrack } from '../hooks/useHistorySoundtrack';
import type { PageRoute } from '../types';

const SPEED_PRESETS = {
  '0.5x': 32,
  '1x': 64,
} as const;

type SpeedPreset = keyof typeof SPEED_PRESETS;

const EQ_BAR_COUNT = 6;

function HistoryAudioBars({
  isActive,
  analyserRef,
  reducedMotion,
}: {
  isActive: boolean;
  analyserRef: RefObject<AnalyserNode | null>;
  reducedMotion: boolean;
}) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!isActive || reducedMotion) {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.transform = 'scaleY(0.24)';
      });
      return;
    }

    let rafId = 0;
    let phase = 0;
    let freqData: Uint8Array<ArrayBuffer> | null = null;

    const tick = () => {
      phase += 0.08;
      const analyser = analyserRef.current;
      if (analyser) {
        if (!freqData || freqData.length !== analyser.frequencyBinCount) {
          freqData = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(freqData);
      }

      for (let i = 0; i < EQ_BAR_COUNT; i++) {
        const bar = barsRef.current[i];
        if (!bar) continue;

        let level = 0.28 + Math.abs(Math.sin(phase + i * 0.65)) * 0.58;
        if (freqData && freqData.length > 0) {
          const bin = Math.min(
            freqData.length - 1,
            Math.floor((i / EQ_BAR_COUNT) * (freqData.length * 0.65))
          );
          const amp = freqData[bin] / 255;
          level = Math.max(
            0.24,
            Math.min(1, amp * 1.25 + (Math.sin(phase + i * 0.55) * 0.12 + 0.18))
          );
        }
        bar.style.transform = `scaleY(${level.toFixed(3)})`;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isActive, analyserRef, reducedMotion]);

  return (
    <div className="flex h-4 items-end gap-[2.5px]" aria-hidden="true">
      {Array.from({ length: EQ_BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className={`h-full w-[2.5px] origin-bottom rounded-full transition-colors duration-200 ${
            isActive ? 'bg-blue-400' : 'bg-slate-600'
          }`}
          style={{ transform: 'scaleY(0.24)' }}
        />
      ))}
    </div>
  );
}

export function HistoryPage({
  onNavigate,
}: {
  onNavigate?: (route: PageRoute, subjectId?: string) => void;
}) {
  const { historyEvents } = useData();
  const prefersReduced = Boolean(useReducedMotion());
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>('0.5x');

  const {
    isMusicPlaying,
    isMuted,
    volume,
    analyserRef,
    startOrResume,
    pause: pauseSoundtrack,
    toggleMute,
    setVolume,
  } = useHistorySoundtrack();

  const scrollCanvasRef = useRef<HTMLDivElement>(null);
  const verticalTrackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);

  const sortedMilestones = [...historyEvents].sort((a, b) => a.order - b.order);

  const handleStopPresentation = useCallback(() => {
    setIsAutoScrollEnabled(false);
    pauseSoundtrack();
  }, [pauseSoundtrack]);

  const { spineScaleY, syncPositionNow } = useHistorySmoothScroll({
    enabled: isAutoScrollEnabled,
    speedPxPerSec: SPEED_PRESETS[speedPreset],
    reducedMotion: prefersReduced,
    scrollCanvasRef,
    trackRef: verticalTrackRef,
    milestoneRefs: itemRefs,
    milestoneCount: sortedMilestones.length,
    progressBarRef,
    progressTextRef,
    onActiveIndexChange: setActiveIndex,
    onReachEnd: handleStopPresentation,
    onUserInterrupt: handleStopPresentation,
  });

  const handlePlay = useCallback(async () => {
    setHasStartedOnce(true);
    setIsAutoScrollEnabled(true);
    await startOrResume();
  }, [startOrResume]);

  const handlePause = useCallback(() => {
    syncPositionNow();
    setIsAutoScrollEnabled(false);
    pauseSoundtrack();
  }, [syncPositionNow, pauseSoundtrack]);

  const handleTogglePresentation = useCallback(() => {
    if (isAutoScrollEnabled) {
      handlePause();
    } else {
      void handlePlay();
    }
  }, [isAutoScrollEnabled, handlePause, handlePlay]);

  const jumpToMilestone = (index: number) => {
    if (isAutoScrollEnabled) {
      handlePause();
    }
    setActiveIndex(index);
    const node = itemRefs.current[index];
    if (!node) return;
    window.requestAnimationFrame(() => {
      node.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });
  };

  const activeMilestone = sortedMilestones[activeIndex] ?? sortedMilestones[0];
  const volumePercent = isMuted ? 0 : Math.round(volume * 100);

  return (
    <div className="relative min-h-screen bg-transparent pb-28">
      {/* Integrated Exhibition Presentation & Auto-Scroll Utility Bar */}
      <div
        role="region"
        aria-label="History presentation controls"
        className={`${
          isAutoScrollEnabled ? 'sticky top-[72px]' : 'relative md:sticky md:top-[72px]'
        } z-30 border-b border-white/10 bg-[#060c1d]/92 backdrop-blur-md`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 text-xs text-slate-300">
            <span className="font-mono font-semibold tabular-nums text-blue-300">
              {activeMilestone?.year || 'Legacy'}
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="truncate font-medium text-slate-200">
              {activeMilestone?.era || 'SSCK Technology Archive'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={handleTogglePresentation}
              aria-label={isAutoScrollEnabled ? 'Pause auto-scroll and music' : 'Play auto-scroll and music'}
              className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                isAutoScrollEnabled
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isAutoScrollEnabled ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span>{isAutoScrollEnabled ? 'Pause' : hasStartedOnce ? 'Resume' : 'Play'}</span>
            </button>

            <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-0.5 sm:flex">
              {(['0.5x', '1x'] as SpeedPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSpeedPreset(preset)}
                  className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-medium tabular-nums transition-colors whitespace-nowrap shrink-0 ${
                    speedPreset === preset
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="hidden sm:block">
              <HistoryAudioBars
                isActive={isMusicPlaying && !isMuted}
                analyserRef={analyserRef}
                reducedMotion={prefersReduced}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute presentation music' : 'Mute presentation music'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-rose-400" />
                ) : (
                  <Volume2 className="h-4 w-4 text-sky-400" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={100}
                step={1}
                aria-label="Presentation music volume"
                value={volumePercent}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-slate-700 accent-blue-400 sm:w-20"
              />
            </div>

            <span
              ref={progressTextRef}
              className="w-9 text-right font-mono text-xs font-medium tabular-nums text-slate-300 shrink-0"
            >
              0%
            </span>
          </div>
        </div>

        {/* Hairline 60fps Compositor Scroll Progress Track */}
        <div className="h-[2px] w-full overflow-hidden bg-white/5" aria-hidden="true">
          <div
            ref={progressBarRef}
            className="h-full w-full origin-left bg-gradient-to-r from-blue-500 via-sky-400 to-violet-500"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>

      {/* GPU-Composited Scrolling Canvas (driven by rAF translate3d when auto-scroll is active) */}
      <div ref={scrollCanvasRef} className="relative z-0">
        {/* Header Hero */}
        <section className="relative overflow-hidden border-b border-white/10 pt-14 pb-12 sm:pt-20 sm:pb-16">
          <MorphingBackdrop variant="section" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-400">
                  <Clock className="h-4 w-4" />
                  <span>SSCK TECH · OUR LEGACY</span>
                </p>
                <h1
                  className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl"
                  style={{ textWrap: 'balance' }}
                >
                  The History of SSCK Technology Section
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
                  Discover the journey of the SSCK Technology Section — from its beginnings as a school-based technology learning community to its growth into a place of scientific exploration, engineering creativity, and technological innovation. Explore the development of Science for Technology, Engineering Technology, Information and Communication Technology, Bio Systems Technology, Geography, and Agricultural Technology. Celebrate the achievements, projects, competitions, innovations, and dedicated individuals who have shaped our journey. Together, we continue to inspire young minds, develop practical skills, and build a brighter future through science and technology.
                  <span className="mt-3 block font-semibold text-white">
                    Our Journey. Our Innovations. Our Future.
                  </span>
                </p>
                <CustomLinksSlot targetSection="history" onNavigate={onNavigate} />
              </div>
            </div>

            {/* Quick Era Jump Strip */}
            <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
              {sortedMilestones.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jumpToMilestone(idx)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                    activeIndex === idx
                      ? 'border-blue-500/60 bg-blue-600/20 text-white'
                      : 'border-white/10 bg-[#0b1328]/75 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <span className="block font-mono text-[11px] font-semibold tabular-nums text-blue-300">
                    {item.year}
                  </span>
                  <span className="block text-xs font-medium whitespace-nowrap">{item.era}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Main Timeline Body */}
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
          <div ref={verticalTrackRef} className="relative">
            {/* Static Spine + Compositor-Animated Gradient Spine */}
            <div
              className="absolute bottom-0 left-4 top-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2"
              aria-hidden="true"
            />
            {!prefersReduced && (
              <motion.div
                style={{ scaleY: spineScaleY, originY: 0 }}
                className="absolute bottom-0 left-4 top-0 w-0.5 bg-gradient-to-b from-blue-400 via-violet-500 to-sky-400 md:left-1/2 md:-translate-x-1/2"
                aria-hidden="true"
              />
            )}

            <div className="space-y-14 sm:space-y-20">
              {sortedMilestones.map((item, idx) => {
                const isLeft = idx % 2 === 0;
                const isCurrent = activeIndex === idx;
                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    className={`relative flex flex-col gap-6 pl-12 md:flex-row md:items-center md:pl-0 ${
                      isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Timeline Node Marker */}
                    <button
                      type="button"
                      onClick={() => jumpToMilestone(idx)}
                      aria-label={`Focus ${item.title}`}
                      className={`absolute left-4 top-6 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-lg border font-mono text-xs font-bold tabular-nums shadow-lg transition-colors md:left-1/2 md:top-1/2 md:-translate-y-1/2 ${
                        isCurrent
                          ? 'border-blue-400 bg-blue-600 text-white'
                          : 'border-blue-400/50 bg-[#080f23] text-blue-300'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </button>

                    {/* Card Column */}
                    <div className="w-full md:w-[calc(50%-2.5rem)]">
                      <RevealBlock delay={Math.min(idx * 0.05, 0.25)}>
                        <HoverInfoBox
                          title={`${item.year} · ${item.title}`}
                          badge={item.era}
                          description={item.impactSummary || item.description}
                          icon={<Clock className="h-3.5 w-3.5" />}
                        >
                          <TiltCard
                            onClick={() => setActiveIndex(idx)}
                            className={`overflow-hidden transition-all duration-300 ${
                              isCurrent
                                ? 'shadow-2xl shadow-blue-950/50 ring-1 ring-blue-400/35'
                                : 'opacity-90'
                            }`}
                          >
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                              <SafeImage
                                src={item.imageUrl}
                                alt={item.title}
                                fallbackLabel={`${item.year} · ${item.title}`}
                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0d152c] via-black/25 to-transparent" />
                              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 text-xs">
                                <span className="font-mono font-semibold tabular-nums text-blue-300">
                                  {item.year}
                                </span>
                                <span className="text-slate-200">{item.era}</span>
                              </div>
                            </div>

                            <div className="p-6">
                              <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                                {item.title}
                              </h2>
                              <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate-200">
                                {item.description}
                              </p>
                              {item.impactSummary && (
                                <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-950/25 p-3.5 text-xs leading-relaxed text-slate-200">
                                  <span className="mb-1 inline-flex items-center gap-1.5 font-semibold text-blue-300">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Historical Impact
                                  </span>
                                  <p>{item.impactSummary}</p>
                                </div>
                              )}
                            </div>
                          </TiltCard>
                        </HoverInfoBox>
                      </RevealBlock>
                    </div>

                    {/* Empty balancing spacer for desktop alternating layout */}
                    <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
