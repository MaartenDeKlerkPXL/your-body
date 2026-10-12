import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { MINUTES_PER_DAY, formatTime, shortestDelta } from '../lib/time';
import { phaseAt } from '../content/phases';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * "A day in your body": scrolling through the journey section moves the
 * page's clock. The intro blends from the dial's time to midnight, each
 * chapter covers its three hours, and the outro blends back to the dial.
 */

export interface Journey {
  /** Time the page should show for the current scroll position, or null outside the journey. */
  minutes(base: number): number | null;
  /** Called every frame with the time currently shown. */
  update(minutes: number | null): void;
}

interface Range {
  top: number;
  height: number;
}

interface Options {
  reducedMotion: boolean;
  onBack: () => void;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function createJourney(root: HTMLElement, { reducedMotion, onBack }: Options): Journey {
  const intro = root.querySelector<HTMLElement>('[data-journey-intro]')!;
  const outro = root.querySelector<HTMLElement>('[data-journey-outro]')!;
  const chapterEls = [...root.querySelectorAll<HTMLElement>('[data-chapter]')];
  const hudTime = root.querySelector<HTMLElement>('[data-hud-time]')!;
  const hudRail = root.querySelector<HTMLElement>('.hud__rail')!;
  const hudLinks = [...root.querySelectorAll<HTMLAnchorElement>('[data-hud-link]')];

  const chapters = chapterEls.map((el) => ({
    el,
    start: Number(el.dataset.start) * 60,
    end: Number(el.dataset.end) * 60,
    range: { top: 0, height: 1 } as Range,
  }));
  let introRange: Range = { top: 0, height: 1 };
  let outroRange: Range = { top: 0, height: 1 };

  const measure = (el: HTMLElement): Range => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: Math.max(1, r.height) };
  };
  const remeasure = () => {
    introRange = measure(intro);
    outroRange = measure(outro);
    for (const c of chapters) c.range = measure(c.el);
  };
  remeasure();
  ScrollTrigger.addEventListener('refresh', remeasure);
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  // --- Smooth scrolling ------------------------------------------------------

  let lenis: Lenis | null = null;
  if (!reducedMotion) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToY = (y: number) => {
    if (lenis) lenis.scrollTo(y, { duration: 1.8 });
    else window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  // Jumping lands at the start of a phase: viewport centre on the chapter's top.
  for (const link of hudLinks) {
    link.addEventListener('click', (event) => {
      const chapter = chapters.find((c) => c.el.id === `phase-${link.dataset.hudLink}`);
      if (!chapter) return;
      event.preventDefault();
      scrollToY(chapter.range.top - window.innerHeight / 2 + 2);
      chapter.el.querySelector<HTMLElement>('.chapter__name')?.focus({ preventScroll: true });
      history.replaceState(null, '', `#${chapter.el.id}`);
    });
  }

  root.querySelector('[data-journey-back]')?.addEventListener('click', () => {
    onBack();
    scrollToY(0);
  });

  // --- Reveals ---------------------------------------------------------------

  if (!reducedMotion) {
    for (const block of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
      gsap.set(block, { autoAlpha: 0, y: 24 });
      ScrollTrigger.create({
        trigger: block,
        start: 'top 80%',
        once: true,
        onEnter: () => gsap.to(block, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }),
      });
    }
    for (const name of root.querySelectorAll<HTMLElement>('[data-reveal-name]')) {
      const split = SplitText.create(name, { type: 'chars', mask: 'chars' });
      gsap.set(split.chars, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: name,
        start: 'top 85%',
        once: true,
        onEnter: () =>
          gsap.to(split.chars, {
            yPercent: 0,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.025,
            onComplete: () => split.revert(),
          }),
      });
    }
  }

  // --- Time from scroll ------------------------------------------------------

  function minutes(base: number): number | null {
    const y = window.scrollY + window.innerHeight / 2;
    if (y < introRange.top) return null;

    if (y < introRange.top + introRange.height) {
      const q = smooth(clamp01((y - introRange.top) / introRange.height));
      return base + shortestDelta(base, 0) * q;
    }

    for (const c of chapters) {
      if (y < c.range.top + c.range.height) {
        const q = clamp01((y - c.range.top) / c.range.height);
        return c.start + (c.end - c.start) * q;
      }
    }

    if (y < outroRange.top + outroRange.height) {
      const q = smooth(clamp01((y - outroRange.top) / outroRange.height));
      return MINUTES_PER_DAY + shortestDelta(0, base) * q;
    }
    return null;
  }

  let lastMinute = -1;
  let lastActive: boolean | null = null;
  let lastPhase = '';

  function update(current: number | null) {
    const active = current !== null;
    if (active !== lastActive) {
      document.body.dataset.journeyActive = String(active);
      lastActive = active;
    }
    if (current === null) return;

    const y = window.scrollY + window.innerHeight / 2;
    const first = chapters[0].range.top;
    const last = chapters[chapters.length - 1];
    const progress = clamp01((y - first) / (last.range.top + last.range.height - first));
    hudRail.style.setProperty('--p', progress.toFixed(4));

    const minute = Math.floor(current);
    if (minute !== lastMinute) {
      hudTime.textContent = current >= MINUTES_PER_DAY ? '24:00' : formatTime(current);
      lastMinute = minute;
    }

    // Only mark a phase while actually inside a chapter, not during the blends.
    const inChapters = y >= first && y < last.range.top + last.range.height;
    const phase = inChapters ? phaseAt(Math.min(current, MINUTES_PER_DAY - 1)).id : '';
    if (phase !== lastPhase) {
      for (const link of hudLinks) {
        if (link.dataset.hudLink === phase) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
      lastPhase = phase;
    }
  }

  return { minutes, update };
}
