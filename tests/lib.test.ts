import { describe, expect, it } from 'vitest';
import { formatTime, parseTime, shortestDelta, wrapMinutes } from '../src/lib/time';
import { CURVES, curveValue, curveTrend, describeCurve, levelLabel } from '../src/lib/circadian';
import { contrast, paletteAt } from '../src/lib/palette';
import { PHASES, phaseAt } from '../src/content/phases';
import { SOURCES } from '../src/content/sources';
import { FORMS, formAt } from '../src/lib/form';
import { SOUNDS, midiToHz, soundAt } from '../src/lib/sound';

describe('time', () => {
  it('wraps and formats', () => {
    expect(wrapMinutes(-15)).toBe(1425);
    expect(formatTime(1439.9)).toBe('23:59');
    expect(formatTime(1440)).toBe('00:00');
  });

  it('parses only valid 24h times', () => {
    expect(parseTime('03:00')).toBe(180);
    expect(parseTime('7:45')).toBe(465);
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('noon')).toBeNull();
  });

  it('finds the shortest way around the clock', () => {
    expect(shortestDelta(1430, 10)).toBe(20);
    expect(shortestDelta(10, 1430)).toBe(-20);
  });
});

describe('circadian model', () => {
  const peakOf = (id: Parameters<typeof curveValue>[0]) => {
    let best = 0;
    for (let m = 0; m < 1440; m += 5) if (curveValue(id, m) > curveValue(id, best)) best = m;
    return best / 60;
  };

  it('puts the peaks where the literature does', () => {
    expect(peakOf('melatonin')).toBeGreaterThanOrEqual(2);
    expect(peakOf('melatonin')).toBeLessThanOrEqual(4);
    expect(peakOf('cortisol')).toBeGreaterThanOrEqual(7);
    expect(peakOf('cortisol')).toBeLessThanOrEqual(9);
    expect(peakOf('temperature')).toBeGreaterThanOrEqual(16);
    expect(peakOf('temperature')).toBeLessThanOrEqual(20);
  });

  it('has an early-afternoon dip in alertness', () => {
    expect(curveValue('alertness', 14.5 * 60)).toBeLessThan(curveValue('alertness', 10.5 * 60));
    expect(curveValue('alertness', 14.5 * 60)).toBeLessThan(curveValue('alertness', 18 * 60));
  });

  it('describes trends', () => {
    expect(curveTrend('melatonin', 13 * 60)).toBe('low');
    expect(curveTrend('melatonin', 23 * 60)).toBe('rising');
    expect(curveTrend('melatonin', 3 * 60)).toBe('peak');
    expect(curveTrend('alertness', 14.5 * 60)).toBe('dip');
  });

  it('has no seams: every curve changes smoothly minute to minute', () => {
    for (const id of ['melatonin', 'cortisol', 'temperature', 'alertness'] as const) {
      for (let m = 0; m < 1440; m++) {
        expect(Math.abs(curveValue(id, m + 1) - curveValue(id, m))).toBeLessThan(0.01);
      }
    }
  });
});

describe('palette', () => {
  it('keeps text readable at every moment of the day', () => {
    let worst = Infinity;
    for (let m = 0; m < 1440; m += 5) {
      const p = paletteAt(m);
      worst = Math.min(
        worst,
        contrast(p.ink, p.bg),
        contrast(p.inkMuted, p.bg),
        contrast(p.inkMuted, p.glow),
      );
    }
    expect(worst).toBeGreaterThanOrEqual(4.5);
  });
});

describe('phases', () => {
  it('covers the whole day without gaps', () => {
    for (let m = 0; m < 1440; m += 15) expect(phaseAt(m)).toBeDefined();
    expect(PHASES[0].start).toBe(0);
    expect(PHASES.at(-1)?.end).toBe(24);
  });

  it('only cites sources that exist', () => {
    const ids = new Set(SOURCES.map((s) => s.id));
    for (const p of PHASES) {
      expect(p.refs.length).toBeGreaterThan(0);
      for (const r of p.refs) expect(ids.has(r)).toBe(true);
    }
  });
});

describe('forms', () => {
  it('has one form per phase', () => {
    expect(FORMS.length).toBe(PHASES.length);
  });

  it('holds each phase form in the middle of its phase', () => {
    PHASES.forEach((p, i) => {
      expect(formAt(((p.start + p.end) / 2) * 60)).toEqual(FORMS[i]);
    });
  });

  it('changes smoothly, including across midnight', () => {
    for (let m = 0; m < 1440; m++) {
      const a = formAt(m);
      const b = formAt(m + 1);
      for (const k of Object.keys(a) as Array<keyof typeof a>) {
        expect(Math.abs(a[k] - b[k])).toBeLessThan(0.05);
      }
    }
  });
});

