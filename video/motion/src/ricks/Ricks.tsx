import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BG, OR, OR2, TX, MU, SANS, SERIF, MONO, clamp, lerp, ex, ei, eio, pr, decay, Spark, Cursor, curPos, FileGlyph } from '../v3/V3';
import { DISP, Reveal, Phase, rise, popS, Frame, Browser, YouTube, YTLogo, Telegram, ClaudeApp, Composer } from './ui';
import { buildRicks, FPS } from './timeline';
import lines from './lines.json';
import words from './words.json';
import meta from './meta.json';

export const RK = buildRicks(lines as any, words as any, (meta as any).lead || 0);
const { sc: SC, C, duration: DUR, tok: TOK } = RK;
const S = (id: string) => SC.find((x) => x.id === id);
const M = meta as any;
const W = 1920, H = 1080;
const THUMBS = ['r1_0', 'r2_1', 'r1_2', 'r2_3', 'r1_4', 'r2_5', 'r2_0', 'r1_3'].map((n) => `ricks/thumbs/${n}.jpg`);

// ---------- backdrop: warm glow, slow drift, dot grid
const Backdrop: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: BG }}>
    <div style={{ position: 'absolute', left: -300 + Math.sin(t * .15) * 120, top: -860, width: W + 600, height: 1150, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,138,61,.95) 0%, rgba(212,86,27,.7) 38%, rgba(120,35,8,.35) 68%, transparent 100%)', filter: 'blur(60px)', opacity: .8 + .2 * Math.sin(t * .7) }} />
    <div style={{ position: 'absolute', left: 1100 + Math.sin(t * .2) * 200, top: 650, width: 1100, height: 700, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(120,60,200,.18), transparent)', filter: 'blur(60px)' }} />
    <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.045) 1.6px, transparent 2px)', backgroundSize: '40px 40px', backgroundPosition: `${t * 5}px ${t * 8}px`, WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 85%)' }} />
  </AbsoluteFill>
);
const Grain: React.FC<{ f: number }> = ({ f }) => <Img src={staticFile(`cine/grain/g${f % 6}.png`)} style={{ position: 'absolute', inset: 0, width: W, height: H, opacity: .09, mixBlendMode: 'overlay', objectFit: 'cover' }} />;
const Vig: React.FC = () => <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 48%, transparent 55%, rgba(0,0,0,.8) 100%)', pointerEvents: 'none' }} />;
const Cam: React.FC<{ t: number; s: { start: number; end: number }; children: React.ReactNode; push?: number }> = ({ t, s, children, push = .035 }) => {
  const k = clamp((t - s.start) / Math.max(1, s.end - s.start));
  return <AbsoluteFill style={{ transform: `translate(${Math.sin(t * .35) * 8}px, ${Math.cos(t * .3) * 6}px) scale(${1 + push * eio(k)})` }}>{children}</AbsoluteFill>;
};
const Phone: React.FC<{ src?: string; img?: string; from?: number; w?: number; muted?: boolean; volume?: number; startAt?: number; style?: React.CSSProperties; label?: string; glow?: boolean }> = ({ src, img, from = 0, w = 340, muted = true, volume = 0, startAt = 0, style, label, glow }) => (
  <div style={{ position: 'absolute', width: w, height: w * 16 / 9, borderRadius: w * .1, padding: w * .025, background: 'linear-gradient(160deg,#3a3633,#141211)', boxShadow: `0 50px 100px rgba(0,0,0,.7)${glow ? ', 0 0 80px rgba(238,122,63,.5)' : ''}`, ...style }}>
    <div style={{ width: '100%', height: '100%', borderRadius: w * .08, overflow: 'hidden', background: '#000', position: 'relative' }}>
      {img ? <Img src={staticFile(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Sequence from={Math.round(startAt * FPS)} layout="none"><OffthreadVideo src={staticFile(src)} startFrom={Math.round(from * FPS)} muted={muted} volume={volume} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Sequence>}
      {label && <div style={{ position: 'absolute', left: 12, top: 12, padding: '6px 14px', borderRadius: 12, background: 'rgba(0,0,0,.55)', fontFamily: SANS, fontWeight: 600, fontSize: w * .055, color: '#fff' }}>{label}</div>}
    </div>
  </div>
);
const Pill: React.FC<{ t: number; at: number; x: number; y: number; children: React.ReactNode; accent?: string; float?: number }> = ({ t, at, x, y, children, accent = OR, float = 0 }) => {
  const k = popS(t, at); if (!k) return null;
  return <div style={{ position: 'absolute', left: x, top: y + Math.sin(t * 1.6 + float) * 6, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 28px', borderRadius: 40, background: 'rgba(24,21,19,.85)', border: `1.5px solid ${accent}aa`, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: TX, whiteSpace: 'nowrap', boxShadow: `0 20px 50px rgba(0,0,0,.45), 0 0 ${18 + 30 * decay(t, at, 3)}px ${accent}55`, transform: `scale(${k})`, opacity: clamp(k * 2) }}>
    <i style={{ width: 10, height: 10, borderRadius: 5, background: accent, boxShadow: `0 0 12px ${accent}` }} />{children}</div>;
};
const Kicker: React.FC<{ t: number; at: number; n: number; title: string }> = ({ t, at, n, title }) => (
  <div style={{ position: 'absolute', left: 96, top: 56, display: 'flex', alignItems: 'center', gap: 22 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...rise(t, at, .6) }}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} style={{ width: i === n ? 46 : 14, height: 14, borderRadius: 7, background: i <= n ? OR : '#3a3430', boxShadow: i === n ? '0 0 14px rgba(238,122,63,.8)' : 'none' }} />)}
    </div>
    <div style={{ fontFamily: MONO, fontSize: 22, color: OR2, letterSpacing: 3, ...rise(t, at + .1, .6) }}>ШАГ {n}</div>
    <Reveal t={t} at={at + .15} text={title} size={40} weight={600} />
  </div>
);
const ClaudeMark: React.FC<{ t: number; size?: number }> = ({ t, size = 70 }) => <div style={{ display: 'flex', alignItems: 'center', gap: size * .3 }}><div style={{ transform: `rotate(${t * 15}deg)` }}><Spark size={size} t={t} breathe={1} /></div><span style={{ fontFamily: SERIF, fontSize: size * 1.05, color: TX, letterSpacing: -1 }}>Claude</span></div>;
const TgIcon: React.FC<{ s?: number; c?: string }> = ({ s = 40, c = '#fff' }) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M21.5 3.5L2.8 10.7c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.7.1 1.9-.7l3.1-15.6c.2-1-.8-1.7-1.9-1.3zM9.4 14.6l9-7.7-7.2 9.2-.4 3.1-1.4-4.6z" fill={c} /></svg>;
const Card: React.FC<{ hot?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ hot, children, style }) => (
  <div style={{ flex: 1, borderRadius: 40, padding: 50, boxSizing: 'border-box', background: hot ? 'linear-gradient(160deg, rgba(238,122,63,.22), rgba(22,16,12,.92) 60%)' : 'rgba(26,23,21,.82)', border: `1.5px solid ${hot ? OR : '#3a3430'}`, boxShadow: hot ? '0 0 100px rgba(238,122,63,.3)' : '0 30px 70px rgba(0,0,0,.4)', ...style }}>{children}</div>
);

