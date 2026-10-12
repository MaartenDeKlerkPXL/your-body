import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { CURVES, TREND_LABELS, curveTrend, curveValue } from '../lib/circadian';
import { phaseAt, type Phase } from '../content/phases';
import { paletteAt, rgbToHex, luminance } from '../lib/palette';
import { formatTime, nowMinutes, parseTime } from '../lib/time';
import { createDial } from './dial';
import { createSky } from './sky';
import { playIntro } from './intro';
import { createJourney } from './journey';

gsap.registerPlugin(SplitText);

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
  let touched = false; // has the person moved the dial yet?
  const setLive = (value: boolean) => {
    live = value;
    document.body.dataset.live = String(value);
    nowButton.hidden = value;
  };

  const dial = createDial(dialEl, {
    reducedMotion,
    onUserInput: () => {
      touched = true;
      if (!intro) setLive(false);
    },
  });
  const sky = createSky($<HTMLCanvasElement>('[data-sky]'), reducedMotion);

  // If nobody has touched the dial after a few seconds, the knob wiggles
  // along the ring once to show it can be dragged.
  function scheduleNudge() {
    if (reducedMotion) return;
    window.setTimeout(() => {
      if (touched || window.scrollY > window.innerHeight * 0.5) return;
      const knob = dialEl.querySelector('.dial__knob');
      gsap
        .timeline()
        .to(knob, { x: 10, duration: 0.35, ease: 'power2.out' })
        .to(knob, { x: -10, duration: 0.5, ease: 'power2.inOut' })
        .to(knob, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
        .fromTo(dialHint, { opacity: 0.4 }, { opacity: 1, duration: 0.6, clearProps: 'opacity' }, 0);
    }, 3500);
  }

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
        scheduleNudge();
      },
    );
  } else {
    document.querySelector('[data-intro-title]')?.remove();
    dial.set(startAt);
    scheduleNudge();
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

  const journey = createJourney($('[data-journey]'), {
    reducedMotion,
    onBack: () => {
      setLive(true);
      dial.set(nowMinutes(), true);
      history.replaceState(null, '', location.pathname);
    },
  });

  // The glow drifts between the dial and the journey's stage instead of jumping.
  let focusX = window.innerWidth * 0.7;
  let focusY = window.innerHeight * 0.4;

  gsap.ticker.add((_time, deltaMs) => {
    const rect = dialEl.getBoundingClientRect(); // read before any writes
    const minutes = dial.minutes();
    // The sky follows the scroll while travelling through the journey,
    // the dial (and everything around it) keeps its own time.
    const scrolled = journey.minutes(minutes);
    const shown = scrolled ?? minutes;
    const palette = paletteAt(shown);
    const energy = curveValue('alertness', shown);
    const bg = rgbToHex(palette.bg);

    const wide = window.innerWidth >= 960;
    const [targetX, targetY] =
      scrolled === null
        ? [rect.left + rect.width / 2, rect.top + rect.height / 2]
        : [window.innerWidth * (wide ? 0.72 : 0.5), window.innerHeight * (wide ? 0.45 : 0.3)];
    const ease = reducedMotion ? 1 : Math.min(1, deltaMs / 160);
    focusX += (targetX - focusX) * ease;
    focusY += (targetY - focusY) * ease;

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
        focus: [focusX, focusY],
      },
      Math.min(deltaMs, 100) / 1000,
    );
    journey.update(scrolled);

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
      for (const t of trendEls) t.el.textContent = TREND_LABELS[curveTrend(t.id, minutes)];
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
