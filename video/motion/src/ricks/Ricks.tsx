import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BG, OR, OR2, CL, TX, MU, PANEL, BORD, SANS, SERIF, MONO, clamp, lerp, eo, ex, ei, eio, back, pr, decay, noise, kf, Words, Spark, Cursor, curPos, FileGlyph } from '../v3/V3';
import { buildRicks, FPS, HOLDS } from './timeline';
import lines from './lines.json';
import words from './words.json';
import meta from './meta.json';

export const RK = buildRicks(lines as any, words as any, (meta as any).lead || 0);
const { sc: SC, C, duration: DUR, tok: TOK } = RK;
const S = (id: string) => SC.find((x) => x.id === id);
const M = meta as any;
type Pt = [number, number];
const W = 1920, H = 1080;
const toks = (id: string, from = 0, to = 999) => S(id).tokens.slice(from, to).map((t) => ({ ...t, w: t.d })).filter((t) => t.w);

// ---------- backgrounds (landscape)
const Glow: React.FC<{ t: number; o?: number; bottom?: boolean }> = ({ t, o = 1, bottom }) => (
  <div style={{ position: 'absolute', left: -300, width: W + 600, height: 1100, borderRadius: '50%', top: bottom ? 820 : -820, background: 'radial-gradient(closest-side, #ff8a3d 0%, #d4561b 40%, rgba(120,35,8,.45) 70%, transparent 100%)', filter: 'blur(50px)', opacity: o * (.85 + .15 * Math.sin(t * .8)) }} />
);
const Grain: React.FC<{ f: number }> = ({ f }) => <Img src={staticFile(`cine/grain/g${f % 6}.png`)} style={{ position: 'absolute', inset: 0, width: W, height: H, opacity: .11, mixBlendMode: 'overlay', objectFit: 'cover' }} />;
const Vig: React.FC = () => <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 55%, rgba(0,0,0,.85) 100%)', pointerEvents: 'none' }} />;
const Dots: React.FC<{ t: number }> = ({ t }) => <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 2px, transparent 2.5px)', backgroundSize: '44px 44px', backgroundPosition: `${t * 6}px ${t * 10}px` }} />;

// scene wrapper: blur-dip in/out
const Scene: React.FC<{ t: number; id: string; children: React.ReactNode }> = ({ t, id, children }) => {
  const s = S(id), ki = s.start === 0 ? pr(t, 0, .6) : pr(t, s.start, .4), ko = pr(t, s.end - .3, .3);
  const blur = (1 - ex(ki)) * 26 + ei(ko) * 30;
  return <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
    <AbsoluteFill style={{ filter: blur > .3 ? `blur(${blur}px)` : 'none', transform: `scale(${lerp(1.08, 1, ex(ki)) * lerp(1, 1.06, ei(ko))})`, opacity: Math.min(clamp(ki * 2.5), 1 - ei(ko) * .6) }}>{children}</AbsoluteFill>
  </AbsoluteFill>;
};
const pop = (t: number, at: number, d = .45) => (t < at ? 0 : back(pr(t, at, d)));
const fadeUp = (t: number, at: number, d = .5): React.CSSProperties => { const k = ex(pr(t, at, d)); return { opacity: k, transform: `translateY(${(1 - k) * 30}px)`, filter: k < .98 ? `blur(${(1 - k) * 12}px)` : 'none' }; };
const Title: React.FC<{ t: number; at: number; children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ t, at, children, size = 76, style }) => (
  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: -size * .035, lineHeight: 1.05, color: TX, ...fadeUp(t, at), ...style }}>{children}</div>
);
const Chip: React.FC<{ t: number; at: number; x: number; y: number; children: React.ReactNode; color?: string; rot?: number }> = ({ t, at, x, y, children, color = OR, rot = 0 }) => {
  const k = pop(t, at); if (!k) return null;
  return <div style={{ position: 'absolute', left: x, top: y, padding: '12px 26px', borderRadius: 40, background: 'rgba(22,19,17,.92)', border: `2.5px solid ${color}`, fontFamily: SANS, fontWeight: 500, fontSize: 32, color: TX, whiteSpace: 'nowrap', boxShadow: `0 0 ${24 + 30 * decay(t, at, 3)}px ${color}66`, transform: `scale(${k}) rotate(${rot}deg)`, transformOrigin: 'center' }}>{children}</div>;
};
// vertical phone frame playing a clip
const Phone: React.FC<{ src: string; from?: number; w?: number; muted?: boolean; volume?: number; startAt?: number; style?: React.CSSProperties; label?: string; img?: string }> = ({ src, from = 0, w = 340, muted = true, volume = 0, startAt = 0, style, label, img }) => (
  <div style={{ position: 'absolute', width: w, height: w * 16 / 9, borderRadius: w * .09, overflow: 'hidden', border: '4px solid #2c2724', background: '#000', boxShadow: '0 40px 90px rgba(0,0,0,.7)', ...style }}>
    {img ? <Img src={staticFile(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <Sequence from={Math.round(startAt * FPS)} layout="none"><OffthreadVideo src={staticFile(src)} startFrom={Math.round(from * FPS)} muted={muted} volume={volume} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Sequence>}
    {label && <div style={{ position: 'absolute', left: 14, top: 14, padding: '6px 14px', borderRadius: 12, background: 'rgba(0,0,0,.6)', fontFamily: SANS, fontWeight: 500, fontSize: 20, color: '#fff' }}>{label}</div>}
  </div>
);
const Win: React.FC<{ x: number; y: number; w: number; h: number; title?: string; children?: React.ReactNode; style?: React.CSSProperties; bar?: React.ReactNode }> = ({ x, y, w, h, title, children, style, bar }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 26, background: PANEL, border: `2px solid ${BORD}`, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.65)', ...style }}>
    <div style={{ height: 58, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', borderBottom: `2px solid ${BORD}`, background: '#171513' }}>
      {['#e8705f', '#e9b94f', '#7cc27a'].map((c) => <i key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
      {bar || <span style={{ marginLeft: 16, fontFamily: SANS, fontSize: 22, color: MU }}>{title}</span>}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 58, bottom: 0 }}>{children}</div>
  </div>
);
const TgIcon: React.FC<{ s?: number; c?: string }> = ({ s = 40, c = '#fff' }) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M21.5 3.5L2.8 10.7c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.7.1 1.9-.7l3.1-15.6c.2-1-.8-1.7-1.9-1.3zM9.4 14.6l9-7.7-7.2 9.2-.4 3.1-1.4-4.6z" fill={c} /></svg>;
const ClaudeMark: React.FC<{ t: number; size?: number }> = ({ t, size = 70 }) => <div style={{ display: 'flex', alignItems: 'center', gap: size * .3 }}><div style={{ transform: `rotate(${t * 15}deg)` }}><Spark size={size} t={t} breathe={1} /></div><span style={{ fontFamily: SERIF, fontSize: size * 1.05, color: TX, letterSpacing: -1 }}>Claude</span></div>;
const THUMBS = ['r1_0', 'r2_1', 'r1_2', 'r2_3', 'r1_4', 'r2_5', 'r2_0', 'r1_3'].map((n) => `ricks/thumbs/${n}.jpg`);

// ---------- scenes
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const s = S('h'), lt = t - s.start, away = ex(pr(t, C.hShow - .3, .7));
  const ph = [[C.hShips, 'Пиратские ядра', 'ricks/rick1.mp4', 2], [C.hJars, 'Древние кувшины', 'ricks/rick2.mp4', 1], [C.hInv, 'Изобретения прошлого', 'ricks/rick1.mp4', 40]] as const;
  return <Scene t={t} id="h">
    <Glow t={t} /><Dots t={t} />
    <AbsoluteFill style={{ perspective: 1600 }}>
      {ph.map(([at, lab, src, from], i) => { const k = ex(pr(t, i === 0 ? .3 : at - .4, .7)), x = 360 + i * 600 - 170, rot = (i - 1) * 14;
        return <div key={i} style={{ position: 'absolute', left: x, top: 150, width: 330, height: 587, transform: `translateX(${-away * 1400}px) translateY(${(1 - k) * 700}px) rotateY(${rot + Math.sin(t * .6 + i) * 3}deg) scale(${lerp(.8, 1, k)})`, opacity: clamp(k * 2) * (1 - away) }}>
          <Phone src={src} from={from} w={330} />
          {t >= at && <div style={{ position: 'absolute', left: -20, right: -20, top: 610, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 34, color: TX, ...fadeUp(t, at, .4) }}>{lab}</div>}
        </div>; })}
    </AbsoluteFill>
    {t >= C.hMil && t < C.hShow && <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 60, letterSpacing: -2, color: OR2, textShadow: '0 0 40px rgba(238,122,63,.5)', ...fadeUp(t, C.hMil, .4), opacity: 1 - pr(t, C.hShow - .4, .3) }}>МИЛЛИОНЫ ПРОСМОТРОВ</div>}
    {t >= C.hShow && <div style={{ position: 'absolute', left: 140, top: 250 }}>
      <Title t={t} at={C.hShow} size={110}>Делай такие же —</Title>
      <Title t={t} at={C.hNever} size={110} style={{ color: OR2 }}>без монтажа.</Title>
      {t >= C.hClaude && <div style={{ marginTop: 50, ...fadeUp(t, C.hClaude, .5) }}><ClaudeMark t={t} size={90} /></div>}
    </div>}
    {t >= C.hTease - .2 && <div style={{ position: 'absolute', left: 1330, top: 170, width: 360, height: 640, ...fadeUp(t, C.hTease - .2, .6) }}>
      <div style={{ filter: 'blur(14px)', opacity: .8 }}><Phone src="" img="ricks/thumbs/res_1.jpg" w={360} /></div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ padding: '16px 30px', borderRadius: 40, background: OR, color: '#1a0f09', fontFamily: SANS, fontWeight: 700, fontSize: 36 }}>в конце →</div></div>
    </div>}
  </Scene>;
};

