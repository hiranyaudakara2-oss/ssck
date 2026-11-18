import { useCallback, useEffect, useRef, useState } from 'react';

interface SoundtrackChord {
  bass: number;
  pad: number[];
  arp: number[];
  chime: number;
}

// Serene cinematic documentary progression: Dmaj9 -> Bm7 -> Gmaj9 -> A6sus4
const SOUNDTRACK_PROGRESSION: SoundtrackChord[] = [
  {
    bass: 73.42, // D2
    pad: [146.83, 220.0, 277.18, 329.63], // D3, A3, C#4, E4
    arp: [293.66, 369.99, 440.0, 554.37, 659.25, 554.37, 440.0, 369.99],
    chime: 1174.66, // D6
  },
  {
    bass: 61.74, // B1
    pad: [123.47, 185.0, 220.0, 293.66], // B2, F#3, A3, D4
    arp: [246.94, 293.66, 369.99, 440.0, 587.33, 440.0, 369.99, 293.66],
    chime: 987.77, // B5
  },
  {
    bass: 98.0, // G2
    pad: [146.83, 196.0, 246.94, 293.66], // D3, G3, B3, D4
    arp: [196.0, 293.66, 369.99, 440.0, 493.88, 440.0, 369.99, 293.66],
    chime: 1108.73, // C#6 / lush color
  },
  {
    bass: 55.0, // A1
    pad: [110.0, 164.81, 220.0, 277.18], // A2, E3, A3, C#4
    arp: [220.0, 277.18, 329.63, 440.0, 554.37, 440.0, 329.63, 277.18],
    chime: 880.0, // A5
  },
];

const STEP_INTERVAL_MS = 450; // ~66.7 BPM eighth-note pulse for calm narrative pacing

