export const MINUTES_PER_DAY = 1440;

/** Wrap any minute value into [0, 1440). */
export function wrapMinutes(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** Minutes since local midnight, with sub-minute precision. */
export function nowMinutes(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function formatTime(minutes: number): string {
  const whole = Math.floor(wrapMinutes(minutes));
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse "HH:MM" (24h). Returns null for anything invalid. */
export function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** Signed shortest distance from `from` to `to` around the clock, in (-720, 720]. */
export function shortestDelta(from: number, to: number): number {
  const d = wrapMinutes(to - from);
  return d > MINUTES_PER_DAY / 2 ? d - MINUTES_PER_DAY : d;
}
