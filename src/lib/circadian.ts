/**
 * Stylised 24-hour curves for a typical adult who sleeps roughly 23:00–07:00.
 * Values are relative (0–1), shaped after the well-documented daily patterns —
 * they illustrate timing, not measured levels. See docs/CONTENT.md.
 */

export type CurveId = 'melatonin' | 'cortisol' | 'temperature' | 'alertness';

export interface CurveInfo {
  id: CurveId;
  label: string;
}

export const CURVES: CurveInfo[] = [
  { id: 'alertness', label: 'Alertness' },
  { id: 'temperature', label: 'Core temperature' },
  { id: 'cortisol', label: 'Cortisol' },
  { id: 'melatonin', label: 'Melatonin' },
];

/**
 * Signed circular distance in hours from `center` to `h`, in [-before, 24 - before).
 * Asymmetric curves put the wrap point where both tails are ~0, so there's no seam.
 */
function hourDelta(h: number, center: number, before = 12): number {
  return ((((h - center) % 24) + 24 + before) % 24) - before;
}

function gauss(h: number, center: number, sigma: number): number {
  const d = hourDelta(h, center);
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

function skewedGauss(h: number, center: number, sigmaBefore: number, sigmaAfter: number): number {
  // Split the day in proportion to the two widths, so both tails meet near zero.
  const d = hourDelta(h, center, (24 * sigmaBefore) / (sigmaBefore + sigmaAfter));
  const s = d < 0 ? sigmaBefore : sigmaAfter;
  return Math.exp(-(d * d) / (2 * s * s));
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Melatonin: rises ~2h before bedtime, peaks in the small hours, gone soon after waking. */
function melatonin(h: number): number {
  return skewedGauss(h, 3, 2.2, 1.8);
}

/** Cortisol: climbs before dawn, peaks shortly after waking, falls across the day. */
function cortisol(h: number): number {
  return 0.04 + 0.96 * skewedGauss(h, 7.75, 2, 4.5);
}

/** Core body temperature: minimum around 04:30, maximum in the early evening. */
function temperature(h: number): number {
  const min = 4.5;
  const max = 18;
  const t = (((h - min) % 24) + 24) % 24; // hours since the minimum
  const rise = max - min;
  if (t <= rise) return 0.5 - 0.5 * Math.cos((Math.PI * t) / rise);
  return 0.5 + 0.5 * Math.cos((Math.PI * (t - rise)) / (24 - rise));
}

/**
 * Alertness: late-morning peak, early-afternoon dip, second peak in the early
 * evening, and its lowest point in the early morning alongside core
 * temperature, which it broadly tracks (Schmidt et al. 2007).
 */
function alertness(h: number): number {
  // The morning rise is steep (it waits for waking and sleep inertia to clear),
  // the decline after the late-morning peak gentler.
  const v = 0.95 * skewedGauss(h, 10.5, 2, 2.8) + 0.85 * gauss(h, 18, 2.4);
  return clamp01(0.88 * (0.03 + v / 0.97) + 0.12 * temperature(h));
}

const FUNCTIONS: Record<CurveId, (h: number) => number> = {
  melatonin,
  cortisol,
  temperature,
  alertness,
};

export function curveValue(id: CurveId, minutes: number): number {
  return clamp01(FUNCTIONS[id](minutes / 60));
}

export type Trend = 'low' | 'rising' | 'peak' | 'dip' | 'falling';

export const TREND_LABELS: Record<Trend, string> = {
  low: 'low',
  rising: 'rising',
  peak: 'peaking',
  dip: 'dipping',
  falling: 'falling',
};

export function curveTrend(id: CurveId, minutes: number): Trend {
  const v = curveValue(id, minutes);
  if (v < 0.08) return 'low';
  const slope = curveValue(id, minutes + 20) - curveValue(id, minutes - 20);
  if (Math.abs(slope) >= 0.03) return slope > 0 ? 'rising' : 'falling';
  // Flat: decide between a top and a valley by looking an hour either side.
  const around = (curveValue(id, minutes - 60) + curveValue(id, minutes + 60)) / 2;
  if (around > v + 0.02) return 'dip';
  return v > 0.5 ? 'peak' : 'low';
}

/** Sample a curve across the day, for drawing. */
export function sampleCurve(id: CurveId, stepMinutes = 10): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let m = 0; m <= 1440; m += stepMinutes) points.push([m, curveValue(id, m)]);
  return points;
}

