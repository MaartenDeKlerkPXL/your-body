import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

/**
 * Opening sequence: a line of type, the dial assembling tick by tick, then a
 * whole day spinning past (every colour of the sky) before landing on now.
 * Any click, key or scroll skips straight to the end.
 */

export interface IntroParts {
  title: HTMLElement;
  titleText: HTMLElement;
  dial: HTMLElement;
  ticks: Element[];
  labels: Element[];
  handle: HTMLElement;
  /** Revealed while the day is still spinning. */
  chrome: HTMLElement[];
  /** Revealed once the dial has landed, so the copy is final. */
  lead: HTMLElement;
  phaseName: HTMLElement;
  copy: HTMLElement;
  curves: HTMLElement;
  /** The chart inside `curves`, wiped in left to right like time passing. */
  plot: HTMLElement;
}

export function playIntro(
  parts: IntroParts,
  wind: (duration: number) => gsap.core.Tween,
  onDone: () => void,
): void {
  const html = document.documentElement;
  const hidden = [parts.dial, parts.lead, parts.phaseName, parts.copy, parts.curves, ...parts.chrome];
  gsap.set(hidden, { autoAlpha: 0 });
  gsap.set(parts.title, { autoAlpha: 1 });
  html.classList.remove('intro'); // GSAP owns visibility from here

  const titleSplit = SplitText.create(parts.titleText, { type: 'words', mask: 'words' });
  let nameSplit: SplitText | null = null;
  let outro: gsap.core.Timeline | null = null;

  const finish = () => {
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('keydown', skip, true);
    window.removeEventListener('wheel', skip, true);
    outro?.progress(1).kill();
    titleSplit.revert();
    nameSplit?.revert();
    parts.title.remove();
    gsap.set([...hidden, parts.plot, parts.handle, ...parts.ticks, ...parts.labels], { clearProps: 'all' });
    onDone();
  };

  const tl = gsap.timeline({ onComplete: finish });

  // 1. "Your body keeps time."
  tl.from(titleSplit.words, { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.07 })
    .to(titleSplit.words, { yPercent: -110, duration: 0.55, ease: 'expo.in', stagger: 0.04 }, '+=0.45');

  // 2. The dial assembles: ticks sweep in clockwise, then the hour labels.
  tl.fromTo(parts.dial, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'expo.out' }, '-=0.25')
    .from(parts.ticks, { opacity: 0, duration: 0.25, stagger: 0.005, ease: 'none' }, '<')
    .from(parts.labels, { opacity: 0, y: 4, duration: 0.4, stagger: 0.04, ease: 'power2.out' }, '<0.3')
    .from(parts.handle, { scale: 0, duration: 0.5, ease: 'back.out(2.5)' }, '<0.2');

  // 3. A whole day passes, landing on the target time.
  tl.add(wind(2.6), '<0.1');

  // 4. Interface settles in during the last stretch of the spin…
  tl.to(parts.chrome, { autoAlpha: 1, duration: 0.8, ease: 'power2.out', stagger: 0.08 }, '-=0.9')
    .to(parts.curves, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, '<')
    .fromTo(
      parts.plot,
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power3.inOut' },
      '<',
    );

  // 5. …and the story appears once the time has landed.
  // Built at that moment because the split needs the final phase name.
  tl.add(() => {
    nameSplit = SplitText.create(parts.phaseName, { type: 'chars', mask: 'chars' });
    gsap.set(parts.phaseName, { autoAlpha: 1 });
    outro = gsap
      .timeline()
      .from(nameSplit.chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.025 })
      .fromTo(parts.lead, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0)
      .to(parts.copy, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 0.25);
  }).to({}, { duration: 1.5 }); // let the outro finish before cleaning up

  function skip() {
    tl.progress(1);
  }
  window.addEventListener('pointerdown', skip, true);
  window.addEventListener('keydown', skip, true);
  window.addEventListener('wheel', skip, true);
}