// ---------- scenes
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const s = S('h'), away = ex(pr(t, C.hShow - .35, .9));
  const ph = [[C.hShips, 'Пиратские ядра', 'ricks/rick1.mp4', 2], [C.hJars, 'Древние кувшины', 'ricks/rick2.mp4', 1], [C.hInv, 'Изобретения прошлого', 'ricks/rick1.mp4', 40]] as const;
  const tz = rise(t, C.hTease - .3, .8);
  return <Cam t={t} s={s}>
    <AbsoluteFill style={{ perspective: 1800 }}>
      {ph.map(([at, lab, src, from], i) => { const k = ex(pr(t, i === 0 ? .2 : at - .5, .9)), x = 960 + (i - 1) * 520 - 165, rot = (i - 1) * -16;
        return <div key={i} style={{ position: 'absolute', left: x, top: 190, width: 330, height: 587, transform: `translateX(${-away * (1500 + i * 120)}px) translateY(${(1 - k) * 260}px) rotateY(${rot + Math.sin(t * .5 + i) * 4}deg) rotateX(${(1 - k) * 20}deg) scale(${lerp(.85, 1, k) * (i === 1 ? 1.06 : 1)})`, opacity: clamp(k * 1.6) * (1 - away), filter: k < .95 ? `blur(${(1 - k) * 12}px)` : 'none' }}>
          <Phone src={src} from={from} w={330} glow={i === 1} />
          {t >= at && <div style={{ position: 'absolute', left: -60, right: -60, top: 612 }}><Reveal t={t} at={at} text={lab} size={28} weight={500} align="center" /></div>}
        </div>; })}
    </AbsoluteFill>
    {t >= C.hMil && t < C.hShow + .4 && <div style={{ position: 'absolute', left: 0, right: 0, top: 62, opacity: 1 - pr(t, C.hShow - .4, .4) }}><Reveal t={t} at={C.hMil} text="МИЛЛИОНЫ ПРОСМОТРОВ" size={64} weight={700} color={OR2} align="center" style={{ textShadow: '0 0 40px rgba(238,122,63,.5)' }} /></div>}
    {t >= C.hShow && <div style={{ position: 'absolute', left: 130, top: 270 }}>
      <Reveal t={t} at={C.hShow} text="Делай такие же" size={104} weight={700} />
      <Reveal t={t} at={C.hNever} text="без монтажа." size={104} weight={700} color={OR2} />
      {t >= C.hClaude - .1 && <div style={{ marginTop: 56, ...rise(t, C.hClaude - .1, .7) }}><ClaudeMark t={t} size={84} /></div>}
    </div>}
    {t >= C.hTease - .3 && <div style={{ position: 'absolute', left: 1360, top: 190, width: 360, height: 640, opacity: tz.opacity, filter: tz.filter, transform: `${tz.transform} rotate(4deg)` }}>
      <div style={{ filter: 'blur(16px) saturate(1.2)', opacity: .85 }}><Phone img="ricks/thumbs/res_1.jpg" w={360} /></div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ padding: '18px 34px', borderRadius: 40, background: OR, color: '#1a0f09', fontFamily: DISP, fontWeight: 600, fontSize: 30, boxShadow: '0 0 50px rgba(238,122,63,.7)', whiteSpace: 'nowrap', transform: `scale(${popS(t, C.hTease + .1)})` }}>в конце →</div></div>
    </div>}
  </Cam>;
};