describe('ambient sound', () => {
  it('has one sound per phase', () => {
    expect(SOUNDS.length).toBe(PHASES.length);
  });

  it('crossfades voices that always sum to one', () => {
    for (let m = 0; m < 1440; m += 3) {
      const { voices } = soundAt(m);
      expect(voices.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
      expect(voices.filter((v) => v > 0).length).toBeLessThanOrEqual(2);
    }
  });

  it('changes smoothly, including across midnight', () => {
    for (let m = 0; m < 1440; m++) {
      const a = soundAt(m);
      const b = soundAt(m + 1);
      expect(Math.abs(a.params.cutoff - b.params.cutoff) / a.params.cutoff).toBeLessThan(0.05);
      a.voices.forEach((v, i) => expect(Math.abs(v - b.voices[i])).toBeLessThan(0.05));
    }
  });

  it('is darker at night than in the morning', () => {
    expect(soundAt(4.5 * 60).params.cutoff).toBeLessThan(soundAt(10.5 * 60).params.cutoff);
  });

  it('tunes A4 to 440 Hz', () => {
    expect(midiToHz(69)).toBe(440);
  });
});

describe('curve descriptions', () => {
  it('describes alertness with two peaks and an afternoon dip', () => {
    const d = describeCurve('alertness');
    // Its low is either a point or a stretch that ends in the early morning.
    expect(d).toMatch(/^Alertness (is lowest around 0[3-5]:\d\d|stays low from about \d\d:\d\d to 0[3-5]:\d\d)/);
    expect(d).toMatch(/peaks around 1[01]:\d\d/);
    expect(d).toMatch(/dips around 1[34]:\d\d/);
    expect(d).toMatch(/peaks again around 1[78]:\d\d/);
  });

  it('puts the melatonin peak in the small hours and keeps it low by day', () => {
    expect(describeCurve('melatonin')).toMatch(/stays low from about 0[6-9]:\d\d to 2[01]:\d\d/);
    expect(describeCurve('melatonin')).toMatch(/peaks around 0[2-4]:\d\d/);
  });

  it('puts the temperature low before dawn and the high in the evening', () => {
    const d = describeCurve('temperature');
    expect(d).toMatch(/lowest around 0[4-5]:\d\d/);
    expect(d).toMatch(/(peaks|highest) around 1[7-9]:\d\d/);
  });

  it('labels levels in words', () => {
    expect(levelLabel(0.05)).toBe('very low');
    expect(levelLabel(0.5)).toBe('moderate');
    expect(levelLabel(0.95)).toBe('very high');
  });
});

import { CHRONOTYPES, clockLabel, shiftOf, sleepWindow } from '../src/lib/chronotype';

describe('chronotype', () => {
  it('runs the night owl an hour later and the early bird an hour earlier', () => {
    expect(shiftOf('late')).toBe(60);
    expect(shiftOf('early')).toBe(-60);
    expect(shiftOf('between')).toBe(0);
    expect(CHRONOTYPES.map((c) => c.id)).toEqual(['early', 'between', 'late']);
  });

  it('moves the sleep window and the curve descriptions with the shift', () => {
    expect(sleepWindow(0)).toBe('23:00–07:00');
    expect(sleepWindow(60)).toBe('00:00–08:00');
    expect(sleepWindow(-60)).toBe('22:00–06:00');
    expect(describeCurve('melatonin', 60)).toMatch(/peaks around 04:00/);
    expect(describeCurve('melatonin', -60)).toMatch(/peaks around 02:00/);
  });

  it('labels chapter edges on the clock, keeping the end of the day as 24:00', () => {
    expect(clockLabel(21 * 60, 60)).toBe('22:00');
    expect(clockLabel(24 * 60, 60)).toBe('01:00');
    expect(clockLabel(24 * 60, 0)).toBe('24:00');
    expect(clockLabel(0, -60)).toBe('23:00');
  });

  it('reads the model the same either side of midnight, since body time can go negative', () => {
    for (const c of CURVES) {
      for (const m of [-90, -60, 30]) expect(curveValue(c.id, m)).toBeCloseTo(curveValue(c.id, m + 1440), 5);
    }
    expect(formAt(-60)).toEqual(formAt(1380));
    expect(paletteAt(-60)).toEqual(paletteAt(1380));
    expect(phaseAt(-60).id).toBe(phaseAt(1380).id);
  });
});