const Channel: React.FC<{ t: number }> = ({ t }) => {
  const s = S('ch'), lt = t - s.start;
  const ph2 = t >= C.chMen - .3, ph3 = t >= C.chHow - .2, ph4 = t >= C.chBefore - .2;
  return <Scene t={t} id="ch">
    <Glow t={t} o={.7} /><Dots t={t} />
    {/* channel page */}
    {!ph2 && <Win x={160} y={90} w={1600} h={800} bar={<div style={{ marginLeft: 20, flex: 1, height: 34, borderRadius: 17, background: '#24201d', fontFamily: SANS, fontSize: 20, color: MU, display: 'flex', alignItems: 'center', padding: '0 20px' }}>youtube.com/@ricksclips</div>} style={fadeUp(t, s.start + .1)}>
      <div style={{ position: 'absolute', left: 50, top: 36, display: 'flex', alignItems: 'center', gap: 30 }}>
        <div style={{ width: 150, height: 150, borderRadius: 75, overflow: 'hidden', border: `4px solid ${OR}` }}><Img src={staticFile('ricks/thumbs/r1_2.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%' }} /></div>
        <div><div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, color: TX, ...fadeUp(t, C.chName, .4) }}>Rick's Clips</div>
          <div style={{ fontFamily: SANS, fontSize: 28, color: MU, marginTop: 6, ...fadeUp(t, C.chFact, .4) }}>реальные факты из истории — как мультик</div></div>
      </div>
      <div style={{ position: 'absolute', left: 50, right: 50, top: 230, display: 'flex', gap: 22 }}>
        {THUMBS.slice(0, 7).map((src, i) => { const k = pop(t, s.start + .5 + i * .12); return <div key={i} style={{ flex: 1, height: 360, borderRadius: 18, overflow: 'hidden', transform: `scale(${k})`, boxShadow: '0 20px 40px rgba(0,0,0,.5)' }}><Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>; })}
      </div>
    </Win>}
    {/* anatomy of a clip */}
    {ph2 && !ph3 && <>
      <div style={{ position: 'absolute', left: 790, top: 70, ...fadeUp(t, C.chMen - .3) }}><Phone src="ricks/rick2.mp4" from={8} w={340} startAt={C.chMen - .3} /></div>
      <Chip t={t} at={C.chMen} x={330} y={180}>🙂 смешные человечки</Chip>
      <Chip t={t} at={C.chWorld} x={1200} y={230}>🏰 яркие 3D-миры</Chip>
      <Chip t={t} at={C.chVoice} x={300} y={560}>🎙 голос за кадром</Chip>
      <Chip t={t} at={C.chSubs} x={1200} y={610}>💬 субтитры по слову</Chip>
    </>}
    {/* structure timeline */}
    {ph3 && !ph4 && <div style={{ position: 'absolute', left: 160, right: 160, top: 160 }}>
      <Title t={t} at={C.chHow - .2} size={70}>Как устроен каждый ролик</Title>
      <div style={{ position: 'relative', marginTop: 70, height: 240 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 100, height: 12, borderRadius: 6, background: '#2a2522' }}><div style={{ width: `${100 * eio(pr(t, C.chHook, C.chWatch - C.chHook))}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${OR}, #ffcf7a)`, boxShadow: '0 0 20px rgba(238,122,63,.7)' }} /></div>
        {Array.from({ length: 14 }, (_, i) => t >= C.chCuts + i * .08 && <div key={i} style={{ position: 'absolute', left: `${10 + i * 6}%`, top: 82, width: 4, height: 48, borderRadius: 2, background: '#ffcf7a', opacity: .8 }} />)}
        <Chip t={t} at={C.chHook} x={-20} y={0}>0:01 · ХУК</Chip>
        <Chip t={t} at={C.chCuts} x={560} y={160}>смена сцен каждые 2–3 с</Chip>
        <Chip t={t} at={C.chTwist} x={1280} y={0} color="#ffcf7a">ПОВОРОТ</Chip>
      </div>
      {t >= C.chWatch && <div style={{ marginTop: 60, fontFamily: SANS, fontWeight: 600, fontSize: 52, color: OR2, ...fadeUp(t, C.chWatch) }}>→ досматривают до конца</div>}
    </div>}
    {/* before / now */}
    {ph4 && <div style={{ position: 'absolute', left: 160, right: 160, top: 190, display: 'flex', gap: 60 }}>
      {[['РАНЬШЕ', 'дни работы', 'художник + монтажёр', C.chBefore, '#5a524b'], ['СЕЙЧАС', 'несколько минут', 'ты + Claude', C.chNow, OR]].map(([a, b, c, at, col], i) => (
        <div key={i} style={{ flex: 1, height: 520, borderRadius: 34, background: i ? 'linear-gradient(160deg, #2b1a10, #160f0b)' : '#161311', border: `3px solid ${col}`, padding: 50, boxSizing: 'border-box', boxShadow: i ? '0 0 80px rgba(238,122,63,.35)' : 'none', ...fadeUp(t, at as number) }}>
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: col as string }}>{a}</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 96, color: TX, marginTop: 30, letterSpacing: -3 }}>{b}</div>
          <div style={{ fontFamily: SANS, fontSize: 38, color: MU, marginTop: 20 }}>{c}</div>
          {i === 1 && <div style={{ marginTop: 50 }}><ClaudeMark t={t} size={60} /></div>}
        </div>))}
    </div>}
  </Scene>;
};