const Channel: React.FC<{ t: number }> = ({ t }) => {
  const s = S('ch');
  return <Cam t={t} s={s} push={.02}>
    <Phase t={t} a={s.start} b={C.chMen - .1}>
      <Frame x={150} y={80} w={1620} h={860} bg="#0f0f0f" style={{ transform: `perspective(2200px) rotateX(${lerp(14, 3, ex(pr(t, s.start, 1.2)))}deg)` }}>
        <Browser url="youtube.com/@RicksClips" tab="Rick's Clips — YouTube" favicon={<div style={{ width: 20, height: 14, borderRadius: 4, background: '#ff0033', flex: 'none' }} />}>
          <YouTube t={t} thumbs={THUMBS} showAt={s.start + .3} />
        </Browser>
      </Frame>
      <Pill t={t} at={C.chFact} x={1220} y={300}>реальные факты из истории</Pill>
    </Phase>
    <Phase t={t} a={C.chMen - .3} b={C.chHow - .1}>
      <div style={{ position: 'absolute', left: 795, top: 60, ...rise(t, C.chMen - .3, .8) }}><Phone src="ricks/rick2.mp4" from={8} w={330} startAt={C.chMen - .3} glow /></div>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>{[[C.chMen, 790, 240, 640, 236], [C.chWorld, 1135, 300, 1270, 296], [C.chVoice, 790, 640, 650, 646], [C.chSubs, 1135, 700, 1270, 696]].map(([at, x1, y1, x2, y2], i) => t >= at && <path key={i} d={`M${x1} ${y1} L${lerp(x1, x2, ex(pr(t, at, .4)))} ${lerp(y1, y2, ex(pr(t, at, .4)))}`} stroke={OR} strokeWidth={2.5} strokeDasharray="6 8" opacity={.8} />)}</svg>
      <Pill t={t} at={C.chMen} x={250} y={208}>смешные человечки</Pill>
      <Pill t={t} at={C.chWorld} x={1270} y={268} float={1}>яркие 3D-миры</Pill>
      <Pill t={t} at={C.chVoice} x={280} y={618} float={2}>голос за кадром</Pill>
      <Pill t={t} at={C.chSubs} x={1270} y={668} float={3}>субтитры по слову</Pill>
    </Phase>
    <Phase t={t} a={C.chHow - .3} b={C.chBefore - .1}>
      <div style={{ position: 'absolute', left: 150, top: 150 }}><Reveal t={t} at={C.chHow - .2} text="Как устроен каждый ролик" size={72} weight={700} /></div>
      <div style={{ position: 'absolute', left: 150, right: 150, top: 420, height: 300 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 130, height: 14, borderRadius: 7, background: '#2a2522', overflow: 'hidden' }}><div style={{ width: `${100 * eio(pr(t, C.chHook, Math.max(1, C.chWatch - C.chHook)))}%`, height: '100%', background: `linear-gradient(90deg, ${OR}, #ffcf7a)`, boxShadow: '0 0 24px rgba(238,122,63,.8)' }} /></div>
        {Array.from({ length: 16 }, (_, i) => { const k = ex(pr(t, C.chCuts + i * .07, .4)); return <div key={i} style={{ position: 'absolute', left: `${8 + i * 5.4}%`, top: 108, width: 3, height: 58 * k, borderRadius: 2, background: '#ffcf7a', opacity: .85 * k }} />; })}
        <Pill t={t} at={C.chHook} x={-10} y={0}>0:01 · хук</Pill>
        <Pill t={t} at={C.chCuts} x={520} y={200} accent="#ffcf7a">смена сцен каждые 2–3 с</Pill>
        <Pill t={t} at={C.chTwist} x={1310} y={0} accent="#ff5d7a">поворот</Pill>
      </div>
      {t >= C.chWatch && <div style={{ position: 'absolute', left: 150, top: 800 }}><Reveal t={t} at={C.chWatch} text="→ досматривают до конца" size={48} weight={600} color={OR2} /></div>}
    </Phase>
    <Phase t={t} a={C.chBefore - .3} b={s.end + 1}>
      <div style={{ position: 'absolute', left: 150, right: 150, top: 170, display: 'flex', gap: 60 }}>
        {[['РАНЬШЕ', 'дни', 'художник + монтажёр', C.chBefore, false], ['СЕЙЧАС', 'минуты', 'ты + Claude', C.chNow, true]].map(([a, b, c, at, hot], i) => (
          <Card key={i} hot={hot as boolean} style={{ height: 560, ...rise(t, at as number, .8) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: hot ? OR2 : MU }}>{a}</div>
            <Reveal t={t} at={(at as number) + .15} text={b as string} size={140} weight={700} color={hot ? TX : '#8d857c'} style={{ marginTop: 30 }} />
            <div style={{ fontFamily: SANS, fontSize: 36, color: MU, marginTop: 10 }}>{c}</div>
            {hot && <div style={{ marginTop: 40, ...rise(t, (at as number) + .4) }}><ClaudeMark t={t} size={56} /></div>}
          </Card>))}
      </div>
    </Phase>
  </Cam>;
};

const Need: React.FC<{ t: number }> = ({ t }) => {
  const s = S('nd');
  const cards: [number, string, string, React.ReactNode][] = [
    [C.nd1, '01', 'Claude', <div style={{ transform: `rotate(${t * 20}deg)` }}><Spark size={150} t={t} breathe={1} /></div>],
    [C.nd2, '02', 'Материалы из TG', <div style={{ width: 150, height: 150, borderRadius: 75, background: 'linear-gradient(160deg,#37aee2,#1e96c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(55,174,226,.4)' }}><TgIcon s={86} /></div>],
    [C.nd3, '03', 'Ролик-референс', <div style={{ width: 100, height: 178, borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 50px rgba(238,122,63,.4)' }}><Img src={staticFile('ricks/thumbs/r2_1.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>],
  ];
  return <Cam t={t} s={s}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 90 }}><Reveal t={t} at={s.start + .05} text="Понадобится всего три вещи" size={70} weight={700} align="center" /></div>
    <div style={{ position: 'absolute', left: 170, right: 170, top: 250, display: 'flex', gap: 46, perspective: 1600 }}>
      {cards.map(([at, n, name, icon], i) => { const k = ex(pr(t, at - .15, .8));
        return <div key={i} style={{ flex: 1, height: 440, borderRadius: 40, background: 'linear-gradient(170deg, rgba(40,35,31,.92), rgba(20,18,16,.92))', border: '1.5px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30, transform: `translateY(${(1 - k) * 120 + Math.sin(t * 1.4 + i) * 6}px) rotateX(${(1 - k) * 30}deg)`, opacity: clamp(k * 1.5), filter: k < .95 ? `blur(${(1 - k) * 10}px)` : 'none', boxShadow: '0 40px 80px rgba(0,0,0,.45)' }}>
          <div style={{ height: 190, display: 'flex', alignItems: 'center' }}>{icon}</div>
          <div style={{ fontFamily: MONO, fontSize: 22, color: OR2, letterSpacing: 3 }}>{n}</div>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 34, color: TX }}>{name}</div></div>; })}
    </div>
    <Pill t={t} at={C.ndNo} x={470} y={770} accent="#6d6359">без After Effects</Pill>
    <Pill t={t} at={C.ndNo + .45} x={850} y={770} accent="#6d6359">без опыта в анимации</Pill>
    {t >= C.ndSteps && <div style={{ position: 'absolute', left: 1340, top: 772 }}><Reveal t={t} at={C.ndSteps} text="поехали →" size={42} weight={700} color={OR2} /></div>}
  </Cam>;
};

