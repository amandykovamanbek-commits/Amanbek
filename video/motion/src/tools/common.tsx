// Shared timeline data + scene furniture: backdrop, progress rail, tool intro/header, phases, funnel chip, subtitles.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import lines from './lines.json';
import words from './words.json';
import env from './env.json';
import { buildTools, ACC } from './timeline';
import { W, H, BG, TX, T2, T3, OR, OR2, DISPLAY, TEXT, WIDE, MONO, clamp, lerp, ex, ei, eio, eo, pr, decay, back, popS, rise, rgba, mixHex, Title, Words, Eyebrow, BigNum, Tile, ToolK, LockIcon, TgBadge, Ring, Burst, impulse, glass } from './kit';

export const TL = buildTools(lines as any, words as any);
export const { sc: SC, C, SH, duration: DUR, tok: TOK } = TL;
export const S = (id: string) => SC.find((x) => x.id === id)!;
const ENV = env as number[];
export const envAt = (t: number) => ENV[Math.max(0, Math.min(ENV.length - 1, Math.round(t * 50)))] || 0;
export { ACC };

// ---------- backdrop: near-black, accent glow that follows the scene, fine grid
export const accentAt = (t: number) => {
  const i = Math.max(0, SC.findIndex((x) => t >= x.start && t < x.end));
  const a = ACC[SC[i].id], p = i ? ACC[SC[i - 1].id] : a;
  return mixHex(p, a, eio(pr(t, SC[i].start, 1.2)));
};
export const Backdrop: React.FC<{ t: number }> = ({ t }) => {
  const a = accentAt(t);
  return <AbsoluteFill style={{ background: BG }}>
    <div style={{ position: 'absolute', left: -200 + Math.sin(t * .13) * 140, top: -720, width: W + 400, height: 1100, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(a, .42)}, ${rgba(a, .16)} 45%, transparent 100%)`, filter: 'blur(40px)' }} />
    <div style={{ position: 'absolute', left: 1050 + Math.sin(t * .17) * 160, top: 620, width: 1200, height: 800, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(a, .12)}, transparent)`, filter: 'blur(50px)' }} />
    <div style={{ position: 'absolute', left: -300 + Math.cos(t * .11) * 120, top: 560, width: 1000, height: 700, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(120,90,255,.07), transparent)', filter: 'blur(50px)' }} />
    <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)', backgroundSize: '80px 80px', backgroundPosition: `${(t * 6) % 80}px ${(t * 4) % 80}px`, WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 80%)' }} />
  </AbsoluteFill>;
};

// ---------- phases inside a scene: blur-fade in, blur-fade out
export const Phase: React.FC<{ t: number; a: number; b: number; children: React.ReactNode; dy?: number; din?: number; dout?: number }> = ({ t, a, b, children, dy = 30, din = .8, dout = .55 }) => {
  if (t < a || t > b) return null;
  const ki = ex(pr(t, a, din)), ko = ei(pr(t, b - dout, dout)), bl = (1 - ki) * 12 + ko * 14;
  return <AbsoluteFill style={{ opacity: clamp(ki * 1.4) * (1 - ko), transform: `translateY(${(1 - ki) * dy - ko * dy * .5}px) scale(${lerp(.97, 1, ki) * lerp(1, 1.035, ko)})`, filter: bl > .3 ? `blur(${bl}px)` : undefined }}>{children}</AbsoluteFill>;
};
// slow camera drift + push for a whole scene
export const Cam: React.FC<{ t: number; id: string; children: React.ReactNode; push?: number }> = ({ t, id, children, push = .03 }) => {
  const s = S(id), k = clamp((t - s.start) / Math.max(1, s.end - s.start));
  return <AbsoluteFill style={{ transform: `translate(${Math.sin(t * .31) * 6}px, ${Math.cos(t * .27) * 5}px) scale(${1 + push * eio(k)})` }}>{children}</AbsoluteFill>;
};