const Need: React.FC<{ t: number }> = ({ t }) => {
  const s = S('nd');
  const cards: [number, string, string, React.ReactNode][] = [
    [C.nd1, '01', 'Claude', <div style={{ transform: `rotate(${t * 20}deg)` }}><Spark size={150} t={t} breathe={1} /></div>],
    [C.nd2, '02', 'Материалы из TG', <div style={{ width: 150, height: 150, borderRadius: 75, background: '#2aa3dd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TgIcon s={90} /></div>],
    [C.nd3, '03', 'Ролик-референс', <div style={{ width: 96, height: 170, borderRadius: 14, overflow: 'hidden' }}><Img src={staticFile('ricks/thumbs/r2_1.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>],
  ];
  return <Scene t={t} id="nd">
    <Glow t={t} o={.8} /><Dots t={t} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center' }}><Title t={t} at={s.start + .1} size={72}>Понадобится всего три вещи</Title></div>
    <div style={{ position: 'absolute', left: 170, right: 170, top: 240, display: 'flex', gap: 50 }}>
      {cards.map(([at, n, name, icon], i) => { const k = pop(t, at - .1, .55);
        return <div key={i} style={{ flex: 1, height: 420, borderRadius: 34, background: '#161311', border: `2.5px solid ${BORD}`, borderTop: `5px solid ${OR}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34, transform: `scale(${k})`, opacity: clamp(k * 2) }}>
          <div style={{ height: 180, display: 'flex', alignItems: 'center' }}>{icon}</div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: OR }}>{n}</div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: TX }}>{name}</div></div>; })}
    </div>
    <Chip t={t} at={C.ndNo} x={520} y={720} color="#6d6359">✕ After Effects</Chip>
    <Chip t={t} at={C.ndNo + .5} x={900} y={720} color="#6d6359">✕ опыт в анимации</Chip>
    {t >= C.ndSteps && <div style={{ position: 'absolute', left: 1450, top: 716, fontFamily: SANS, fontWeight: 700, fontSize: 44, color: OR2, ...fadeUp(t, C.ndSteps, .4) }}>поехали →</div>}
  </Scene>;
};

const StepTag: React.FC<{ t: number; n: number; at: number; title: string }> = ({ t, n, at, title }) => (
  <div style={{ position: 'absolute', left: 90, top: 60, display: 'flex', alignItems: 'center', gap: 22, ...fadeUp(t, at, .5) }}>
    <div style={{ padding: '8px 18px', borderRadius: 12, background: OR, color: '#170e09', fontFamily: MONO, fontWeight: 800, fontSize: 28 }}>ШАГ {n}/5</div>
    <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: TX }}>{title}</div>
  </div>
);

const Step1: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s1'), url = 'claude.ai', typed = url.slice(0, Math.round(url.length * pr(t, C.s1Site + .1, .8)));
  const dl = pr(t, C.s1Dl + .1, 1.2), inst = ex(pr(t, C.s1Inst, .6)), app = t >= C.s1Reg - .2, codeSel = t >= C.s1Code;
  const cur = curPos(t, [[s.start, 1700, 900], [C.s1Dl - .4, 960, 640], [C.s1Dl + .3, 960, 640], [C.s1Reg, 1200, 800], [C.s1Code - .4, 1160, 260], [C.s1Code + .4, 1160, 260], [s.end, 1300, 700]]);
  return <Scene t={t} id="s1">
    <Glow t={t} o={.6} /><Dots t={t} />
    <StepTag t={t} n={1} at={s.start + .1} title="Скачай Claude" />
    {!app && <Win x={260} y={160} w={1400} h={760} bar={<div style={{ marginLeft: 20, flex: 1, height: 36, borderRadius: 18, background: '#24201d', fontFamily: SANS, fontSize: 24, color: TX, display: 'flex', alignItems: 'center', padding: '0 20px' }}>{typed}<span style={{ opacity: t < C.s1Dl && Math.sin(t * 14) > 0 ? 1 : 0, color: OR }}>|</span></div>} style={fadeUp(t, s.start + .1)}>
      {t >= C.s1Site + .8 && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, #3a1c0e, #141110 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 50, ...fadeUp(t, C.s1Site + .8, .4) }}>
        <ClaudeMark t={t} size={110} />
        <div style={{ padding: '24px 60px', borderRadius: 20, background: OR, color: '#170e09', fontFamily: SANS, fontWeight: 700, fontSize: 40, transform: `scale(${1 - .08 * Math.sin(Math.PI * clamp((t - C.s1Dl) / .2))})`, boxShadow: `0 0 ${30 + 50 * decay(t, C.s1Dl, 3)}px rgba(238,122,63,.6)` }}>Скачать</div>
        {t >= C.s1Dl + .1 && <div style={{ width: 520, padding: '18px 26px', borderRadius: 18, background: '#211d1a', border: `2px solid ${BORD}`, fontFamily: SANS, fontSize: 26, color: TX }}>Claude — установка<div style={{ marginTop: 12, height: 10, borderRadius: 5, background: '#2d2824' }}><div style={{ width: `${eio(dl) * 100}%`, height: '100%', borderRadius: 5, background: OR }} /></div></div>}
        {t >= C.s1Web && <div style={{ position: 'absolute', right: 40, top: 30, fontFamily: SANS, fontSize: 28, color: MU, ...fadeUp(t, C.s1Web, .4) }}>или прямо в браузере ✓</div>}
      </div>}
    </Win>}
    {/* dock with the installed app */}
    {t >= C.s1Inst && !app && <div style={{ position: 'absolute', left: 960 - 260, top: 950, width: 520, height: 110, borderRadius: 30, background: 'rgba(40,36,33,.8)', border: `2px solid ${BORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, transform: `translateY(${(1 - inst) * 160}px)` }}>
      {['#3a8ee6', '#e23d64', 'cl', '#30d158', '#a1a1a6'].map((c, i) => <div key={i} style={{ width: 78, height: 78, borderRadius: 20, background: c === 'cl' ? 'linear-gradient(160deg,#e58a6a,#c9603e)' : c, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: c === 'cl' ? `translateY(${-30 * Math.abs(Math.sin(Math.min(t - C.s1Inst, 1.2) * 8)) * (1 - pr(t, C.s1Inst, 1.2))}px)` : 'none' }}>{c === 'cl' && <Spark size={52} color="#fff4ec" stroke={15} />}</div>)}
    </div>}
    {/* app: login + code tab */}
    {app && <Win x={260} y={160} w={1400} h={760} title="Claude" style={fadeUp(t, C.s1Reg - .2)}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {['Чат', 'Код'].map((n, i) => <div key={n} style={{ padding: '12px 36px', borderRadius: 16, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: i && codeSel ? '#170e09' : TX, background: i && codeSel ? OR : '#24201d', boxShadow: i && codeSel ? `0 0 ${20 + 40 * decay(t, C.s1Code, 3)}px rgba(238,122,63,.7)` : 'none' }}>{i ? '</> ' : ''}{n}</div>)}
      </div>
      {!codeSel ? <div style={{ position: 'absolute', left: 400, right: 400, top: 200, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
        <ClaudeMark t={t} size={80} />
        <div style={{ width: '100%', padding: '22px 28px', borderRadius: 18, border: `2px solid ${BORD}`, background: '#141210', fontFamily: SANS, fontSize: 30, color: TX }}>{'name@mail.com'.slice(0, Math.round(13 * pr(t, C.s1Reg + .2, .8)))}<span style={{ color: OR }}>|</span></div>
        <div style={{ width: '100%', padding: '22px 0', borderRadius: 18, background: '#efe9e2', textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#1a1512' }}>Продолжить с почтой</div>
      </div> : <div style={{ position: 'absolute', left: 120, right: 120, top: 170, fontFamily: MONO, fontSize: 28, lineHeight: 1.7, color: '#cfc8bf' }}>
        {['> claude', '✳ Claude Code готов к работе', '  Пиши задачу — я напишу код и соберу видео'].map((l, i) => <div key={i} style={{ ...fadeUp(t, C.s1Code + .2 + i * .25, .3), color: i === 1 ? OR2 : undefined }}>{l}</div>)}
      </div>}
      {t >= C.s1Pro && <div style={{ position: 'absolute', right: 50, bottom: 50, padding: '16px 30px', borderRadius: 18, border: `3px solid ${OR}`, fontFamily: SANS, fontWeight: 700, fontSize: 36, color: OR2, transform: `scale(${pop(t, C.s1Pro)}) rotate(-4deg)` }}>нужна подписка Pro</div>}
    </Win>}
    <Cursor t={t} x={cur[0]} y={cur[1]} hand={(t > C.s1Dl - .3 && t < C.s1Dl + .3) || (t > C.s1Code - .3 && t < C.s1Code + .3)} clicks={[C.s1Dl, C.s1Code]} o={clamp((t - s.start) / .3)} />
  </Scene>;
};

const Step2: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s2'), cmp = t >= C.s2Without - .2 && t < C.s2Week - .2, cta = t >= C.s2Link - .2;
  const dl = (i: number) => pr(t, C.s2Pin + .8 + i * .3, 1.1);
  const cur = curPos(t, [[s.start, 1600, 900], [C.s2Tg - .3, 1100, 420], [C.s2Pin + .4, 1100, 520], [C.s2Pin + .8, 1100, 600], [s.end, 1500, 800]]);
  return <Scene t={t} id="s2">
    <Glow t={t} o={.8} /><Dots t={t} />
    <StepTag t={t} n={2} at={s.start + .1} title="Материалы в моём Telegram" />
    {!cmp && !cta && t < C.s2Week - .2 && <Win x={360} y={150} w={1200} h={780} title="Telegram" style={fadeUp(t, s.start + .2)}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 150, background: '#1b1917', display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px', borderBottom: `2px solid ${BORD}` }}>
        <Img src={staticFile('avatar.jpg')} style={{ width: 100, height: 100, borderRadius: 50, objectFit: 'cover', boxShadow: `0 0 0 4px ${OR}` }} />
        <div><div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: TX }}>@claudecode09</div><div style={{ fontFamily: SANS, fontSize: 26, color: MU }}>видео в Claude · промпты · разборы</div></div>
        <div style={{ marginLeft: 'auto', padding: '14px 30px', borderRadius: 16, background: '#2aa3dd', fontFamily: SANS, fontWeight: 600, fontSize: 28, color: '#fff' }}>Подписаться</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, height: 64, display: 'flex', alignItems: 'center', gap: 16, padding: '0 40px', background: t >= C.s2Pin ? `rgba(238,122,63,${.12 + .2 * decay(t, C.s2Pin, 2)})` : '#181614', fontFamily: SANS, fontSize: 26, color: TX }}>📌 <b style={{ color: OR2 }}>Закреплено:</b> промпты и материалы — видео как у Rick's Clips</div>
      {t >= C.s2Pin && <div style={{ position: 'absolute', left: 60, right: 260, top: 250, padding: 30, borderRadius: 24, background: '#24201d', ...fadeUp(t, C.s2Pin, .5) }}>
        <div style={{ fontFamily: SANS, fontSize: 30, color: TX, lineHeight: 1.4 }}>Всё для роликов в стиле Rick's Clips. Скачай файлы и закинь в Claude 👇</div>
        {[['doc', 'промпты.txt'], ['img', 'материалы.zip']].map(([k, n], i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 22, padding: '16px 20px', borderRadius: 18, background: '#181614' }}>
          <FileGlyph k={k} s={1.4} /><div style={{ flex: 1 }}><div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: TX }}>{n}</div>
            <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: '#2d2824' }}><div style={{ width: `${eio(dl(i)) * 100}%`, height: '100%', borderRadius: 4, background: dl(i) >= 1 ? '#7cc27a' : OR }} /></div></div>
          <span style={{ fontFamily: SANS, fontSize: 30, color: dl(i) >= 1 ? '#7cc27a' : MU }}>{dl(i) >= 1 ? '✓' : '↓'}</span></div>)}
      </div>}
    </Win>}
    {cmp && <div style={{ position: 'absolute', left: 160, right: 160, top: 200, display: 'flex', gap: 60 }}>
      {[['БЕЗ МАТЕРИАЛОВ', 'просто какое-то видео', C.s2Without, false], ['С НИМИ', "ролик в стиле Rick's Clips", C.s2With, true]].map(([a, b, at, good], i) => (
        <div key={i} style={{ flex: 1, borderRadius: 34, padding: 40, boxSizing: 'border-box', height: 600, background: good ? 'linear-gradient(160deg,#2b1a10,#160f0b)' : '#161311', border: `3px solid ${good ? OR : '#4a433d'}`, boxShadow: good ? '0 0 80px rgba(238,122,63,.35)' : 'none', ...fadeUp(t, at as number) }}>
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: good ? OR : MU }}>{a}</div>
          <div style={{ marginTop: 30, height: 330, borderRadius: 20, overflow: 'hidden', filter: good ? 'none' : 'grayscale(1) blur(6px) brightness(.6)' }}><Img src={staticFile(good ? 'ricks/thumbs/res_2.jpg' : 'ricks/thumbs/res_4.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <div style={{ marginTop: 30, fontFamily: SANS, fontWeight: 600, fontSize: 44, color: good ? TX : MU }}>{b}</div>
        </div>))}
    </div>}
    {t >= C.s2Week - .2 && !cta && <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center' }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 260, color: OR2, lineHeight: 1, textShadow: '0 0 60px rgba(238,122,63,.5)', ...fadeUp(t, C.s2Week - .2) }}>7 дней</div>
      <div style={{ fontFamily: SANS, fontSize: 52, color: TX, marginTop: 20, ...fadeUp(t, C.s2Week + .3) }}>подбора промптов — чтобы ты не тратил своё время</div>
    </div>}
    {cta && <div style={{ position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 30, padding: '30px 60px', borderRadius: 30, background: OR, color: '#170e09', fontFamily: SANS, fontWeight: 800, fontSize: 80, boxShadow: `0 0 ${60 + 40 * Math.sin(t * 6)}px rgba(238,122,63,.7)`, transform: `scale(${pop(t, C.s2Link - .2) * (1 + .02 * Math.sin(t * 6))})` }}><TgIcon s={80} c="#170e09" />ССЫЛКА В ОПИСАНИИ ↓</div>
      <div style={{ marginTop: 34, fontFamily: SANS, fontSize: 46, color: TX, ...fadeUp(t, C.s2Link + .8) }}>и в закреплённом комментарии</div>
      {t >= C.s2Pause && <div style={{ marginTop: 70, display: 'inline-flex', alignItems: 'center', gap: 30, ...fadeUp(t, C.s2Pause, .4) }}>
        <div style={{ width: 120, height: 120, borderRadius: 60, border: `5px solid ${TX}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, transform: `scale(${1 + .06 * Math.sin(t * 7)})` }}><i style={{ width: 16, height: 50, background: TX, borderRadius: 4 }} /><i style={{ width: 16, height: 50, background: TX, borderRadius: 4 }} /></div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, color: TX }}>поставь на паузу и забери</div></div>}
    </div>}
    {!cmp && !cta && t < C.s2Week - .2 && <Cursor t={t} x={cur[0]} y={cur[1]} hand={t > C.s2Tg - .3 && t < C.s2Pin + 1} clicks={[C.s2Tg, C.s2Pin + .8]} />}
  </Scene>;
};

const PROMPT1 = "Ты — аниматор в стиле Rick's Clips. Изучи материалы и жди ролик-референс.";
const ChatWin: React.FC<{ t: number; chips: number[]; text: string; caret?: boolean; sentAt?: number; reply?: string; replyAt?: number; extra?: React.ReactNode }> = ({ t, chips, text, caret, sentAt = 1e9, reply, replyAt = 1e9, extra }) => {
  const sent = t >= sentAt, files = [['doc', 'промпты.txt'], ['img', 'материалы.zip'], ['aud', 'ролик.mp4']];
  return <Win x={460} y={140} w={1360} h={800} title="Claude">
    <div style={{ position: 'absolute', left: 0, right: 0, top: 26, display: 'flex', justifyContent: 'center' }}><ClaudeMark t={t} size={56} /></div>
    {sent && <div style={{ position: 'absolute', right: 50, top: 130, maxWidth: 900, padding: '20px 28px', borderRadius: '28px 28px 8px 28px', background: '#2b2724', fontFamily: SANS, fontSize: 28, color: TX, ...fadeUp(t, sentAt, .4) }}>{text}</div>}
    {reply && t >= replyAt && <div style={{ position: 'absolute', left: 50, top: 270, maxWidth: 1000, display: 'flex', gap: 18, ...fadeUp(t, replyAt, .5) }}><Spark size={40} /><div style={{ fontFamily: SANS, fontSize: 28, color: '#ded7ce', lineHeight: 1.45 }}>{reply}</div></div>}
    {extra}
    <div style={{ position: 'absolute', left: 40, right: 40, bottom: 34, minHeight: 190, borderRadius: 30, background: '#141210', border: `2.5px solid ${sent ? BORD : OR}`, padding: '24px 30px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 14, minHeight: 50 }}>{chips.map((at, i) => !sent && t >= at && <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 8px 10px', borderRadius: 16, background: '#2a2623', border: `2px solid ${BORD}`, fontFamily: SANS, fontSize: 24, color: TX, transform: `scale(${pop(t, at)})`, boxShadow: `0 0 ${30 * decay(t, at, 2.5)}px rgba(238,122,63,.7)` }}><FileGlyph k={files[i][0]} />{files[i][1]}</div>)}</div>
      <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 30, color: !sent && text ? TX : '#6f6862' }}>{!sent && text ? text : 'Чем помочь сегодня?'}{caret && <span style={{ color: OR }}>|</span>}</div>
    </div>
  </Win>;
};

const Step3: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s3'), k = (i: number) => pr(t, C.s3Drag + i * .2, .7);
  const pasted = t >= C.s3Paste ? PROMPT1.slice(0, Math.round(PROMPT1.length * pr(t, C.s3Paste, .5))) : '';
  return <Scene t={t} id="s3">
    <Glow t={t} o={.6} /><Dots t={t} />
    <StepTag t={t} n={3} at={s.start + .1} title="Закинь материалы в Claude" />
    <div style={{ ...fadeUp(t, s.start + .2) }}><ChatWin t={t} chips={[C.s3Drag + .6, C.s3Drag + .8]} text={pasted} caret={t > C.s3Paste && t < C.s3Read} sentAt={C.s3Read} reply="Понял: делаем ролик в стиле Rick's Clips. Пришли видео-референс." replyAt={C.s3Read + .6} /></div>
    {/* file panel + drag */}
    <Win x={70} y={260} w={360} h={360} title="Загрузки" style={fadeUp(t, s.start + .3)}>
      {[['doc', 'промпты.txt'], ['img', 'материалы.zip']].map(([g, n], i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', fontFamily: SANS, fontSize: 26, color: TX, opacity: k(i) > 0 && k(i) < 1 ? .3 : 1 }}><FileGlyph k={g} s={1.2} />{n}</div>)}
      {t >= C.s3Copy && <div style={{ margin: '10px 20px', padding: 16, borderRadius: 14, background: 'rgba(238,122,63,.18)', border: `2px solid ${OR}`, fontFamily: MONO, fontSize: 20, color: OR2, ...fadeUp(t, C.s3Copy, .4) }}>Промпт 1 — скопировано ✓</div>}
    </Win>
    {[0, 1].map((i) => { const kk = k(i); if (kk <= 0 || kk >= 1) return null; const e = eio(kk);
      return <div key={i} style={{ position: 'absolute', left: lerp(110, 540 + i * 260, e), top: lerp(330 + i * 70, 760, e) - Math.sin(kk * Math.PI) * 120, padding: '14px 22px', borderRadius: 16, background: '#2a2623', border: `2.5px solid ${OR}`, display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontSize: 26, color: TX, boxShadow: '0 0 40px rgba(238,122,63,.5)' }}><FileGlyph k={i ? 'img' : 'doc'} />{i ? 'материалы.zip' : 'промпты.txt'}</div>; })}
  </Scene>;
};

const Step4: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s4'), parse = t >= C.s4Parse - .2, fly = pr(t, C.s4Send, .7);
  const cur = curPos(t, [[s.start, 1500, 900], [C.s4Pick - .4, 830, 470], [C.s4Pick + .3, 830, 470], [s.end, 1300, 900]]);
  const labels: [number, string, number][] = [[C.s4Hook, 'ХУК · 0:01', 0], [C.s4Scenes, 'СМЕНА СЦЕН', 2], [C.s4Chars, 'ПЕРСОНАЖИ', 4], [C.s4Snd, 'ЗВУКИ', 6]];
  return <Scene t={t} id="s4">
    <Glow t={t} o={.7} /><Dots t={t} />
    <StepTag t={t} n={4} at={s.start + .1} title="Отправь Claude понравившийся ролик" />
    {!parse && <>
      <Win x={160} y={170} w={1600} h={600} title="youtube.com/@ricksclips · Shorts" style={fadeUp(t, s.start + .2)}>
        <div style={{ position: 'absolute', left: 40, right: 40, top: 40, display: 'flex', gap: 22 }}>
          {THUMBS.slice(0, 6).map((src, i) => { const sel = i === 2 && t >= C.s4Pick;
            return <div key={i} style={{ flex: 1, height: 440, borderRadius: 18, overflow: 'hidden', border: sel ? `5px solid ${OR}` : '5px solid transparent', boxShadow: sel ? '0 0 50px rgba(238,122,63,.7)' : 'none', transform: `scale(${sel ? 1.05 : 1})`, opacity: i === 2 && fly > 0 ? 1 - fly : 1 }}><Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>; })}
        </div>
      </Win>
      {fly > 0 && <div style={{ position: 'absolute', left: lerp(700, 860, eio(fly)), top: lerp(230, 820, eio(fly)) - Math.sin(fly * Math.PI) * 140, padding: '18px 28px', borderRadius: 18, background: '#2a2623', border: `3px solid ${OR}`, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontSize: 32, color: TX, boxShadow: '0 0 50px rgba(238,122,63,.6)', transform: `scale(${lerp(1.2, .9, fly)})` }}><FileGlyph k="aud" s={1.3} />ролик.mp4 → Claude</div>}
      <Cursor t={t} x={cur[0]} y={cur[1]} hand={t > C.s4Pick - .3 && t < C.s4Pick + .3} clicks={[C.s4Pick]} />
    </>}
    {parse && <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center' }}><Title t={t} at={C.s4Parse - .2} size={64}>Claude разбирает ролик по кадрам</Title></div>
      <div style={{ position: 'absolute', left: 110, right: 110, top: 330, display: 'flex', gap: 14 }}>
        {['r1_0', 'r1_1', 'r1_2', 'r1_3', 'r2_0', 'r2_1', 'r2_2', 'r2_3'].map((n, i) => { const k = pop(t, C.s4Parse + i * .07, .4);
          return <div key={i} style={{ flex: 1, height: 380, borderRadius: 14, overflow: 'hidden', transform: `scale(${k})`, position: 'relative', boxShadow: labels.some(([at, , idx]) => idx === i && t >= at) ? `0 0 0 4px ${OR}, 0 0 40px rgba(238,122,63,.6)` : 'none' }}><Img src={staticFile(`ricks/thumbs/${n}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', left: 8, bottom: 8, fontFamily: MONO, fontSize: 18, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '2px 8px', borderRadius: 6 }}>0:{String(i * 7 + 1).padStart(2, '0')}</div></div>; })}
      </div>
      {labels.map(([at, txt, idx], i) => <Chip key={i} t={t} at={at} x={110 + idx * 213 - 20} y={740}>{txt}</Chip>)}
    </>}
  </Scene>;
};

const CODE = ["const Scene = ({ frame }) => {", "  const ship = spring({ frame, fps })", "  return <World sky='sunset'>", "    <Stickman head='round' mood='shock' />", "    <Subtitle word={words[i]} />", "  </World>", "}", "voice('Nikolay', script.ru)", "render('ролик.mp4')"];
const Step5: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s5'), lt = t - s.start, edit = t >= C.s5Edit - .2;
  const steps: [number, string][] = [[C.s5Script, 'Сценарий'], [C.s5Draw, 'Сцены и персонажи'], [C.s5Voice, 'Озвучка'], [C.s5Subs, 'Субтитры по словам'], [C.s5Build, 'Сборка ролика']];
  const rp = eio(pr(t, C.s5Build, 1.4));
  return <Scene t={t} id="s5">
    <Glow t={t} o={.7} /><Dots t={t} />
    <StepTag t={t} n={5} at={s.start + .1} title="Claude делает всё сам" />
    {!edit && <>
      <div style={{ position: 'absolute', left: 120, top: 190, width: 820, height: 640, borderRadius: 26, background: '#110f0e', border: `2px solid ${BORD}`, padding: '30px 36px', boxSizing: 'border-box', fontFamily: MONO, fontSize: 25, lineHeight: 1.75, overflow: 'hidden', transform: 'perspective(1600px) rotateY(10deg)', ...fadeUp(t, s.start + .2) }}>
        {CODE.slice(0, Math.min(CODE.length, Math.floor(lt / .45) + 1)).map((l, i, a) => <div key={i} style={{ color: i === a.length - 1 ? OR2 : '#cfc8bf', textShadow: i === a.length - 1 ? '0 0 16px rgba(238,122,63,.8)' : 'none' }}>{l}</div>)}
      </div>
      <div style={{ position: 'absolute', left: 1020, top: 190, width: 780, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {steps.map(([at, n], i) => { const done = i < steps.length - 1 ? t >= (steps[i + 1][0]) : rp >= 1;
          return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 28px', borderRadius: 20, background: t >= at ? '#1d1916' : '#141210', border: `2.5px solid ${t >= at ? (done ? '#5fbf55' : OR) : BORD}`, fontFamily: SANS, fontWeight: 600, fontSize: 36, color: t >= at ? TX : '#5a534d', transform: `scale(${t >= at ? 1 + .04 * decay(t, at, 5) : 1})` }}>
            <span style={{ width: 44, textAlign: 'center', color: done ? '#7cc27a' : OR2 }}>{done ? '✓' : t >= at ? '●' : '○'}</span>{n}
            {i === 1 && t >= at && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{[0, 1, 2].map((j) => <Img key={j} src={staticFile(`ricks/thumbs/res_${j}.jpg`)} style={{ width: 54, height: 96, objectFit: 'cover', borderRadius: 8, transform: `scale(${pop(t, at + .2 + j * .25)})` }} />)}</div>}
            {i === 4 && t >= at && <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 30, color: rp >= 1 ? '#7cc27a' : OR2 }}>{Math.round(rp * 100)}%</span>}
          </div>; })}
      </div>
      {t >= C.s5Wait - .2 && <div style={{ position: 'absolute', left: 1020, top: 830, fontFamily: SANS, fontSize: 40, color: MU, ...fadeUp(t, C.s5Wait - .2) }}>☕ а ты просто ждёшь</div>}
    </>}
    {edit && <div style={fadeUp(t, C.s5Edit - .2)}><ChatWin t={t} chips={[]} text={t < C.s5Edit + 1.6 ? 'сделай быстрее, поменяй голос, добавь шутку'.slice(0, Math.round(42 * pr(t, C.s5Edit, 1.2))) : 'сделай быстрее, поменяй голос, добавь шутку'} caret={t < C.s5Edit + 1.6} sentAt={C.s5Edit + 1.6} reply="Готово ✓ Темп быстрее, новый голос и шутка в 3-й сцене. Рендер обновлён." replyAt={Math.max(C.s5Redo, C.s5Edit + 2.1)} /></div>}
  </Scene>;
};

const Result: React.FC<{ t: number }> = ({ t }) => {
  const s = S('rs'), play = t >= C.rsPlay, big = ex(pr(t, C.rsPlay - .3, .8));
  return <Scene t={t} id="rs">
    <Glow t={t} o={.6 + .3 * big} /><Dots t={t} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 50, textAlign: 'center', opacity: 1 - big }}><Title t={t} at={s.start + .1} size={64}>Что получилось у меня</Title></div>
    <div style={{ position: 'absolute', left: lerp(260, 140, big), top: lerp(200, 230, big), opacity: 1 - big * .4, ...fadeUp(t, s.start + .4) }}>
      <Phone src="ricks/rick1.mp4" from={10} w={lerp(330, 280, big)} startAt={s.start} label="Rick's Clips" />
    </div>
    <div style={{ position: 'absolute', left: lerp(1330, 960 - 270, big), top: lerp(200, 70, big), ...fadeUp(t, s.start + .6) }}>
      <Phone src="ricks/result.mp4" img={play ? undefined : 'ricks/thumbs/res_0.jpg'} from={0} w={lerp(330, 540, big)} muted={!play} volume={play ? 1 : 0} startAt={C.rsPlay} label="моё · через Claude" style={{ border: `5px solid ${OR}`, boxShadow: `0 0 ${60 + 40 * big}px rgba(238,122,63,.55)` }} />
    </div>
    {!play && <div style={{ position: 'absolute', left: 720, top: 380, width: 480, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 48, color: TX, lineHeight: 1.2, ...fadeUp(t, s.start + 1) }}>Лондонский пивной потоп<div style={{ fontSize: 36, color: OR2, marginTop: 20, fontWeight: 500 }}>на русском · в том же стиле</div></div>}
  </Scene>;
};

const End: React.FC<{ t: number }> = ({ t }) => {
  const s = S('en'), fade = clamp((t - (DUR - .6)) / .6);
  return <Scene t={t} id="en">
    <Glow t={t} /><Glow t={t} bottom o={.6} /><Dots t={t} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center', ...fadeUp(t, s.start) }}><div style={{ transform: `rotate(${t * 25}deg)`, filter: 'drop-shadow(0 0 30px rgba(238,122,63,.7))' }}><Spark size={130} t={t} breathe={1} /></div></div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center' }}>
      <Title t={t} at={C.enAll} size={100}>Все промпты и материалы</Title>
      <Title t={t} at={C.enAll + .4} size={100} style={{ color: OR2 }}>в моём Telegram</Title>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 600, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '24px 34px 24px 24px', borderRadius: 30, background: '#fbf8f4', boxShadow: `0 0 ${50 + 30 * Math.sin(t * 5)}px rgba(238,122,63,.6)`, transform: `scale(${pop(t, C.enLink - .2)})` }}>
        <Img src={staticFile('avatar.jpg')} style={{ width: 110, height: 110, borderRadius: 55, objectFit: 'cover' }} />
        <div><div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 56, color: '#1a1512' }}>@claudecode09</div><div style={{ fontFamily: SANS, fontSize: 30, color: '#7a7168' }}>ссылка в описании ↓</div></div>
        <div style={{ marginLeft: 30, padding: '22px 40px', borderRadius: 20, background: t >= C.enSub ? '#7cc27a' : OR, fontFamily: SANS, fontWeight: 700, fontSize: 38, color: '#170e09', transform: `scale(${1 - .08 * Math.sin(Math.PI * clamp((t - C.enSub) / .2))})` }}>{t >= C.enSub + .1 ? 'Подписан ✓' : 'Подписаться'}</div>
      </div>
    </div>
    <AbsoluteFill style={{ background: '#000', opacity: fade }} />
  </Scene>;
};

