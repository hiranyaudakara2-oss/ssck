import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface MusicPreferences {
  volume: number;
  muted: boolean;
  wantsPlayback: boolean;
  playerHidden: boolean;
}

const STORAGE_KEY = 'ssck_tech_music_prefs';

function loadPreferences(): MusicPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { volume: 0.42, muted: false, wantsPlayback: true, playerHidden: false };
    const parsed = JSON.parse(raw) as Partial<MusicPreferences>;
    return {
      volume:
        typeof parsed.volume === 'number' && !Number.isNaN(parsed.volume)
          ? Math.min(1, Math.max(0, parsed.volume))
          : 0.42,
      muted: Boolean(parsed.muted),
      wantsPlayback: parsed.wantsPlayback !== false,
      playerHidden: Boolean(parsed.playerHidden),
    };
  } catch {
    return { volume: 0.42, muted: false, wantsPlayback: true, playerHidden: false };
  }
}

function savePreferences(prefs: MusicPreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

// Royalty-free procedural futuristic ambient progression: Am9 -> Fmaj7 -> Cmaj9 -> G6
const CHORD_PROGRESSION = [
  [220.0, 261.63, 329.63, 493.88], // Am9
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [261.63, 329.63, 392.0, 587.33], // Cmaj9
  [196.0, 246.94, 293.66, 329.63], // G6
];

const ARPEGGIO_SCALE = [440.0, 523.25, 659.25, 783.99, 987.77, 659.25, 587.33, 523.25];

interface MusicContextValue {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  needsActivation: boolean;
  analyserNode: AnalyserNode | null;
  isPlayerHidden: boolean;
  playMusic: () => Promise<void>;
  pauseMusic: () => void;
  togglePlay: () => Promise<void>;
  toggleMute: () => void;
  setVolume: (nextVolume: number) => void;
  setRouteSuspended: (suspended: boolean) => void;
  hidePlayer: () => void;
  showPlayer: () => void;
  togglePlayerVisibility: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const initialPrefs = useRef<MusicPreferences>(
    typeof window !== 'undefined'
      ? loadPreferences()
      : { volume: 0.42, muted: false, wantsPlayback: true, playerHidden: false }
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialPrefs.current.muted);
  const [volume, setVolumeState] = useState(initialPrefs.current.volume);
  const [wantsPlayback, setWantsPlayback] = useState(initialPrefs.current.wantsPlayback);
  const [isPlayerHidden, setIsPlayerHidden] = useState(initialPrefs.current.playerHidden);
  const [needsActivation, setNeedsActivation] = useState(true);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const stepTimerRef = useRef<number | null>(null);
  const stepCountRef = useRef(0);
  const padOscillatorsRef = useRef<OscillatorNode[]>([]);
  const padGainsRef = useRef<GainNode[]>([]);
  const routeSuspendedRef = useRef(
    typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/history'
  );
  const resumeAfterRouteRef = useRef(false);

  const applyGainSmoothly = useCallback((vol: number, muted: boolean, playing: boolean) => {
    const ctx = audioCtxRef.current;
    const gain = masterGainRef.current;
    if (!ctx || !gain) return;
    const target = !playing || muted ? 0 : Math.max(0.0001, vol * 0.34);
    gain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
  }, []);

  const ensureSynthEngine = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (audioCtxRef.current) return audioCtxRef.current;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1850;
    filter.Q.value = 1.2;

    // Gentle stereo-feeling feedback echo for spatial atmosphere
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.38;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    delay.connect(feedback);
    feedback.connect(delay);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.82;

    filter.connect(masterGain);
    filter.connect(delay);
    delay.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    // 4 continuous detuned warm pad oscillators that glide through chords
    const padOscs: OscillatorNode[] = [];
    const padGains: GainNode[] = [];
    const initialChord = CHORD_PROGRESSION[0];
    initialChord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq * 0.5;
      osc.detune.value = (i - 1.5) * 6;
      g.gain.value = i === 0 ? 0.24 : 0.14;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      padOscs.push(osc);
      padGains.push(g);
    });

    audioCtxRef.current = ctx;
    masterGainRef.current = masterGain;
    filterNodeRef.current = filter;
    padOscillatorsRef.current = padOscs;
    padGainsRef.current = padGains;
    setAnalyserNode(analyser);

    return ctx;
  }, []);

  const triggerStepNote = useCallback(() => {
    const ctx = audioCtxRef.current;
    const filter = filterNodeRef.current;
    if (!ctx || !filter || ctx.state !== 'running') return;

    const step = stepCountRef.current;
    stepCountRef.current += 1;

    // Advance chord pad every 16 steps (~6.4 seconds)
    if (step % 16 === 0) {
      const chordIdx = Math.floor(step / 16) % CHORD_PROGRESSION.length;
      const chord = CHORD_PROGRESSION[chordIdx];
      padOscillatorsRef.current.forEach((osc, i) => {
        osc.frequency.setTargetAtTime(chord[i] * 0.5, ctx.currentTime, 0.35);
      });
    }

    // Soft sub bass pulse on beats 0 and 8
    if (step % 8 === 0) {
      const chordIdx = Math.floor(step / 16) % CHORD_PROGRESSION.length;
      const rootFreq = CHORD_PROGRESSION[chordIdx][0] * 0.25;
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(rootFreq, ctx.currentTime);
      bassGain.gain.setValueAtTime(0.001, ctx.currentTime);
      bassGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.06);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      bassOsc.connect(bassGain);
      bassGain.connect(filter);
      bassOsc.start(ctx.currentTime);
      bassOsc.stop(ctx.currentTime + 1.55);
    }

    // Ethereal tech arpeggio pluck on select eighth steps
    if (step % 2 === 0 && (step % 6 === 0 || step % 4 === 2)) {
      const note = ARPEGGIO_SCALE[(step / 2) % ARPEGGIO_SCALE.length];
      const pluckOsc = ctx.createOscillator();
      const pluckGain = ctx.createGain();
      pluckOsc.type = 'sine';
      pluckOsc.frequency.setValueAtTime(note, ctx.currentTime);
      pluckGain.gain.setValueAtTime(0.001, ctx.currentTime);
      pluckGain.gain.linearRampToValueAtTime(0.085, ctx.currentTime + 0.025);
      pluckGain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.85);
      pluckOsc.connect(pluckGain);
      pluckGain.connect(filter);
      pluckOsc.start(ctx.currentTime);
      pluckOsc.stop(ctx.currentTime + 0.9);
    }
  }, []);

  const startSequencerLoop = useCallback(() => {
    if (stepTimerRef.current !== null) return;
    triggerStepNote();
    stepTimerRef.current = window.setInterval(triggerStepNote, 400);
  }, [triggerStepNote]);

  const stopSequencerLoop = useCallback(() => {
    if (stepTimerRef.current !== null) {
      window.clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  }, []);

  const playMusic = useCallback(async () => {
    if (routeSuspendedRef.current) return;
    const ctx = ensureSynthEngine();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (ctx.state === 'running') {
        setIsPlaying(true);
        setNeedsActivation(false);
        setWantsPlayback(true);
        applyGainSmoothly(volume, isMuted, true);
        startSequencerLoop();
      } else {
        setNeedsActivation(true);
      }
    } catch {
      setNeedsActivation(true);
      setIsPlaying(false);
    }
  }, [ensureSynthEngine, volume, isMuted, applyGainSmoothly, startSequencerLoop]);

  const pauseMusic = useCallback(() => {
    setIsPlaying(false);
    setWantsPlayback(false);
    setNeedsActivation(false);
    applyGainSmoothly(volume, isMuted, false);
    stopSequencerLoop();
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'running') {
      void ctx.suspend().catch(() => undefined);
    }
  }, [volume, isMuted, applyGainSmoothly, stopSequencerLoop]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      await playMusic();
    }
  }, [isPlaying, pauseMusic, playMusic]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      applyGainSmoothly(volume, next, isPlaying);
      return next;
    });
  }, [volume, isPlaying, applyGainSmoothly]);

  const setVolume = useCallback(
    (nextVolume: number) => {
      const clamped = Math.min(1, Math.max(0, nextVolume));
      setVolumeState(clamped);
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
        applyGainSmoothly(clamped, false, isPlaying);
      } else {
        applyGainSmoothly(clamped, isMuted, isPlaying);
      }
    },
    [isMuted, isPlaying, applyGainSmoothly]
  );

  const hidePlayer = useCallback(() => {
    setIsPlayerHidden(true);
  }, []);

  const showPlayer = useCallback(() => {
    setIsPlayerHidden(false);
  }, []);

  const togglePlayerVisibility = useCallback(() => {
    setIsPlayerHidden((prev) => !prev);
  }, []);

  // Save preferences on change
  useEffect(() => {
    savePreferences({
      volume,
      muted: isMuted,
      wantsPlayback,
      playerHidden: isPlayerHidden,
    });
  }, [volume, isMuted, wantsPlayback, isPlayerHidden]);

  const setRouteSuspended = useCallback(
    (suspended: boolean) => {
      const prev = routeSuspendedRef.current;
      routeSuspendedRef.current = suspended;
      if (suspended === prev) return;

      if (suspended) {
        resumeAfterRouteRef.current = isPlaying;
        if (isPlaying) {
          setIsPlaying(false);
          applyGainSmoothly(volume, isMuted, false);
          stopSequencerLoop();
          const ctx = audioCtxRef.current;
          if (ctx && ctx.state === 'running') {
            void ctx.suspend().catch(() => undefined);
          }
        }
      } else if (resumeAfterRouteRef.current) {
        resumeAfterRouteRef.current = false;
        void playMusic();
      }
    },
    [isPlaying, volume, isMuted, applyGainSmoothly, stopSequencerLoop, playMusic]
  );

  // Attempt graceful autoplay if user wanted music; otherwise remain ready for 1-click unlock
  useEffect(() => {
    if (!wantsPlayback) {
      setNeedsActivation(false);
      return;
    }

    let cancelled = false;
    const tryAutoplay = async () => {
      if (routeSuspendedRef.current) return;
      const ctx = ensureSynthEngine();
      if (!ctx || cancelled) return;
      try {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        if (!cancelled && !routeSuspendedRef.current && ctx.state === 'running') {
          setIsPlaying(true);
          setNeedsActivation(false);
          applyGainSmoothly(volume, isMuted, true);
          startSequencerLoop();
        } else if (!cancelled) {
          setNeedsActivation(true);
        }
      } catch {
        if (!cancelled) {
          setNeedsActivation(true);
        }
      }
    };

    void tryAutoplay();

    // Also unlock cleanly on the user's very first pointer/keyboard interaction if autoplay was blocked
    const unlockOnFirstGesture = () => {
      if (!routeSuspendedRef.current && wantsPlayback && !isPlaying) {
        void playMusic();
      }
    };
    window.addEventListener('pointerdown', unlockOnFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', unlockOnFirstGesture, { once: true, passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener('pointerdown', unlockOnFirstGesture);
      window.removeEventListener('keydown', unlockOnFirstGesture);
    };
    // Run only once on initial mount so navigation never restarts audio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean shutdown only when whole app unmounts
  useEffect(() => {
    return () => {
      stopSequencerLoop();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => undefined);
      }
    };
  }, [stopSequencerLoop]);

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        isMuted,
        volume,
        needsActivation,
        analyserNode,
        isPlayerHidden,
        playMusic,
        pauseMusic,
        togglePlay,
        toggleMute,
        setVolume,
        setRouteSuspended,
        hidePlayer,
        showPlayer,
        togglePlayerVisibility,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used inside MusicProvider');
  return ctx;
}
