import { PRESETS } from "../data/palettes.js";
import { TAGLINES } from "../data/taglines.js";
import { blend, createGradient, presetState } from "./gradient.js";

const root = document.documentElement;
const HOLD = 7; // seconds on each preset
const FADE = 3; // seconds morphing into the next one

function load(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}
function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// ---- language: each language has its own page (/ and /zh/); following the switch remembers the choice
const lang = root.lang.startsWith("zh") ? "zh" : "en";
document.getElementById("lang").addEventListener("click", (e) => {
  save("oi-lang", e.currentTarget.dataset.lang);
});

// ---- tagline: different from the last visit, click for another
const tagline = document.getElementById("tagline");
const last = Number(load("oi-tagline"));
const lines = shuffle(TAGLINES.map((_, i) => i).filter((i) => i !== last));
let at = 0;
function showLine() {
  const i = lines[at % lines.length];
  tagline.textContent = TAGLINES[i][lang];
  save("oi-tagline", String(i));
}
showLine();
tagline.addEventListener("click", () => {
  at += 1;
  tagline.classList.remove("swap");
  void tagline.offsetWidth;
  tagline.classList.add("swap");
  showLine();
});

// ---- live gradient
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const inkFor = (p) => (lum(p.colors[0]) > 0.4 ? "dark" : "light");

const first = Number(root.dataset.preset) || 0; // chosen by the inline head script
const order = [first, ...shuffle(PRESETS.map((_, i) => i).filter((i) => i !== first))];
const states = PRESETS.map(presetState);
const canvas = document.getElementById("bg");
const render = createGradient(canvas);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!render) {
  const c = PRESETS[first].colors;
  document.body.style.background =
    `radial-gradient(60% 70% at 20% 20%, ${c[1]}, transparent), radial-gradient(60% 70% at 85% 80%, ${c[2]}, transparent),` +
    `radial-gradient(50% 60% at 90% 10%, ${c[3]}, transparent), ${c[0]}`;
  canvas.remove();
} else if (reduce) {
  const st = { ...states[first], phase: Math.random() * 50 };
  const draw = () => render(st, 0);
  draw();
  window.addEventListener("resize", draw);
} else {
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const n = order.length;
  let phase = Math.random() * 50;
  // paint the first preset right away so the page never shows an empty canvas
  render({ ...states[first], phase }, 0);
  // time starts at the first animation frame: rAF timestamps can precede performance.now()
  // taken earlier, and a negative time would index a preset that does not exist
  let start = null;
  let prev = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (start === null) {
      start = now;
      prev = now;
    }
    const dt = Math.min(0.05, Math.max(0, (now - prev) / 1000));
    prev = now;
    const t = Math.max(0, (now - start) / 1000);
    const seg = Math.floor(t / (HOLD + FADE));
    const local = t - seg * (HOLD + FADE);
    const a = order[seg % n];
    const b = order[(seg + 1) % n];
    const k = local < HOLD ? 0 : ease((local - HOLD) / FADE);
    const st = blend(states[a], states[b], k);
    phase += dt * st.speed;
    st.phase = phase;
    render(st, t);
    const ink = inkFor(PRESETS[k < 0.5 ? a : b]);
    if (root.dataset.ink !== ink) root.dataset.ink = ink;
  };
  requestAnimationFrame(frame);
}