const Step1: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s1'), url = 'claude.ai', typed = url.slice(0, Math.round(url.length * pr(t, C.s1Site + .1, .8)));
  const site = t >= C.s1Site + .8, dl = pr(t, C.s1Dl + .1, 1.3), app = C.s1Reg - .3;
  const cur = curPos(t, [[s.start, 1700, 950], [C.s1Site - .1, 520, 222], [C.s1Site + .9, 640, 330], [C.s1Dl - .45, 790, 706], [C.s1Dl + .4, 790, 706], [C.s1Reg, 1000, 760], [C.s1Code - .45, 410, 300], [C.s1Code + .5, 410, 300], [s.end, 1300, 800]]);
  return <Cam t={t} s={s} push={.025}>
    <Kicker t={t} at={s.start + .05} n={1} title="Скачай Claude" />
    <Phase t={t} a={s.start + .15} b={app + .2}>
      <Frame x={210} y={150} w={1500} h={800}>
        <Browser url={site ? 'claude.ai' : typed} tab={site ? 'Claude' : 'Новая вкладка'} favicon={site ? <Spark size={18} /> : null} caret={t < C.s1Site + .8} t={t}>
          {site && <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 0%, #3a1f12, #151312 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34, ...rise(t, C.s1Site + .8, .6) }}>
            <ClaudeMark t={t} size={104} />
            <div style={{ fontFamily: SANS, fontSize: 30, color: '#bdb6ad' }}>ИИ-помощник для кода, текста и видео</div>
            <div style={{ display: 'flex', gap: 18 }}>
              <div style={{ padding: '20px 44px', borderRadius: 18, background: OR, color: '#170e09', fontFamily: SANS, fontWeight: 700, fontSize: 30, transform: `scale(${1 - .07 * Math.sin(Math.PI * clamp((t - C.s1Dl) / .2))})`, boxShadow: `0 0 ${30 + 60 * decay(t, C.s1Dl, 2.5)}px rgba(238,122,63,.6)` }}>Скачать приложение</div>
              <div style={{ padding: '20px 40px', borderRadius: 18, border: '1.5px solid #4a433d', color: TX, fontFamily: SANS, fontWeight: 600, fontSize: 30, boxShadow: t >= C.s1Web ? `0 0 0 3px ${OR2}` : 'none' }}>Открыть в браузере</div>
            </div>
            {t >= C.s1Dl + .1 && <div style={{ width: 560, padding: '18px 24px', borderRadius: 18, background: 'rgba(36,32,29,.9)', border: '1.5px solid #3b3632', fontFamily: SANS, fontSize: 22, color: TX, ...rise(t, C.s1Dl + .1, .5) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Claude — установка</span><span style={{ color: dl >= 1 ? '#7cc27a' : OR2 }}>{dl >= 1 ? 'готово ✓' : `${Math.round(eio(dl) * 100)}%`}</span></div>
              <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: '#2d2824' }}><div style={{ width: `${eio(dl) * 100}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${OR}, #ffcf7a)` }} /></div></div>}
          </AbsoluteFill>}
        </Browser>
      </Frame>
    </Phase>
    <Phase t={t} a={app} b={s.end + 1}>
      <Frame x={210} y={150} w={1500} h={800} bg="#1a1817">
        <ClaudeApp t={t} tab="code" tabAt={C.s1Code}>
          {t < C.s1Code ? <div style={{ position: 'absolute', left: 300, right: 300, top: 120, display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center' }}>
            <ClaudeMark t={t} size={70} />
            <div style={{ fontFamily: SANS, fontSize: 26, color: '#bdb6ad' }}>Вход в аккаунт</div>
            <div style={{ width: '100%', padding: '20px 26px', borderRadius: 16, border: '1.5px solid #4a433d', background: '#141210', fontFamily: SANS, fontSize: 26, color: TX }}>{'name@mail.com'.slice(0, Math.round(13 * pr(t, C.s1Reg + .1, .9)))}<span style={{ color: OR }}>|</span></div>
            <div style={{ width: '100%', padding: '20px 0', borderRadius: 16, background: '#efe9e2', textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 26, color: '#1a1512' }}>Продолжить с почтой</div>
          </div> : <div style={{ position: 'absolute', left: 60, right: 60, top: 50, fontFamily: MONO, fontSize: 26, lineHeight: 1.8, color: '#cfc8bf' }}>
            {['$ claude', '✳ Claude Code — готов к работе', '  Опиши задачу: я напишу код, соберу и отрендерю видео.', '> _'].map((l, i) => <div key={i} style={{ ...rise(t, C.s1Code + .25 + i * .22, .5), color: i === 1 ? OR2 : undefined }}>{l}</div>)}
          </div>}
        </ClaudeApp>
      </Frame>
      {t >= C.s1Pro && <div style={{ position: 'absolute', right: 150, bottom: 150, padding: '18px 34px', borderRadius: 22, background: 'linear-gradient(160deg,#ff9d5c,#e2622a)', fontFamily: DISP, fontWeight: 600, fontSize: 32, color: '#170e09', boxShadow: '0 20px 60px rgba(238,122,63,.5)', transform: `scale(${popS(t, C.s1Pro)}) rotate(-4deg)` }}>нужна подписка Pro</div>}
    </Phase>
    <Cursor t={t} x={cur[0]} y={cur[1]} hand={(t > C.s1Dl - .35 && t < C.s1Dl + .35) || (t > C.s1Code - .35 && t < C.s1Code + .35)} clicks={[C.s1Site - .05, C.s1Dl, C.s1Code]} o={clamp((t - s.start - .2) / .3)} />
  </Cam>;
};

const Step2: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s2'), tgEnd = C.s2Without - .1;
  const dl = [pr(t, C.s2Pin + 1.1, 1.2), pr(t, C.s2Pin + 1.5, 1.4)];
  const cur = curPos(t, [[s.start, 1600, 950], [C.s2Tg - .4, 470, 330], [C.s2Tg + .3, 470, 330], [C.s2Pin + .6, 735, 444], [C.s2Pin + 1.2, 735, 444], [tgEnd, 1200, 900]]);
  return <Cam t={t} s={s} push={.02}>
    <Kicker t={t} at={s.start + .05} n={2} title="Забери материалы в Telegram" />
    <Phase t={t} a={s.start + .15} b={tgEnd}>
      <Frame x={210} y={150} w={1500} h={800} bg="#0e1621"><Telegram t={t} pinAt={C.s2Pin} postAt={C.s2Pin + .3} dl={dl} /></Frame>
      <Cursor t={t} x={cur[0]} y={cur[1]} hand={(t > C.s2Tg - .3 && t < C.s2Tg + .3) || (t > C.s2Pin + .9 && t < C.s2Pin + 1.4)} clicks={[C.s2Tg, C.s2Pin + 1.1]} />
    </Phase>
    <Phase t={t} a={C.s2Without - .3} b={C.s2Week - .1}>
      <div style={{ position: 'absolute', left: 170, right: 170, top: 190, display: 'flex', gap: 60 }}>
        {[['БЕЗ МАТЕРИАЛОВ', 'просто какое-то видео', C.s2Without, false], ['С НИМИ', "в стиле Rick's Clips", C.s2With, true]].map(([a, b, at, good], i) => (
          <Card key={i} hot={good as boolean} style={{ height: 640, padding: 44, ...rise(t, at as number, .8) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: good ? OR2 : MU }}>{a}</div>
            <div style={{ marginTop: 26, height: 360, borderRadius: 24, overflow: 'hidden', filter: good ? 'none' : 'grayscale(1) blur(7px) brightness(.55)' }}><Img src={staticFile(good ? 'ricks/thumbs/res_2.jpg' : 'ricks/thumbs/res_4.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            <Reveal t={t} at={(at as number) + .2} text={b as string} size={42} weight={600} color={good ? TX : MU} style={{ marginTop: 30 }} />
          </Card>))}
      </div>
    </Phase>
    <Phase t={t} a={C.s2Week - .3} b={C.s2Link - .1}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 280 }}>
        <Reveal t={t} at={C.s2Week - .2} text="7 дней" size={240} weight={700} color={OR2} align="center" style={{ textShadow: '0 0 80px rgba(238,122,63,.45)' }} />
        <Reveal t={t} at={C.s2Week + .4} text="подбора промптов — чтобы ты не тратил своё время" size={40} weight={500} align="center" font={SANS} style={{ marginTop: 20 }} />
      </div>
    </Phase>
    <Phase t={t} a={C.s2Link - .3} b={s.end + 1}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 190, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '30px 56px', borderRadius: 34, background: 'linear-gradient(160deg,#ff9d5c,#e2622a)', color: '#170e09', fontFamily: DISP, fontWeight: 700, fontSize: 66, boxShadow: `0 0 ${70 + 40 * Math.sin(t * 5)}px rgba(238,122,63,.65)`, transform: `scale(${popS(t, C.s2Link - .2) * (1 + .015 * Math.sin(t * 5))})` }}><TgIcon s={72} c="#170e09" />ССЫЛКА В ОПИСАНИИ ↓</div>
        <Reveal t={t} at={C.s2Link + .7} text="и в закреплённом комментарии" size={42} weight={500} font={SANS} align="center" style={{ marginTop: 36 }} />
        {t >= C.s2Pause && <div style={{ marginTop: 70, display: 'flex', alignItems: 'center', gap: 30, ...rise(t, C.s2Pause, .6) }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, border: `4px solid ${TX}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, transform: `scale(${1 + .06 * Math.sin(t * 6)})`, boxShadow: '0 0 40px rgba(255,255,255,.15)' }}><i style={{ width: 16, height: 50, background: TX, borderRadius: 4 }} /><i style={{ width: 16, height: 50, background: TX, borderRadius: 4 }} /></div>
          <Reveal t={t} at={C.s2Pause + .1} text="поставь на паузу и забери" size={56} weight={700} /></div>}
      </div>
    </Phase>
  </Cam>;
};

const PROMPT1 = "Ты — аниматор в стиле Rick's Clips. Изучи материалы и жди ролик-референс.";
const Step3: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s3'), k = (i: number) => pr(t, C.s3Drag + i * .22, .8);
  const sent = t >= C.s3Read;
  const pasted = t >= C.s3Paste && !sent ? PROMPT1.slice(0, Math.round(PROMPT1.length * pr(t, C.s3Paste, .6))) : '';
  return <Cam t={t} s={s} push={.02}>
    <Kicker t={t} at={s.start + .05} n={3} title="Закинь материалы в Claude" />
    <div style={rise(t, s.start + .15, .8)}><Frame x={470} y={150} w={1350} h={800} bg="#1a1817"><ClaudeApp t={t}>
      {!sent && <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center' }}><div style={{ fontFamily: SERIF, fontSize: 52, color: TX, display: 'flex', alignItems: 'center', gap: 18 }}><Spark size={50} t={t} breathe={1} />Чем займёмся?</div></div>}
      {sent && <div style={{ position: 'absolute', right: 60, top: 40, maxWidth: 760, padding: '18px 24px', borderRadius: '24px 24px 6px 24px', background: '#2b2724', fontFamily: SANS, fontSize: 22, lineHeight: 1.45, color: TX, ...rise(t, C.s3Read, .5) }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>{[['doc', 'промпты.txt'], ['img', 'материалы.zip']].map(([g, n]) => <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, background: '#36312d', fontSize: 16 }}><FileGlyph k={g} />{n}</span>)}</div>{PROMPT1}</div>}
      {sent && t >= C.s3Read + .6 && <div style={{ position: 'absolute', left: 60, top: 250, maxWidth: 820, display: 'flex', gap: 16, ...rise(t, C.s3Read + .6, .6) }}><Spark size={34} t={t} breathe={1} /><div style={{ fontFamily: SANS, fontSize: 24, lineHeight: 1.5, color: '#e6dfd7' }}>Понял задачу: делаем ролик в стиле Rick's Clips. Материалы изучил — пришли видео-референс.</div></div>}
      <Composer t={t} text={pasted} caret={t > C.s3Paste && !sent} active={!sent && t >= C.s3Drag + .6} chips={sent ? [] : [[C.s3Drag + .75, 'doc', 'промпты.txt'], [C.s3Drag + .97, 'img', 'материалы.zip']]} />
    </ClaudeApp></Frame></div>
    <div style={rise(t, s.start + .25, .8)}><Frame x={90} y={250} w={340} h={430} bg="#1c1a18">
      <div style={{ padding: '16px 20px', fontFamily: SANS, fontWeight: 600, fontSize: 20, color: MU, borderBottom: '1px solid #2c2926' }}>Загрузки</div>
      {[['doc', 'промпты.txt'], ['img', 'материалы.zip']].map(([g, n], i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', fontFamily: SANS, fontSize: 22, color: TX, opacity: k(i) > 0 && k(i) < 1 ? .3 : 1 }}><FileGlyph k={g} s={1.2} />{n}</div>)}
      {t >= C.s3Copy && <div style={{ margin: '14px 18px', padding: '14px 16px', borderRadius: 14, background: 'rgba(238,122,63,.14)', border: `1.5px solid ${OR}`, fontFamily: MONO, fontSize: 17, color: OR2, ...rise(t, C.s3Copy, .5) }}>Промпт 1 · скопирован ✓</div>}
    </Frame></div>
    {[0, 1].map((i) => { const kk = k(i); if (kk <= 0 || kk >= 1) return null; const e = eio(kk);
      return <div key={i} style={{ position: 'absolute', left: lerp(120, 610 + i * 200, e), top: lerp(330 + i * 66, 800, e) - Math.sin(kk * Math.PI) * 140, padding: '12px 20px', borderRadius: 14, background: '#2f2b28', border: `1.5px solid ${OR}`, display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontSize: 22, color: TX, boxShadow: '0 20px 50px rgba(0,0,0,.5), 0 0 40px rgba(238,122,63,.45)', transform: `rotate(${Math.sin(kk * Math.PI) * (i ? 6 : -6)}deg) scale(${1 + .1 * Math.sin(kk * Math.PI)})` }}><FileGlyph k={i ? 'img' : 'doc'} />{i ? 'материалы.zip' : 'промпты.txt'}</div>; })}
  </Cam>;
};

const Step4: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s4'), fly = pr(t, C.s4Send, .8), parseA = C.s4Parse - .3;
  const cur = curPos(t, [[s.start, 1600, 950], [C.s4Pick - .45, 838, 740], [C.s4Pick + .4, 838, 740], [parseA, 1300, 950]]);
  const labels: [number, string, number, string][] = [[C.s4Hook, 'хук · 0:01', 0, OR], [C.s4Scenes, 'смена сцен', 2, '#ffcf7a'], [C.s4Chars, 'персонажи', 4, '#7cc2ff'], [C.s4Snd, 'звуки', 6, '#ff7aa8']];
  return <Cam t={t} s={s} push={.02}>
    <Kicker t={t} at={s.start + .05} n={4} title="Отправь понравившийся ролик" />
    <Phase t={t} a={s.start + .15} b={parseA + .1}>
      <Frame x={150} y={150} w={1620} h={800} bg="#0f0f0f"><Browser url="youtube.com/@RicksClips/shorts" tab="Rick's Clips — YouTube" favicon={<div style={{ width: 20, height: 14, borderRadius: 4, background: '#ff0033', flex: 'none' }} />}>
        <YouTube t={t} thumbs={THUMBS} selIdx={2} selAt={C.s4Pick} hideIdx={2} grow={fly} /></Browser></Frame>
      {fly > 0 && fly < 1 && <div style={{ position: 'absolute', left: lerp(760, 1450, eio(fly)), top: lerp(700, 860, eio(fly)) - Math.sin(fly * Math.PI) * 260, padding: '16px 26px', borderRadius: 18, background: '#2f2b28', border: `1.5px solid ${OR}`, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 600, fontSize: 28, color: TX, boxShadow: '0 30px 60px rgba(0,0,0,.5), 0 0 50px rgba(238,122,63,.6)', transform: `scale(${lerp(1.15, .8, fly)}) rotate(${Math.sin(fly * Math.PI) * 8}deg)` }}><FileGlyph k="aud" s={1.3} />ролик.mp4 → Claude</div>}
      {t >= C.s4Send + .7 && <div style={{ position: 'absolute', right: 120, bottom: 70, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 26px', borderRadius: 22, background: 'rgba(26,24,23,.92)', border: '1.5px solid #3b3632', ...rise(t, C.s4Send + .7, .5) }}><Spark size={34} t={t} breathe={1} /><span style={{ fontFamily: SANS, fontSize: 24, color: TX }}>Получил ролик, разбираю…</span></div>}
      <Cursor t={t} x={cur[0]} y={cur[1]} hand={t > C.s4Pick - .35 && t < C.s4Pick + .35} clicks={[C.s4Pick]} />
    </Phase>
    <Phase t={t} a={parseA} b={s.end + 1}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170 }}><Reveal t={t} at={parseA + .1} text="Claude разбирает ролик по кадрам" size={58} weight={700} align="center" /></div>
      <div style={{ position: 'absolute', left: 110, right: 110, top: 320, display: 'flex', gap: 14, perspective: 1600 }}>
        {['r1_0', 'r1_1', 'r1_2', 'r1_3', 'r2_0', 'r2_1', 'r2_2', 'r2_3'].map((n, i) => { const k = ex(pr(t, C.s4Parse + i * .07, .6)), lab = labels.find(([at, , idx]) => idx === i && t >= at);
          return <div key={i} style={{ flex: 1, height: 380, borderRadius: 16, overflow: 'hidden', position: 'relative', transform: `translateY(${(1 - k) * 80}px) rotateY(${(1 - k) * -40}deg) scale(${lab ? 1.02 + .04 * decay(t, lab[0], 4) : 1})`, opacity: clamp(k * 1.4), boxShadow: lab ? `0 0 0 3px ${lab[3]}, 0 0 40px ${lab[3]}88` : '0 20px 40px rgba(0,0,0,.5)' }}>
            <Img src={staticFile(`ricks/thumbs/${n}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', left: 8, bottom: 8, fontFamily: MONO, fontSize: 16, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '2px 8px', borderRadius: 6 }}>0:{String(i * 7 + 1).padStart(2, '0')}</div></div>; })}
      </div>
      {labels.map(([at, txt, idx, col], i) => <Pill key={i} t={t} at={at} x={110 + idx * 213 - 10} y={735} accent={col} float={i}>{txt}</Pill>)}
    </Phase>
  </Cam>;
};

const CODE: [string, string][] = [['const', 'Scene = ({ frame }) => {'], ['  const', 'ship = spring({ frame, fps })'], ['  return', "<World sky='sunset'>"], ['', "    <Stickman head='round' mood='shock' />"], ['', '    <Subtitle word={words[i]} />'], ['', '  </World>'], ['', '}'], ['', "voice('Nikolay', script.ru)"], ['', "render('ролик.mp4')"]];
const Step5: React.FC<{ t: number }> = ({ t }) => {
  const s = S('s5'), lt = t - s.start, editA = C.s5Edit - .3;
  const steps: [number, string][] = [[C.s5Script, 'Сценарий'], [C.s5Draw, 'Сцены и персонажи'], [C.s5Voice, 'Озвучка'], [C.s5Subs, 'Субтитры по словам'], [C.s5Build, 'Сборка ролика']];
  const rp = eio(pr(t, C.s5Build, 1.6)), edit = 'сделай быстрее, поменяй голос, добавь шутку';
  return <Cam t={t} s={s} push={.02}>
    <Kicker t={t} at={s.start + .05} n={5} title="Claude делает всё сам" />
    <Phase t={t} a={s.start + .15} b={editA + .1}>
      <div style={{ position: 'absolute', left: 120, top: 190, width: 820, height: 640, perspective: 1800 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: 'rgba(17,15,14,.94)', border: '1.5px solid #2e2a27', padding: '30px 36px', boxSizing: 'border-box', fontFamily: MONO, fontSize: 24, lineHeight: 1.8, overflow: 'hidden', transform: 'rotateY(12deg) rotateX(4deg)', boxShadow: '0 50px 100px rgba(0,0,0,.6)' }}>
          {CODE.slice(0, Math.min(CODE.length, Math.floor(lt / .5) + 1)).map(([kw, rest], i, a) => { const k = ex(pr(t, s.start + i * .5, .4)), last = i === a.length - 1;
            return <div key={i} style={{ opacity: k, transform: `translateX(${(1 - k) * 30}px)`, background: last ? 'rgba(238,122,63,.1)' : 'transparent', borderRadius: 6, whiteSpace: 'pre' }}><span style={{ color: OR }}>{kw} </span><span style={{ color: last ? OR2 : '#d9d2c9' }}>{rest}</span></div>; })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1010, top: 190, width: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map(([at, n], i) => { const done = i < steps.length - 1 ? t >= steps[i + 1][0] : rp >= 1, on = t >= at;
          return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '20px 28px', borderRadius: 22, background: on ? 'rgba(36,31,27,.94)' : 'rgba(20,18,16,.7)', border: `1.5px solid ${on ? (done ? '#5fbf55' : OR) : '#2e2a27'}`, fontFamily: SANS, fontWeight: 600, fontSize: 32, color: on ? TX : '#5a534d', transform: `translateX(${on ? 0 : 20}px) scale(${1 + .03 * decay(t, at, 5)})`, boxShadow: on && !done ? '0 0 40px rgba(238,122,63,.25)' : 'none' }}>
            <span style={{ width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#4fae4e' : on ? 'rgba(238,122,63,.25)' : '#24201d', color: '#fff', fontSize: 22, flex: 'none' }}>{done ? '✓' : on ? <i style={{ width: 14, height: 14, borderRadius: 7, background: OR, transform: `scale(${.8 + .3 * Math.sin(t * 8)})` }} /> : ''}</span>{n}
            {i === 1 && on && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{[0, 1, 2].map((j) => <Img key={j} src={staticFile(`ricks/thumbs/res_${j}.jpg`)} style={{ width: 50, height: 89, objectFit: 'cover', borderRadius: 8, transform: `scale(${popS(t, at + .25 + j * .25)})` }} />)}</div>}
            {i === 2 && on && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, height: 40 }}>{Array.from({ length: 14 }, (_, j) => <i key={j} style={{ width: 5, borderRadius: 3, background: OR2, height: 8 + 30 * Math.abs(Math.sin(t * 7 + j * .9)) * (done ? .3 : 1) }} />)}</div>}
            {i === 4 && on && <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 28, color: rp >= 1 ? '#7cc27a' : OR2 }}>{Math.round(rp * 100)}%</span>}
          </div>; })}
        {t >= C.s5Wait - .2 && <div style={{ marginTop: 10 }}><Reveal t={t} at={C.s5Wait - .2} text="а ты просто ждёшь" size={34} weight={500} font={SANS} color={MU} /></div>}
      </div>
    </Phase>
    <Phase t={t} a={editA} b={s.end + 1}>
      <Frame x={260} y={150} w={1400} h={800} bg="#1a1817"><ClaudeApp t={t}>
        {t >= C.s5Edit + 1.6 && <div style={{ position: 'absolute', right: 60, top: 40, padding: '18px 24px', borderRadius: '24px 24px 6px 24px', background: '#2b2724', fontFamily: SANS, fontSize: 24, color: TX, ...rise(t, C.s5Edit + 1.6, .5) }}>{edit}</div>}
        {t >= Math.max(C.s5Redo, C.s5Edit + 2.2) && <div style={{ position: 'absolute', left: 60, top: 150, maxWidth: 860, display: 'flex', gap: 16, ...rise(t, Math.max(C.s5Redo, C.s5Edit + 2.2), .6) }}><Spark size={34} t={t} breathe={1} /><div style={{ fontFamily: SANS, fontSize: 24, lineHeight: 1.5, color: '#e6dfd7' }}>Готово ✓ Темп быстрее, новый голос и шутка в третьей сцене. Рендер обновлён.</div></div>}
        <Composer t={t} text={t < C.s5Edit + 1.6 ? edit.slice(0, Math.round(edit.length * pr(t, C.s5Edit, 1.3))) : ''} caret={t < C.s5Edit + 1.6} active={t < C.s5Edit + 1.6} />
      </ClaudeApp></Frame>
    </Phase>
  </Cam>;
};

