import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { MINUTES_PER_DAY, formatTime, shortestDelta } from '../lib/time';
import { phaseAt } from '../content/phases';
import { CURVES, TREND_LABELS, curveTrend, curveValue, type CurveId } from '../lib/circadian';
import { SPARK_H, sparkY } from '../lib/spark';

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

  const chapters = chapterEls.map((el) => {
    const spark = el.querySelector<HTMLElement>('[data-spark]')!;
    return {
      el,
      start: Number(el.dataset.start) * 60,
      end: Number(el.dataset.end) * 60,
      range: { top: 0, height: 1 } as Range,
      spark: {
        root: spark,
        from: Number(spark.dataset.from),
        span: Number(spark.dataset.span),
        items: [...spark.querySelectorAll<HTMLElement>('[data-spark-item]')].map((item) => ({
          id: item.dataset.sparkItem as CurveId,
          plot: item.querySelector<HTMLElement>('.spark__plot')!,
          playhead: item.querySelector<HTMLElement>('[data-spark-playhead]')!,
          dot: item.querySelector<HTMLElement>('[data-spark-dot]')!,
          cross: item.querySelector<HTMLElement>('[data-spark-cross]')!,
        })),
        tip: spark.querySelector<HTMLElement>('[data-spark-tip]')!,
      },
    };
  });

  // --- Mini charts ----------------------------------------------------------

  type Chapter = (typeof chapters)[number];

  /** Move a chapter's playheads and dots to a time inside its window. */
  function drawSpark(c: Chapter, minutes: number) {
    const f = Math.min(1, Math.max(0, (minutes - c.spark.from) / c.spark.span));
    const left = `${(f * 100).toFixed(2)}%`;
    for (const item of c.spark.items) {
      item.playhead.style.left = left;
      item.dot.style.left = left;
      item.dot.style.top = `${((sparkY(curveValue(item.id, minutes)) / SPARK_H) * 100).toFixed(2)}%`;
    }
  }

  // Hover: one crosshair through all four charts and one readout listing every
  // curve at that time. Everything it shows is also in the chapter text.
  for (const c of chapters) {
    const { root: spark, tip } = c.spark;
    const list = spark.querySelector<HTMLElement>('.spark__list')!;
    list.addEventListener('pointermove', (event) => {
      const plot = (event.target as HTMLElement).closest<HTMLElement>('.spark__plot');
      if (!plot) return hide();
      const r = plot.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (event.clientX - r.left) / r.width));
      const minutes = c.spark.from + f * c.spark.span;
      for (const item of c.spark.items) item.cross.style.left = `${(f * 100).toFixed(2)}%`;
      spark.classList.add('is-hover');

      tip.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = formatTime(minutes);
      tip.append(title);
      for (const curve of CURVES) {
        const row = document.createElement('div');
        const name = document.createElement('span');
        const value = document.createElement('b');
        name.textContent = curve.label;
        value.textContent = TREND_LABELS[curveTrend(curve.id, minutes)];
        row.append(name, value);
        tip.append(row);
      }
      const box = spark.getBoundingClientRect();
      tip.style.left = `${Math.min(box.width - 80, Math.max(80, event.clientX - box.left))}px`;
      tip.style.top = `${r.top - box.top}px`;
      tip.hidden = false;
    });
    list.addEventListener('pointerleave', hide);
    function hide() {
      spark.classList.remove('is-hover');
      tip.hidden = true;
    }
  }
  let introRange: Range = { top: 0, height: 1 };
  let outroRange: Range = { top: 0, height: 1 };

  const measure = (el: HTMLElement): Range => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: Math.max(1, r.height) };
  };
  // Chapters stick while their three hours pass, but never with part of the
  // text hidden behind the bottom bar: on short screens the sticky offset
  // shrinks, and a chapter taller than the screen simply scrolls.
  const fitSticky = () => {
    const vh = window.innerHeight;
    const bottomSpace = window.innerWidth < 720 ? 84 : 32;
    for (const c of chapters) {
      const inner = c.el.querySelector<HTMLElement>('.chapter__inner')!;
      inner.style.top = '';
      inner.style.position = '';
      const preferred = parseFloat(getComputedStyle(inner).top) || 0;
      const fits = vh - bottomSpace - inner.offsetHeight;
      if (fits < 12) inner.style.position = 'relative';
      else if (fits < preferred) inner.style.top = `${fits}px`;
    }
  };
  const remeasure = () => {
    fitSticky();
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
  // Opacity only (never visibility), so headings stay in the accessibility
  // tree before they're revealed; titles are split into letters only when
  // they come into view, keeping start-up light.

  if (!reducedMotion) {
    for (const block of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
      gsap.set(block, { opacity: 0, y: 24 });
      ScrollTrigger.create({
        trigger: block,
        start: 'top 80%',
        once: true,
        onEnter: () => gsap.to(block, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', clearProps: 'transform' }),
      });
    }
    for (const name of root.querySelectorAll<HTMLElement>('[data-reveal-name]')) {
      gsap.set(name, { opacity: 0 });
      ScrollTrigger.create({
        trigger: name,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const split = SplitText.create(name, { type: 'chars', mask: 'chars' });
          gsap.set(name, { opacity: 1 });
          gsap.from(split.chars, {
            yPercent: 110,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.025,
            onComplete: () => split.revert(),
          });
        },
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
    if (inChapters) {
      const c = chapters.find((ch) => y < ch.range.top + ch.range.height);
      if (c) drawSpark(c, current);
    }
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
