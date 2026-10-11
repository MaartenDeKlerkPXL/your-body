import { Mesh, Program, Renderer, Triangle } from 'ogl';
import type { RGB } from '../lib/palette';

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
    float body = smoothstep(radius + 0.45, 0.0, d + n * 0.22);
    col = mix(col, uGlow, body * 0.9);

    float halo = smoothstep(0.18, 0.0, abs(d - radius * 0.62 + n * 0.06));
    col = mix(col, uAccent, halo * (0.12 + 0.1 * uEnergy));

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
  let breathPhase = 0;

  return {
    render(state, dt) {
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
      renderer.render({ scene: mesh });
    },
    destroy() {
      window.removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
