// Live "flow" gradient. Low-frequency, domain-warped simplex noise is mapped onto a four-colour
// palette and finished with film grain. The page drives colours and field settings every frame,
// so presets can morph into one another. A soft veil of the base colour keeps the centre readable.

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uPhase;
uniform float uTime;
uniform float uFreq;
uniform float uWarp;
uniform float uSwirl;
uniform float uGrain;
uniform float uVeil;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

// 2D simplex noise — Ashima Arts / Stefan Gustavson (MIT)
vec3 permute(vec3 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float t = uPhase;
  float r = length(p);
  float ang = uSwirl * sin(t * 0.6) * exp(-r * 0.8);
  vec2 s = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p;
  vec2 q = vec2(snoise(s * 0.42 * uFreq + vec2(0.0, t)), snoise(s * 0.42 * uFreq + vec2(4.1, -0.8 * t)));
  vec2 w = s + uWarp * q;
  float f = 0.72 * snoise(w * 0.55 * uFreq + vec2(0.3 * t, -0.2 * t)) + 0.28 * snoise(w * 1.05 * uFreq - 0.25 * t);
  float x = clamp(0.5 + 0.85 * f, 0.0, 1.0);
  // veil: pull the centre towards the palette's base colour so the logo and tagline stay readable
  vec2 e = p * vec2(0.8, 1.25);
  x *= 1.0 - 0.78 * uVeil * (1.0 - smoothstep(0.1, 0.66, length(e)));
  vec3 c = uC0;
  c = mix(c, uC1, smoothstep(0.08, 0.46, x));
  c = mix(c, uC2, smoothstep(0.38, 0.72, x));
  c = mix(c, uC3, smoothstep(0.66, 0.98, x));
  vec3 col = pow(c, vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy + fract(uTime * 0.37) * 97.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}

/** sRGB hex -> linear RGB triple */
export function linear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.pow(v / 255, 2.2));
}

/**
 * Set up the renderer. Returns null when WebGL is unavailable (the caller keeps its CSS fallback).
 * `render(state, seconds)` draws one frame; state = { colors: [lin x4], freq, warp, swirl, grain, veil, phase }.
 */
export function createGradient(canvas, scale = 0.6) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  } catch {
    return null;
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  ["uRes", "uPhase", "uTime", "uFreq", "uWarp", "uSwirl", "uGrain", "uVeil", "uC0", "uC1", "uC2", "uC3"].forEach(
    (n) => (u[n] = gl.getUniformLocation(prog, n)),
  );

  return function render(st, seconds) {
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uPhase, st.phase);
    gl.uniform1f(u.uTime, seconds);
    gl.uniform1f(u.uFreq, st.freq);
    gl.uniform1f(u.uWarp, st.warp);
    gl.uniform1f(u.uSwirl, st.swirl);
    gl.uniform1f(u.uGrain, st.grain);
    gl.uniform1f(u.uVeil, st.veil);
    st.colors.forEach((c, i) => gl.uniform3fv(u["uC" + i], c));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

/** Map a preset's tool settings to shader parameters. */
export function presetState(p) {
  return {
    colors: p.colors.map(linear),
    freq: 50 / p.scale,
    warp: 0.35 + (p.distortion / 100) * 0.9,
    swirl: (p.swirl / 100) * 3,
    speed: 0.07 * (p.speed / 30),
    grain: (p.noise / 100) * 0.8,
    veil: 1,
  };
}

/** Linear blend between two preset states. */
export function blend(a, b, k) {
  const m = (x, y) => x + (y - x) * k;
  return {
    colors: a.colors.map((c, i) => c.map((v, j) => m(v, b.colors[i][j]))),
    freq: m(a.freq, b.freq),
    warp: m(a.warp, b.warp),
    swirl: m(a.swirl, b.swirl),
    speed: m(a.speed, b.speed),
    grain: m(a.grain, b.grain),
    veil: m(a.veil, b.veil),
  };
}
