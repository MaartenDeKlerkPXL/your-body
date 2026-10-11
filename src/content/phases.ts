/**
 * The eight phases of the day. Copy is deliberately conservative: every claim
 * must be traceable to a source listed in docs/CONTENT.md before launch.
 * Times assume someone who sleeps roughly 23:00–07:00.
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
}

export const PHASES: Phase[] = [
  {
    id: 'deep-night',
    start: 0,
    end: 3,
    name: 'Deep night',
    headline: 'Repair mode.',
    body: 'Melatonin is close to its highest, and the first half of the night holds most of your deep, slow-wave sleep. That deep sleep is when much of your growth hormone is released.',
    tip: 'Keep the bedroom dark and cool. Even dim light can suppress melatonin.',
  },
  {
    id: 'low-tide',
    start: 3,
    end: 6,
    name: 'Low tide',
    headline: 'Your lowest point.',
    body: 'Core body temperature reaches its daily minimum, a couple of hours before you would naturally wake. Dreams get longer: REM sleep fills more of the second half of the night.',
    tip: 'Awake right now? Skip the bright screen, so your clock doesn’t mistake it for morning.',
  },
  {
    id: 'first-light',
    start: 6,
    end: 9,
    name: 'First light',
    headline: 'Waking up, chemically.',
    body: 'Morning light reaching your eyes switches melatonin production off. Cortisol surges in the first 30 to 45 minutes after you wake, helping you get going.',
    tip: 'Get outside daylight within an hour of waking. It anchors your clock for the whole day.',
  },
  {
    id: 'morning-peak',
    start: 9,
    end: 12,
    name: 'Morning peak',
    headline: 'Your sharpest hours.',
    body: 'As sleep inertia wears off and your body warms up, alertness and focus climb through the late morning for most people.',
    tip: 'Put your hardest, most focused work here, and protect it from meetings.',
  },
  {
    id: 'afternoon-dip',
    start: 12,
    end: 15,
    name: 'Afternoon dip',
    headline: 'The slump is built in.',
    body: 'That early-afternoon drowsiness isn’t only lunch. A dip in alertness around this time is part of your daily rhythm, meal or no meal.',
    tip: 'A nap of 10 to 20 minutes, or a walk in daylight, lifts you without stealing from tonight’s sleep.',
  },
  {
    id: 'second-wind',
    start: 15,
    end: 18,
    name: 'Second wind',
    headline: 'Warm, quick, strong.',
    body: 'Core temperature keeps rising toward its daily high. Reaction time, coordination and muscle strength tend to be at their best in the late afternoon.',
    tip: 'A good window for a workout or anything physical.',
  },
  {
    id: 'evening',
    start: 18,
    end: 21,
    name: 'Evening',
    headline: 'Wide awake, for now.',
    body: 'Your temperature peaks and begins to fall. Strangely, the few hours before your usual bedtime are when falling asleep is hardest: the so-called wake maintenance zone.',
    tip: 'Dim the lights after sunset and finish your last big meal a few hours before bed.',
  },
  {
    id: 'wind-down',
    start: 21,
    end: 24,
    name: 'Wind-down',
    headline: 'Darkness means sleep.',
    body: 'Melatonin starts rising about two hours before your usual bedtime while your core temperature drops, preparing your body for sleep.',
    tip: 'Turn screens down and keep a regular bedtime. Consistency matters, not just hours.',
  },
];

export function phaseAt(minutes: number): Phase {
  const hour = ((((minutes / 60) % 24) + 24) % 24);
  return PHASES.find((p) => hour >= p.start && hour < p.end) ?? PHASES[0];
}
