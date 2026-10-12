import { curveValue } from './circadian';
import type { Phase } from '../content/phases';

/**
 * Each phase has its own fixed display weight and width, following how alert
 * the body is in that phase: light and narrow at night, heavy and wide at the
 * peaks. Fixed per phase so text never shifts while scrolling or dragging.
 */
export function displayAxes(phase: Phase): { wght: number; wdth: number } {
  const energy = curveValue('alertness', ((phase.start + phase.end) / 2) * 60);
  return { wght: Math.round(220 + energy * 560), wdth: Math.round(78 + energy * 22) };
}

/** Inline style that pins the display axes for one phase. */
export function displayAxesStyle(phase: Phase): string {
  const { wght, wdth } = displayAxes(phase);
  return `--display-wght: ${wght}; --display-wdth: ${wdth}%`;
}
