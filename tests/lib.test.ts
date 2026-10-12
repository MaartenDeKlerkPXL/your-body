import { describe, expect, it } from 'vitest';
import { formatTime, parseTime, shortestDelta, wrapMinutes } from '../src/lib/time';
import { curveValue, curveTrend } from '../src/lib/circadian';
import { contrast, paletteAt } from '../src/lib/palette';
import { PHASES, phaseAt } from '../src/content/phases';
import { SOURCES } from '../src/content/sources';
import { FORMS, formAt } from '../src/lib/form';

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