// ---------- progress rail: 10 tools + locked 11th
export const TOOLS: { id: string; k: ToolK; name: string; kind: string; role: string }[] = [
  { id: 't1', k: 'el', name: 'ElevenLabs', kind: 'КОННЕКТОР', role: 'озвучка' },
  { id: 't2', k: 'figma', name: 'Figma', kind: 'КОННЕКТОР', role: 'дизайн и обложки' },
  { id: 't3', k: 'canva', name: 'Canva', kind: 'КОННЕКТОР', role: 'посты, сторис, слайды' },
  { id: 't4', k: 'vidiq', name: 'vidIQ', kind: 'КОННЕКТОР', role: 'аналитика YouTube' },
  { id: 't5', k: 'notion', name: 'Notion', kind: 'КОННЕКТОР', role: 'база идей' },
  { id: 't6', k: 'github', name: 'GitHub', kind: 'КОННЕКТОР', role: 'версии проектов' },
  { id: 't7', k: 'brag', name: 'brag-slim', kind: 'СКИЛЛ', role: 'промо-ролик' },
  { id: 't8', k: 'docs', name: 'PDF · Word · PPT', kind: 'СКИЛЛЫ', role: 'готовые файлы' },
  { id: 't9', k: 'skill', name: 'skill-creator', kind: 'СКИЛЛ', role: 'скилл, который делает скиллы' },
  { id: 't10', k: 'research', name: 'deep-research', kind: 'СКИЛЛ', role: 'глубокий поиск' },
];
export const Rail: React.FC<{ t: number }> = ({ t }) => {
  if (t < C.hShow) return null;
  const inK = ex(pr(t, C.hShow - .1, .6));
  const lit = (i: number) => t >= C[`t${i + 1}n`];
  const cur = TOOLS.findIndex((x, i) => lit(i) && (i === 9 || !lit(i + 1)));
  const inEnd = t >= S('en').start;
  const lockShake = Math.max(impulse(t, C.enWont, .6), impulse(t, C.hWill - .05, .5)) * Math.sin(t * 70) * 6;
  const fade = 1 - ei(pr(t, C.enLink - .2, .6)) * .7;
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 34, display: 'flex', justifyContent: 'center', opacity: inK * fade, transform: `translateY(${(1 - inK) * -20}px)` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 999, ...glass(OR, .02), boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 16px 40px rgba(0,0,0,.45)' }}>
      {TOOLS.map((tool, i) => {
        const pop = popS(t, C.hShow + .15 + i * .085, .45), on = lit(i), isCur = i === cur && !inEnd && t < S('top').start, k = ex(pr(t, C[`t${i + 1}n`], .6));
        const wdt = isCur ? lerp(34, 168, k) : 34;
        return <React.Fragment key={i}>
          {i === 6 && <i style={{ width: 1, height: 20, background: 'rgba(255,255,255,.18)', margin: '0 4px' }} />}
          <div style={{ width: wdt, height: 30, borderRadius: 15, transform: `scale(${pop})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', whiteSpace: 'nowrap',
            background: on ? `linear-gradient(180deg, ${OR2}, ${OR})` : 'rgba(255,255,255,.07)', boxShadow: on ? `0 0 ${10 + 24 * decay(t, C[`t${i + 1}n`], 2)}px ${rgba(OR, .7)}` : 'inset 0 0 0 1px rgba(255,255,255,.08)',
            fontFamily: TEXT, fontWeight: 700, fontSize: 14, color: on ? '#1c0f07' : T3 }}>
            {isCur && k > .3 ? <><span style={{ opacity: k }}>{String(i + 1).padStart(2, '0')}</span><span style={{ fontWeight: 600, opacity: k }}>{tool.name.split(' ')[0]}</span></> : String(i + 1)}
          </div>
        </React.Fragment>;
      })}
      {t >= C.hEleven && <div style={{ width: 46, height: 30, borderRadius: 15, marginLeft: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateX(${lockShake}px) scale(${popS(t, C.hEleven, .5)})`,
        background: 'linear-gradient(180deg, rgba(255,77,77,.25), rgba(255,77,77,.08))', boxShadow: `inset 0 0 0 1.5px rgba(255,110,90,.75), 0 0 ${14 + 20 * Math.abs(Math.sin(t * 2))}px rgba(255,90,70,.45)` }}>
        <LockIcon s={18} c="#ffd7cf" open={t < C.hWill - .05 ? 1 : 0} /><span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 13, color: '#ffd7cf', marginLeft: 4 }}>11</span>
      </div>}
    </div>
  </div>;
};

