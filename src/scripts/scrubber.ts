import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { MINUTES_PER_DAY, formatTime, wrapMinutes } from '../lib/time';
import type { Dial } from './dial';

gsap.registerPlugin(Draggable, InertiaPlugin);

/**
 * The phone version of the dial: a tape you drag under a fixed needle. It has
 * no time of its own; it reads and moves the dial, so live mode, the intro
 * and "Back to now" all keep working unchanged.
 */

const STEP = 15;

export interface Scrubber {
  /** Is the timeline the visible control right now (phone layout)? */
  visible(): boolean;
  /** Draw the tape for the time the dial shows. */
  update(minutes: number, live: boolean): void;
  /** Wiggle the tape once to show it can be dragged. */
  nudge(): void;
  isDragging(): boolean;
}

interface Options {
  dial: Dial;
  reducedMotion: boolean;
  onUserInput: () => void;
}

export function createScrubber(root: HTMLElement, { dial, reducedMotion, onUserInput }: Options): Scrubber {
  const viewport = root.querySelector<HTMLElement>('[data-scrub-slider]')!;
  const tape = root.querySelector<SVGSVGElement>('[data-scrub-tape]')!;
  const proxy = root.querySelector<HTMLElement>('[data-scrub-proxy]')!;
  const timeEl = root.querySelector<HTMLElement>('[data-scrub-time]')!;
  const hintEl = root.querySelector<HTMLElement>('[data-scrub-hint]')!;

  const hour = parseFloat(getComputedStyle(root).getPropertyValue('--hour')) || 64;
  const ppm = hour / 60; // px per minute
  const day = MINUTES_PER_DAY * ppm;

  let width = viewport.clientWidth;
  window.addEventListener('resize', () => {
    width = viewport.clientWidth;
  });

  // While dragging, the proxy's x (from 0 at press) is turned into minutes.
  let start = 0;
  const minutesAt = (x: number) => wrapMinutes(start - x / ppm);

  const [draggable] = Draggable.create(proxy, {
    type: 'x',
    trigger: viewport,
    inertia: !reducedMotion,
    allowNativeTouchScrolling: true,
    onPressInit() {
      start = dial.minutes();
      gsap.set(proxy, { x: 0 });
    },
    onPress: onUserInput,
    onDrag() {
      onUserInput();
      dial.set(minutesAt(this.x));
    },
    onThrowUpdate() {
      dial.set(minutesAt(this.x));
    },
    // Glide, then settle on a quarter hour.
    snap: {
      x: (x: number) => (start - Math.round((start - x / ppm) / STEP) * STEP) * ppm,
    },
  });

  viewport.addEventListener('keydown', (event) => {
    if (dial.key(event.key)) event.preventDefault();
  });

  let offset = 0; // extra shift for the nudge animation
  let lastMinute = -1;
  let lastLive: boolean | null = null;

  return {
    visible: () => root.offsetParent !== null,

    update(minutes, live) {
      if (root.offsetParent === null) return; // hidden on wide screens
      // Middle copy of the day under the needle.
      const x = width / 2 - (day + minutes * ppm) + offset;
      tape.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;

      const minute = Math.floor(minutes);
      if (minute !== lastMinute || live !== lastLive) {
        const time = formatTime(minutes);
        timeEl.textContent = time;
        hintEl.textContent = live ? 'Live · drag the timeline' : 'Exploring';
        viewport.setAttribute('aria-valuenow', String(minute));
        viewport.setAttribute('aria-valuetext', time);
        lastMinute = minute;
        lastLive = live;
      }
    },

    nudge() {
      const state = { v: 0 };
      gsap
        .timeline({ onUpdate: () => (offset = state.v) })
        .to(state, { v: -28, duration: 0.4, ease: 'power2.out' })
        .to(state, { v: 18, duration: 0.5, ease: 'power2.inOut' })
        .to(state, { v: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    },

    isDragging: () => draggable.isDragging || draggable.isThrowing,
  };
}