const Result: React.FC<{ t: number }> = ({ t }) => {
  const s = S('rs'), play = t >= C.rsPlay, big = ex(pr(t, C.rsPlay - .4, 1));
  return <Cam t={t} s={s} push={.015}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 60, opacity: 1 - big }}><Reveal t={t} at={s.start + .1} text="Что получилось у меня" size={66} weight={700} align="center" /></div>
    <div style={{ position: 'absolute', left: lerp(250, 120, big), top: lerp(210, 250, big), opacity: 1 - big * .35, ...rise(t, s.start + .3) }}>
      <Phone src="ricks/rick1.mp4" from={10} w={lerp(330, 280, big)} startAt={s.start} label="Rick's Clips" />
    </div>
    <div style={{ position: 'absolute', left: lerp(1340, 960 - 270, big), top: lerp(210, 60, big), ...rise(t, s.start + .5) }}>
      <Phone src="ricks/result.mp4" img={play ? undefined : 'ricks/thumbs/res_0.jpg'} w={lerp(330, 540, big)} muted={!play} volume={play ? 1 : 0} startAt={C.rsPlay} label="моё · через Claude" glow />
    </div>
    <div style={{ position: 'absolute', left: 660, top: 380, width: 600, textAlign: 'center', opacity: 1 - big }}>
      <Reveal t={t} at={s.start + .9} text="Лондонский пивной потоп" size={52} weight={700} align="center" />
      <Reveal t={t} at={s.start + 1.4} text="на русском · в том же стиле" size={30} weight={500} font={SANS} color={OR2} align="center" style={{ marginTop: 24 }} />
    </div>
    {play && <div style={{ position: 'absolute', right: 140, top: 470, ...rise(t, C.rsPlay + .3) }}><div style={{ fontFamily: MONO, fontSize: 22, color: MU, letterSpacing: 3 }}>0 МОНТАЖА</div><div style={{ marginTop: 14 }}><ClaudeMark t={t} size={48} /></div></div>}
  </Cam>;
};