// ---------- subtitles: chunks of ~6 words, current word highlighted
const CH = (() => { const out: any[] = []; let cur: any[] = []; const fl = () => { if (cur.length) out.push(cur); cur = []; };
  TOK.forEach((t, i) => { if (!t.d) return; if (cur.length && TOK[i - 1] && TOK[i - 1].si !== t.si) fl(); cur.push(t); if (/[.!?…:]$/.test(t.d) || cur.length >= 7) fl(); }); fl();
  out.forEach((c, i) => { c.s = c[0].s - .05; c.e = i < out.length - 1 ? Math.min(out[i + 1][0].s - .05, c.at(-1).e + .6) : c.at(-1).e + .6; }); return out; })();
const Subs: React.FC<{ t: number }> = ({ t }) => {
  const ch = CH.find((c) => t >= c.s && t < c.e); if (!ch) return null;
  const k = pr(t, ch.s, .15);
  return <div style={{ position: 'absolute', left: 120, right: 120, bottom: 52, textAlign: 'center', opacity: k, transform: `translateY(${(1 - eo(k)) * 16}px)` }}>
    <span style={{ display: 'inline-block', padding: '10px 26px', borderRadius: 20, background: 'rgba(10,9,8,.72)', fontFamily: SANS, fontWeight: 600, fontSize: 44, lineHeight: 1.3, color: TX }}>
      {ch.map((w, i) => { const on = t >= w.s - .03 && (i === ch.length - 1 || t < ch[i + 1].s - .03); return <span key={i} style={{ color: on ? OR2 : TX, marginRight: 12 }}>{w.d}</span>; })}
    </span></div>;
};

