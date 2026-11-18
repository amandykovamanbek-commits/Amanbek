// Film timeline: lazily built sets, shot list, transitions, overlays.
import { clamp, env } from './core.js';
import { shots as A } from './shots_a.js';
import { shots as B } from './shots_b.js';
import { shots as C } from './shots_c.js';

const SETS = ['city', 'apartment', 'courtyard', 'station', 'street', 'highway', 'house', 'black'];

export async function build({ W, H }) {
  const mods = {};
  for (const k of SETS) { try { mods[k] = await import(`./sets/${k}.js`); } catch (e) { console.warn('set missing', k, e.message); } }
  const sets = {};
  const get = k => (sets[k] ||= mods[k].build(W, H));
  env.get = get;
  const SHOTS = [...A, ...B, ...C].sort((a, b) => a.t0 - b.t0);
  const duration = SHOTS[SHOTS.length - 1].t1;
  env.shot = id => SHOTS.find(s => s.id === id);
  const prep = (shot, t) => {
    const s = get(shot.set), lt = t - shot.t0;
    const r = shot.run(lt, s, t) || {};
    return { scene: r.scene || s.scene, cam: r.cam || s.cam, look: r.look || {}, overlay: r.overlay, comp: r.comp || {} };
  };
  return {
    duration,
    shots: SHOTS,
    render(t, post, ctx) {
      let i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = SHOTS.length - 1;
      let a = SHOTS[i], b = null, mix = 0, mode = 0;
      const nx = SHOTS[i + 1];
      if (nx && nx.trans && t > nx.t0 - nx.trans.dur / 2) { b = nx; mix = (t - (nx.t0 - nx.trans.dur / 2)) / nx.trans.dur; mode = nx.trans.mode || 0; }
      else if (a.trans && i > 0 && t < a.t0 + a.trans.dur / 2) { b = a; a = SHOTS[i - 1]; mix = (t - (b.t0 - b.trans.dur / 2)) / b.trans.dur; mode = b.trans.mode || 0; }
      mix = clamp(mix);
      const RA = prep(a, t);
      post.renderShot(RA.scene, RA.cam, RA.look, post.shotA, t);
      let RB = null;
      if (b) { RB = prep(b, t); post.renderShot(RB.scene, RB.cam, RB.look, post.shotB, t); }
      const ca = RA.comp, cb = RB ? RB.comp : {};
      const m = RB ? mix : 0;
      const lerp = (k, d = 0) => (ca[k] ?? d) * (1 - m) + (RB ? (cb[k] ?? d) * m : 0);
      post.composite({ mix: m, mode, time: t, grain: lerp('grain', 0.045), dust: lerp('dust', 0), fade: Math.max(ca.fade || 0, RB ? cb.fade || 0 : 0), flash: Math.max(ca.flash || 0, RB ? cb.flash || 0 : 0), flashColor: ca.flashColor || cb.flashColor });
      ctx.save(); ctx.globalAlpha = 1 - m; RA.overlay && RA.overlay(ctx); ctx.restore();
      if (RB && RB.overlay) { ctx.save(); ctx.globalAlpha = m; RB.overlay(ctx); ctx.restore(); }
      return `#${a.id}${b ? '>' + b.id : ''}`;
    },
  };
}
