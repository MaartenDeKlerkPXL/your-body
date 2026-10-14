import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { CURVES, TREND_LABELS, curveTrend, curveValue } from '../lib/circadian';
import { phaseAt, type Phase } from '../content/phases';
import { paletteAt, rgbToHex, luminance } from '../lib/palette';
import { formatTime, nowMinutes, parseTime, shortestDelta } from '../lib/time';
import { createDial } from './dial';
import { createDialFeel, type DialFeel } from './dial-feel';
import { createScrubber } from './scrubber';
import { createSky, type Sky } from './sky';
import { playIntro } from './intro';
import type { Journey } from './journey';
import type { Ambient } from './ambient';
import { formAt } from '../lib/form';
import { displayAxes } from '../lib/type';
import { DEFAULT_CHRONOTYPE, clockLabel, isChronotype, shiftOf, sleepWindow, type Chronotype } from '../lib/chronotype';
import { curvePath, rhythmCells, rhythmNote, rhythmSummary } from '../lib/rhythm-view';

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
  const tableRows = [...document.querySelectorAll<HTMLElement>('[data-curves-row]')];
  let currentRow: HTMLElement | null = null;

  // Set by an inline script in the page before first paint (see index.astro).
  let intro = root.classList.contains('intro');
  let live = true;
  let touched = false; // has the person moved the dial yet?
  const setLive = (value: boolean) => {
    live = value;
    document.body.dataset.live = String(value);
    nowButton.hidden = value;
  };

  let feel: DialFeel | null = null;
  const dial = createDial(dialEl, {
    reducedMotion,
    onUserInput: () => {
      touched = true;
      if (!intro) setLive(false);
    },
    onSettle: () => feel?.settle(),
  });
  feel = createDialFeel(dialEl, dial, { reducedMotion });
  const scrubEl = $('[data-scrub]');
  const scrubber = createScrubber(scrubEl, {
    dial,
    reducedMotion,
    onUserInput: () => {
      touched = true;
      if (!intro) setLive(false);
    },
  });
  // Whichever control the layout shows: the dial, or the timeline on phones.
  const clockEl = () => (scrubber.visible() ? scrubEl : dialEl);
  // The shader compiles after the first paint, so text shows straight away;
  // until then (or if WebGL is missing) the CSS gradient stands in.
  let sky: Sky | null = null;
  requestAnimationFrame(() =>
    window.setTimeout(() => {
      sky = createSky($<HTMLCanvasElement>('[data-sky]'), reducedMotion);
    }, 0),
  );

  // If nobody has touched the dial after a few seconds, the knob wiggles
  // along the ring once to show it can be dragged.
  function scheduleNudge() {
    if (reducedMotion) return;
    window.setTimeout(() => {
      if (touched || window.scrollY > window.innerHeight * 0.5) return;
      if (scrubber.visible()) {
        scrubber.nudge();
        return;
      }
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
    const onPhone = scrubber.visible();
    playIntro(
      {
        title: $('[data-intro-title]'),
        titleText: $('[data-intro-title-text]'),
        dial: onPhone ? scrubEl : dialEl,
        ticks: [...(onPhone ? scrubEl.querySelectorAll('.scrub__tick, .scrub__edge') : dialEl.querySelectorAll('.dial__tick'))],
        labels: [...(onPhone ? scrubEl.querySelectorAll('.scrub__label') : dialEl.querySelectorAll('.dial__label'))],
        handle: onPhone ? $('[data-scrub-needle]') : handle,
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
    if (live && !intro && !dial.isDragging() && !scrubber.isDragging()) dial.set(nowMinutes());
  }, 1000);

  nowButton.addEventListener('click', () => {
    setLive(true);
    dial.set(nowMinutes(), true);
    history.replaceState(null, '', location.pathname);
    handle.focus();
  });

  // --- Chronotype -------------------------------------------------------------
  // Early birds and night owls run the same rhythm an hour earlier or later.
  // The shift glides, so the curves slide along the axis instead of jumping;
  // text that names times is rewritten once it lands.

  const CHRONO_KEY = 'ybn-chronotype';
  const chronoInputs = [...document.querySelectorAll<HTMLInputElement>('[data-chrono] input[name="chronotype"]')];
  const chronoHint = $('[data-chrono-hint]');
  const curvePaths = CURVES.map((c) => ({ id: c.id, el: $<SVGPathElement>(`[data-curve-path="${c.id}"]`) }));
  const scrubPhases = $<SVGGElement>('[data-scrub-phases]');
  const scrubHour = Number(scrubPhases.dataset.hour);
  const curvesNote = $('[data-curves-note]');
  const curvesSummary = $('#curves-summary');
  const tableCells = tableRows.map((row) =>
    [...row.querySelectorAll<HTMLElement>('[data-curves-cell]')].map((cell) => ({
      level: cell.querySelector<HTMLElement>('.curves__level')!,
      dir: cell.querySelector<HTMLElement>('.curves__dir')!,
    })),
  );
  const rangeEls = [...document.querySelectorAll<HTMLElement>('[data-range-start]')];
  const edgeEls = [...document.querySelectorAll<HTMLElement>('[data-edge]')];

  const readChronotype = (): Chronotype => {
    try {
      const stored = localStorage.getItem(CHRONO_KEY);
      return isChronotype(stored) ? stored : DEFAULT_CHRONOTYPE;
    } catch {
      return DEFAULT_CHRONOTYPE;
    }
  };
  const chrono = { shift: shiftOf(readChronotype()) };
  let shiftTween: gsap.core.Tween | null = null;

  const drawCurves = (shift: number) => {
    for (const p of curvePaths) p.el.setAttribute('d', curvePath(p.id, shift));
    scrubPhases.setAttribute('transform', `translate(${((shift / 60) * scrubHour).toFixed(1)} 0)`);
  };
  const writeChronoText = (shift: number) => {
    chronoHint.textContent = `Sleeps around ${sleepWindow(shift)}`;
    curvesNote.textContent = rhythmNote(shift);
    curvesSummary.textContent = rhythmSummary(shift);
    rhythmCells(shift).forEach((row, i) =>
      row.forEach((cell, j) => {
        const el = tableCells[i]?.[j];
        if (!el) return;
        el.level.textContent = cell.level;
        el.dir.textContent = cell.trend;
      }),
    );
    for (const el of rangeEls) {
      el.textContent = `${clockLabel(Number(el.dataset.rangeStart), shift)}–${clockLabel(Number(el.dataset.rangeEnd), shift)}`;
    }
    for (const el of edgeEls) el.textContent = clockLabel(Number(el.dataset.edge), shift);
  };
  const applyShift = (target: number, animate: boolean) => {
    shiftTween?.kill();
    if (!animate || reducedMotion) {
      chrono.shift = target;
      drawCurves(target);
      writeChronoText(target);
      return;
    }
    shiftTween = gsap.to(chrono, {
      shift: target,
      duration: 0.9,
      ease: 'power2.inOut',
      onUpdate: () => drawCurves(chrono.shift),
      onComplete: () => writeChronoText(target),
    });
  };

  // A thumb slides behind the chosen option instead of the highlight jumping.
  const chronoOptions = $('.chrono__options');
  const chronoThumb = $('[data-chrono-thumb]');
  const placeThumb = (instant = false) => {
    const label = chronoInputs.find((i) => i.checked)?.nextElementSibling as HTMLElement | null;
    if (!label || !label.offsetWidth) return;
    if (instant) chronoThumb.style.transition = 'none';
    const left = label.getBoundingClientRect().left - chronoOptions.getBoundingClientRect().left - chronoOptions.clientLeft;
    chronoThumb.style.translate = `${left.toFixed(1)}px 0`;
    chronoThumb.style.width = `${label.offsetWidth}px`;
    if (instant) {
      chronoThumb.getBoundingClientRect(); // commit the jump before transitions return
      chronoThumb.style.transition = '';
    }
  };

  const initialType = readChronotype();
  for (const input of chronoInputs) {
    input.checked = input.value === initialType;
    input.addEventListener('change', () => {
      placeThumb();
      if (!input.checked || !isChronotype(input.value)) return;
      try {
        localStorage.setItem(CHRONO_KEY, input.value);
      } catch {
        // Private mode: the choice simply lasts for this visit.
      }
      applyShift(shiftOf(input.value), true);
    });
  }
  if (chrono.shift !== 0) applyShift(chrono.shift, false);
  placeThumb(true);
  chronoOptions.classList.add('has-thumb');
  window.addEventListener('resize', () => placeThumb(true));
  document.fonts?.ready.then(() => placeThumb(true));

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
    // The hero title takes its phase's weight while the copy is swapped out.
    const axes = displayAxes(phase);
    root.style.setProperty('--display-wght', String(axes.wght));
    root.style.setProperty('--display-wdth', `${axes.wdth}%`);
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
        split = SplitText.create(nameEl, { type: 'words,chars', mask: 'chars' });
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
    if (vars.get(name) === value) return false;
    vars.set(name, value);
    root.style.setProperty(name, value);
    return true;
  };
  // Changing a custom property on :root restyles the whole page, so the CSS
  // palette updates about ten times a second; the shader still gets every frame.
  const CSS_INTERVAL = 100;
  let lastCss = -Infinity;
  let lastDraw = '';

  let lastMinute = -1;
  let lastShift = NaN;
  let lastLive: boolean | null = null;
  let lastPhase = '';
  // The phase the sky shows (dial or scroll), for the transition wave.
  let skyPhase = '';
  let lastShown = 0;

  // The journey (Lenis, ScrollTrigger, reveals) loads as its own chunk once the
  // browser is idle: it lives below the fold and isn't needed for first paint.
  let journey: Journey | null = null;
  const startJourney = () =>
    import('./journey').then(({ createJourney }) => {
      journey = createJourney($('[data-journey]'), {
        reducedMotion,
        onBack: () => {
          setLive(true);
          dial.set(nowMinutes(), true);
          history.replaceState(null, '', location.pathname);
        },
      });
    });
  // Ambient sound: the module is fetched when idle, so the first click can
  // start audio synchronously (Safari only allows that inside the gesture).
  const soundButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-sound]')];
  let ambient: Ambient | null = null;
  let ambientModule: typeof import('./ambient') | null = null;
  const loadAmbient = () =>
    import('./ambient').then((m) => {
      ambientModule = m;
      return m;
    });
  let soundOn = false;
  const toggleSound = async () => {
    soundOn = !soundOn;
    for (const b of soundButtons) b.setAttribute('aria-pressed', String(soundOn));
    if (!ambient) ambient = (ambientModule ?? (await loadAmbient())).createAmbient();
    ambient.setEnabled(soundOn);
  };
  for (const b of soundButtons) b.addEventListener('click', toggleSound);
  const prefetch = () => {
    startJourney();
    loadAmbient();
  };

  // Safari has no requestIdleCallback; fall back to a short timeout there.
  const idle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
  if (idle) idle.call(window, prefetch, { timeout: 1500 });
  else setTimeout(prefetch, 400);

  // The glow drifts between the dial and the journey's stage instead of jumping.
  let focusX = window.innerWidth * 0.7;
  let focusY = window.innerHeight * 0.4;
  // The phase's form: half strength and small behind the clock in the first
  // screen, full size on the journey's stage.
  let formMix = 0;
  let formScale = 0.6;
  const HERO_FORM = 0.5;
  const scrubTime = $('[data-scrub-time]');

  gsap.ticker.add((_time, deltaMs) => {
    // On phones the form sits behind the timeline's big digits.
    const onPhone = scrubber.visible();
    const rect = (onPhone ? scrubTime : clockEl()).getBoundingClientRect(); // read before any writes
    const minutes = dial.minutes(); // clock time
    // The body runs `shift` minutes behind the clock (ahead for early birds).
    const shift = chrono.shift;
    const body = minutes - shift;
    // The sky follows the scroll while travelling through the journey,
    // the dial (and everything around it) keeps its own time.
    const scrolled = journey ? journey.minutes(body) : null;
    const shown = scrolled ?? body;
    const palette = paletteAt(shown);
    const energy = curveValue('alertness', shown);
    const bg = rgbToHex(palette.bg);

    const wide = window.innerWidth >= 960;
    const [targetX, targetY] =
      scrolled === null
        ? [rect.left + rect.width / 2, rect.top + rect.height / 2]
        : [window.innerWidth * (wide ? 0.72 : 0.5), window.innerHeight * (wide ? 0.5 : 0.15)];
    const ease = reducedMotion ? 1 : Math.min(1, deltaMs / 160);
    focusX += (targetX - focusX) * ease;
    focusY += (targetY - focusY) * ease;
    // Hero size: inside the dial's ring (ring radius is 128/300 of the dial),
    // or about the digits' height on phones. Forms are ~0.25 of the shorter
    // screen side at scale 1.
    const unit = 0.25 * Math.min(window.innerWidth, window.innerHeight);
    const heroSize = onPhone ? rect.height * 0.9 : rect.width * (128 / 300) * 0.62;
    const targetScale = scrolled === null ? heroSize / unit : 1;
    const formEase = reducedMotion ? 1 : Math.min(1, deltaMs / 400);
    formMix += ((scrolled === null ? HERO_FORM : 1) - formMix) * formEase;
    formScale += (targetScale - formScale) * formEase;

    const now = performance.now();
    if (now - lastCss >= CSS_INTERVAL) {
      lastCss = now;
      if (setVar('--bg', bg)) themeMeta?.setAttribute('content', bg);
      setVar('--glow', rgbToHex(palette.glow));
      setVar('--accent', rgbToHex(palette.accent));
      setVar('--ink', rgbToHex(palette.ink));
      setVar('--ink-muted', rgbToHex(palette.inkMuted));
      setVar('--invert', luminance(palette.bg) > 0.18 ? '0' : '1');
    }

    const draw = minutes.toFixed(1);
    if (draw !== lastDraw) {
      lastDraw = draw;
      progress.style.strokeDasharray = `${draw} 1440`;
      playhead.setAttribute('x1', draw);
      playhead.setAttribute('x2', draw);
    }

    sky?.render(
      {
        bg: palette.bg,
        glow: palette.glow,
        accent: palette.accent,
        energy,
        focus: [focusX, focusY],
        form: formAt(shown),
        formMix,
        formScale,
      },
      Math.min(deltaMs, 100) / 1000,
    );
    // A new phase in the sky, by any route (dial, scroll, live time, or the
    // chronotype), sends a wave of light through it; not while the intro
    // races through the day.
    const shownPhase = phaseAt(shown).id;
    if (shownPhase !== skyPhase) {
      if (skyPhase !== '' && !intro) sky?.pulse(shortestDelta(lastShown, shown) >= 0 ? 1 : -1);
      skyPhase = shownPhase;
    }
    lastShown = shown;
    journey?.update(scrolled, shift);
    ambient?.update(shown);
    scrubber.update(minutes, live);

    const minute = Math.floor(minutes);
    const shiftMinute = Math.round(shift);
    if (minute !== lastMinute || live !== lastLive || shiftMinute !== lastShift) {
      const time = formatTime(minutes);
      dialTime.textContent = time;
      dialHint.textContent = live ? 'Drag to travel' : 'Exploring';
      statusText.textContent = live ? 'Live' : `Viewing ${time}`;
      lead.textContent = live ? `It’s ${time}. Your body is in` : `At ${time}, your body is in`;
      handle.setAttribute('aria-valuenow', String(minute));
      handle.setAttribute('aria-valuetext', time);
      if (document.activeElement !== jumpInput) jumpInput.value = time;
      for (const t of trendEls) t.el.textContent = TREND_LABELS[curveTrend(t.id, body)];
      // Mark the table row covering the time the clock shows.
      const row = tableRows[Math.min(tableRows.length - 1, Math.floor(minute / 180))] ?? null;
      if (row !== currentRow) {
        currentRow?.removeAttribute('aria-current');
        row?.setAttribute('aria-current', 'time');
        currentRow = row;
      }
      if (!live && !intro && lastLive !== null) syncUrl(minutes);
      lastMinute = minute;
      lastShift = shiftMinute;
      lastLive = live;
    }

    const phase = phaseAt(body);
    if (phase.id !== lastPhase) {
      showPhase(phase, lastPhase === '' || intro || dial.isDragging());
      if (lastPhase !== '' && !live && !intro) announce(minutes, phase);
      lastPhase = phase.id;
    }
  });
}
