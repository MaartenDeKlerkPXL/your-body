import { CURVES, TREND_LABELS, curveTrend, curveValue, describeCurve, levelLabel, type CurveId } from './circadian';
import { sleepWindow } from './chronotype';

/**
 * Everything the "daily rhythm" chart and its text alternatives show for a
 * chronotype shift. Used at build time (default) and in the browser when the
 * chronotype changes, so both always agree. Times on the x axis are clock
 * time; the model is read at body time (clock − shift).
 */

export const CURVE_W = 1440;
export const CURVE_H = 100;
const y = (v: number) => CURVE_H - 6 - v * (CURVE_H - 14);

export function curvePath(id: CurveId, shift = 0, step = 10): string {
  const parts: string[] = [];
  for (let m = 0; m <= CURVE_W; m += step) parts.push(`${m ? 'L' : 'M'}${m},${y(curveValue(id, m - shift)).toFixed(1)}`);
  return parts.join(' ');
}

export function rhythmSummary(shift = 0): string {
  return CURVES.map((c) => describeCurve(c.id, shift)).join(' ');
}

export function rhythmNote(shift = 0): string {
  return `Typical rhythm for someone who sleeps around ${sleepWindow(shift)}. Relative, not measured.`;
}

/** Table cells, a row every three hours of clock time. */
export function rhythmCells(shift = 0): Array<Array<{ level: string; trend: string }>> {
  return Array.from({ length: 8 }, (_, i) =>
    CURVES.map((c) => {
      const body = i * 180 - shift;
      const trend = curveTrend(c.id, body);
      // The level is already in words, so a flat stretch reads "steady", not "low, low".
      return { level: levelLabel(curveValue(c.id, body)), trend: trend === 'low' ? 'steady' : TREND_LABELS[trend] };
    }),
  );
}