export function useHistorySoundtrack() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.55);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const warmBusRef = useRef<BiquadFilterNode | null>(null);
  const padOscsRef = useRef<OscillatorNode[]>([]);
  const stepTimerRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);

  const volumeRef = useRef(volume);
  const mutedRef = useRef(isMuted);
  const playingRef = useRef(isMusicPlaying);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    playingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  const applyGain = useCallback((vol: number, muted: boolean, playing: boolean) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const target = !playing || muted ? 0 : Math.max(0.0001, vol * 0.36);
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.09);
  }, []);

  const ensureEngine = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (audioCtxRef.current) return audioCtxRef.current;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;

    // Warm cinematic lowpass bus so tones feel soft and orchestral
    const warmBus = ctx.createBiquadFilter();
    warmBus.type = 'lowpass';
    warmBus.frequency.value = 1950;
    warmBus.Q.value = 0.7;

    // Dual-tap atmospheric hall delay for gentle spacious reverb feel
    const delayLeft = ctx.createDelay(1.5);
    delayLeft.delayTime.value = 0.44;
    const delayRight = ctx.createDelay(1.5);
    delayRight.delayTime.value = 0.66;

    const feedbackA = ctx.createGain();
    feedbackA.gain.value = 0.32;
    const feedbackB = ctx.createGain();
    feedbackB.gain.value = 0.24;

    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.42;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.84;

    warmBus.connect(masterGain);
    warmBus.connect(delayLeft);
    delayLeft.connect(feedbackA);
    feedbackA.connect(delayRight);
    delayRight.connect(feedbackB);
    feedbackB.connect(delayLeft);

    delayLeft.connect(reverbWet);
    delayRight.connect(reverbWet);
    reverbWet.connect(masterGain);

    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    // 4 continuous orchestral string-pad voices that smoothly glide between chords
    const firstChord = SOUNDTRACK_PROGRESSION[0];
    const padOscs: OscillatorNode[] = [];
    firstChord.pad.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 7;
      voiceGain.gain.value = i === 0 ? 0.19 : 0.12;
      osc.connect(voiceGain);
      voiceGain.connect(warmBus);
      osc.start();
      padOscs.push(osc);
    });

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    masterGainRef.current = masterGain;
    warmBusRef.current = warmBus;
    padOscsRef.current = padOscs;

    return ctx;
  }, []);

  const triggerStep = useCallback(() => {
    const ctx = audioCtxRef.current;
    const bus = warmBusRef.current;
    if (!ctx || !bus || ctx.state !== 'running') return;

    const step = stepIndexRef.current;
    stepIndexRef.current += 1;

    const barIndex = Math.floor(step / 16) % SOUNDTRACK_PROGRESSION.length;
    const stepInBar = step % 16;
    const chord = SOUNDTRACK_PROGRESSION[barIndex];

    // Smooth string pad chord glide at start of each 16-step bar
    if (stepInBar === 0) {
      padOscsRef.current.forEach((osc, i) => {
        const targetFreq = chord.pad[i] ?? chord.pad[0];
        osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.55);
      });

      // Warm cello/bass swell on bar downbeat
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chord.bass, ctx.currentTime);
      bassGain.gain.setValueAtTime(0.0008, ctx.currentTime);
      bassGain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.18);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.4);
      bassOsc.connect(bassGain);
      bassGain.connect(bus);
      bassOsc.start(ctx.currentTime);
      bassOsc.stop(ctx.currentTime + 3.5);
    }

    // Soft felt-piano arpeggio notes on every 2 steps
    if (stepInBar % 2 === 0) {
      const arpNote = chord.arp[(stepInBar / 2) % chord.arp.length];
      const pianoOsc = ctx.createOscillator();
      const harmonicOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const harmonicGain = ctx.createGain();

      pianoOsc.type = 'sine';
      pianoOsc.frequency.setValueAtTime(arpNote, ctx.currentTime);

      harmonicOsc.type = 'triangle';
      harmonicOsc.frequency.setValueAtTime(arpNote * 2, ctx.currentTime);
      harmonicGain.gain.setValueAtTime(0.025, ctx.currentTime);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.45);

      noteGain.gain.setValueAtTime(0.0008, ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.115, ctx.currentTime + 0.035);
      noteGain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 1.55);

      pianoOsc.connect(noteGain);
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(noteGain);
      noteGain.connect(bus);

      pianoOsc.start(ctx.currentTime);
      harmonicOsc.start(ctx.currentTime);
      pianoOsc.stop(ctx.currentTime + 1.6);
      harmonicOsc.stop(ctx.currentTime + 1.6);
    }

    // Gentle celesta chime on step 8 of alternate bars
    if (stepInBar === 8 && barIndex % 2 === 0) {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(chord.chime, ctx.currentTime);
      chimeGain.gain.setValueAtTime(0.0005, ctx.currentTime);
      chimeGain.gain.linearRampToValueAtTime(0.038, ctx.currentTime + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.0004, ctx.currentTime + 1.9);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(bus);
      chimeOsc.start(ctx.currentTime);
      chimeOsc.stop(ctx.currentTime + 2.0);
    }
  }, []);

  const stopScheduler = useCallback(() => {
    if (stepTimerRef.current !== null) {
      window.clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  }, []);

  const startScheduler = useCallback(() => {
    if (stepTimerRef.current !== null) return;
    triggerStep();
    stepTimerRef.current = window.setInterval(triggerStep, STEP_INTERVAL_MS);
  }, [triggerStep]);

  const startOrResume = useCallback(async () => {
    const ctx = ensureEngine();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (ctx.state === 'running') {
        playingRef.current = true;
        setIsMusicPlaying(true);
        applyGain(volumeRef.current, mutedRef.current, true);
        startScheduler();
      }
    } catch {
      playingRef.current = false;
      setIsMusicPlaying(false);
    }
  }, [ensureEngine, applyGain, startScheduler]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setIsMusicPlaying(false);
    applyGain(volumeRef.current, mutedRef.current, false);
    stopScheduler();
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'running') {
      void ctx.suspend().catch(() => undefined);
    }
  }, [applyGain, stopScheduler]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      applyGain(volumeRef.current, next, playingRef.current);
      return next;
    });
  }, [applyGain]);

  const setVolume = useCallback(
    (nextVol: number) => {
      const clamped = Math.min(1, Math.max(0, nextVol));
      volumeRef.current = clamped;
      setVolumeState(clamped);
      if (clamped > 0 && mutedRef.current) {
        mutedRef.current = false;
        setIsMuted(false);
        applyGain(clamped, false, playingRef.current);
      } else {
        applyGain(clamped, mutedRef.current, playingRef.current);
      }
    },
    [applyGain]
  );

  // Full cleanup when leaving the History page so audio never persists on other routes
  useEffect(() => {
    return () => {
      stopScheduler();
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      analyserRef.current = null;
      if (ctx) {
        void ctx.close().catch(() => undefined);
      }
    };
  }, [stopScheduler]);

  return {
    isMusicPlaying,
    isMuted,
    volume,
    analyserRef,
    startOrResume,
    pause,
    toggleMute,
    setVolume,
  };
}
