import { formatTime } from './time';

/**
 * Chronotype: the same rhythm, running earlier or later on the clock. Morning
 * and evening types sit about two to three hours apart in core temperature,
 * melatonin and sleepiness (Kerkhof & Van Dongen 1996; Lack et al. 2009), so
 * the site shifts everything by a conservative hour either side.
 *
 * Body time = clock time − shift. The model (curves, phases, forms, palette,
 * sound) runs on body time; every time shown on screen stays clock time.
 */

export type Chronotype = 'early' | 'between' | 'late';

export const CHRONOTYPES: Array<{ id: Chronotype; label: string; shift: number }> = [
  { id: 'early', label: 'Early bird', shift: -60 },
  { id: 'between', label: 'In between', shift: 0 },
  { id: 'late', label: 'Night owl', shift: 60 },
];

export const DEFAULT_CHRONOTYPE: Chronotype = 'between';

export const shiftOf = (type: Chronotype) => CHRONOTYPES.find((c) => c.id === type)?.shift ?? 0;

export const isChronotype = (value: unknown): value is Chronotype =>
  CHRONOTYPES.some((c) => c.id === value);

/** The typical sleep window the curves assume, on the clock. */
export function sleepWindow(shift: number): string {
  return `${formatTime(23 * 60 + shift)}–${formatTime(7 * 60 + shift)}`;
}

/**
 * A body-time edge (0–1440) as it reads on the clock for this shift. The end
 * of the day stays "24:00" rather than wrapping to "00:00".
 */
export function clockLabel(body: number, shift: number): string {
  const clock = body + shift;
  return clock === 24 * 60 ? '24:00' : formatTime(clock);
}
