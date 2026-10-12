import { Mesh, Program, Renderer, Triangle } from 'ogl';
import type { RGB } from '../lib/palette';
import type { Form } from '../lib/form';

/**
 * Full-screen shader behind everything: a slow, domain-warped glow that sits
 * behind the dial like a body's warmth. Colour comes from the palette, tempo
 * from alertness: languid at 04:00, lively at 10:30.
 */

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uBreath;
  uniform float uEnergy;
  uniform vec2 uRes;
  uniform vec2 uFocus;
  uniform vec3 uBg;
  uniform vec3 uGlow;
  uniform vec3 uAccent;

  // The phase's form (see lib/form.ts), and how visible it is.
  uniform float uForm;
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
    // The soft body glow steps back while a phase's form is on stage.
    float body = smoothstep(radius + 0.45, 0.0, d + n * 0.22);
    col = mix(col, uGlow, body * 0.9 * (1.0 - 0.55 * uForm));

    float halo = smoothstep(0.18, 0.0, abs(d - radius * 0.62 + n * 0.06));
    col = mix(col, uAccent, halo * (0.12 + 0.1 * uEnergy) * (1.0 - uForm));

    // --- The form ------------------------------------------------------------
    if (uForm > 0.001) {
      vec2 r2 = p - f;
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
}

export interface Sky {
  render(state: SkyState, deltaSeconds: number): void;
  destroy(): void;
}

export function createSky(canvas: HTMLCanvasElement, reducedMotion: boolean): Sky | null {
  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio, 1.5), antialias: false });
  } catch {
    return null;
  }
  const gl = renderer.gl;
  if (!gl) return null;

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uBreath: { value: 0 },
      uEnergy: { value: 0 },
      uRes: { value: [1, 1] },
      uFocus: { value: [0, 0] },
      uBg: { value: [0, 0, 0] },
      uGlow: { value: [0, 0, 0] },
      uAccent: { value: [0, 0, 0] },
      uForm: { value: 0 },
      uRadius: { value: 0.26 },
      uSquash: { value: 1 },
      uSag: { value: 0 },
      uRise: { value: 0 },
      uSharp: { value: 0.4 },
      uRings: { value: 0 },
      uRays: { value: 0 },
      uOrbit: { value: 0 },
      uHalo: { value: 0 },
      uDissolve: { value: 0 },
      uStars: { value: 0 },
      uBreathDepth: { value: 0.3 },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    program.uniforms.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
  };
  resize();
  window.addEventListener('resize', resize);

  let time = 7.3; // start mid-flow, not at the noise origin
  let failed = false;
  let breathPhase = 0;

  return {
    render(state, dt) {
      if (failed) return;
      if (!reducedMotion) {
        // Calm at night, brisker by day.
        time += dt * (0.35 + state.energy * 0.9);
        breathPhase += dt * Math.PI * 2 * (0.1 + state.energy * 0.12);
      }
      const scale = gl.drawingBufferWidth / window.innerWidth;
      const u = program.uniforms;
      u.uTime.value = time;
      u.uBreath.value = Math.sin(breathPhase);
      u.uEnergy.value = state.energy;
      u.uFocus.value = [state.focus[0] * scale, gl.drawingBufferHeight - state.focus[1] * scale];
      u.uBg.value = state.bg;
      u.uGlow.value = state.glow;
      u.uAccent.value = state.accent;
      const form = state.form;
      u.uForm.value = state.formMix;
      u.uRadius.value = form.radius;
      u.uSquash.value = form.squash;
      u.uSag.value = form.sag;
      u.uRise.value = form.rise;
      u.uSharp.value = form.sharp;
      u.uRings.value = form.rings;
      u.uRays.value = form.rays;
      u.uOrbit.value = form.orbit;
      u.uHalo.value = form.halo;
      u.uDissolve.value = form.dissolve;
      u.uStars.value = form.stars;
      u.uBreathDepth.value = form.breath;
      try {
        renderer.render({ scene: mesh });
      } catch {
        // A shader that fails on this device: fall back to the CSS gradient.
        failed = true;
        canvas.width = 0;
        canvas.height = 0;
      }
    },
    destroy() {
      window.removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
