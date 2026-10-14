import type { RGB } from '../lib/palette';
import type { Form } from '../lib/form';

/**
 * Full-screen shader behind everything: a slow, domain-warped glow that sits
 * behind the dial like a body's warmth. Colour comes from the palette, tempo
 * from alertness: languid at 04:00, lively at 10:30.
 */

const vertex = /* glsl */ `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uOctaves;
  uniform float uBreath;
  uniform float uEnergy;
  uniform vec2 uRes;
  uniform vec2 uFocus;
  uniform vec3 uBg;
  uniform vec3 uGlow;
  uniform vec3 uAccent;

  // The phase's form (see lib/form.ts), and how visible it is.
  uniform float uForm;
  uniform float uScale;
  uniform float uRadius;
  uniform float uSquash;
  uniform float uSag;
  uniform float uRise;
  uniform float uSharp;
  uniform float uRings;
  uniform float uRays;
  uniform float uOrbit;
  uniform float uHalo;
  uniform float uDissolve;
  uniform float uStars;
  uniform float uBreathDepth;

  // Phase change: a ring of light travelling through the sky (see pulse()).
  uniform float uPulseR;
  uniform float uPulseW;
  uniform float uPulseA;

  varying vec2 vUv;

  // 3D simplex noise, Ashima Arts / Stefan Gustavson (MIT).
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Sparse twinkling points: one candidate per grid cell, most cells empty.
  float starField(vec2 uv, float scale, float t, float density) {
    vec2 g = uv * scale;
    vec2 id = floor(g);
    vec2 fr = fract(g) - 0.5;
    float h = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
    vec2 off = vec2(fract(h * 13.7), fract(h * 7.3)) - 0.5;
    float d = length(fr - off * 0.7);
    float twinkle = 0.55 + 0.45 * sin(t * 1.7 + h * 40.0);
    return smoothstep(0.09, 0.0, d) * step(1.0 - density, h) * twinkle;
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      if (float(i) >= uOctaves) break;
      v += a * snoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
    vec2 f = (uFocus - 0.5 * uRes) / min(uRes.x, uRes.y);

    // Domain warp: the field folds over itself like slow smoke.
    vec2 q = vec2(fbm(vec3(p * 1.1, uTime * 0.06)), fbm(vec3(p * 1.1 + 4.7, uTime * 0.06)));
    float n = fbm(vec3(p * 1.4 + q * 1.6, uTime * 0.04));

    float d = length(p - f);
    float radius = 0.55 + 0.04 * uBreath + 0.1 * uEnergy;

    vec3 col = uBg;

    // The ring is bent by the same smoke, so it reads as a breath, not a circle.
    float pulse = 0.0;
    if (uPulseA > 0.001) {
      pulse = smoothstep(uPulseW, 0.0, abs(d - uPulseR + n * 0.12)) * uPulseA;
      // Light pooling behind the wave as it leaves.
      pulse += smoothstep(uPulseR, 0.0, d) * uPulseA * 0.18;
    }

    // The soft body glow steps back while a phase's form is on stage.
    float body = smoothstep(radius + 0.45, 0.0, d + n * 0.22);
    col = mix(col, uGlow, body * 0.9 * (1.0 - 0.55 * uForm));

    float halo = smoothstep(0.18, 0.0, abs(d - radius * 0.62 + n * 0.06));
    col = mix(col, uAccent, halo * (0.12 + 0.1 * uEnergy) * (1.0 - uForm));

    // --- The form ------------------------------------------------------------
    if (uForm > 0.001) {
      // The whole form lives in its own scaled space, so it can sit small
      // behind the dial or fill the journey's stage with the same geometry.
      vec2 r2 = (p - f) / max(uScale, 0.05);
      r2.y -= uRise;
      // Droop: stretch the lower half downward.
      r2.y /= mix(1.0, 1.0 + uSag, smoothstep(0.05, -0.35, r2.y));
      r2.y /= max(uSquash, 0.05);

      float ang = atan(r2.y, r2.x);
      float r = length(r2);
      float size = uRadius * (1.0 + 0.05 * uBreath * uBreathDepth);
      // A gentle, slow wobble: organic, never lumpy.
      float wobble = snoise(vec3(cos(ang) * 0.8, sin(ang) * 0.8, uTime * 0.1)) * (0.01 + 0.018 * (1.0 - uSharp) + 0.012 * uSag);
      float sd = r - size - wobble;

      // Solid inside; only the outside of the edge feathers, so the
      // wobbling outline never shades the body itself.
      float edge = mix(0.16, 0.008, uSharp);
      float fill = 1.0 - smoothstep(0.0, edge, sd);
      float core = smoothstep(size, 0.0, r);

      // Wind-down: the body comes apart into fine dust drifting upward.
      if (uDissolve > 0.001) {
        vec2 drift = r2 + vec2(0.0, -uTime * 0.012);
        float dust = starField(drift, 60.0, uTime, 0.6) * 1.2 + starField(drift + 3.1, 100.0, uTime * 1.3, 0.55);
        float body2 = mix(0.45, 0.0, smoothstep(size * 0.1, size * 1.2, r));
        float loose = (body2 + dust) * (1.0 - smoothstep(size * 0.9, size * 1.9, r) * 0.6);
        fill = mix(fill, clamp(loose, 0.0, 1.0), uDissolve);
      }

      // Lit from within: brighter toward the core.
      vec3 formCol = mix(uGlow, mix(uGlow, uAccent, 0.45), core * core);
      col = mix(col, formCol, clamp(fill, 0.0, 1.0) * 0.92 * uForm);

      // A thin rim of light on the edge: narrow, so it never reaches inside
      // and traces the wobble across the body; brighter on crisp forms.
      float rimWidth = min(edge, size * 0.12) + 0.004;
      float rim = smoothstep(rimWidth, 0.0, abs(sd)) * (1.0 - uDissolve);
      col = mix(col, uAccent, rim * 0.35 * smoothstep(0.35, 0.9, uSharp) * uForm);

      // Morning peak: crisp concentric rings, slowly travelling outward.
      if (uRings > 0.001) {
        float wave = sin((r - uTime * 0.03) * 70.0) * 0.5 + 0.5;
        float rings = smoothstep(0.82, 1.0, wave) * smoothstep(size * 2.4, size * 1.05, r) * step(size, r);
        col = mix(col, uAccent, rings * 0.4 * uRings * uForm);
      }

      // First light: rays fanning out around the rising body.
      if (uRays > 0.001) {
        float beam = pow(sin(ang * 9.0 + uTime * 0.08) * 0.5 + 0.5, 8.0);
        float reach = smoothstep(size * 3.4, size * 1.1, r) * smoothstep(size * 0.95, size * 1.15, r);
        col = mix(col, mix(uGlow, uAccent, 0.5), beam * reach * 0.5 * uRays * uForm);
      }

      // Second wind: satellites orbit and pulses ripple out.
      if (uOrbit > 0.001) {
        for (int i = 0; i < 3; i++) {
          float a = uTime * 0.5 + float(i) * 2.094;
          vec2 sat = vec2(cos(a), sin(a) * 0.8) * size * (1.7 + 0.15 * float(i));
          float dot_ = smoothstep(0.03, 0.0, length(r2 - sat));
          col = mix(col, uAccent, dot_ * 0.8 * uOrbit * uForm);
        }
        float pulse = fract(uTime * 0.25);
        float ripple = smoothstep(0.012, 0.0, abs(r - size * (1.05 + pulse * 1.6))) * (1.0 - pulse);
        col = mix(col, uAccent, ripple * 0.5 * uOrbit * uForm);
      }

      // Evening: a wide, low halo like the sun going down.
      if (uHalo > 0.001) {
        float band = smoothstep(0.045, 0.0, abs(r - size * 1.5)) * 0.7 + smoothstep(size * 2.4, size * 1.05, r) * 0.22;
        col = mix(col, mix(uGlow, uAccent, 0.4), band * uHalo * uForm);
      }
    }

    // Night: a scattering of stars around the stage.
    if (uStars > 0.001) {
      float stars = starField(p + vec2(uTime * 0.003, 0.0), 26.0, uTime, 0.22);
      float around = smoothstep(1.4, 0.2, length(p - f));
      col = mix(col, mix(uAccent, vec3(1.0), 0.6), stars * around * 0.8 * uStars * uForm);
    }

    // On light skies the wave is light itself: brighter than the background,
    // so the dark ink only gains contrast. On dark skies the glow is too close
    // to the background to show, so the wave leans on the accent; at most a
    // quarter of it, in a passing ring, which keeps light ink well above AA.
    float lightSky = step(0.45, dot(uBg, vec3(0.2126, 0.7152, 0.0722)));
    vec3 waveCol = mix(mix(uGlow, uAccent, 0.55), mix(uGlow, vec3(1.0), 0.65), lightSky);
    col = mix(col, waveCol, clamp(pulse, 0.0, 1.0) * mix(0.45, 0.55, lightSky));

    col += (n * 0.5) * 0.08 * uGlow;
    col *= mix(1.0, 0.86, smoothstep(0.5, 1.5, length(p)));

    // Film grain keeps gradients from banding.
    float g = fract(sin(dot(gl_FragCoord.xy + fract(uTime) * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
    col += (g - 0.5) * 0.03;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface SkyState {
  bg: RGB;
  glow: RGB;
  accent: RGB;
  energy: number;
  /** Centre of the glow, in CSS pixels from the top-left. */
  focus: [number, number];
  /** The phase's form and how visible it is (0–1). */
  form: Form;
  formMix: number;
  /** Size of the form relative to its journey size (1). */
  formScale: number;
}

export interface Sky {
  render(state: SkyState, deltaSeconds: number): void;
  /** A new phase begins: a wave of light outward (forward in time) or inward (back). */
  pulse(direction: 1 | -1): void;
  destroy(): void;
}

type UniformValue = number | readonly number[];

export function createSky(canvas: HTMLCanvasElement, reducedMotion: boolean): Sky | null {
  // Plain WebGL: one triangle covering the screen needs no library, and this
  // way no extensions are probed at start-up and the shader can compile in
  // the background instead of blocking the page.
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  // With this extension the driver compiles off the main thread and we poll
  // for completion each frame; without it, the first status check waits.
  const parallel = gl.getExtension('KHR_parallel_shader_compile') as { COMPLETION_STATUS_KHR: number } | null;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const locations = new Map<string, WebGLUniformLocation | null>();
  const setUniform = (name: string, value: UniformValue) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    const loc = locations.get(name)!;
    if (loc === null) return;
    if (typeof value === 'number') gl.uniform1f(loc, value);
    else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
    else gl.uniform3f(loc, value[0], value[1], value[2]);
  };

  // Resolution scale: the soft visuals hold up well below native resolution,
  // and the scale drops further on devices that can't keep up (see adapt()).
  const maxDpr = Math.min(window.devicePixelRatio, 1.5);
  let quality = 0.85;
  let octaves = 4;
  const resize = () => {
    const scale = maxDpr * quality;
    canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  // Frame-time watchdog: average frame time over a window; step quality down
  // when frames run long, and once back up if there's plenty of headroom.
  let frames = 0;
  let total = 0;
  let raised = false;
  const adapt = (dt: number) => {
    if (dt <= 0 || dt > 0.25) return; // skip tab switches and hiccups
    frames++;
    total += dt;
    if (frames < 90) return;
    const avg = total / frames;
    frames = 0;
    total = 0;
    if (avg > 0.022 && quality > 0.45) {
      quality = Math.max(0.45, quality - 0.15);
    } else if (avg < 0.0135 && quality < 0.85 && !raised) {
      raised = true; // only once, so it never oscillates
      quality = Math.min(0.85, quality + 0.15);
    } else return;
    octaves = quality < 0.75 ? 3 : 4;
    resize();
  };

  let time = 7.3; // start mid-flow, not at the noise origin
  let failed = false;
  let linked = false;
  let ready = false;
  let breathPhase = 0;

  // Phase-change wave. Its own clock (real seconds), so it runs at the same
  // pace at night as by day.
  const PULSE_SECONDS = 2.4;
  const PULSE_GAP = 0.6; // when phases fly by, at most one new wave per this
  let pulseT = -1; // 0–1 while a wave runs
  let pulseDir: 1 | -1 = 1;
  let sincePulse = Infinity;

  const fail = () => {
    failed = true;
    canvas.classList.remove('is-ready'); // keep the CSS gradient
  };
  canvas.addEventListener('webglcontextlost', fail);

  return {
    render(state, dt) {
      if (failed) return;
      if (!reducedMotion) {
        // Calm at night, brisker by day.
        time += dt * (0.35 + state.energy * 0.9);
        breathPhase += dt * Math.PI * 2 * (0.1 + state.energy * 0.12);
      }
      if (!linked) {
        if (parallel && !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) return;
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.warn('Sky shader failed:', gl.getProgramInfoLog(program) || gl.getShaderInfoLog(fs));
          fail();
          return;
        }
        linked = true;
        gl.useProgram(program);
      }
      adapt(dt);

      sincePulse += dt;
      let pulseR = 0;
      let pulseW = 0;
      let pulseA = 0;
      if (pulseT >= 0) {
        pulseT += dt / PULSE_SECONDS;
        if (pulseT >= 1) pulseT = -1;
        else {
          const e = 1 - (1 - pulseT) ** 3; // fast start, long glide
          const travel = pulseDir === 1 ? e : 1 - e;
          pulseR = 0.08 + travel * 1.9;
          pulseW = 0.06 + travel * 0.34;
          // Swells in quickly, fades over the rest of its way.
          pulseA = Math.min(1, pulseT / 0.08) * (1 - pulseT) ** 1.6;
        }
      }

      const scale = canvas.width / window.innerWidth;
      const form = state.form;
      setUniform('uTime', time);
      setUniform('uOctaves', octaves);
      setUniform('uBreath', Math.sin(breathPhase));
      setUniform('uEnergy', state.energy);
      setUniform('uRes', [canvas.width, canvas.height]);
      setUniform('uFocus', [state.focus[0] * scale, canvas.height - state.focus[1] * scale]);
      setUniform('uBg', state.bg);
      setUniform('uGlow', state.glow);
      setUniform('uAccent', state.accent);
      setUniform('uForm', state.formMix);
      setUniform('uScale', state.formScale);
      setUniform('uRadius', form.radius);
      setUniform('uSquash', form.squash);
      setUniform('uSag', form.sag);
      setUniform('uRise', form.rise);
      setUniform('uSharp', form.sharp);
      setUniform('uRings', form.rings);
      setUniform('uRays', form.rays);
      setUniform('uOrbit', form.orbit);
      setUniform('uHalo', form.halo);
      setUniform('uDissolve', form.dissolve);
      setUniform('uStars', form.stars);
      setUniform('uBreathDepth', form.breath);
      setUniform('uPulseR', pulseR);
      setUniform('uPulseW', pulseW);
      setUniform('uPulseA', pulseA);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready'); // fade in over the CSS gradient
      }
    },
    pulse(direction) {
      if (reducedMotion || sincePulse < PULSE_GAP) return;
      sincePulse = 0;
      pulseT = 0;
      pulseDir = direction;
    },
    destroy() {
      window.removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
