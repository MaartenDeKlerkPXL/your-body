import { phaseBlend } from './form';

/**
 * The sound of each phase, for the generative ambient score (scripts/ambient.ts).
 * Chords never glide between phases (that would sound like a siren while
 * scrolling): each phase has its own voice and they crossfade. Everything
 * else is a continuous parameter that blends like the forms do.
 */

export interface PhaseSound {
  /** Drone chord, as MIDI note numbers. */
  chord: number[];
  /** Pentatonic notes the chimes pick from (MIDI). */
  chimes: number[];
  /** Low-pass cutoff of the drone in Hz: dark at night, open by day. */
  cutoff: number;
  /** Air/noise level (0–1) and its band centre in Hz. */
  air: number;
  airFreq: number;
  /** Slow swell of the air, like a tide (0–1). */
  swell: number;
  /** Chimes per second. */
  chimeRate: number;
  /** Soft heartbeat pulse level (0–1) and tempo. */
  pulse: number;
  bpm: number;
  /** Breathing of the drone: LFO rate (Hz) and depth (0–1). */
  breathRate: number;
  breathDepth: number;
  /** Overall level (0–1). */
  level: number;
}

export const SOUNDS: PhaseSound[] = [
  // Deep night: dark, low, breathing deeply.
  { chord: [38, 45, 52, 57], chimes: [69, 72, 74, 76, 79], cutoff: 420, air: 0.25, airFreq: 500, swell: 0.2, chimeRate: 0.04, pulse: 0, bpm: 52, breathRate: 0.07, breathDepth: 0.7, level: 0.8 },
  // Low tide: lowest and quietest, distant sea.
  { chord: [36, 43, 50], chimes: [67, 70, 72, 74, 77], cutoff: 300, air: 0.4, airFreq: 380, swell: 0.9, chimeRate: 0, pulse: 0, bpm: 48, breathRate: 0.05, breathDepth: 0.4, level: 0.65 },
  // First light: clearing up, the first chimes.
  { chord: [41, 48, 55, 57], chimes: [77, 79, 81, 84, 86], cutoff: 1100, air: 0.18, airFreq: 1400, swell: 0.2, chimeRate: 0.28, pulse: 0, bpm: 64, breathRate: 0.1, breathDepth: 0.4, level: 0.85 },
  // Morning peak: bright and open, frequent crisp chimes.
  { chord: [43, 50, 57, 59, 66], chimes: [79, 81, 83, 86, 88, 91], cutoff: 2400, air: 0.06, airFreq: 2600, swell: 0, chimeRate: 0.45, pulse: 0, bpm: 72, breathRate: 0.12, breathDepth: 0.25, level: 0.9 },
  // Afternoon dip: muffled and heavy.
  { chord: [40, 47, 50, 55], chimes: [64, 67, 69, 71, 74], cutoff: 620, air: 0.14, airFreq: 700, swell: 0.3, chimeRate: 0.08, pulse: 0, bpm: 60, breathRate: 0.06, breathDepth: 0.6, level: 0.75 },
  // Second wind: energetic, with a soft pulse.
  { chord: [45, 52, 59, 61], chimes: [76, 78, 81, 83, 85], cutoff: 1800, air: 0.08, airFreq: 1800, swell: 0, chimeRate: 0.3, pulse: 0.6, bpm: 92, breathRate: 0.16, breathDepth: 0.3, level: 0.9 },
  // Evening: warm, slowing down.
  { chord: [38, 45, 54, 61], chimes: [69, 71, 73, 76, 78], cutoff: 1050, air: 0.12, airFreq: 900, swell: 0.15, chimeRate: 0.15, pulse: 0.15, bpm: 68, breathRate: 0.09, breathDepth: 0.45, level: 0.85 },
  // Wind-down: thinning out, high distant chimes like stars.
  { chord: [35, 42, 50, 57], chimes: [81, 83, 86, 88, 90], cutoff: 520, air: 0.24, airFreq: 600, swell: 0.3, chimeRate: 0.1, pulse: 0, bpm: 56, breathRate: 0.07, breathDepth: 0.65, level: 0.75 },
];

type Continuous = Exclude<keyof PhaseSound, 'chord' | 'chimes'>;
const CONTINUOUS: Continuous[] = ['cutoff', 'air', 'airFreq', 'swell', 'chimeRate', 'pulse', 'bpm', 'breathRate', 'breathDepth', 'level'];

export interface SoundState {
  /** Gain of each phase's drone voice, summing to 1. */
  voices: number[];
  /** The phase whose chimes are used (the dominant one). */
  chimes: number[];
  params: Record<Continuous, number>;
}

export function soundAt(minutes: number): SoundState {
  const { from, to, t } = phaseBlend(minutes);
  const voices = SOUNDS.map(() => 0);
  voices[from] += 1 - t;
  voices[to] += t;
  const a = SOUNDS[from];
  const b = SOUNDS[to];
  const params = {} as Record<Continuous, number>;
  // Cutoffs blend in log space so the brightening sounds even.
  for (const k of CONTINUOUS) {
    params[k] = k === 'cutoff' || k === 'airFreq' ? a[k] * (b[k] / a[k]) ** t : a[k] + (b[k] - a[k]) * t;
  }
  return { voices, chimes: (t < 0.5 ? a : b).chimes, params };
}

export const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);