const End: React.FC<{ t: number }> = ({ t }) => {
  const s = S('en'), fade = clamp((t - (DUR - .7)) / .7);
  return <Cam t={t} s={s} push={.04}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center', ...rise(t, s.start) }}><div style={{ transform: `rotate(${t * 25}deg)`, filter: 'drop-shadow(0 0 40px rgba(238,122,63,.8))' }}><Spark size={120} t={t} breathe={1} /></div></div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 290 }}>
      <Reveal t={t} at={C.enAll} text="Все промпты и материалы" size={88} weight={700} align="center" />
      <Reveal t={t} at={C.enAll + .5} text="в моём Telegram" size={88} weight={700} color={OR2} align="center" />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '22px 30px 22px 22px', borderRadius: 32, background: 'rgba(251,248,244,.97)', boxShadow: `0 30px 80px rgba(0,0,0,.5), 0 0 ${50 + 30 * Math.sin(t * 4)}px rgba(238,122,63,.55)`, transform: `scale(${popS(t, C.enLink - .2)})` }}>
        <Img src={staticFile('avatar.jpg')} style={{ width: 104, height: 104, borderRadius: 52, objectFit: 'cover' }} />
        <div><div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 44, color: '#1a1512' }}>@claudecode09</div><div style={{ fontFamily: SANS, fontSize: 26, color: '#7a7168', marginTop: 4 }}>ссылка в описании ↓</div></div>
        <div style={{ marginLeft: 26, padding: '20px 38px', borderRadius: 20, background: t >= C.enSub + .1 ? '#4fae4e' : OR, fontFamily: SANS, fontWeight: 700, fontSize: 32, color: '#170e09', transform: `scale(${1 - .08 * Math.sin(Math.PI * clamp((t - C.enSub) / .2))})` }}>{t >= C.enSub + .1 ? 'Подписан ✓' : 'Подписаться'}</div>
      </div>
    </div>
    <AbsoluteFill style={{ background: '#000', opacity: fade }} />
  </Cam>;
};

