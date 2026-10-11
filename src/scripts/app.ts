import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { CURVES, curveTrend, curveValue, type Trend } from '../lib/circadian';
import { phaseAt, type Phase } from '../content/phases';
import { paletteAt, rgbToHex, luminance } from '../lib/palette';
import { formatTime, nowMinutes, parseTime } from '../lib/time';
import { createDial } from './dial';
import { createSky } from './sky';
import { playIntro } from './intro';

gsap.registerPlugin(SplitText);

const TREND_WORDS: Record<Trend, string> = {
  low: 'low',
  rising: 'rising',
  peak: 'peaking',
  dip: 'dipping',
  falling: 'falling',
};

function $<T extends Element = HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

export function start() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const dialEl = $('[data-dial]');
  const handle = $('[data-dial-handle]');
  const dialTime = $('[data-dial-time]');
  const dialHint = $('[data-dial-hint]');
  const progress = $<SVGCircleElement>('[data-dial-progress]');
  const playhead = $<SVGLineElement>('[data-playhead]');
  const statusText = $('[data-status-text]');
  const nowButton = $<HTMLButtonElement>('[data-now]');
  const jumpForm = $<HTMLFormElement>('[data-jump]');
  const jumpInput = $<HTMLInputElement>('[data-jump-input]');
  const lead = $('[data-lead]');
  const nameEl = $('[data-phase-name]');
  const copyEl = $('[data-phase-copy]');
  const headlineEl = $('[data-phase-headline]');
  const bodyEl = $('[data-phase-body]');
  const tipEl = $('[data-phase-tip]');
  const announcer = $('[data-announce]');
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const trendEls = CURVES.map((c) => ({ id: c.id, el: $(`[data-trend="${c.id}"]`) }));

  // Set by an inline script in the page before first paint (see index.astro).
  let intro = root.classList.contains('intro');
  let live = true;
  const setLive = (value: boolean) => {
    live = value;
    document.body.dataset.live = String(value);
    nowButton.hidden = value;
  };

  const dial = createDial(dialEl, {
    reducedMotion,
    onUserInput: () => {
      if (!intro) setLive(false);
    },
  });
  const sky = createSky($<HTMLCanvasElement>('[data-sky]'), reducedMotion);

  // A shared link like ?t=03:00 opens straight on that moment.
  const fromUrl = parseTime(new URLSearchParams(location.search).get('t'));
  setLive(fromUrl === null);
  const startAt = fromUrl ?? nowMinutes();

  if (intro) {
    playIntro(
      {
        title: $('[data-intro-title]'),
        titleText: $('[data-intro-title-text]'),
        dial: dialEl,
        ticks: [...dialEl.querySelectorAll('.dial__tick')],
        labels: [...dialEl.querySelectorAll('.dial__label')],
        handle,
        chrome: [...document.querySelectorAll<HTMLElement>('[data-intro-chrome]')],
        lead,
        phaseName: nameEl,
        copy: copyEl,
        curves: $('[data-curves]'),
        plot: $('.curves__plot'),
      },
      (duration) => dial.wind(startAt, duration),
      () => {
        intro = false;
      },
    );
  } else {
    document.querySelector('[data-intro-title]')?.remove();
    dial.set(startAt);
  }

  window.setInterval(() => {
    if (live && !intro && !dial.isDragging()) dial.set(nowMinutes());
  }, 1000);

  nowButton.addEventListener('click', () => {
    setLive(true);
    dial.set(nowMinutes(), true);
    history.replaceState(null, '', location.pathname);
    handle.focus();
  });

  jumpForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const target = parseTime(jumpInput.value);
    if (target === null) return;
    setLive(false);
    dial.set(target, true);
  });

  // --- Phase copy -----------------------------------------------------------

  let split: SplitText | null = null;
  let phaseAnimation: gsap.core.Timeline | null = null;

  const writePhase = (phase: Phase) => {
    split?.revert();
    split = null;
    nameEl.textContent = phase.name;
    headlineEl.textContent = phase.headline;
    bodyEl.textContent = phase.body;
    tipEl.textContent = phase.tip;
  };

  const showPhase = (phase: Phase, instant: boolean) => {
    phaseAnimation?.kill();
    // The intro owns visibility while it runs; otherwise recover from any
    // half-finished transition.
    if (!intro) gsap.set([nameEl, copyEl], { clearProps: 'opacity,visibility,transform' });
    if (instant || reducedMotion) {
      writePhase(phase);
      return;
    }
    phaseAnimation = gsap
      .timeline()
      .to([nameEl, copyEl], { autoAlpha: 0, y: -10, duration: 0.22, ease: 'power2.in', stagger: 0.03 })
      .add(() => {
        writePhase(phase);
        split = SplitText.create(nameEl, { type: 'chars', mask: 'chars' });
        gsap.set([nameEl, copyEl], { autoAlpha: 1, y: 0 });
        phaseAnimation = gsap
          .timeline()
          .from(split.chars, { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.022 })
          .from(copyEl, { autoAlpha: 0, y: 14, duration: 0.7, ease: 'power3.out' }, 0.15);
      });
  };

  let announceTimer = 0;
  const announce = (minutes: number, phase: Phase) => {
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => {
      announcer.textContent = `${formatTime(minutes)}. ${phase.name}. ${phase.headline}`;
    }, 700);
  };

  let urlTimer = 0;
  const syncUrl = (minutes: number) => {
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(() => {
      history.replaceState(null, '', `?t=${formatTime(minutes)}`);
    }, 400);
  };

  // --- Frame loop -------------------------------------------------------------

  const vars = new Map<string, string>();
  const setVar = (name: string, value: string) => {
    if (vars.get(name) === value) return;
    vars.set(name, value);
    root.style.setProperty(name, value);
  };

  let lastMinute = -1;
  let lastLive: boolean | null = null;
  let lastPhase = '';

  gsap.ticker.add((_time, deltaMs) => {
    const rect = dialEl.getBoundingClientRect(); // read before any writes
    const minutes = dial.minutes();
    const palette = paletteAt(minutes);
    const energy = curveValue('alertness', minutes);
    const bg = rgbToHex(palette.bg);

    setVar('--bg', bg);
    setVar('--glow', rgbToHex(palette.glow));
    setVar('--accent', rgbToHex(palette.accent));
    setVar('--ink', rgbToHex(palette.ink));
    setVar('--ink-muted', rgbToHex(palette.inkMuted));
    setVar('--energy', energy.toFixed(3));
    setVar('--invert', luminance(palette.bg) > 0.18 ? '0' : '1');
    themeMeta?.setAttribute('content', bg);

    progress.style.strokeDasharray = `${minutes.toFixed(1)} 1440`;
    playhead.setAttribute('x1', minutes.toFixed(1));
    playhead.setAttribute('x2', minutes.toFixed(1));

    sky?.render(
      {
        bg: palette.bg,
        glow: palette.glow,
        accent: palette.accent,
        energy,
        focus: [rect.left + rect.width / 2, rect.top + rect.height / 2],
      },
      Math.min(deltaMs, 100) / 1000,
    );

    const minute = Math.floor(minutes);
    if (minute !== lastMinute || live !== lastLive) {
      const time = formatTime(minutes);
      dialTime.textContent = time;
      dialHint.textContent = live ? 'Drag to travel' : 'Exploring';
      statusText.textContent = live ? 'Live' : `Viewing ${time}`;
      lead.textContent = live ? `It’s ${time}. Your body is in` : `At ${time}, your body is in`;
      handle.setAttribute('aria-valuenow', String(minute));
      handle.setAttribute('aria-valuetext', time);
      if (document.activeElement !== jumpInput) jumpInput.value = time;
      for (const t of trendEls) t.el.textContent = TREND_WORDS[curveTrend(t.id, minutes)];
      if (!live && !intro && lastLive !== null) syncUrl(minutes);
      lastMinute = minute;
      lastLive = live;
    }

    const phase = phaseAt(minutes);
    if (phase.id !== lastPhase) {
      showPhase(phase, lastPhase === '' || intro || dial.isDragging());
      if (lastPhase !== '' && !live && !intro) announce(minutes, phase);
      lastPhase = phase.id;
    }
  });
}
