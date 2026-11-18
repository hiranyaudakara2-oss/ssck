import { useCallback, useEffect, useRef, useState } from 'react';
import type { Achievement } from '../types';

export function useUnlockedAchievements(achievements: Achievement[], userId?: string | null) {
  const storageKey = `techsphere_unlocked_ach_${userId || 'guest'}`;

  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
      }
    } catch {
      // Ignore storage read errors
    }
    return [];
  });

  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);
  const seenIdsRef = useRef<Set<string> | null>(null);

  // Sync storage key when user signs in/out
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setUnlockedIds(parsed.filter((x) => typeof x === 'string'));
          return;
        }
      }
      setUnlockedIds([]);
    } catch {
      setUnlockedIds([]);
    }
  }, [storageKey]);

  // Detect live newly-added achievement in Firestore after initial hydration and trigger 3D celebration
  useEffect(() => {
    if (achievements.length === 0) return;
    if (seenIdsRef.current === null) {
      seenIdsRef.current = new Set(achievements.map((a) => a.id));
      return;
    }

    const newlyAdded = achievements.find((a) => !seenIdsRef.current?.has(a.id));
    seenIdsRef.current = new Set(achievements.map((a) => a.id));

    if (newlyAdded) {
      setUnlockedIds((prev) => {
        if (prev.includes(newlyAdded.id)) return prev;
        const next = [...prev, newlyAdded.id];
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
      setCelebratingAchievement(newlyAdded);
    }
  }, [achievements, storageKey]);

  const unlockAndCelebrate = useCallback(
    (achievement: Achievement) => {
      setUnlockedIds((prev) => {
        if (prev.includes(achievement.id)) return prev;
        const next = [...prev, achievement.id];
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
      setCelebratingAchievement(achievement);
    },
    [storageKey]
  );

  const dismissCelebration = useCallback(() => {
    setCelebratingAchievement(null);
  }, []);

  return {
    unlockedIds,
    celebratingAchievement,
    unlockAndCelebrate,
    dismissCelebration,
  };
}