// ---------- subtitles: glass pill, words light up one by one
const CH = (() => { const out: any[] = []; let cur: any[] = []; const fl = () => { if (cur.length) out.push(cur); cur = []; };
  TOK.forEach((t, i) => { if (!t.d) return; if (cur.length && TOK[i - 1] && TOK[i - 1].si !== t.si) fl(); cur.push(t); if (/[.!?…:]$/.test(t.d) || cur.length >= 7) fl(); }); fl();
  out.forEach((c, i) => { c.s = c[0].s - .08; c.e = i < out.length - 1 ? Math.min(out[i + 1][0].s - .08, c.at(-1).e + .6) : c.at(-1).e + .6; }); return out; })();
const Subs: React.FC<{ t: number }> = ({ t }) => {
  const ch = CH.find((c) => t >= c.s && t < c.e); if (!ch) return null;
  const k = ex(pr(t, ch.s, .3)), ko = ei(pr(t, ch.e - .15, .15));
  return <div style={{ position: 'absolute', left: 120, right: 120, bottom: 46, textAlign: 'center', opacity: k * (1 - ko), transform: `translateY(${(1 - k) * 14}px)` }}>
    <span style={{ display: 'inline-block', padding: '12px 30px', borderRadius: 22, background: 'rgba(12,10,9,.66)', border: '1px solid rgba(255,255,255,.07)', fontFamily: SANS, fontWeight: 600, fontSize: 40, lineHeight: 1.3, color: TX }}>
      {ch.map((w, i) => { const on = t >= w.s - .03 && (i === ch.length - 1 || t < ch[i + 1].s - .03), seen = t >= w.s - .03, kk = ex(pr(t, w.s - .06, .25));
        return <span key={i} style={{ display: 'inline-block', marginRight: 11, color: on ? OR2 : seen ? TX : 'rgba(239,233,226,.45)', transform: `translateY(${(1 - kk) * 6}px)`, textShadow: on ? '0 0 18px rgba(238,122,63,.6)' : 'none' }}>{w.d}</span>; })}
    </span></div>;
};

