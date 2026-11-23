import { useEffect, useMemo, useState } from 'react';
import { Archive, Ban, Clock, ExternalLink, Radio } from 'lucide-react';
import type { CampusEvent, EventStatus } from '../types';

const COLOMBO_OFFSET_MS = 5.5 * 3_600_000; // Asia/Colombo is permanently UTC+05:30

function parseStartTime(
  eventDate?: string,
  startTime?: string,
  timeLabel?: string
): { hours: number; minutes: number } {
  // Handle datetime-local strings if passed in eventDate
  const dateIsoTime = (eventDate || '').trim().match(/T(\d{1,2}):(\d{2})/);
  if (dateIsoTime && !(startTime || '').trim()) {
    const h = Number(dateIsoTime[1]);
    const m = Number(dateIsoTime[2]);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      return {
        hours: Math.min(23, Math.max(0, h)),
        minutes: Math.min(59, Math.max(0, m)),
      };
    }
  }

  const trimmedStart = (startTime || '').trim();
  const match24 = trimmedStart.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = Number(match24[1]);
    const m = Number(match24[2]);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      return {
        hours: Math.min(23, Math.max(0, h)),
        minutes: Math.min(59, Math.max(0, m)),
      };
    }
  }

  const label = (timeLabel || '').trim();
  const match12 = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    let h = Number(match12[1]);
    const m = Number(match12[2]);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      const meridiem = match12[3].toUpperCase();
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return {
        hours: Math.min(23, Math.max(0, h)),
        minutes: Math.min(59, Math.max(0, m)),
      };
    }
  }

  const matchLabel24 = label.match(/(\d{1,2}):(\d{2})/);
  if (matchLabel24) {
    const h = Number(matchLabel24[1]);
    const m = Number(matchLabel24[2]);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      return {
        hours: Math.min(23, Math.max(0, h)),
        minutes: Math.min(59, Math.max(0, m)),
      };
    }
  }

  return { hours: 9, minutes: 0 };
}

/**
 * Computes exact epoch milliseconds interpreted in Asia/Colombo (UTC+05:30).
 * Guaranteed to return a finite number or null (never NaN).
 */
export function getEventTargetTimestamp(
  eventDate?: string,
  startTime?: string,
  timeLabel?: string
): number | null {
  const rawDate = (eventDate || '').trim();
  if (!rawDate) return null;

  const { hours, minutes } = parseStartTime(rawDate, startTime, timeLabel);
  const ymdMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const utcEpoch = Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - COLOMBO_OFFSET_MS;
      return Number.isFinite(utcEpoch) ? utcEpoch : null;
    }
  }

  const parsed = Date.parse(rawDate);
  if (!Number.isFinite(parsed)) return null;
  const d = new Date(parsed);
  const utcEpoch =
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes, 0, 0) -
    COLOMBO_OFFSET_MS;
  return Number.isFinite(utcEpoch) ? utcEpoch : null;
}

/**
 * Resolves the active display status combining explicit Admin override
 * with automatic countdown transition to 'live' when target time is reached.
 */
export function resolveEffectiveEventStatus(
  event: Pick<
    CampusEvent,
    'status' | 'isUpcoming' | 'eventDate' | 'startTime' | 'timeLabel'
  >,
  nowMs = Date.now()
): EventStatus {
  if (event.status === 'cancelled') return 'cancelled';
  if (event.status === 'closed') return 'closed';
  if (event.status === 'live') return 'live';

  if (event.status !== 'scheduled' && !event.isUpcoming) {
    return 'closed';
  }

  const targetMs = getEventTargetTimestamp(event.eventDate, event.startTime, event.timeLabel);
  if (targetMs !== null && targetMs <= nowMs) {
    return 'live';
  }

  return 'scheduled';
}

export function formatColomboDateLabel(
  eventDate?: string,
  startTime?: string,
  timeLabel?: string
): string {
  const datePart = (eventDate || '').split('T')[0];
  const targetMs = getEventTargetTimestamp(eventDate, startTime, timeLabel);
  if (targetMs === null) {
    return [datePart, timeLabel || startTime].filter(Boolean).join(' · ');
  }
  try {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(targetMs));
    const formattedTime =
      timeLabel?.trim() ||
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(targetMs));
    return `${formattedDate} · ${formattedTime}`;
  } catch {
    return [datePart, timeLabel || startTime].filter(Boolean).join(' · ');
  }
}

function padUnit(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return String(safe).padStart(2, '0');
}

interface EventCountdownProps {
  event: Pick<
    CampusEvent,
    | 'eventDate'
    | 'startTime'
    | 'timeLabel'
    | 'isUpcoming'
    | 'status'
    | 'cancellationReason'
    | 'liveStreamUrl'
    | 'registrationLink'
  >;
  variant?: 'compact' | 'detailed';
}

