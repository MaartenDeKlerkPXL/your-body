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

/** Alertness: late-morning peak, early-afternoon dip, second peak in the early evening. */
function alertness(h: number): number {
  const v = 0.95 * gauss(h, 10.5, 2.6) + 0.85 * gauss(h, 18, 2.4);
  return clamp01(0.03 + v / 0.97);
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
