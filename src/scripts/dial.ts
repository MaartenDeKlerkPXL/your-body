import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { MINUTES_PER_DAY, shortestDelta, wrapMinutes } from '../lib/time';

gsap.registerPlugin(Draggable, InertiaPlugin);

const DEG_PER_MINUTE = 360 / MINUTES_PER_DAY;
const STEP = 15; // minutes — keyboard step and release snap

export interface Dial {
  /** Current time shown by the arm, in minutes. */
  minutes(): number;
  /** Move the arm. `animate` takes the shortest way round. */
  set(minutes: number, animate?: boolean): void;
  /** One full clockwise turn ending on `minutes`: a whole day passing by. */
  wind(minutes: number, duration: number): gsap.core.Tween;
  isDragging(): boolean;
}

interface Options {
  reducedMotion: boolean;
  /** Fired whenever the person moves the dial (drag, throw or keyboard). */
  onUserInput: () => void;
}

export function createDial(root: HTMLElement, { reducedMotion, onUserInput }: Options): Dial {
  const arm = root.querySelector<HTMLElement>('[data-dial-arm]')!;
  const handle = root.querySelector<HTMLElement>('[data-dial-handle]')!;
  const face = root.querySelector<SVGElement>('.dial__face')!;

  const rotation = () => Number(gsap.getProperty(arm, 'rotation')) || 0;
  const minutes = () => wrapMinutes(rotation() / DEG_PER_MINUTE);
  let tween: gsap.core.Tween | null = null;
  let target = 0; // where the arm is heading, so rapid key presses add up

  const [draggable] = Draggable.create(arm, {
    type: 'rotation',
    trigger: [handle, face],
    inertia: !reducedMotion,
    // Let a throw glide, then settle on the nearest quarter hour.
    snap: (value: number) => Math.round(value / (STEP * DEG_PER_MINUTE)) * STEP * DEG_PER_MINUTE,
    onPress: () => {
      tween?.kill();
      tween = null;
      onUserInput();
    },
    onDrag: onUserInput,
    onThrowUpdate: onUserInput,
  });

  function set(next: number, animate = false) {
    tween?.kill();
    target = wrapMinutes(next);
    const current = rotation();
    const to = current + shortestDelta(minutes(), target) * DEG_PER_MINUTE;
    if (!animate || reducedMotion) {
      tween = null;
      gsap.set(arm, { rotation: to });
      return;
    }
    const distance = Math.abs(to - current) / 360; // fraction of a full turn
    tween = gsap.to(arm, {
      rotation: to,
      duration: 0.5 + distance * 1.6,
      ease: 'power3.inOut',
      onComplete: () => {
        tween = null;
      },
    });
  }

  handle.addEventListener('keydown', (event) => {
    const from = tween ? target : minutes();
    const snapped = Math.round(from / STEP) * STEP;
    const moves: Record<string, number> = {
      ArrowRight: snapped + STEP,
      ArrowUp: snapped + STEP,
      ArrowLeft: snapped - STEP,
      ArrowDown: snapped - STEP,
      PageUp: snapped + 60,
      PageDown: snapped - 60,
      Home: 0,
      End: MINUTES_PER_DAY - STEP,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    onUserInput();
    set(moves[event.key], true);
  });

  function wind(next: number, duration: number) {
    tween?.kill();
    tween = null;
    target = wrapMinutes(next);
    const end = target * DEG_PER_MINUTE;
    gsap.set(arm, { rotation: end - 360 });
    return gsap.to(arm, { rotation: end, duration, ease: 'power4.inOut' });
  }

  return {
    minutes,
    set,
    wind,
    isDragging: () => draggable.isDragging || draggable.isThrowing,
  };
}
