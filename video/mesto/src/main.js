// Boot: renderer, post pipeline, overlay canvas, render loop entry (window.renderAt)
import * as THREE from 'three';
import { Post } from './post.js';
import { env } from './core.js';

const P = new URLSearchParams(location.search);
const S = +(P.get('scale') || 1);
const W = Math.round(1920 * S), H = Math.round(804 * S), FW = Math.round(1920 * S), FH = Math.round(1080 * S);
const st = document.getElementById('st'), gl = document.getElementById('gl'), ov = document.getElementById('ov');
st.style.width = FW + 'px'; st.style.height = FH + 'px';
gl.style.top = Math.round((FH - H) / 2) + 'px'; gl.style.width = W + 'px'; gl.style.height = H + 'px';
ov.width = FW; ov.height = FH; ov.style.top = '0px';
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
const post = new Post(renderer, W, H, +(P.get('msaa') ?? 4));
const ctx = ov.getContext('2d');
env.renderer = renderer; env.W = W; env.H = H;

const fams = ['300 20px "Cormorant Garamond"', 'italic 300 20px "Cormorant Garamond"', 'italic 400 20px "Cormorant Garamond"', 'italic 500 20px "Cormorant Garamond"', '400 20px "Cormorant Garamond"',
  '200 20px Inter', '300 20px Inter', '400 20px Inter', '500 20px Inter', '600 20px Inter', '400 20px Neucha', '400 20px Caveat'];
await Promise.all(fams.map(f => document.fonts.load(f, 'АБВ абв Мы ждём 0123 ABC')));
await document.fonts.ready;

const mod = P.get('test') ? await import('./test.js') : await import('./film.js');
const film = await mod.build({ renderer, W, H, S });
window.DURATION = film.duration;
window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, FW, FH);
  ctx.setTransform(S, 0, 0, S, 0, 0);
  if (film.render) return film.render(t, post, ctx);
  const f = film.frame(t);
  post.renderShot(f.a.scene, f.a.cam, f.a.look, post.shotA, t);
  post.composite({ ...(f.comp || {}), time: t });
  if (f.overlay) f.overlay(ctx);
  return f.label || '';
};
window.READY = true;
