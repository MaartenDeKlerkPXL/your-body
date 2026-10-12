/**
 * The shape of each phase: one abstract body in the sky shader that changes
 * character through the day. Each phase holds its own form for most of its
 * three hours and blends into its neighbours around the boundaries.
 */

export interface Form {
  /** Size of the body, in shader units (1 = the shorter screen side). */
  radius: number;
  /** Vertical scale: < 1 flattens it. */
  squash: number;
  /** How much the lower half droops. */
  sag: number;
  /** Vertical offset: negative sinks it toward the horizon. */
  rise: number;
  /** Edge definition, 0 = hazy, 1 = crisp. */
  sharp: number;
  /** Concentric rings (focus). */
  rings: number;
  /** Light rays (sunrise). */
  rays: number;
  /** Orbiting satellites and pulses (energy). */
  orbit: number;
  /** Wide halo (sunset). */
  halo: number;
  /** Breaking up into fine drifting dust (letting go). */
  dissolve: number;
  /** Twinkling stars around the body (night). */
  stars: number;
  /** Breathing depth. */
  breath: number;
}

const BASE: Form = {
  radius: 0.26,
  squash: 1,
  sag: 0,
  rise: 0,
  sharp: 0.4,
  rings: 0,
  rays: 0,
  orbit: 0,
  halo: 0,
  dissolve: 0,
  stars: 0,
  breath: 0.3,
};

// One per phase, in the order of PHASES (00–03, 03–06, … 21–24).
export const FORMS: Form[] = [
  { ...BASE, radius: 0.3, sharp: 0.15, stars: 0.7, breath: 1 }, // Deep night: repair
  { ...BASE, radius: 0.24, squash: 0.3, rise: -0.16, sharp: 0.25, stars: 0.35, breath: 0.15 }, // Low tide: lowest point
  { ...BASE, radius: 0.24, rise: -0.02, sharp: 0.6, rays: 1, breath: 0.4 }, // First light: sunrise
  { ...BASE, radius: 0.25, sharp: 1, rings: 1, breath: 0.25 }, // Morning peak: focus
  { ...BASE, radius: 0.24, sag: 1.1, rise: 0.03, sharp: 0.3, breath: 0.2 }, // Afternoon dip: heavy
  { ...BASE, radius: 0.22, sharp: 0.75, orbit: 1, breath: 0.6 }, // Second wind: energy
  { ...BASE, radius: 0.24, squash: 0.94, rise: -0.08, sharp: 0.55, halo: 1, breath: 0.35 }, // Evening: sunset
  { ...BASE, radius: 0.27, sharp: 0.4, dissolve: 0.8, stars: 1, breath: 0.7 }, // Wind-down: letting go
];

const KEYS = Object.keys(BASE) as Array<keyof Form>;
const smooth = (t: number) => t * t * (3 - 2 * t);
const BLEND = 0.2; // fraction of a phase spent blending at each end

function mix(a: Form, b: Form, t: number): Form {
  const out = { ...a };
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

export function formAt(minutes: number): Form {
  const hours = ((((minutes / 60) % 24) + 24) % 24);
  const n = FORMS.length;
  const span = 24 / n;
  const k = Math.min(n - 1, Math.floor(hours / span));
  const u = (hours - k * span) / span;
  const current = FORMS[k];
  if (u < BLEND) {
    // Halfway with the previous form at the boundary, fully ours by u = BLEND.
    return mix(FORMS[(k - 1 + n) % n], current, smooth(0.5 + u / (2 * BLEND)));
  }
  if (u > 1 - BLEND) {
    return mix(current, FORMS[(k + 1) % n], smooth((u - (1 - BLEND)) / (2 * BLEND)));
  }
  return current;
}
