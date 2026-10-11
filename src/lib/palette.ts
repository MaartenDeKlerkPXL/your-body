/**
 * The colour of the day. Keyframes are placed on the clock and interpolated in
 * OKLab so transitions stay vivid instead of turning muddy halfway.
 */

export type RGB = [number, number, number]; // 0–1, sRGB

export interface Palette {
  bg: RGB;
  glow: RGB;
  accent: RGB;
  ink: RGB;
  inkMuted: RGB;
}

interface Keyframe {
  hour: number;
  bg: string;
  glow: string;
  accent: string;
}

// Hand-tuned: night indigo → pre-dawn plum → sunrise coral → clear morning →
// hazy afternoon → golden hour → sunset → violet dusk.
const KEYFRAMES: Keyframe[] = [
  { hour: 0, bg: '#0b1026', glow: '#272b6e', accent: '#8a90ff' },
  { hour: 3, bg: '#070a1a', glow: '#1c1e4c', accent: '#6268dc' },
  { hour: 5, bg: '#191635', glow: '#563a6b', accent: '#e08b9c' },
  { hour: 6.5, bg: '#3a2140', glow: '#d9705f', accent: '#ffc285' },
  { hour: 8, bg: '#fbe4cf', glow: '#ffb487', accent: '#e8592a' },
  { hour: 10.5, bg: '#e6f1fd', glow: '#a3d1ff', accent: '#2468e0' },
  { hour: 13, bg: '#e8f4ee', glow: '#b3e3cb', accent: '#16855a' },
  { hour: 14.5, bg: '#e6e2ee', glow: '#c6bce5', accent: '#6b4fc9' },
  { hour: 17, bg: '#ffe4bd', glow: '#ffb055', accent: '#c9500a' },
  { hour: 19.5, bg: '#3a1d3d', glow: '#d65c52', accent: '#ffb067' },
  { hour: 21.5, bg: '#181236', glow: '#45296f', accent: '#b48cff' },
  { hour: 24, bg: '#0b1026', glow: '#272b6e', accent: '#8a90ff' },
];

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const to = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

type Lab = [number, number, number];

function rgbToOklab([r, g, b]: RGB): Lab {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: Lab): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return [
    clamp(toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    clamp(toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    clamp(toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}

function mixLab(a: Lab, b: Lab, t: number): Lab {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const LAB_KEYFRAMES = KEYFRAMES.map((k) => ({
  hour: k.hour,
  bg: rgbToOklab(hexToRgb(k.bg)),
  glow: rgbToOklab(hexToRgb(k.glow)),
  accent: rgbToOklab(hexToRgb(k.accent)),
}));

/** WCAG relative luminance. */
export function luminance([r, g, b]: RGB): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Background luminance where light and dark ink give roughly equal contrast.
const INK_SWITCH = 0.18;
const GLOW_CONTRAST = 6;

export function paletteAt(minutes: number): Palette {
  const hour = ((((minutes / 60) % 24) + 24) % 24);
  let i = 0;
  while (i < LAB_KEYFRAMES.length - 2 && LAB_KEYFRAMES[i + 1].hour <= hour) i++;
  const a = LAB_KEYFRAMES[i];
  const b = LAB_KEYFRAMES[i + 1];
  const raw = (hour - a.hour) / (b.hour - a.hour);
  const t = raw * raw * (3 - 2 * raw); // ease between keyframes

  const bgLab = mixLab(a.bg, b.bg, t);
  let bg = oklabToRgb(bgLab);
  const dark = luminance(bg) > INK_SWITCH;

  // Ink is tinted with the background's hue so it feels part of the scene.
  const tint: Lab = [0, bgLab[1] * 0.35, bgLab[2] * 0.35];
  const inkAt = (L: number) =>
    oklabToRgb(dark ? [L, tint[1], tint[2]] : [L, tint[1] * 0.5, tint[2] * 0.5]);

  // Around sunrise and sunset the background passes through mid-tones. Push the
  // ink toward its extreme first, then nudge the background, so body text never
  // drops below WCAG AA (4.5:1).
  let inkL = dark ? 0.2 : 0.97;
  let ink = inkAt(inkL);
  while (contrast(ink, bg) < 4.6 && (dark ? inkL > 0.08 : inkL < 1)) {
    inkL += dark ? -0.02 : 0.01;
    ink = inkAt(inkL);
  }
  for (let nudge = 0.01; contrast(ink, bg) < 4.6 && nudge < 0.2; nudge += 0.01) {
    bg = oklabToRgb([bgLab[0] + (dark ? nudge : -nudge), bgLab[1], bgLab[2]]);
  }
  // Text also sits on top of the glow behind the dial, so the glow may only get
  // as bright (or dark) as keeps the ink readable. The margin covers the noise
  // and halo the shader adds on top.
  const glowLab = mixLab(a.glow, b.glow, t);
  let glow = oklabToRgb(glowLab);
  for (let nudge = 0.01; contrast(ink, glow) < GLOW_CONTRAST && nudge < 0.6; nudge += 0.01) {
    glow = oklabToRgb([glowLab[0] + (dark ? nudge : -nudge), glowLab[1], glowLab[2]]);
  }

  // Muted ink sits between ink and background, as far toward the background as
  // AA contrast (against both background and glow) allows.
  const inkLab = rgbToOklab(ink);
  const finalBgLab = rgbToOklab(bg);
  let inkMuted = ink;
  for (let k = 0.45; k > 0; k -= 0.05) {
    const candidate = oklabToRgb(mixLab(inkLab, finalBgLab, k));
    if (contrast(candidate, bg) >= 4.5 && contrast(candidate, glow) >= 4.5) {
      inkMuted = candidate;
      break;
    }
  }

  return {
    bg,
    glow,
    accent: oklabToRgb(mixLab(a.accent, b.accent, t)),
    ink,
    inkMuted,
  };
}
