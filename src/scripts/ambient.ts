import { SOUNDS, midiToHz, soundAt } from '../lib/sound';

/**
 * Generative ambient score, built from Web Audio nodes (no audio files):
 * a drone voice per phase (crossfaded), filtered air with a slow swell, sparse
 * chimes, an optional soft pulse, a generated reverb and a gentle limiter.
 * Created on the first click of the sound button (browsers only allow audio
 * after a gesture) and suspended whenever it's off or the tab is hidden.
 */

export interface Ambient {
  setEnabled(on: boolean): void;
  enabled(): boolean;
  /** Follow the time shown on the page; cheap to call every frame. */
  update(minutes: number): void;
}

const SMOOTH = 0.6; // seconds: time constant for parameter changes
const LOOKAHEAD = 0.25; // seconds of pulse beats scheduled ahead

interface Engine {
  ctx: AudioContext;
  master: GainNode;
  update(minutes: number): void;
}

function impulse(ctx: BaseAudioContext, seconds: number, decay: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
  }
  return buffer;
}

function pinkNoise(ctx: BaseAudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Paul Kellet's economy pink filter.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
  }
  return buffer;
}

function build(): Engine {
  const ctx = new AudioContext({ latencyHint: 'playback' });
  const now = () => ctx.currentTime;
  const glide = (param: AudioParam, value: number, tc = SMOOTH) => param.setTargetAtTime(value, now(), tc);

  // Output: master → limiter → speakers, with a shared reverb bus.
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 12;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.01;
  limiter.release.value = 0.4;
  master.connect(limiter).connect(ctx.destination);

  const reverb = ctx.createConvolver();
  reverb.buffer = impulse(ctx, 3.5, 2.6);
  const reverbOut = ctx.createGain();
  reverbOut.gain.value = 0.55;
  reverb.connect(reverbOut).connect(master);

  // --- Drone: one voice per phase, through a shared breathing low-pass ----
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.Q.value = 0.7;
  padFilter.frequency.value = 500;
  const padOut = ctx.createGain();
  padOut.gain.value = 0.9;
  padFilter.connect(padOut);
  padOut.connect(master);
  const padSend = ctx.createGain();
  padSend.gain.value = 0.35;
  padOut.connect(padSend).connect(reverb);

  const breath = ctx.createOscillator();
  breath.frequency.value = 0.08;
  const breathAmount = ctx.createGain();
  breathAmount.gain.value = 0;
  breath.connect(breathAmount).connect(padFilter.frequency);
  breath.start();

  // Voices are made on demand and released after they've been silent a
  // while, so only the one or two phases you can hear are running.
  interface Voice {
    gain: GainNode;
    oscs: OscillatorNode[];
    silentSince: number;
  }
  const voices: Array<Voice | null> = SOUNDS.map(() => null);
  const makeVoice = (i: number): Voice => {
    const sound = SOUNDS[i];
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(padFilter);
    const perNote = 0.16 / sound.chord.length;
    const oscs: OscillatorNode[] = [];
    for (const note of sound.chord) {
      for (const [type, detune, level] of [
        ['sine', 0, 1],
        ['triangle', 7, 0.6],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = midiToHz(note);
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = perNote * level;
        osc.connect(g).connect(gain);
        osc.start();
        oscs.push(osc);
      }
    }
    return { gain, oscs, silentSince: -1 };
  };
  const releaseVoice = (i: number) => {
    const v = voices[i];
    if (!v) return;
    for (const osc of v.oscs) osc.stop();
    v.gain.disconnect();
    voices[i] = null;
  };

  // --- Air: looping pink noise through a band-pass, with a slow swell -------
  const noise = ctx.createBufferSource();
  noise.buffer = pinkNoise(ctx, 4);
  noise.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = 'bandpass';
  airFilter.Q.value = 0.6;
  const air = ctx.createGain();
  air.gain.value = 0;
  noise.connect(airFilter).connect(air).connect(master);
  const airSend = ctx.createGain();
  airSend.gain.value = 0.25;
  air.connect(airSend).connect(reverb);
  const swell = ctx.createOscillator();
  swell.frequency.value = 0.09; // one wave every ~11 s
  const swellAmount = ctx.createGain();
  swellAmount.gain.value = 0;
  swell.connect(swellAmount).connect(air.gain);
  swell.start();
  noise.start();

  // --- Chimes and pulse: scheduled notes ------------------------------------
  const chimeBus = ctx.createGain();
  chimeBus.gain.value = 0.5;
  chimeBus.connect(master);
  const chimeSend = ctx.createGain();
  chimeSend.gain.value = 0.9;
  chimeBus.connect(chimeSend).connect(reverb);

  const chime = (note: number, at: number) => {
    const f = midiToHz(note);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.12, at + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, at + 3.2);
    env.connect(chimeBus);
    for (const [ratio, level] of [
      [1, 1],
      [2.76, 0.18], // a soft bell-like partial
    ]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = f * ratio;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(env);
      osc.start(at);
      osc.stop(at + 3.3);
    }
  };

  const pulseBus = ctx.createGain();
  pulseBus.gain.value = 0;
  pulseBus.connect(master);
  const beat = (at: number) => {
    // A soft low thump: sine falling in pitch, quick decay.
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(90, at);
    osc.frequency.exponentialRampToValueAtTime(42, at + 0.25);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.5, at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, at + 0.45);
    osc.connect(env).connect(pulseBus);
    osc.start(at);
    osc.stop(at + 0.5);
  };

  let nextBeat = 0;
  let lastUpdate = 0;
  let lastChimeNote = -1;

  return {
    ctx,
    master,
    update(minutes) {
      const t = now();
      const dt = lastUpdate ? Math.min(0.5, t - lastUpdate) : 0;
      lastUpdate = t;
      const s = soundAt(minutes);
      const p = s.params;

      s.voices.forEach((weight, i) => {
        let v = voices[i];
        if (weight > 0 && !v) v = voices[i] = makeVoice(i);
        if (!v) return;
        glide(v.gain.gain, weight * p.level, 1.2);
        if (weight > 0) v.silentSince = -1;
        else if (v.silentSince < 0) v.silentSince = t;
        else if (t - v.silentSince > 8) releaseVoice(i); // well past the fade-out
      });
      glide(padFilter.frequency, p.cutoff);
      glide(breathAmount.gain, p.cutoff * 0.35 * p.breathDepth);
      glide(breath.frequency, p.breathRate, 2);
      glide(airFilter.frequency, p.airFreq);
      glide(air.gain, p.air * 0.5 * (1 - p.swell * 0.5));
      glide(swellAmount.gain, p.air * 0.5 * p.swell * 0.5);
      glide(pulseBus.gain, p.pulse * 0.6);

      // Chimes: a Poisson process at the phase's rate, never the same note twice.
      if (dt > 0 && Math.random() < p.chimeRate * dt) {
        let note = s.chimes[Math.floor(Math.random() * s.chimes.length)];
        if (note === lastChimeNote) note = s.chimes[(s.chimes.indexOf(note) + 2) % s.chimes.length];
        lastChimeNote = note;
        chime(note, t + 0.02);
      }

      // Pulse: keep a few beats scheduled ahead while it's audible.
      if (p.pulse > 0.02) {
        if (nextBeat < t) nextBeat = t + 0.05;
        while (nextBeat < t + LOOKAHEAD) {
          beat(nextBeat);
          nextBeat += 60 / p.bpm;
        }
      }
    },
  };
}