// ---------- tool intro -> header morph
export const ToolHead: React.FC<{ t: number; i: number; until?: number }> = ({ t, i, until }) => {
  const tool = TOOLS[i], id = tool.id, s = S(id), nameAt = C[`${id}n`];
  const morph = until ?? nameAt + 1.55;
  const m = eio(pr(t, morph, .85));
  const num = String(i + 1).padStart(2, '0'), prev = String(i).padStart(2, '0');
  // intro layout (centred) vs header layout (top-left), as one transformed group
  const fit = Math.min(1, 1600 / (480 + 70 + 174 + tool.name.length * 86));
  const x = lerp(230, 64, m), y = lerp(320 + (1 - fit) * 120, 92, m), sc = lerp(fit, .28, m);
  const tileK = back(pr(t, nameAt - .05, .7));
  const acc = ACC[id] === '#e8e6e3' ? '#bdb8b0' : ACC[id];
  return <>
    <div style={{ position: 'absolute', zIndex: 5, left: x, top: y, width: 'max-content', transform: `scale(${sc})`, transformOrigin: '0 0', display: 'flex', alignItems: 'center', gap: 70, whiteSpace: 'nowrap' }}>
      <BigNum t={t} at={s.start + .4} value={num} from={prev} size={300} sweep={nameAt + .2} chroma={[nameAt]} grad={['#fff3e8', acc]} glow={ACC[id]} />
      <div>
        <Eyebrow t={t} at={s.start + .5} text={`${tool.kind} · ${num} / 10`} color={ACC[id] === '#e8e6e3' ? OR2 : ACC[id]} size={24} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 34, marginTop: 20 }}>
          <div style={{ position: 'relative', transform: `perspective(800px) rotateY(${(1 - tileK) * 80}deg) scale(${tileK})`, opacity: clamp(tileK * 2) }}>
            <Tile k={tool.k} s={140} glow={1} />
            <Ring t={t} at={nameAt} x={70} y={70} r={130} color={ACC[id]} />
            <Burst t={t} at={nameAt + .05} x={150} y={-6} r={90} color="#fff" />
          </div>
          <Title t={t} at={nameAt - .1} text={tool.name} size={150} weight={800} grad={['#ffffff', '#c9c9cf']} glow={ACC[id]} glowO={.5} sweep={nameAt + .5} chroma={[nameAt + .02]} style={{ whiteSpace: 'nowrap' }} />
        </div>
        <Words t={t} at={nameAt + .35} text={tool.role} size={44} weight={500} color={T2} style={{ marginTop: 16 }} />
      </div>
    </div>
  </>;
};
// the funnel reminder shown in every showcase
export const Funnel: React.FC<{ t: number; id: string; text?: string }> = ({ t, id, text = 'Как подключить — в шпаргалке' }) => {
  const [a, b] = SH[id]; if (t < a + .4 || t > b) return null;
  const k = back(pr(t, a + .5, .7)), o = ei(pr(t, b - .5, .45));
  return <div style={{ position: 'absolute', right: 70, bottom: 64, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px 12px 12px', borderRadius: 999, ...glass('#3aa7e8'), transform: `scale(${k * (1 - .1 * o)})`, opacity: clamp(k * 2) * (1 - o), transformOrigin: '100% 50%', boxShadow: `inset 0 1px 0 rgba(255,255,255,.1), 0 20px 50px rgba(0,0,0,.5), 0 0 ${24 + 16 * Math.sin(t * 3)}px rgba(58,167,232,.35)` }}>
    <TgBadge s={44} />
    <div style={{ fontFamily: TEXT }}><div style={{ fontSize: 19, fontWeight: 600, color: TX }}>{text}</div><div style={{ fontSize: 15, color: T2, marginTop: 1 }}>Telegram · ссылка в описании</div></div>
    <div style={{ marginLeft: 6, width: 34, height: 34, borderRadius: 17, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LockIcon s={18} c="#ffd7cf" /></div>
  </div>;
};
// showcase caption (big, left)
export const ShowTitle: React.FC<{ t: number; id: string; text: string; sub?: string; x?: number; y?: number; size?: number }> = ({ t, id, text, sub, x = 120, y = 820, size = 64 }) => {
  const [a, b] = SH[id]; if (t < a) return null;
  return <div style={{ position: 'absolute', left: x, top: y }}>
    <Title t={t} at={a + .15} text={text} size={size} weight={800} grad={['#ffffff', '#cfcfd4']} glow={ACC[id]} glowO={.35} out={b - .55} sweep={a + 1.2} />
    {sub && <Words t={t} at={a + .5} text={sub} size={28} color={T2} out={b - .55} style={{ marginTop: 12 }} />}
  </div>;
};

// ---------- subtitles
const CH = (() => {
  const out: any[] = []; let cur: any[] = []; const fl = () => { if (cur.length) out.push(cur); cur = []; };
  TOK.forEach((t: any, i: number) => { if (!t.d) return; if (cur.length && TOK[i - 1] && TOK[i - 1].si !== t.si) fl(); cur.push(t); if (/[.!?…:]$/.test(t.d) || (cur.length >= 6 && /[,—]$/.test(t.d)) || cur.length >= 8) fl(); }); fl();
  out.forEach((c, i) => { c.s = c[0].s - .1; c.e = i < out.length - 1 ? Math.min(out[i + 1][0].s - .1, c.at(-1).e + .7) : c.at(-1).e + .7; });
  return out;
})();
export const Subs: React.FC<{ t: number }> = ({ t }) => {
  const ch = CH.find((c) => t >= c.s && t < c.e); if (!ch) return null;
  const k = ex(pr(t, ch.s, .35)), ko = ei(pr(t, ch.e - .18, .18));
  return <div style={{ position: 'absolute', left: 160, right: 160, bottom: 40, textAlign: 'center', opacity: k * (1 - ko), transform: `translateY(${(1 - k) * 12}px)`, filter: k < .97 ? `blur(${(1 - k) * 6}px)` : undefined }}>
    <span style={{ display: 'inline-block', padding: '10px 26px', borderRadius: 18, background: 'rgba(8,8,10,.62)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.07), 0 10px 30px rgba(0,0,0,.35)', fontFamily: TEXT, fontWeight: 600, fontSize: 36, lineHeight: 1.3, letterSpacing: '-.01em', color: TX }}>
      {ch.map((w: any, i: number) => { const on = t >= w.s - .03 && (i === ch.length - 1 || t < ch[i + 1].s - .03), seen = t >= w.s - .03, kk = ex(pr(t, w.s - .06, .25));
        return <span key={i} style={{ display: 'inline-block', marginRight: 10, color: on ? OR2 : seen ? TX : 'rgba(245,245,247,.42)', transform: `translateY(${(1 - kk) * 5}px)`, textShadow: on ? `0 0 18px ${rgba(OR, .55)}` : 'none' }}>{w.d}</span>; })}
    </span>
  </div>;
};
// showcase caption as a right-hand column
export const ShowSide: React.FC<{ t: number; id: string; title: string; sub?: string; x?: number; y?: number; w?: number; size?: number; eyebrow?: string }> = ({ t, id, title, sub, x = 1300, y = 330, w = 540, size = 76, eyebrow = 'РЕЗУЛЬТАТ' }) => {
  const [a, b] = SH[id]; if (t < a) return null;
  return <div style={{ position: 'absolute', left: x, top: y, width: w }}>
    <Eyebrow t={t} at={a + .05} text={eyebrow} color={ACC[id] === '#e8e6e3' ? OR2 : ACC[id]} size={22} />
    <Title t={t} at={a + .15} text={title} size={size} weight={800} grad={['#ffffff', '#cfcfd4']} glow={ACC[id]} glowO={.35} out={b - .55} sweep={a + 1.3} lh={1.02} style={{ marginTop: 18 }} />
    {sub && <Words t={t} at={a + .55} text={sub} size={30} color={T2} out={b - .55} style={{ marginTop: 18 }} />}
  </div>;
};
