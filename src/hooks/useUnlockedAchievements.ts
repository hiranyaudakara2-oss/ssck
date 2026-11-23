import { useCallback, useEffect, useState } from 'react';
import type { Achievement } from '../types';

export function useUnlockedAchievements(_achievements: Achievement[], userId?: string | null) {
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

  const toggleUnlock = useCallback(
    (achievement: Achievement) => {
      setUnlockedIds((prev) => {
        const next = prev.includes(achievement.id)
          ? prev.filter((id) => id !== achievement.id)
          : [...prev, achievement.id];
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
    },
    [storageKey]
  );

  return {
    unlockedIds,
    toggleUnlock,
  };
}