export function createAmbient(): Ambient {
  let engine: Engine | null = null;
  let on = false;
  let lastSent = 0;
  let pending: number | null = null;

  const fade = (to: number) => {
    if (!engine) return;
    const g = engine.master.gain;
    g.cancelScheduledValues(engine.ctx.currentTime);
    g.setTargetAtTime(to, engine.ctx.currentTime, to > 0 ? 0.9 : 0.25);
  };

  document.addEventListener('visibilitychange', () => {
    if (!engine || !on) return;
    if (document.hidden) engine.ctx.suspend();
    else engine.ctx.resume();
  });

  return {
    enabled: () => on,
    setEnabled(next) {
      on = next;
      if (on && !engine) {
        engine = build();
        if (pending !== null) engine.update(pending);
      }
      if (!engine) return;
      if (on) {
        engine.ctx.resume();
        fade(0.7);
      } else {
        fade(0);
        // Suspend once the fade-out has finished, unless it was turned back on.
        window.setTimeout(() => {
          if (!on) engine?.ctx.suspend();
        }, 1200);
      }
    },
    update(minutes) {
      pending = minutes;
      if (!engine || !on) return;
      // Audio parameters glide on their own; ten updates a second is plenty.
      const t = performance.now();
      if (t - lastSent < 100) return;
      lastSent = t;
      engine.update(minutes);
    },
  };
}