const songVol = (t: number) => {
  const talk = TOK.reduce((m, w) => Math.max(m, clamp(1 - Math.max(w.s - .15 - t, t - w.e - .3, 0) / .35)), 0);
  const inResult = t >= C.rsPlay - .3 && t < C.rsPlayEnd + .3 ? 1 : 0;
  return lerp(lerp(.34, .14, talk), .03, inResult) * clamp(t / .6) * clamp((DUR - t) / 1.5);
};
const COMPS: Record<string, React.FC<{ t: number }>> = { h: Hook, ch: Channel, nd: Need, s1: Step1, s2: Step2, s3: Step3, s4: Step4, s5: Step5, rs: Result, en: End };
export const Ricks: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const s = SC.find((x) => t >= x.start && t < x.end) || SC[SC.length - 1];
  const Comp = COMPS[s.id];
  const subsOn = !(t >= C.rsPlay - .1 && t < C.rsPlayEnd);
  return <AbsoluteFill style={{ background: BG }}>
    <Comp t={t} />
    {subsOn && <Subs t={t} />}
    <Vig />
    <Grain f={f} />
    {/* the result clip keeps its own sound only while it plays full-size */}
    {M.voice && <Audio src={staticFile('ricks/voice.wav')} />}
    <Audio src={staticFile(M.song || 'v3/song.wav')} volume={(fr) => songVol(fr / FPS)} />
    <Audio src={staticFile('ricks/sfx.wav')} volume={.5} />
  </AbsoluteFill>;
};
