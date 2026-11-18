import { useEffect, useMemo, useState } from 'react';
import { Clock, Radio } from 'lucide-react';
import type { CampusEvent } from '../types';

function parseStartTime(startTime?: string, timeLabel?: string): { hours: number; minutes: number } {
  const trimmedStart = (startTime || '').trim();
  const match24 = trimmedStart.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = Math.min(23, Math.max(0, Number(match24[1])));
    const m = Math.min(59, Math.max(0, Number(match24[2])));
    return { hours: h, minutes: m };
  }

  const label = (timeLabel || '').trim();
  const match12 = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    let h = Number(match12[1]);
    const m = Math.min(59, Math.max(0, Number(match12[2])));
    const meridiem = match12[3].toUpperCase();
    if (meridiem === 'PM' && h < 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return { hours: Math.min(23, Math.max(0, h)), minutes: m };
  }

  const matchLabel24 = label.match(/(\d{1,2}):(\d{2})/);
  if (matchLabel24) {
    return {
      hours: Math.min(23, Math.max(0, Number(matchLabel24[1]))),
      minutes: Math.min(59, Math.max(0, Number(matchLabel24[2]))),
    };
  }

  return { hours: 9, minutes: 0 };
}

export function getEventTargetTimestamp(
  eventDate?: string,
  startTime?: string,
  timeLabel?: string
): number | null {
  const dateStr = (eventDate || '').trim();
  if (!dateStr) return null;

  const { hours, minutes } = parseStartTime(startTime, timeLabel);
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return new Date(year, month, day, hours, minutes, 0, 0).getTime();
  }

  const parsed = Date.parse(dateStr);
  if (Number.isNaN(parsed)) return null;
  const fallbackDate = new Date(parsed);
  fallbackDate.setHours(hours, minutes, 0, 0);
  return fallbackDate.getTime();
}

function padUnit(value: number): string {
  return String(Math.max(0, value)).padStart(2, '0');
}

interface EventCountdownProps {
  event: Pick<CampusEvent, 'eventDate' | 'startTime' | 'timeLabel' | 'isUpcoming'>;
  variant?: 'compact' | 'detailed';
}

export function EventCountdown({ event, variant = 'compact' }: EventCountdownProps) {
  const targetMs = useMemo(
    () => getEventTargetTimestamp(event.eventDate, event.startTime, event.timeLabel),
    [event.eventDate, event.startTime, event.timeLabel]
  );

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!targetMs) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (!targetMs) return null;
  if (!event.isUpcoming && targetMs < nowMs) return null;

  const remainingMs = targetMs - nowMs;

  if (remainingMs <= 0) {
    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-xl border border-emerald-400/35 bg-emerald-950/35 ${
          variant === 'detailed' ? 'px-4 py-3' : 'px-3 py-2'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-emerald-300">
            Event Started
          </span>
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-200/90">
          <Radio className="h-3 w-3" />
          <span>Event Live</span>
        </span>
      </div>
    );
  }

  const days = Math.floor(remainingMs / 86_400_000);
  const hours = Math.floor((remainingMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);

  const units = [
    { label: variant === 'detailed' ? 'Days' : 'Days', value: String(days).padStart(2, '0') },
    { label: variant === 'detailed' ? 'Hours' : 'Hrs', value: padUnit(hours) },
    { label: variant === 'detailed' ? 'Minutes' : 'Min', value: padUnit(minutes) },
    { label: variant === 'detailed' ? 'Seconds' : 'Sec', value: padUnit(seconds) },
  ];

  return (
    <div
      className={`rounded-xl border border-cyan-500/25 bg-[#071026]/85 ${
        variant === 'detailed' ? 'p-4' : 'p-2.5'
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-cyan-300">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-cyan-400" />
          <span>Starts In</span>
        </span>
        {event.startTime && (
          <span className="font-mono text-[10px] tabular-nums text-slate-400">
            {event.startTime}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-[#0b1530]/90 py-1.5"
          >
            <span
              className={`font-mono font-bold tabular-nums text-white ${
                variant === 'detailed' ? 'text-lg sm:text-xl' : 'text-sm'
              }`}
            >
              {unit.value}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
