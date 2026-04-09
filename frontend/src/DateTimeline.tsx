// @author Claude Sonnet 4.6 Anthropic
import React, { useCallback, useEffect, useRef } from 'react';

interface DateTimelineProps {
  availableDates: string[];  // sorted ascending ISO date strings
  selectedDate: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}

/** Calendar days between two ISO date strings (b − a) */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function isToday(iso: string): boolean {
  return iso === todayIso();
}

// @author Claude Sonnet 4.6 Anthropic
const DateTimeline = ({ availableDates, selectedDate, onChange, disabled = false }: DateTimelineProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Derived values — computed unconditionally so hooks below are always called
  const hasMultipleDates = availableDates.length > 1;
  const minDate = availableDates[0] ?? '';
  const maxDate = availableDates[availableDates.length - 1] ?? '';
  const totalDays = Math.max(1, hasMultipleDates ? daysBetween(minDate, maxDate) : 1);

  // All hooks must be called unconditionally (Rules of Hooks).
  // The early return for the single-date case comes after all hook calls.
  const snapToX = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetDays = fraction * totalDays;
    let nearest = availableDates[0];
    let minDist = Infinity;
    for (const date of availableDates) {
      const dist = Math.abs(daysBetween(minDate, date) - targetDays);
      if (dist < minDist) { minDist = dist; nearest = date; }
    }
    onChange(nearest);
  }, [availableDates, totalDays, minDate, onChange]);

  useEffect(() => {
    if (!hasMultipleDates) return;
    const onMove = (e: MouseEvent) => { if (dragging.current) snapToX(e.clientX); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [snapToX, hasMultipleDates]);

  if (!hasMultipleDates) return null;

  // Scale width with number of available dates, expressed in vw so it stays
  // proportional at any viewport size. Formula normalised to a 1440px reference:
  //   (120 + n*42) px @ 1440px ≡ (120 + n*42) / 14.4 vw
  // Clamped between 14vw (compact, ~3 dates) and 90vw (dense, 100+ dates).
  const widthVw = Math.min(Math.max(14, (120 + availableDates.length * 42) / 14.4), 90);

  const getPos = (date: string): number =>
    (daysBetween(minDate, date) / totalDays) * 100;

  const selectedIndex = availableDates.indexOf(selectedDate);
  // If selected date not in this source's list, fall back to most recent
  const idx = selectedIndex >= 0 ? selectedIndex : availableDates.length - 1;
  const effectiveSelected = availableDates[idx];
  const thumbPos = getPos(effectiveSelected);

  // Solid track segments only between consecutive (1-day-apart) available dates.
  // Physical gaps appear in the track line where dates are non-consecutive,
  // proportional to the number of missing days.
  const segments: { left: number; width: number }[] = [];
  for (let i = 0; i < availableDates.length - 1; i++) {
    if (daysBetween(availableDates[i], availableDates[i + 1]) === 1) {
      const l = getPos(availableDates[i]);
      const r = getPos(availableDates[i + 1]);
      segments.push({ left: l, width: r - l });
    }
  }

  const displayLabel = isToday(effectiveSelected) ? 'Today' : formatShortDate(effectiveSelected);

  return (
    <div className={`date-timeline${disabled ? ' date-timeline--disabled' : ''}`} style={{ width: `${widthVw}vw` }}>
      <button
        className="date-timeline-arrow"
        onClick={() => idx > 0 && onChange(availableDates[idx - 1])}
        disabled={disabled || idx === 0}
        aria-label="Previous date"
      >‹</button>

      <div className="date-timeline-track-wrapper">
        {/* Date label floats above the thumb, clamped to stay within track bounds */}
        <div
          className="date-timeline-label"
          style={{ left: `clamp(18px, ${thumbPos}%, calc(100% - 18px))` }}
        >
          {displayLabel}
        </div>

        <div
          ref={trackRef}
          className="date-timeline-track"
          onMouseDown={(e) => {
            if (!disabled) { dragging.current = true; snapToX(e.clientX); e.preventDefault(); }
          }}
          onTouchStart={(e) => {
            if (!disabled) { dragging.current = true; snapToX(e.touches[0].clientX); }
          }}
          onTouchMove={(e) => {
            if (dragging.current) { snapToX(e.touches[0].clientX); e.preventDefault(); }
          }}
          onTouchEnd={() => { dragging.current = false; }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); onChange(availableDates[idx - 1]); }
            if (e.key === 'ArrowRight' && idx < availableDates.length - 1) { e.preventDefault(); onChange(availableDates[idx + 1]); }
          }}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={availableDates.length - 1}
          aria-valuenow={idx}
          aria-valuetext={displayLabel}
          tabIndex={disabled ? -1 : 0}
        >
          {/* Solid segments — gaps appear where dates are non-consecutive */}
          {segments.map((seg, i) => (
            <div
              key={i}
              className="date-timeline-segment"
              style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
            />
          ))}

          {/* Tick mark for each available date */}
          {availableDates.map((date) => (
            <div
              key={date}
              className={`date-timeline-tick${isToday(date) ? ' date-timeline-tick--today' : ''}`}
              style={{ left: `${getPos(date)}%` }}
            />
          ))}

          {/* Draggable thumb */}
          <div className="date-timeline-thumb" style={{ left: `${thumbPos}%` }} />
        </div>
      </div>

      <button
        className="date-timeline-arrow"
        onClick={() => idx < availableDates.length - 1 && onChange(availableDates[idx + 1])}
        disabled={disabled || idx === availableDates.length - 1}
        aria-label="Next date"
      >›</button>
    </div>
  );
};

export default DateTimeline;