const songVol = (t: number) => {
  const talk = TOK.reduce((m, w) => Math.max(m, clamp(1 - Math.max(w.s - .2 - t, t - w.e - .35, 0) / .4)), 0);
  const inResult = t >= C.rsPlay - .4 && t < C.rsPlayEnd + .4 ? 1 : 0;
  return lerp(lerp(.55, .24, talk), .07, inResult) * clamp(t / .8) * clamp((DUR - t) / 2);
};
const COMPS: Record<string, React.FC<{ t: number }>> = { h: Hook, ch: Channel, nd: Need, s1: Step1, s2: Step2, s3: Step3, s4: Step4, s5: Step5, rs: Result, en: End };
const TR = .7; // scene transition (starts on the beat at the cut)
export const Ricks: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const i = Math.max(0, SC.findIndex((x) => t >= x.start && t < x.end)), s = SC[i];
  const k = i ? pr(t, s.start, TR) : 1, e = eio(k);
  const Prev = i ? COMPS[SC[i - 1].id] : null, Cur = COMPS[s.id];
  const subsOn = !(t >= C.rsPlay - .1 && t < C.rsPlayEnd);
  const open = pr(t, 0, .8), sweep = lerp(-30, 110, e);
  return <AbsoluteFill style={{ background: BG }}>
    <Backdrop t={t} />
    {Prev && k < 1 && <AbsoluteFill style={{ transform: `scale(${lerp(1, .9, e)}) translateY(${-e * 30}px)`, filter: `blur(${e * 16}px) brightness(${1 - .55 * e})`, opacity: 1 - ei(k) }}><Prev t={t} /></AbsoluteFill>}
    <AbsoluteFill style={k < 1 ? { clipPath: `inset(${(1 - e) * 18}% ${(1 - e) * 26}% round ${(1 - e) * 80 + 4}px)`, transform: `scale(${lerp(1.08, 1, e)})`, filter: `blur(${(1 - e) * 12}px)`, opacity: clamp(k * 3) } : undefined}><Cur t={t} /></AbsoluteFill>
    {i > 0 && k < 1 && <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${sweep - 18}%, rgba(255,190,140,.22) ${sweep}%, transparent ${sweep + 18}%)`, mixBlendMode: 'screen' }} />}
    {subsOn && <Subs t={t} />}
    <Vig />
    <Grain f={f} />
    <AbsoluteFill style={{ background: '#000', opacity: 1 - open }} />
    {M.voice && <Audio src={staticFile('ricks/voice.wav')} />}
    <Audio src={staticFile(M.song || 'v3/song.wav')} volume={(fr) => songVol(fr / FPS)} />
    <Audio src={staticFile('ricks/sfx.wav')} volume={.45} />
  </AbsoluteFill>;
};