export function EventCountdown({ event, variant = 'compact' }: EventCountdownProps) {
  const targetMs = useMemo(
    () => getEventTargetTimestamp(event.eventDate, event.startTime, event.timeLabel),
    [event.eventDate, event.startTime, event.timeLabel]
  );

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const explicitTerminal =
    event.status === 'cancelled' ||
    event.status === 'closed' ||
    event.status === 'live';

  useEffect(() => {
    if (explicitTerminal || !targetMs) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [explicitTerminal, targetMs]);

  const effectiveStatus = resolveEffectiveEventStatus(event, nowMs);

  // 1. Cancelled State: stop timer immediately and show cancellation notice
  if (effectiveStatus === 'cancelled') {
    return (
      <div
        className={`rounded-xl border border-rose-500/40 bg-rose-950/35 backdrop-blur-md transition-all ${
          variant === 'detailed' ? 'p-4' : 'px-3 py-2.5'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 shrink-0 text-rose-400" />
            <span className="font-mono text-xs font-bold tracking-wider text-rose-300 uppercase">
              EVENT CANCELLED
            </span>
          </div>
          <span className="font-mono text-[10px] font-medium text-rose-200/75 uppercase">
            Timer Halted
          </span>
        </div>
        {event.cancellationReason?.trim() && (
          <p className="mt-2 text-xs leading-relaxed text-rose-100/90">
            Notice: {event.cancellationReason.trim()}
          </p>
        )}
      </div>
    );
  }

  // 2. Closed / Completed State: stop timer and mark cleanly archived
  if (effectiveStatus === 'closed') {
    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-xl border border-[#FFD700]/30 bg-[#0b1328]/80 backdrop-blur-md ${
          variant === 'detailed' ? 'px-4 py-3' : 'px-3 py-2.5'
        }`}
      >
        <div className="flex items-center gap-2">
          <Archive className="h-3.5 w-3.5 shrink-0 text-[#FFD700]" />
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FFD700] uppercase">
            EVENT CLOSED / COMPLETED
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 uppercase">Archived</span>
      </div>
    );
  }

  // 3. Started / Live State: replace timer with pulsing neon green/cyan indicator + optional action link
  if (effectiveStatus === 'live') {
    const actionHref = event.liveStreamUrl?.trim() || event.registrationLink?.trim();
    const actionLabel = event.liveStreamUrl?.trim() ? 'Join Live' : 'Register';
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#00FFFF]/50 bg-[#041d29]/85 shadow-[0_0_24px_rgba(0,255,255,0.16)] backdrop-blur-md ${
          variant === 'detailed' ? 'px-4 py-3.5' : 'px-3 py-2.5'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00FFFF] shadow-[0_0_10px_#00FFFF]" />
          </span>
          <span className="font-mono text-xs font-bold tracking-wider text-[#00FFFF] uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.65)]">
            ● LIVE NOW
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-300">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>In Progress</span>
          </span>
          {actionHref && (
            <a
              href={actionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#00FFFF]/40 bg-[#00FFFF]/15 px-2.5 py-1 text-[11px] font-semibold text-[#00FFFF] transition-colors hover:bg-[#00FFFF]/25 hover:text-white"
            >
              <span>{actionLabel}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // 4. Scheduled / Upcoming Countdown
  if (targetMs === null) return null;

  const remainingMs = Math.max(0, targetMs - nowMs);
  const days = Math.max(0, Math.floor(remainingMs / 86_400_000));
  const hours = Math.max(0, Math.floor((remainingMs % 86_400_000) / 3_600_000));
  const minutes = Math.max(0, Math.floor((remainingMs % 3_600_000) / 60_000));
  const seconds = Math.max(0, Math.floor((remainingMs % 60_000) / 1000));

  const units = [
    { label: 'Days', value: padUnit(days), gold: false },
    { label: variant === 'detailed' ? 'Hours' : 'Hrs', value: padUnit(hours), gold: false },
    { label: variant === 'detailed' ? 'Minutes' : 'Min', value: padUnit(minutes), gold: false },
    { label: variant === 'detailed' ? 'Seconds' : 'Sec', value: padUnit(seconds), gold: true },
  ];

  return (
    <div
      className={`rounded-xl border border-[#00FFFF]/25 bg-[#060f26]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md ${
        variant === 'detailed' ? 'p-4' : 'p-2.5'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5 text-[#00FFFF]">
          <Clock className="h-3 w-3 text-[#00FFFF]" />
          <span className="font-mono tracking-wide uppercase">Starts In</span>
        </span>
        <span className="font-mono text-[10px] tabular-nums text-[#FFD700]/85">
          Asia/Colombo
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {units.map((unit) => (
          <div
            key={unit.label}
            className={`flex flex-col items-center justify-center rounded-lg border bg-[#091430]/90 py-1.5 transition-colors ${
              unit.gold ? 'border-[#FFD700]/30' : 'border-[#00FFFF]/20'
            }`}
          >
            <span
              className={`font-mono font-bold tabular-nums ${
                unit.gold
                  ? 'text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]'
                  : 'text-white drop-shadow-[0_0_8px_rgba(0,255,255,0.28)]'
              } ${variant === 'detailed' ? 'text-lg sm:text-xl' : 'text-sm'}`}
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