/** A relative level in words, for tables and descriptions. */
export function levelLabel(v: number): string {
  if (v < 0.15) return 'very low';
  if (v < 0.4) return 'low';
  if (v < 0.65) return 'moderate';
  if (v < 0.85) return 'high';
  return 'very high';
}

const fmt = (m: number) => {
  const q = Math.round(m / 15) * 15;
  const w = ((q % 1440) + 1440) % 1440;
  return `${String(Math.floor(w / 60)).padStart(2, '0')}:${String(w % 60).padStart(2, '0')}`;
};

/**
 * A one-sentence description of a curve's shape over the day, derived from
 * the model itself so it can never drift from the chart. Lists the turning
 * points (peaks and troughs that stand out) in time order, starting from the
 * lowest point of the day.
 */
export function describeCurve(id: CurveId): string {
  const step = 5;
  const n = 1440 / step;
  const v = Array.from({ length: n }, (_, i) => curveValue(id, i * step));
  const at = (i: number) => v[((i % n) + n) % n];

  // Local extrema on the circular day, kept only if they stand out from the
  // surrounding three hours by a clear margin.
  const span = 180 / step;
  const turns: Array<{ i: number; kind: 'peak' | 'trough' }> = [];
  for (let i = 0; i < n; i++) {
    let max = true;
    let min = true;
    for (let d = 1; d <= span; d++) {
      if (at(i - d) >= v[i] || at(i + d) > v[i]) max = false;
      if (at(i - d) <= v[i] || at(i + d) < v[i]) min = false;
    }
    const around = (at(i - span) + at(i + span)) / 2;
    if (max && v[i] - around > 0.05) turns.push({ i, kind: 'peak' });
    if (min && around - v[i] > 0.05) turns.push({ i, kind: 'trough' });
  }

  let lowest = 0;
  v.forEach((x, i) => {
    if (x < v[lowest]) lowest = i;
  });
  const highest = turns.filter((t) => t.kind === 'peak').sort((a, b) => v[b.i] - v[a.i])[0];

  // A long, flat floor (melatonin by day, cortisol in the evening) reads as a
  // stretch of time, not a single point that would suggest false precision.
  const floor = v[lowest] + 0.025;
  let from = lowest;
  let to = lowest;
  while (at(from - 1) < floor && (lowest - from + n) % n < n - 1) from--;
  while (at(to + 1) < floor && (to - lowest + n) % n < n - 1) to++;
  const flat = (to - from) * step >= 240;
  const start = flat ? to : lowest;

  // Order from the lowest point (or the end of the floor) onward.
  const ordered = turns
    .filter((t) => t.kind === 'peak' || !flat || (t.i - from + n) % n > to - from)
    .filter((t) => t.i !== lowest)
    .sort((a, b) => ((a.i - start + n) % n) - ((b.i - start + n) % n));
  const parts = [
    flat ? `stays low from about ${fmt(from * step)} to ${fmt(to * step)}` : `is lowest around ${fmt(lowest * step)}`,
  ];
  let peaks = 0;
  for (const t of ordered) {
    if (t.kind === 'peak') {
      parts.push(peaks === 0 ? `peaks around ${fmt(t.i * step)}` : `peaks again around ${fmt(t.i * step)}`);
      peaks++;
    } else parts.push(`dips around ${fmt(t.i * step)}`);
  }
  // A plateau without a single standout point: still name the high.
  if (!highest) {
    let top = 0;
    v.forEach((x, i) => {
      if (x > v[top]) top = i;
    });
    parts.push(`is highest around ${fmt(top * step)}`);
  }
  const label = CURVES.find((c) => c.id === id)!.label;
  const last = parts.pop()!;
  return `${label} ${parts.length ? `${parts.join(', ')} and ${last}` : last}.`;
}
