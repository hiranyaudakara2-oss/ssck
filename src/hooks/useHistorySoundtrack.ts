import { useCallback, useEffect, useRef, useState } from 'react';
import { HISTORY_SCROLL_AUDIO_URL } from '../data/seedDefaults';

export function useHistorySoundtrack() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.55);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const mediaSourceAttachedRef = useRef(false);
  const fadeOutTimerRef = useRef<number | null>(null);

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
    const el = audioElRef.current;

    if (ctx && master && mediaSourceAttachedRef.current) {
      const target = !playing || muted ? 0 : Math.max(0.0001, vol);
      master.gain.setTargetAtTime(target, ctx.currentTime, 0.14);
      if (el) {
        el.volume = 1;
        el.muted = false;
      }
      return;
    }

    if (el) {
      el.volume = !playing || muted ? 0 : vol;
      el.muted = muted || !playing;
    }
  }, []);

  const ensureAudioPipeline = useCallback(() => {
    if (typeof window === 'undefined') return null;

    if (!audioElRef.current) {
      const el = new Audio(HISTORY_SCROLL_AUDIO_URL);
      el.loop = true;
      el.preload = 'auto';
      audioElRef.current = el;
    }

    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.84;

        masterGain.connect(analyser);
        analyser.connect(ctx.destination);

        try {
          const mediaSource = ctx.createMediaElementSource(audioElRef.current);
          mediaSource.connect(masterGain);
          mediaSourceAttachedRef.current = true;
        } catch {
          mediaSourceAttachedRef.current = false;
        }

        audioCtxRef.current = ctx;
        masterGainRef.current = masterGain;
        analyserRef.current = analyser;
      }
    }

    return {
      el: audioElRef.current,
      ctx: audioCtxRef.current,
    };
  }, []);

  const startOrResume = useCallback(async () => {
    if (fadeOutTimerRef.current !== null) {
      window.clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }

    const pipeline = ensureAudioPipeline();
    if (!pipeline || !pipeline.el) return;

    try {
      if (pipeline.ctx && pipeline.ctx.state === 'suspended') {
        await pipeline.ctx.resume();
      }
      // Start smoothly from near-zero gain and glide up
      if (pipeline.ctx && masterGainRef.current && mediaSourceAttachedRef.current) {
        masterGainRef.current.gain.setValueAtTime(0.0001, pipeline.ctx.currentTime);
      }
      await pipeline.el.play();
      playingRef.current = true;
      setIsMusicPlaying(true);
      applyGain(volumeRef.current, mutedRef.current, true);
    } catch {
      playingRef.current = false;
      setIsMusicPlaying(false);
    }
  }, [ensureAudioPipeline, applyGain]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setIsMusicPlaying(false);
    applyGain(volumeRef.current, mutedRef.current, false);

    if (fadeOutTimerRef.current !== null) {
      window.clearTimeout(fadeOutTimerRef.current);
    }
    fadeOutTimerRef.current = window.setTimeout(() => {
      fadeOutTimerRef.current = null;
      if (!playingRef.current && audioElRef.current) {
        audioElRef.current.pause();
      }
    }, 180);
  }, [applyGain]);

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

  // Full cleanup when leaving the History page so audio never persists elsewhere
  useEffect(() => {
    return () => {
      if (fadeOutTimerRef.current !== null) {
        window.clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = null;
      }
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = '';
        audioElRef.current = null;
      }
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      analyserRef.current = null;
      masterGainRef.current = null;
      mediaSourceAttachedRef.current = false;
      if (ctx) {
        void ctx.close().catch(() => undefined);
      }
    };
  }, []);

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
