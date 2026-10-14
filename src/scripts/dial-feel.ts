import { gsap } from 'gsap';
import { shortestDelta } from '../lib/time';
import type { Dial } from './dial';

/**
 * How the dial feels in the hand, kept apart from how it works (dial.ts):
 * - the ticks light up around the knob while you hover, hold or focus it
 * - every hour the knob passes flashes once, like a detent
 * - the knob leans toward a nearby cursor, squashes when pressed and sends a
 *   ripple out when it settles on a quarter hour
 * Only opacity, stroke width and small transforms; nothing moves under
 * reduced motion except the light on the ticks.
 */

export interface DialFeel {
  /** The knob came to rest after a drag or throw. */
  settle(): void;
}

interface Options {
  reducedMotion: boolean;
}

const WAVE_HOURS = 1.4; // width of the light around the knob
const FLASH_MS = 420; // how long an hour's detent flash takes to fade
const PULL = 0.22; // share of the cursor's offset the knob follows
const PULL_MAX = 7; // px
const PULL_RADIUS = 96; // px from the knob's centre

export function createDialFeel(root: HTMLElement, dial: Dial, { reducedMotion }: Options): DialFeel {
  const arm = root.querySelector<HTMLElement>('[data-dial-arm]')!;
  const handle = root.querySelector<HTMLElement>('[data-dial-handle]')!;
  const knob = root.querySelector<HTMLElement>('.dial__knob')!;
  const ripple = root.querySelector<HTMLElement>('.dial__ripple')!;
  const ticks = [...root.querySelectorAll<SVGLineElement>('.dial__tick')].map((el, i) => ({
    el,
    minute: i * 15,
    major: i % 4 === 0,
    base: i % 4 === 0 ? 0.6 : 0.28,
    flash: 0,
    last: '',
  }));
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  let hovered = false;
  let pressed = false;
  let engaged = 0; // 0–1, eased
  let lastHour = Math.floor(dial.minutes() / 60);
  let pullX = 0;
  let pullY = 0;
  let pullTargetX = 0;
  let pullTargetY = 0;

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') hovered = true;
  });
  root.addEventListener('pointerleave', () => {
    hovered = false;
    pullTargetX = pullTargetY = 0;
  });
  const release = () => {
    if (!pressed) return;
    pressed = false;
    delete root.dataset.pressed;
  };
  root.addEventListener('pointerdown', () => {
    pressed = true;
    root.dataset.pressed = '';
    pullTargetX = pullTargetY = 0;
  });
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  // The knob leans toward the cursor, in the arm's rotated frame.
  window.addEventListener(
    'pointermove',
    (e) => {
      if (reducedMotion || pressed || !fine.matches || e.pointerType !== 'mouse') return;
      const r = handle.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) > PULL_RADIUS) {
        pullTargetX = pullTargetY = 0;
        return;
      }
      const a = (-Number(gsap.getProperty(arm, 'rotation')) * Math.PI) / 180;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      const len = Math.hypot(lx, ly) * PULL;
      const k = len > PULL_MAX ? PULL_MAX / len : 1;
      pullTargetX = lx * PULL * k;
      pullTargetY = ly * PULL * k;
    },
    { passive: true },
  );

  gsap.ticker.add((_t, deltaMs) => {
    const minutes = dial.minutes();
    const active = hovered || pressed || dial.isDragging() || document.activeElement === handle;
    engaged += ((active ? 1 : 0) - engaged) * Math.min(1, deltaMs / (active ? 120 : 380));

    // A detent for every hour passed while the person is at the controls.
    const hour = Math.floor(minutes / 60);
    if (hour !== lastHour) {
      if (engaged > 0.5) {
        // Turning clockwise you arrive at the hour you enter; backwards, at the one you leave.
        const forward = shortestDelta(lastHour * 60, hour * 60) > 0;
        ticks[((forward ? hour : lastHour) % 24) * 4].flash = 1;
      }
      lastHour = hour;
    }

    const decay = Math.exp(-deltaMs / (FLASH_MS / 3));
    for (const t of ticks) {
      t.flash = t.flash > 0.01 ? t.flash * decay : 0;
      const d = shortestDelta(minutes, t.minute) / 60;
      const wave = engaged > 0.002 ? Math.exp(-((d / WAVE_HOURS) ** 2)) * engaged : 0;
      const w = Math.max(wave * 0.75, t.flash);
      // Empty strings hand the tick back to its stylesheet.
      const opacity = w < 0.005 ? '' : (t.base + (1 - t.base) * w).toFixed(2);
      const width = t.major && t.flash >= 0.01 ? (1.5 + 1.5 * t.flash).toFixed(2) : '';
      const key = `${opacity}|${width}`;
      if (key === t.last) continue;
      t.last = key;
      t.el.style.strokeOpacity = opacity;
      if (t.major) t.el.style.strokeWidth = width;
    }

    const ease = Math.min(1, deltaMs / 140);
    const nx = pullX + (pullTargetX - pullX) * ease;
    const ny = pullY + (pullTargetY - pullY) * ease;
    if (Math.abs(nx - pullX) > 0.01 || Math.abs(ny - pullY) > 0.01) {
      pullX = nx;
      pullY = ny;
      knob.style.translate = `${nx.toFixed(2)}px ${ny.toFixed(2)}px`;
    }
  });

  return {
    settle() {
      if (reducedMotion) return;
      ripple.animate(
        [
          { transform: 'scale(0.6)', opacity: 0.55 },
          { transform: 'scale(2.6)', opacity: 0 },
        ],
        { duration: 700, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
      );
    },
  };
}
