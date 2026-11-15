// Tools 1-3: ElevenLabs, Figma, Canva
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { TX, T2 as G2, T3 as G3, OR, OR2, CL, DISPLAY, TEXT, WIDE, MONO, SERIF, clamp, lerp, ex, ei, eio, eo, pr, decay, back, popS, rise, fall, rgba, typed, fmt, Title, Words, Eyebrow, Tile, Win, Chip, glass, Spark, IC, Cursor, curPos, Ring, Burst, SketchArrow, LockIcon, win } from './kit';
import { ClaudeShell, UserMsg, AiMsg, Stream, Composer, ToolCall, CB, FigmaUI, SelBox, CanvaUI } from './apps';
import { C, S, SH, Phase, Cam, ToolHead, Funnel, ShowSide, ShowTitle, envAt } from './common';

const HOOK_TXT = 'Вот обычный Клод. Прошу: сделай мне видео. И получаю текст. Совет, как сделать видео самому. А теперь тот же запрос, но с правильными инструментами…';

// ===================== 1 · ElevenLabs
const VOICES = [['Nikolay', 'YouTube · v3', ['#ff9a5c', '#7b3fe4']], ['Denis', 'спокойный', ['#4cc9ff', '#1d3b8f']], ['Anna', 'тёплый', ['#ff6ba8', '#ffb347']], ['Mark', 'диктор', ['#34c759', '#0e7490']]] as const;
const Orb: React.FC<{ c: readonly string[]; s: number; t: number }> = ({ c, s, t }) => <div style={{ width: s, height: s, borderRadius: s / 2, background: `conic-gradient(from ${t * 60}deg, ${c[0]}, ${c[1]}, ${c[0]})`, boxShadow: `inset 0 ${s * .08}px ${s * .15}px rgba(255,255,255,.5)`, flex: 'none' }} />;
const LiveWave: React.FC<{ t: number; n?: number; w: number; h: number; c?: string }> = ({ t, n = 96, w, h, c = '#9aa6ff' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: w / n * .35, width: w, height: h }}>
    {Array.from({ length: n }, (_, i) => { const a = envAt(t - (n - 1 - i) * .028), fade = Math.pow(i / (n - 1), .6); const hh = 6 + (h - 6) * a * (.35 + .65 * fade);
      return <i key={i} style={{ flex: 1, height: hh, borderRadius: 99, background: `linear-gradient(180deg, #ffffff, ${c})`, opacity: .25 + .75 * fade, boxShadow: i > n - 8 ? `0 0 14px ${rgba(c, .7)}` : 'none' }} />; })}
  </div>
);
const STATIC_WAVE = Array.from({ length: 150 }, (_, i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return .15 + .85 * Math.abs(Math.sin(i * .21) * .6 + (x - Math.floor(x)) * .4) * (i % 37 < 3 ? .25 : 1); });
export const T1: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t1'), m = C.t1n + 1.55, [sa, sb] = SH.t1;
  const sel = t < C.t1Pick + .3 ? 0 : 0, hiY = lerp(1, 0, eio(pr(t, C.t1Pick + .05, .5)));
  const p = clamp((t - C.t1Speak) / .6);
  return <Cam t={t} id="t1">
    <ToolHead t={t} i={0} />
    <Phase t={t} a={s.start} b={C.t1Hear - .2} din={.01}>
      <Win t={t} at={m + .05} x={130} y={190} w={1060} h={760} title="Claude" bg={CB.bg} bar="#1f1e1d">
        <ClaudeShell t={t} side={false} title="Озвучка ролика">
          <UserMsg t={t} at={m + .2} text="Напиши текст для ролика и озвучь его" y={30} />
          <AiMsg t={t} at={C.t1Write - .1} y={104} w={940}>
            <div style={{ fontSize: 18, color: CB.sub, marginBottom: 10 }}>Сценарий.txt</div>
            <div style={{ borderRadius: 14, background: '#1f1e1c', border: '1px solid #3a3935', padding: '14px 18px', height: 128, overflow: 'hidden' }}><Stream t={t} at={C.t1Write} text={HOOK_TXT} cps={70} style={{ fontSize: 18, color: '#d9d5cd', lineHeight: 1.55 }} /></div>
          </AiMsg>
          <div style={{ position: 'absolute', left: 106, top: 330, width: 880 }}>
            <ToolCall t={t} at={C.t1Speak - .1} k="el" name="ElevenLabs" action="generate_speech · Nikolay" p={p} accent="#9aa6ff">
              {p >= 1 && <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: '#ece9e4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IC.play(16, '#1d1c1a')}</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, height: 44 }}>{STATIC_WAVE.slice(0, 90).map((v, i) => <i key={i} style={{ flex: 1, height: 4 + 36 * v * ex(pr(t, C.t1Speak + .6 + i * .004, .3)), borderRadius: 2, background: i < (t - C.t1Speak - .7) * 60 ? '#9aa6ff' : '#55534e' }} />)}</div>
                <span style={{ fontFamily: MONO, fontSize: 15, color: CB.sub }}>0:21</span>
              </div>}
            </ToolCall>
          </div>
        </ClaudeShell>
      </Win>
      {t >= C.t1Pick - .3 && <div style={{ position: 'absolute', left: 1240, top: 250, width: 540, borderRadius: 28, ...glass('#9aa6ff'), padding: '24px 22px', ...rise(t, C.t1Pick - .3, .7) }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 20, color: G2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}><Tile k="el" s={30} />Голос</div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: hiY * 0 + 0, height: 84, transform: `translateY(${(1 - eio(pr(t, C.t1Pick + .05, .5))) * 84 * 2}px)`, borderRadius: 18, background: 'rgba(154,166,255,.16)', boxShadow: 'inset 0 0 0 1.5px rgba(154,166,255,.7)' }} />
          {VOICES.map(([n, d, c], i) => <div key={n} style={{ position: 'relative', height: 84, display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', fontFamily: TEXT, ...rise(t, C.t1Pick - .2 + i * .06, .5, 12) }}>
            <Orb c={c} s={52} t={t} /><div style={{ flex: 1 }}><div style={{ fontSize: 24, fontWeight: 600, color: TX }}>{n}</div><div style={{ fontSize: 16, color: G3 }}>{d}</div></div>
            {i === 0 && t >= C.t1Pick + .5 && <div style={{ width: 34, height: 34, borderRadius: 17, background: '#9aa6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${popS(t, C.t1Pick + .5)})` }}>{IC.check(20, '#0b0b1a')}</div>}
          </div>)}
        </div>
      </div>}
    </Phase>
    <Phase t={t} a={C.t1Hear - .25} b={C.t1Free - .2}>
      <div style={{ position: 'absolute', left: 170, top: 210 }}>
        <Eyebrow t={t} at={C.t1Hear - .2} text="ЭТОТ ГОЛОС" color="#9aa6ff" size={24} />
        <Title t={t} at={C.t1Hear - .1} text="Ты слышишь его прямо сейчас" size={88} weight={800} grad={['#ffffff', '#cdd3ff']} glow="#9aa6ff" glowO={.4} sweep={C.t1Hear + .8} style={{ marginTop: 16 }} />
      </div>
      <div style={{ position: 'absolute', left: 170, top: 470, ...rise(t, C.t1Hear, .8) }}><LiveWave t={t} w={1580} h={300} /></div>
      <Chip t={t} at={C.t1Hear + .5} x={170} y={820} accent="#9aa6ff" icon={<Tile k="el" s={34} />}>Nikolay · ElevenLabs · eleven_v3</Chip>
    </Phase>
    <Phase t={t} a={C.t1Free - .25} b={sa}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 190, textAlign: 'center' }}>
        <Eyebrow t={t} at={C.t1Free - .2} text="БЕСПЛАТНО" color="#9aa6ff" size={24} style={{ justifyContent: 'center' }} />
        <div style={{ fontFamily: WIDE, fontWeight: 900, fontSize: 230, lineHeight: 1.05, letterSpacing: '-.03em', marginTop: 10, backgroundImage: 'linear-gradient(180deg, #ffffff 10%, #9aa6ff 95%)', WebkitBackgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 0 40px ${rgba('#9aa6ff', .45)})`, ...rise(t, C.t1Free - .1, .7) }}>{fmt(10000 * eo(pr(t, C.t1Free, 1.5)))}</div>
        <Words t={t} at={C.t1Num + .1} text="символов в месяц" size={48} color={G2} align="center" style={{ marginTop: 6 }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center', gap: 26 }}>
        {['tools/thA.jpg', 'tools/thB.jpg', 'tools/thC.jpg', 'tools/thYT.jpg'].map((src, i) => { const k = popS(t, C.t1Enough + i * .12, .55);
          return <div key={i} style={{ position: 'relative', width: 280, height: 158, borderRadius: 16, overflow: 'hidden', transform: `scale(${k}) translateY(${(1 - k) * 30}px)`, opacity: clamp(k * 2), boxShadow: '0 20px 50px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.1)' }}>
            <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', right: 10, top: 10, width: 34, height: 34, borderRadius: 17, background: '#34c759', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${popS(t, C.t1Enough + .3 + i * .12)})` }}>{IC.check(20)}</div>
          </div>; })}
      </div>
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <Win t={t} at={sa - .05} x={110} y={190} w={1120} h={720} title="ElevenLabs — Text to Speech" bg="#ffffff" bar="#f4f4f5" light>
        <div style={{ position: 'absolute', left: 0, top: 0, right: 330, bottom: 110, padding: '30px 36px', fontFamily: TEXT }}>
          {['Вот обычный Клод.', 'Прошу: сделай мне видео.', 'И получаю текст.', 'Совет, как сделать видео самому.', 'А теперь тот же запрос,', 'но с правильными инструментами.'].map((l, i) => { const on = Math.floor((t - sa - .3) / 1.15) === i;
            return <div key={i} style={{ fontSize: 27, lineHeight: 1.55, color: on ? '#0b0b0f' : '#8a8a92', fontWeight: on ? 600 : 500, background: on ? 'rgba(154,166,255,.18)' : 'transparent', borderRadius: 8, padding: '0 8px', margin: '0 -8px', ...rise(t, sa + .1 + i * .07, .5, 10) }}>{l}</div>; })}
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 110, width: 330, borderLeft: '1px solid #ececef', padding: '26px 24px', fontFamily: TEXT }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Orb c={VOICES[0][2]} s={56} t={t} /><div><div style={{ fontSize: 22, fontWeight: 700, color: '#0b0b0f' }}>Nikolay</div><div style={{ fontSize: 15, color: '#8a8a92' }}>Eleven v3</div></div></div>
          {[['Стабильность', .5], ['Сходство', .75], ['Стиль', .15]].map(([n, v], i) => <div key={i} style={{ marginTop: 30 }}><div style={{ fontSize: 16, color: '#55555c', marginBottom: 10 }}>{n as string}</div><div style={{ height: 6, borderRadius: 3, background: '#e7e7ea', position: 'relative' }}><div style={{ width: `${(v as number) * 100 * ex(pr(t, sa + .3 + i * .1, .8))}%`, height: '100%', borderRadius: 3, background: '#111' }} /><i style={{ position: 'absolute', left: `calc(${(v as number) * 100 * ex(pr(t, sa + .3 + i * .1, .8))}% - 10px)`, top: -7, width: 20, height: 20, borderRadius: 10, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }} /></div></div>)}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, borderTop: '1px solid #ececef', display: 'flex', alignItems: 'center', gap: 20, padding: '0 30px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{IC.play(22)}</div>
          <div style={{ flex: 1, height: 60, display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>{STATIC_WAVE.map((v, i) => <i key={i} style={{ flex: 1, height: 6 + 48 * v, borderRadius: 2, background: i / 150 < (t - sa) / (sb - sa) ? '#111' : '#d4d4d8' }} />)}</div>
          <span style={{ fontFamily: MONO, fontSize: 16, color: '#55555c' }}>0:{String(Math.min(59, Math.floor((t - sa) * 2.2))).padStart(2, '0')} / 3:25</span>
        </div>
      </Win>
      <ShowSide t={t} id="t1" title="Озвучка за минуту" sub="голос Nikolay · модель Eleven v3 · на русском" />
      <Funnel t={t} id="t1" />
    </Phase>
  </Cam>;
};

// ===================== 2 · Figma: the thumbnail assembles layer by layer
const DOTS: React.CSSProperties = { backgroundImage: 'radial-gradient(rgba(60,40,20,.07) 2px, transparent 2.5px)', backgroundSize: '30px 30px' };
const ThumbB: React.FC<{ t: number; L: number[]; dragX: number }> = ({ t, L, dragX }) => {
  const k = (i: number) => (t >= L[i] ? ex(pr(t, L[i], .55)) : 0), pk = (i: number) => popS(t, L[i], .6);
  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#ffffff' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, #fffaf3, #f1e6d8 70%, #e6d6c3)', opacity: k(0) }}><div style={{ position: 'absolute', inset: 0, ...DOTS }} /></div>
    <div style={{ position: 'absolute', left: 54 + dragX, top: 70, opacity: k(1), transform: `translateY(${(1 - k(1)) * 30}px)` }}>
      <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 128, lineHeight: .98, color: '#16110d', letterSpacing: -1 }}>СКОПИРОВАЛ</div>
      <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 128, lineHeight: .98, color: '#ee5f24', letterSpacing: -1, textShadow: '0 5px 0 #a8380f' }}>RICK'S CLIPS</div>
    </div>
    <div style={{ position: 'absolute', left: 765, top: 175, width: 250, height: 330, borderRadius: 24, overflow: 'hidden', transform: `rotate(-8deg) scale(${pk(2)})`, boxShadow: '0 24px 50px rgba(60,40,20,.35)', border: '6px solid #fff' }}>
      <Img src={staticFile('tools/k22.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 38%' }} />
      <div style={{ position: 'absolute', left: 10, top: 10, padding: '6px 14px', borderRadius: 12, background: 'rgba(0,0,0,.7)', color: '#fff', fontFamily: DISPLAY, fontWeight: 800, fontSize: 18 }}>оригинал</div>
    </div>
    <div style={{ position: 'absolute', left: 950, top: 70, width: 300, height: 540, borderRadius: 42, padding: 10, background: '#16110d', transform: `rotate(5deg) scale(${pk(3)})`, boxShadow: '0 34px 70px rgba(60,40,20,.45)' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', position: 'relative' }}><Img src={staticFile('tools/m16.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', left: 12, top: 12, padding: '6px 14px', borderRadius: 12, background: '#ee7a3f', color: '#170e09', fontFamily: DISPLAY, fontWeight: 800, fontSize: 18 }}>моё</div></div>
    </div>
    <div style={{ position: 'absolute', left: 54 + dragX, top: 352, opacity: k(4), transform: `translateY(${(1 - k(4)) * 20}px)`, display: 'inline-flex', padding: '16px 26px', borderRadius: 20, background: '#16110d', color: '#fff', fontFamily: DISPLAY, fontWeight: 800, fontSize: 40 }}>одним промптом в Claude</div>
    <div style={{ position: 'absolute', left: 58, top: 560, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px 12px 14px', borderRadius: 40, background: '#fff', boxShadow: '0 10px 30px rgba(60,40,20,.2)', fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, color: '#16110d', transform: `scale(${pk(4)})`, transformOrigin: '0 50%' }}>
      <span style={{ width: 44, height: 44, borderRadius: 22, background: '#21b25b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IC.check(26)}</span>без монтажа · 0 ₽</div>
    <div style={{ position: 'absolute', left: 885, top: 470, transform: `rotate(-12deg) scale(${pk(5)})` }}><Tile k="claude" s={150} /></div>
    {t >= L[5] && <svg width={300} height={160} style={{ position: 'absolute', left: 600, top: 470, overflow: 'visible' }}><path d="M10 120 C 90 150, 190 120, 250 40" stroke="#2f6bff" strokeWidth={9} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - eo(pr(t, L[5], .5))} /><path d="M222 46 L252 34 L262 66" stroke="#2f6bff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={pr(t, L[5] + .4, .1)} /></svg>}
  </div>;
};
export const T2: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t2'), m = C.t2n + 1.55, [sa, sb] = SH.t2;
  const L = [0, 1, 2, 3, 4, 5].map((i) => C.t2Build + .05 + i * .36);
  const BOX = [[0, 0, 1280, 720, 'Фон'], [54, 70, 690, 260, 'Заголовок'], [740, 150, 300, 380, 'Фото · оригинал'], [930, 50, 350, 590, 'Фото · моё'], [54, 350, 600, 290, 'Плашки'], [590, 430, 480, 260, 'Стрелка + иконка']] as const;
  const layers = [['Фон', '▭'], ['Заголовок', 'T'], ['Фото · оригинал', '▣'], ['Фото · моё', '▣'], ['Плашки', '▭'], ['Стрелка', '↗']].map(([n, kk], i) => ({ at: L[i], name: n, kind: kk }));
  const cur = L.reduce((a, x, i) => (t >= x ? i : a), -1);
  const dragA = C.t2Fix + .15, dragX = 26 * eio(pr(t, dragA + .25, .6));
  const fixing = t >= C.t2Fix - .1;
  const sc = .78, fx = 96, fy = 72;
  const curK: [number, number, number][] = [[C.t2Fix - .6, 900, 640], [dragA, fx + 300 * sc, fy + 150 * sc], [dragA + .25, fx + 300 * sc, fy + 150 * sc], [dragA + .85, fx + 326 * sc, fy + 150 * sc], [sa, fx + 360 * sc, fy + 230 * sc]];
  const [cx, cy] = curPos(t, curK);
  return <Cam t={t} id="t2">
    <ToolHead t={t} i={1} />
    <Phase t={t} a={s.start} b={sa} din={.01}>
      {t < m + .2 && <><Chip t={t} at={C.t2Cov} x={980} y={720} out={m - .2} accent="#b07bff">обложки</Chip><Chip t={t} at={C.t2Ban} x={1220} y={720} out={m - .15} accent="#ff7262" float={1}>баннеры</Chip><Chip t={t} at={C.t2Des} x={1460} y={720} out={m - .1} accent="#1abcfe" float={2}>дизайн</Chip></>}
      <Win t={t} at={m + .05} x={110} y={190} w={1700} h={790} title="Figma" bg="#1e1e1e" bar="#2c2c2c">
        <FigmaUI t={t} layers={layers} sel={fixing ? 1 : cur} props={[['X', fixing ? String(Math.round(54 + dragX)) : '54'], ['Y', '70'], ['W', '690'], ['H', '260'], ['Шрифт', 'Oswald 700'], ['Размер', '128']]}>
          <div style={{ position: 'absolute', left: fx, top: fy - 26, fontFamily: TEXT, fontSize: 13, color: '#9a9a9a' }}>Thumbnail 1280×720</div>
          <div style={{ position: 'absolute', left: fx, top: fy, width: 1280, height: 720, transform: `scale(${sc})`, transformOrigin: '0 0', boxShadow: '0 10px 40px rgba(0,0,0,.5)' }}>
            <ThumbB t={t} L={t >= L[0] ? L : [1e9, 1e9, 1e9, 1e9, 1e9, 1e9]} dragX={dragX} />
          </div>
          {!fixing && cur >= 0 && t < L[cur] + .9 && (() => { const [x, y, w, h, lb] = BOX[cur]; return <SelBox x={fx + x * sc} y={fy + y * sc} w={w * sc} h={h * sc} label={lb} o={1 - pr(t, L[cur] + .6, .3)} />; })()}
          {fixing && <SelBox x={fx + (54 + dragX) * sc} y={fy + 70 * sc} w={690 * sc} h={260 * sc} label={`X: ${Math.round(54 + dragX)}`} />}
          {t >= C.t2Fix - .6 && <Cursor t={t} x={cx} y={cy} hand={t > dragA - .1} clicks={[dragA + .2]} />}
          {t >= C.t2Write - .2 && <div style={{ position: 'absolute', right: 24, top: 18, width: 380, borderRadius: 18, background: '#262624', border: '1px solid #3d3c38', padding: '14px 16px', fontFamily: TEXT, ...rise(t, C.t2Write - .2, .5, 14), boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#9c9a92', marginBottom: 8 }}><Spark size={16} color={CL} />Claude · Figma</div>
            <div style={{ fontSize: 18, color: '#ece9e4', minHeight: 26 }}>{typed('Сделай обложку для ролика', t, C.t2Write, .8)}</div>
            {t >= C.t2Build - .2 && <div style={{ fontSize: 15, color: t >= L[5] + .5 ? '#7bd389' : OR2, marginTop: 8 }}>{t >= L[5] + .5 ? '✓ 6 слоёв готово' : `Собираю по слоям… ${Math.max(0, cur + 1)}/6`}</div>}
          </div>}
        </FigmaUI>
      </Win>
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <AbsoluteFill style={{ perspective: 2000 }}>
        {[['tools/thA.jpg', -1], ['tools/thC.jpg', 1], ['tools/thB.jpg', -2], ['tools/thYT.jpg', 0]].map(([src, pos], i) => { const p = pos as number, k = ex(pr(t, sa + i * .12, 1)), sw = Math.sin((t - sa) * .35) * 5;
          if (p === -2) return null;
          return <div key={i} style={{ position: 'absolute', left: 660 + p * 560, top: 210 - (p === 0 ? 20 : 0), width: 600, height: 338, borderRadius: 20, overflow: 'hidden', transform: `translateZ(${p === 0 ? 120 : -60}px) rotateY(${-p * 24 + sw}deg) translateY(${(1 - k) * 120}px)`, opacity: clamp(k * 1.5), zIndex: p === 0 ? 3 : 1, boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)' }}>
            <Img src={staticFile(src as string)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${lerp(-40, 140, pr(t, sa + .8 + i * .2, 1.6)) - 20}%, rgba(255,255,255,.28) ${lerp(-40, 140, pr(t, sa + .8 + i * .2, 1.6))}%, transparent ${lerp(-40, 140, pr(t, sa + .8 + i * .2, 1.6)) + 20}%)` }} />
          </div>; })}
      </AbsoluteFill>
      <ShowTitle t={t} id="t2" text="Обложки, которые собрал Claude" sub="для прошлого ролика — по референсам и по слоям" x={150} y={770} size={60} />
      <Funnel t={t} id="t2" />
    </Phase>
  </Cam>;
};

// ===================== 3 · Canva
const PostD: React.FC<{ t: number; at: number; s: number }> = ({ t, at, s }) => {
  const e = (i: number) => popS(t, at + i * .22, .55);
  return <div style={{ width: s, height: s, borderRadius: s * .04, overflow: 'hidden', position: 'relative', background: 'linear-gradient(150deg, #ff9a5c, #e8532a 45%, #7d2ae8)', boxShadow: '0 20px 50px rgba(0,0,0,.35)' }}>
    <div style={{ position: 'absolute', left: s * .08, top: s * .08, right: s * .08, fontFamily: DISPLAY, fontWeight: 800, fontSize: s * .12, lineHeight: 1, color: '#fff', letterSpacing: '-.03em', transform: `scale(${e(0)})`, transformOrigin: '0 0' }}>10 инструментов для Claude</div>
    <div style={{ position: 'absolute', left: s * .08, top: s * .46, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: s * .025 }}>{(['el', 'figma', 'canva', 'vidiq', 'notion', 'github', 'brag', 'docs', 'skill', 'research'] as const).map((k, i) => <div key={k} style={{ transform: `scale(${popS(t, at + .3 + i * .04, .5)})` }}><Tile k={k} s={s * .14} /></div>)}</div>
    <div style={{ position: 'absolute', left: s * .08, bottom: s * .08, padding: `${s * .025}px ${s * .05}px`, borderRadius: 99, background: '#fff', color: '#16110d', fontFamily: TEXT, fontWeight: 700, fontSize: s * .05, transform: `scale(${e(3)})`, transformOrigin: '0 50%' }}>сохрани ↓</div>
  </div>;
};
const StoryD: React.FC<{ t: number; at: number; w: number }> = ({ t, at, w }) => (
  <div style={{ width: w, height: w * 16 / 9, borderRadius: w * .06, overflow: 'hidden', position: 'relative', background: 'radial-gradient(ellipse at 50% 20%, #5a2a14, #0d0b0a 70%)', boxShadow: '0 20px 50px rgba(0,0,0,.35)', fontFamily: TEXT }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: w * .3, textAlign: 'center', fontFamily: WIDE, fontWeight: 900, fontSize: w * .42, color: '#ffb27a', textShadow: '0 0 30px rgba(255,138,76,.7)' }}>11</div>
    <div style={{ position: 'absolute', left: w * .38, top: w * .82, transform: `scale(${popS(t, at + .3)})` }}><LockIcon s={w * .24} c="#fff" /></div>
    <div style={{ position: 'absolute', left: w * .1, right: w * .1, top: w * 1.18, textAlign: 'center', fontSize: w * .085, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>мой скилл — в Telegram</div>
    <div style={{ position: 'absolute', left: w * .15, right: w * .15, bottom: w * .12, padding: `${w * .04}px 0`, borderRadius: 99, background: '#41b4ec', textAlign: 'center', fontSize: w * .07, fontWeight: 700, color: '#fff' }}>Забрать</div>
  </div>
);
const SlideD: React.FC<{ t: number; at: number; w: number }> = ({ t, at, w }) => (
  <div style={{ width: w, height: w * 9 / 16, borderRadius: w * .02, overflow: 'hidden', position: 'relative', background: '#fbfaf8', boxShadow: '0 20px 50px rgba(0,0,0,.35)', fontFamily: TEXT, padding: w * .06, boxSizing: 'border-box' }}>
    <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: w * .06, color: '#16110d', letterSpacing: '-.03em' }}>Коннекторы и скиллы</div>
    <div style={{ display: 'flex', gap: w * .04, marginTop: w * .04 }}>{[['#4f8cff', 'Коннекторы', 'руки Claude'], [OR, 'Скиллы', 'его навыки']].map(([c, a, b], i) => <div key={i} style={{ flex: 1, borderRadius: w * .02, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,.08)', padding: w * .03, transform: `scale(${popS(t, at + .2 + i * .15)})` }}>
      <i style={{ display: 'block', width: w * .06, height: w * .06, borderRadius: w * .015, background: c }} /><div style={{ fontWeight: 700, fontSize: w * .04, color: '#16110d', marginTop: w * .02 }}>{a}</div><div style={{ fontSize: w * .03, color: '#7a7168' }}>{b}</div></div>)}</div>
  </div>
);
export const T3: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t3'), m = C.t3n + 1.55, [sa, sb] = SH.t3;
  const easy = ex(pr(t, C.t3Easy - .1, .6));
  return <Cam t={t} id="t3">
    <ToolHead t={t} i={2} until={m - .25} />
    <Phase t={t} a={s.start} b={C.t3Posts - .2} din={.01}>
      {t >= m - .3 && <>
        <div style={{ position: 'absolute', left: 520, top: 360, textAlign: 'center', transform: `scale(${lerp(1, .82, easy)})`, opacity: lerp(1, .45, easy), ...rise(t, m - .3, .7) }}>
          <Tile k="figma" s={220} /><div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: G2, marginTop: 24 }}>сложнее</div>
        </div>
        <div style={{ position: 'absolute', left: 880, top: 430, fontFamily: DISPLAY, fontWeight: 800, fontSize: 70, color: G3, ...rise(t, m - .1, .6) }}>vs</div>
        <div style={{ position: 'absolute', left: 1180, top: 360, textAlign: 'center', transform: `scale(${lerp(1, 1.15, easy)})`, ...rise(t, m - .2, .7) }}>
          <Tile k="canva" s={220} glow={easy} /><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, color: easy > .5 ? '#5ee7ec' : G2, marginTop: 24 }}>проще</div>
          <Ring t={t} at={C.t3Easy} x={110} y={110} r={200} color="#22d3d8" />
        </div>
      </>}
    </Phase>
    <Phase t={t} a={C.t3Posts - .25} b={sa}>
      <Win t={t} at={C.t3Posts - .25} x={150} y={180} w={1620} h={800} title="Canva" bg="#ebecf0" bar="#f6f6f8" light>
        <CanvaUI t={t} tplAt={C.t3Posts - .1}>
          <div style={{ position: 'absolute', left: 60, top: 120, transform: `scale(${popS(t, C.t3Posts, .6)})`, transformOrigin: '50% 60%' }}>
            {t >= C.t3Build ? <PostD t={t} at={C.t3Build + .1} s={400} /> : <div style={{ width: 400, height: 400, borderRadius: 16, background: 'linear-gradient(150deg, #ff9a5c, #e8532a 45%, #7d2ae8)', opacity: .5 }} />}
            <div style={{ fontFamily: TEXT, fontSize: 16, color: '#55555c', marginTop: 12 }}>Пост · 1080×1080</div>
          </div>
          <div style={{ position: 'absolute', left: 510, top: 60, transform: `scale(${popS(t, C.t3Stories, .6)})`, transformOrigin: '50% 60%' }}><StoryD t={t} at={C.t3Stories} w={250} /><div style={{ fontFamily: TEXT, fontSize: 16, color: '#55555c', marginTop: 12 }}>Сторис · 9:16</div></div>
          <div style={{ position: 'absolute', left: 820, top: 170, transform: `scale(${popS(t, C.t3Pres, .6)})`, transformOrigin: '50% 60%' }}><SlideD t={t} at={C.t3Pres} w={380} /><div style={{ fontFamily: TEXT, fontSize: 16, color: '#55555c', marginTop: 12 }}>Слайд · 16:9</div></div>
          {t >= C.t3Desc - .2 && <div style={{ position: 'absolute', left: 60, right: 60, bottom: 30, height: 66, borderRadius: 18, background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,.15), 0 0 0 2px #7d2ae8', display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', fontFamily: TEXT, fontSize: 20, color: '#1d1d1f', ...rise(t, C.t3Desc - .2, .5, 16) }}>
            <Spark size={24} color={CL} />{typed('Пост: 10 инструментов для Claude, оранжевый стиль', t, C.t3Desc, 1.1)}<span style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(90deg, #00c4cc, #7d2ae8)', color: '#fff', fontWeight: 600, fontSize: 16 }}>Создать</span></div>}
        </CanvaUI>
      </Win>
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <div style={{ position: 'absolute', left: 170, top: 180, transform: `translateY(${Math.sin((t - sa) * .8) * 8}px) rotate(-3deg)`, ...rise(t, sa, .9) }}><PostD t={t} at={-10} s={500} /></div>
      <div style={{ position: 'absolute', left: 760, top: 150, transform: `translateY(${Math.sin((t - sa) * .8 + 1) * 8}px)`, ...rise(t, sa + .15, .9) }}><StoryD t={t} at={-10} w={300} /></div>
      <div style={{ position: 'absolute', left: 1140, top: 250, transform: `translateY(${Math.sin((t - sa) * .8 + 2) * 8}px) rotate(3deg)`, ...rise(t, sa + .3, .9) }}><SlideD t={t} at={-10} w={620} /></div>
      <ShowTitle t={t} id="t3" text="Посты, сторис и слайды" sub="из одного описания" x={1140} y={680} size={60} />
      <Funnel t={t} id="t3" />
    </Phase>
  </Cam>;
};
