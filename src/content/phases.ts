/**
 * The eight phases of the day. Copy is deliberately conservative: every claim
 * is traceable to a source in docs/CONTENT.md. Change a claim, update that file.
 * Times assume someone who sleeps roughly 23:00–07:00; the chronotype toggle
 * shifts the whole rhythm an hour either way (lib/chronotype.ts).
 */

export interface Phase {
  id: string;
  /** Start and end hour, end exclusive. */
  start: number;
  end: number;
  name: string;
  headline: string;
  body: string;
  tip: string;
  /** Ids in SOURCES backing this phase's claims. */
  refs: number[];
}

export const PHASES: Phase[] = [
  {
    id: 'deep-night',
    start: 0,
    end: 3,
    name: 'Deep night',
    headline: 'Repair mode.',
    body: 'Melatonin is close to its highest, and the first half of the night holds most of your deep, slow-wave sleep. That deep sleep is when much of your growth hormone is released.',
    tip: 'Keep the bedroom dark. Even ordinary room light can suppress melatonin.',
    refs: [1, 2, 3, 19, 20, 21],
  },
  {
    id: 'low-tide',
    start: 3,
    end: 6,
    name: 'Low tide',
    headline: 'Your lowest point.',
    body: 'Core body temperature reaches its daily low in the early morning, before you would naturally wake. Dreams get longer: most REM sleep falls in the second half of the night.',
    tip: 'Awake right now? Skip the bright screen, so your clock doesn’t mistake it for morning.',
    refs: [3, 5, 9, 10, 21],
  },
  {
    id: 'first-light',
    start: 6,
    end: 9,
    name: 'First light',
    headline: 'Waking up, chemically.',
    body: 'Light reaching your eyes helps shut melatonin down. Cortisol rises sharply in the first 30 to 45 minutes after you wake, helping you get going.',
    tip: 'Get outside in the morning. Early light pulls your clock earlier and keeps it on time.',
    refs: [3, 5, 6, 7],
  },
  {
    id: 'morning-peak',
    start: 9,
    end: 12,
    name: 'Morning peak',
    headline: 'Your sharpest hours.',
    body: 'As sleep inertia wears off and your body warms up, alertness and focus climb through the late morning for most people.',
    tip: 'Put your hardest, most focused work here, and protect it from meetings.',
    refs: [15, 16],
  },
  {
    id: 'afternoon-dip',
    start: 12,
    end: 15,
    name: 'Afternoon dip',
    headline: 'The slump is built in.',
    body: 'That early-afternoon drowsiness isn’t only lunch. A dip in alertness around this time is part of your daily rhythm, meal or no meal.',
    tip: 'A nap of about 10 minutes lifts alertness straight away. Much longer naps can leave you groggy.',
    refs: [12, 16, 17],
  },
  {
    id: 'second-wind',
    start: 15,
    end: 18,
    name: 'Second wind',
    headline: 'Warm, quick, strong.',
    body: 'Core temperature keeps rising toward its daily high. Reaction time, coordination and muscle strength tend to be at their best in the late afternoon.',
    tip: 'A good window for a workout or anything physical.',
    refs: [9, 18],
  },
  {
    id: 'evening',
    start: 18,
    end: 21,
    name: 'Evening',
    headline: 'Wide awake, for now.',
    body: 'Your temperature peaks and begins to fall. Strangely, the few hours before your usual bedtime are when falling asleep is hardest: the so-called wake maintenance zone.',
    tip: 'Dim the lights in the evening and avoid big meals close to bedtime.',
    refs: [3, 9, 13, 14, 22],
  },
  {
    id: 'wind-down',
    start: 21,
    end: 24,
    name: 'Wind-down',
    headline: 'Darkness means sleep.',
    body: 'Melatonin starts rising two to three hours before your usual bedtime, and your body sheds heat through your hands and feet, preparing you for sleep.',
    tip: 'Turn screens down and keep a regular bedtime. Consistency matters, not just hours.',
    refs: [1, 2, 11, 23],
  },
];

export function phaseAt(minutes: number): Phase {
  const hour = ((((minutes / 60) % 24) + 24) % 24);
  return PHASES.find((p) => hour >= p.start && hour < p.end) ?? PHASES[0];
}
