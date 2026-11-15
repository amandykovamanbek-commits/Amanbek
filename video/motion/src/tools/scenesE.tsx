// Bonus (Claude Code + Remotion), top-3, finale with the locked 11th skill and the Telegram CTA
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { TX, T2, T3, OR, OR2, CL, GRN, RED, DISPLAY, TEXT, WIDE, MONO, clamp, lerp, ex, ei, eio, eo, pr, decay, back, popS, rise, rgba, typed, impulse, Title, Words, Eyebrow, BigNum, Tile, Win, Chip, glass, Spark, IC, Ring, Burst, SketchArrow, LockIcon, TgBadge, TgIcon, Flash, Cursor, curPos } from './kit';
import { ClaudeShell, Composer, CB, Term, FileChip, TG, TgFile } from './apps';
import { C, S, SH, SC, DUR, Phase, Cam, Funnel, ShowSide, TOOLS } from './common';
import { FPS } from './timeline';

const SCENE_NAMES: Record<string, string> = { h: 'Хук', ex: 'Коннекторы и скиллы', t1: 'ElevenLabs', t2: 'Figma', t3: 'Canva', t4: 'vidIQ', t5: 'Notion', t6: 'GitHub', mid: 'Шпаргалка', t7: 'brag-slim', t8: 'Документы', t9: 'skill-creator', t10: 'deep-research', bn: 'Бонус', top: 'Топ-3', en: 'Финал' };
const SCENE_COL = ['#ff8a4c', '#ff8a4c', '#9aa6ff', '#b07bff', '#22d3d8', '#4f8cff', '#bdb8b0', '#3fb950', '#3aa7e8', '#ff7a45', '#ff5f57', '#ff8a4c', '#38bdf8', '#4f8cff', '#ffb347', '#3aa7e8'];
export const FILES: [string, number][] = [['src/tools/Tools.tsx', 37], ['src/tools/scenesA–E.tsx', 1045], ['src/tools/kit.tsx', 226], ['src/tools/apps.tsx', 174], ['src/tools/common.tsx', 161], ['src/tools/timeline.ts', 110], ['public/tools/voice.wav', 0], ['public/tools/sfx.wav', 0]];
const CODE: [string, string][][] = [
  [['export const ', OR], ['Hook', '#f1c27d'], [' = ({ t }) => (', TX]],
  [['  <', T3], ['BigNum', '#7fd3ff'], [' value', OR2], ['=', T3], ['"10"', '#9fd49a'], [' size', OR2], ['={400}', TX]],
  [['    sweep', OR2], ['={C.hTen}', TX], [' chroma', OR2], ['={[C.hTen]}', TX], [' />', T3]],
  [[');', TX]],
  [['', TX]],
  [['// каждая анимация — функция времени', '#6e6e73']],
  [['const ', OR], ['k', TX], [' = ', T3], ['ex', '#f1c27d'], ['(', TX], ['pr', '#f1c27d'], ['(t, at, ', TX], ['.8', '#c9a0ff'], ['));', TX]],
];
const Timeline: React.FC<{ t: number; w: number; playT: number; big?: boolean }> = ({ t, w, playT, big }) => {
  const tot = DUR; const h = big ? 64 : 38;
  return <div style={{ position: 'relative', width: w }}>
    <div style={{ display: 'flex', gap: 3, height: h }}>
      {SC.map((s, i) => <div key={s.id} style={{ width: (s.end - s.start) / tot * w - 3, height: h, borderRadius: 8, background: rgba(SCENE_COL[i], s.id === 'bn' ? .55 : .28), boxShadow: s.id === 'bn' ? `inset 0 0 0 2px ${SCENE_COL[i]}` : 'none', overflow: 'hidden', padding: big ? '8px 8px' : '4px 6px', boxSizing: 'border-box', fontFamily: TEXT, fontWeight: 600, fontSize: big ? 14 : 11, color: TX, whiteSpace: 'nowrap', transform: `scaleY(${ex(pr(t, (big ? C.bnWhole + .05 : C.bnMode) + i * .04, .4))})` }}>{(s.end - s.start) / tot * w > 50 ? SCENE_NAMES[s.id] : ''}</div>)}
    </div>
    <div style={{ display: 'flex', gap: 3, height: h * .5, marginTop: 6 }}>{Array.from({ length: 60 }, (_, i) => <i key={i} style={{ flex: 1, borderRadius: 3, background: 'rgba(154,166,255,.35)', height: `${30 + 70 * Math.abs(Math.sin(i * 1.7))}%`, alignSelf: 'center' }} />)}</div>
    <div style={{ position: 'absolute', left: playT / tot * w, top: -10, bottom: -6, width: 2, background: OR, boxShadow: `0 0 10px ${OR}` }}><i style={{ position: 'absolute', left: -7, top: -6, width: 16, height: 12, borderRadius: 3, background: OR }} /></div>
  </div>;
};
export const Bonus: React.FC<{ t: number }> = ({ t }) => {
  const s = S('bn'), [sa, sb] = SH.bn;
  const rp = clamp((t - C.bnTurns) / Math.max(.6, C.bnVideo - C.bnTurns));
  const slash = eo(pr(t, C.bnNoAE + .2, .45));
  return <Cam t={t} id="bn">
    <Phase t={t} a={s.start} b={C.bnMode - .15}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center' }}><Eyebrow t={t} at={C.bnBonus - .2} text="БОНУС" size={26} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 80 }}>
        {[['cc', 'Claude Code', C.bnCC], ['remotion', 'Remotion', C.bnRem]].map(([k, n, at], i) => { const kk = back(pr(t, (at as number) - .1, .7));
          return <React.Fragment key={i}>{i === 1 && <div style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: 120, color: T3, opacity: clamp(kk * 2) }}>+</div>}
            <div style={{ textAlign: 'center', transform: `scale(${kk})`, opacity: clamp(kk * 2) }}><Tile k={k as any} s={230} glow={1} /><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, color: TX, marginTop: 36, letterSpacing: '-.03em' }}>{n as string}</div></div></React.Fragment>; })}
      </div>
    </Phase>
    <Phase t={t} a={C.bnMode - .2} b={C.bnWhole - .15}>
      <Win t={t} at={C.bnMode - .2} x={90} y={180} w={880} h={760} title="Claude Code" bg="#141210" bar="#1c1a17">
        <Term t={t} fontSize={20} lines={[
          { at: C.bnMode, text: 'собери ролик по сценарию и озвучке', prompt: true, d: .9, c: '#fff' },
          { at: C.bnFiles - .2, text: '  ✓ src/tools/timeline.ts', c: '#9fd49a' }, { at: C.bnFiles, text: '  ✓ src/tools/scenes*.tsx', c: '#9fd49a' }, { at: C.bnFiles + .2, text: '  ✓ public/tools/voice.wav', c: '#9fd49a' },
        ]}>
          <div style={{ marginTop: 18, padding: '16px 18px', borderRadius: 12, background: '#1c1916', border: '1px solid #2e2a26' }}>
            {CODE.map((ln, i) => { const at = C.bnWrites + i * .22; if (t < at) return null; const full = ln.map((x) => x[0]).join(''); const n = Math.round(full.length * clamp((t - at) / .2)); let acc = 0;
              return <div key={i} style={{ whiteSpace: 'pre', minHeight: 30 }}>{ln.map(([txt, c], j) => { const from = acc; acc += txt.length; const vis = txt.slice(0, Math.max(0, n - from)); return <span key={j} style={{ color: c }}>{vis}</span>; })}</div>; })}
          </div>
        </Term>
      </Win>
      <Win t={t} at={C.bnRem2 - .4} x={1010} y={180} w={820} h={760} title="Remotion Studio" bg="#0f1115" bar="#171a20">
        <div style={{ position: 'absolute', left: 30, top: 24, width: 760, height: 428, borderRadius: 12, overflow: 'hidden', background: '#050506', boxShadow: '0 0 0 1px rgba(255,255,255,.08)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%, rgba(255,138,76,.45), transparent 60%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center' }}><BigNum t={t} at={C.bnWrites + .8} value="10" from="00" size={170} sweep={C.bnWrites + 1.8} /></div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', gap: 8 }}>{TOOLS.map((tl, i) => <div key={tl.id} style={{ transform: `scale(${popS(t, C.bnWrites + 1.2 + i * .06)})` }}><Tile k={tl.k} s={40} /></div>)}</div>
        </div>
        <div style={{ position: 'absolute', left: 30, top: 476 }}><Timeline t={t} w={760} playT={lerp(10, 16, pr(t, C.bnRem2, 4))} /></div>
        <div style={{ position: 'absolute', left: 30, right: 30, top: 610 }}>
          {t >= C.bnTurns && <div style={{ ...rise(t, C.bnTurns, .4, 10) }}><div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 16, color: '#9aa0ad', marginBottom: 8 }}><span>npx remotion render Tools</span><span style={{ color: rp >= 1 ? '#9fd49a' : OR2 }}>{Math.round(rp * 100)}%</span></div>
            <div style={{ height: 8, borderRadius: 4, background: '#232733', overflow: 'hidden' }}><div style={{ width: `${rp * 100}%`, height: '100%', background: rp >= 1 ? '#5ac46a' : `linear-gradient(90deg, #4f8cff, ${OR})` }} /></div></div>}
        </div>
      </Win>
      <Chip t={t} at={C.bnFree} x={1300} y={130} accent="#4f8cff" icon={<Tile k="remotion" s={30} />}>бесплатная библиотека</Chip>
      {t >= C.bnVideo - .1 && <div style={{ position: 'absolute', left: 1460, top: 860, transform: `scale(${popS(t, C.bnVideo - .1)})`, transformOrigin: '0 50%' }}><FileChip name="tools.mp4" meta="1920×1080 · готово ✓" color="#4f8cff" label="MP4" /></div>}
    </Phase>
    <Phase t={t} a={C.bnWhole - .2} b={sa}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 200 }}><Title t={t} at={C.bnWhole - .1} text="Весь этот ролик — код" size={110} weight={800} align="center" grad={['#ffffff', '#cfd9ff']} glow="#4f8cff" glowO={.35} sweep={C.bnWhole + .8} /></div>
      <div style={{ position: 'absolute', left: 160, top: 430, ...rise(t, C.bnWhole, .8) }}><Timeline t={t} w={1600} playT={t} big /></div>
      {t >= C.bnNoAE - .2 && <div style={{ position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, ...rise(t, C.bnNoAE - .2, .6) }}>
        <div style={{ position: 'relative' }}><Tile k="ae" s={150} style={{ filter: `saturate(${1 - slash * .8}) brightness(${1 - slash * .3})` }} />
          <svg width={210} height={210} style={{ position: 'absolute', left: -30, top: -30, overflow: 'visible' }}><line x1={20} y1={190} x2={lerp(20, 190, slash)} y2={lerp(190, 20, slash)} stroke="#ff3b30" strokeWidth={14} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 10px rgba(255,59,48,.8))' }} /></svg></div>
        <Title t={t} at={C.bnNoAE} text="Без After Effects" size={90} weight={800} grad={['#ffffff', '#ffd2cc']} glow="#ff3b30" glowO={.3} chroma={[C.bnNoAE + .3]} />
      </div>}
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <div style={{ position: 'absolute', left: 120, top: 190, width: 1050, borderRadius: 28, ...glass('#4f8cff'), padding: '26px 30px', fontFamily: MONO, ...rise(t, sa - .1, .8) }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 20, color: T2, marginBottom: 16 }}>Исходники этого ролика</div>
        {FILES.map(([f, n], i) => <div key={f} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 23, lineHeight: 2, color: '#dfe6f5', ...rise(t, sa + .1 + i * .1, .5, 10) }}><span>{f}</span><span style={{ color: '#7fd3ff' }}>{n ? `${n} строк` : f.includes('voice') ? 'голос · ElevenLabs' : '372 звука · синтез'}</span></div>)}
        <div style={{ height: 1, background: 'rgba(255,255,255,.1)', margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 23, color: TX, ...rise(t, sa + 1, .5, 10) }}><span>{'> npx remotion render Tools'}</span><span style={{ color: '#9fd49a' }}>✓ {(DUR / 60 | 0)}:{String(Math.round(DUR % 60)).padStart(2, '0')} · 1080p · 60 fps</span></div>
      </div>
      <ShowSide t={t} id="bn" title="Этот ролик — это код" sub="Claude Code + Remotion · ноль ключей руками" x={1260} y={330} w={580} />
      <Funnel t={t} id="bn" />
    </Phase>
  </Cam>;
};

// ===================== top-3
export const Top: React.FC<{ t: number }> = ({ t }) => {
  const s = S('top');
  const P = [['el', 'ElevenLabs', 'голос', C.topEL], ['skill', 'skill-creator', 'свои навыки', C.topSC], ['cc', 'Claude Code', 'делает руками', C.topCC]] as const;
  return <Cam t={t} id="top">
    <div style={{ position: 'absolute', left: 0, right: 0, top: 120 }}>
      <Eyebrow t={t} at={s.start + .1} text="ЕСЛИ СТАВИТЬ ТОЛЬКО ТРИ" size={24} style={{ justifyContent: 'center' }} />
      <Title t={t} at={C.topThree - .1} text="Мой топ-3" size={110} weight={800} align="center" grad={['#ffffff', '#ffe2b8']} glow="#ffb347" glowO={.35} sweep={C.topThree + .6} style={{ marginTop: 14 }} />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 370, display: 'flex', justifyContent: 'center', gap: 40 }}>
      {P.map(([k, n, d, at], i) => { const kk = back(pr(t, (at as number) - .1, .65));
        return <div key={k} style={{ width: 420, height: 380, borderRadius: 36, ...glass('#ffb347', .05), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - clamp(kk)) * 80}px) scale(${lerp(.8, 1, clamp(kk))})`, opacity: clamp(kk * 2), position: 'relative',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.1), 0 40px 90px rgba(0,0,0,.5), 0 0 ${40 * decay(t, at as number, 1.5) + 20}px ${rgba('#ffb347', .25)}` }}>
          <div style={{ position: 'absolute', left: 26, top: 18, fontFamily: WIDE, fontWeight: 900, fontSize: 64, color: 'rgba(255,179,71,.85)' }}>{i + 1}</div>
          <Tile k={k as any} s={130} glow={.6} />
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, color: TX, marginTop: 30, letterSpacing: '-.03em' }}>{n}</div>
          <div style={{ fontFamily: TEXT, fontSize: 24, color: T2, marginTop: 6 }}>{d}</div>
        </div>; })}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 30 }}>
      {t >= C.topAdv - .2 && <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 54, color: T3, position: 'relative', ...rise(t, C.topAdv - .2, .5, 16) }}>не советует<i style={{ position: 'absolute', left: 0, right: 0, top: '55%', height: 4, background: '#ff6b5c', transform: `scaleX(${ex(pr(t, C.topAdv + .3, .4))})`, transformOrigin: '0 50%' }} /></span>}
      {t >= C.topDo - .15 && <Title t={t} at={C.topDo - .15} text="а делает" size={70} weight={900} font={WIDE} grad={['#fff3ea', OR]} glow={OR} glowO={.6} chroma={[C.topDo]} sweep={C.topDo + .3} track={-.01} />}
    </div>
    <Flash t={t} at={C.topDo} c={OR} o={.18} />
  </Cam>;
};

// ===================== finale
const PIPE = ['Референс', 'Сценарий', 'Озвучка', 'Анимация', 'Звук', 'Рендер'];
const Mystery: React.FC<{ t: number; w: number; h: number; shake?: number }> = ({ t, w, h, shake = 0 }) => (
  <div style={{ width: w, height: h, borderRadius: 34, ...glass('#ff3b30', .06), position: 'relative', overflow: 'hidden', transform: `translateX(${shake}px)`, boxShadow: `inset 0 0 0 1.5px rgba(255,90,70,.6), 0 50px 120px rgba(0,0,0,.6), 0 0 ${60 + 30 * Math.sin(t * 2.5)}px rgba(255,60,40,.35)` }}>
    <div style={{ position: 'absolute', inset: 0, padding: '40px 44px', fontFamily: MONO, fontSize: 22, lineHeight: 1.8, color: '#e8d6d2', filter: 'blur(7px)' }}>
      {['---', 'name: motion-video', 'description: моушен-ролик', '---', '## Процесс', '1. Референсы → style.md', '2. Сценарий по словам', '3. Голос + тайминг', '4. Сцены в Remotion', '5. SFX и сведение', '6. Рендер и обложка'].map((l, i) => <div key={i}>{l}</div>)}
    </div>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,5,6,0) 30%, rgba(5,5,6,.6))' }} />
    <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%, -50%)', width: 150, height: 150, borderRadius: 75, background: 'rgba(255,59,48,.18)', boxShadow: 'inset 0 0 0 2px rgba(255,110,90,.8), 0 0 60px rgba(255,59,48,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LockIcon s={72} c="#ffe1db" /></div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontFamily: TEXT, fontWeight: 700, fontSize: 24, color: '#ffb3a8', letterSpacing: '.08em' }}>motion-skill.md</div>
  </div>
);
export const End: React.FC<{ t: number }> = ({ t }) => {
  const s = S('en'), fade = clamp((t - (DUR - 1.4)) / 1.2);
  const deny = impulse(t, C.enWont - .05, .7), shake = deny * Math.sin(t * 80) * 18;
  const [cx, cy] = curPos(t, [[C.enNoShow - .3, 1500, 900], [C.enNoShow + .15, 990, 560], [C.enWont + .6, 1040, 620]]);
  return <Cam t={t} id="en" push={.02}>
    <Phase t={t} a={s.start} b={C.enSend - .15}>
      <div style={{ position: 'absolute', left: 700, top: 190, ...rise(t, C.enEleven, .9) }}><Mystery t={t} w={520} h={680} /></div>
      <div style={{ position: 'absolute', left: 120, top: 200, width: 540 }}>
        <BigNum t={t} at={C.enEleven - .25} value="11" from="10" size={210} grad={['#ffe3dd', '#ff3b30']} glow="#ff3b30" sweep={C.enEleven + .5} chroma={[C.enEleven + .05]} />
        <Eyebrow t={t} at={C.enEleven + .1} text="ОДИННАДЦАТЫЙ" color="#ff8f80" size={22} style={{ marginTop: 12 }} />
        <Title t={t} at={C.enOwn - .2} text="Мой собственный скилл" size={70} weight={800} grad={['#ffffff', '#ffd2cc']} glow="#ff3b30" glowO={.3} lh={1.02} style={{ marginTop: 16 }} />
        <Words t={t} at={C.enProc - .1} text="весь процесс, которым я делаю эти ролики" size={30} color={T2} style={{ marginTop: 18 }} />
      </div>
      <div style={{ position: 'absolute', left: 1330, top: 220, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PIPE.map((n, i) => { const at = C.enProc + .2 + i * .32, on = t >= at, hot = (i === 0 && t >= C.enRef) || (i === 5 && t >= C.enReady);
          return <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', borderRadius: 18, ...glass(hot ? OR : '#ffffff', .03), width: 400, transform: `translateX(${(1 - ex(pr(t, at - .2, .5))) * 60}px)`, opacity: clamp(ex(pr(t, at - .2, .5)) * 1.4), boxShadow: hot ? `inset 0 0 0 1.5px ${OR}, 0 0 40px ${rgba(OR, .35)}` : undefined }}>
            <span style={{ width: 36, height: 36, borderRadius: 18, background: on ? OR : 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TEXT, fontWeight: 800, fontSize: 16, color: on ? '#1c0f07' : T3 }}>{i + 1}</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 32, color: on ? TX : T3 }}>{n}</span></div>; })}
      </div>
    </Phase>
    <Phase t={t} a={C.enSend - .2} b={C.enNoShow - .15}>
      <div style={{ position: 'absolute', left: 120, top: 240, width: 1000, height: 600 }}>
        <Win t={t} at={C.enSend - .2} x={0} y={0} w={1000} h={560} title="Claude" bg={CB.bg} bar="#1f1e1d">
          <ClaudeShell t={t} side={false} title="Новый чат">
            <Composer t={t} y={260} w={880} text={typed('Сделай моушен-ролик про мой канал', t, C.enSend + .4, 1)} active chips={[{ at: C.enSend + .1, node: <FileChip name="motion-skill.md" meta="скилл · мой стиль" color="#ff3b30" label="MD" /> }]} sendAt={C.enMakes} />
          </ClaudeShell>
        </Win>
      </div>
      <div style={{ position: 'absolute', left: 1240, top: 150, transform: 'rotate(3deg)', ...rise(t, C.enMakes - .1, .8) }}>
        <div style={{ width: 420, height: 747, borderRadius: 46, padding: 12, background: 'linear-gradient(160deg, #3a3633, #121110)', boxShadow: `0 50px 110px rgba(0,0,0,.65), 0 0 90px ${rgba(OR, .3)}` }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', background: '#000' }}><Sequence from={Math.round(C.enMakes * FPS)} layout="none"><OffthreadVideo src={staticFile('tools/promo.mp4')} startFrom={Math.round(6 * 30)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Sequence></div>
        </div>
      </div>
      <Chip t={t} at={C.enStyle - .1} x={1180} y={860} accent={OR}>моушен-ролик в моём стиле</Chip>
    </Phase>
    <Phase t={t} a={C.enNoShow - .2} b={C.enSheet - .15}>
      <div style={{ position: 'absolute', left: 700, top: 190, ...rise(t, C.enNoShow - .2, .7) }}><Mystery t={t} w={520} h={680} shake={shake} /></div>
      {t < C.enWont + 1 && <Cursor t={t} x={cx} y={cy} hand clicks={[C.enNoShow + .2]} />}
      {t >= C.enWont - .1 && <div style={{ position: 'absolute', left: 1290, top: 360 }}><Title t={t} at={C.enWont - .1} text="НЕ" size={110} weight={900} font={WIDE} grad={['#ffe6df', '#ff3b30']} glow="#ff3b30" glowO={.6} chroma={[C.enWont]} track={-.01} /><Title t={t} at={C.enWont} text="ЗДЕСЬ" size={110} weight={900} font={WIDE} grad={['#ffe6df', '#ff3b30']} glow="#ff3b30" glowO={.6} chroma={[C.enWont + .05]} track={-.01} /></div>}
      {t >= C.enNoShow - .1 && <div style={{ position: 'absolute', left: 120, top: 420, width: 520 }}><Title t={t} at={C.enNoShow - .1} text="Показывать не буду" size={70} weight={800} grad={['#ffffff', '#ffd2cc']} glow="#ff3b30" glowO={.3} lh={1.02} /></div>}
      <Flash t={t} at={C.enWont} c="#ff3b30" o={.25} />
    </Phase>
    <Phase t={t} a={C.enSheet - .2} b={C.enLink - .15}>
      <Win t={t} at={C.enSheet - .2} x={330} y={150} w={1260} h={800} title="Telegram" bg={TG.bg} bar="#17212b">
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 74, background: TG.panel, display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px', borderBottom: '1px solid #0b121a', boxShadow: t >= C.enTg ? `inset 0 -3px 0 ${rgba('#41b4ec', decay(t, C.enTg, 1.5))}` : 'none' }}>
          <Img src={staticFile('avatar.jpg')} style={{ width: 50, height: 50, borderRadius: 25, objectFit: 'cover' }} />
          <div style={{ fontFamily: TEXT }}><div style={{ fontSize: 22, fontWeight: 600, color: TG.txt }}>@claudecode09</div><div style={{ fontSize: 15, color: TG.sub }}>канал · видео в Claude, промпты, скиллы</div></div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 74, height: 60, background: TG.panel, display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px', borderBottom: '1px solid #0b121a', boxShadow: `inset 3px 0 0 ${TG.acc}, inset 0 0 0 ${t >= C.enPinned ? 2 : 0}px ${rgba('#6ab3f3', decay(t, C.enPinned, 1.2))}`, fontFamily: TEXT }}>
          <svg width={22} height={22} viewBox="0 0 24 24"><path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7" stroke="#6ab3f3" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div><div style={{ fontSize: 15, fontWeight: 600, color: TG.link }}>Закреплённое сообщение</div><div style={{ fontSize: 16, color: TG.txt }}>Шпаргалка по 10 инструментам + мой скилл</div></div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 134, bottom: 0, backgroundImage: 'radial-gradient(rgba(82,136,193,.07) 2px, transparent 2.5px)', backgroundSize: '26px 26px' }}>
          <div style={{ position: 'absolute', left: 70, top: 40, width: 700, borderRadius: '20px 20px 20px 6px', background: TG.bub, padding: '18px 22px 14px', fontFamily: TEXT, ...rise(t, C.enSheet, .7) }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: TG.link, marginBottom: 8 }}>@claudecode09</div>
            <div style={{ fontSize: 21, lineHeight: 1.5, color: TG.txt }}>Всё из видео «10 инструментов для Claude»: шпаргалка с подключением каждого и мой скилл для моушен-роликов. Забирай ↓</div>
            <TgFile name="Шпаргалка_10_инструментов.pdf" meta="PDF · 8 страниц" color="#e5322d" p={clamp((t - C.enPinned - .3) / 1.2)} />
            <TgFile name="motion-skill.md" meta="Скилл · моушен в моём стиле" color={OR} p={clamp((t - C.enPinned - .8) / 1.2)} />
            <div style={{ display: 'flex', marginTop: 14 }}><span style={{ marginLeft: 'auto', fontSize: 14, color: TG.sub }}>сейчас</span></div>
          </div>
        </div>
      </Win>
    </Phase>
    <Phase t={t} a={C.enLink - .2} b={DUR + 1}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', ...rise(t, C.enLink - .2, .8) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '22px 30px 22px 22px', borderRadius: 34, background: 'rgba(250,248,245,.97)', boxShadow: `0 30px 80px rgba(0,0,0,.5), 0 0 ${50 + 25 * Math.sin(t * 3)}px rgba(65,180,236,.45)` }}>
          <Img src={staticFile('avatar.jpg')} style={{ width: 110, height: 110, borderRadius: 55, objectFit: 'cover' }} />
          <div style={{ fontFamily: TEXT }}><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 50, color: '#16110d', letterSpacing: '-.02em' }}>@claudecode09</div><div style={{ fontSize: 24, color: '#7a7168', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}><TgIcon s={22} c="#2a9fd8" />Telegram-канал</div></div>
          <div style={{ marginLeft: 22, padding: '22px 40px', borderRadius: 22, background: t >= C.enSub + .15 ? '#34c759' : 'linear-gradient(180deg, #41b4ec, #1d8fd0)', fontFamily: TEXT, fontWeight: 700, fontSize: 32, color: '#fff', transform: `scale(${1 - .08 * Math.sin(Math.PI * clamp((t - C.enSub) / .25))})` }}>{t >= C.enSub + .15 ? 'Подписан ✓' : 'Подписаться'}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 360 }}><Title t={t} at={C.enLink - .1} text="Забери в Telegram" size={140} weight={800} align="center" grad={['#ffffff', '#c9ecff']} glow="#41b4ec" glowO={.45} sweep={C.enLink + .8} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 550 }}><Words t={t} at={C.enLink + .2} text="шпаргалка по 10 инструментам + мой скилл" size={42} color={T2} align="center" hi={{ скилл: '#ff9b8f' }} /></div>
      <Chip t={t} at={C.enLink + .3} x={520} y={670} accent="#41b4ec" icon={IC.link(24, '#9fd8f7')}>ссылка в описании ↓</Chip>
      <Chip t={t} at={C.enComment - .2} x={950} y={670} accent="#41b4ec" float={1}>и в закреплённом комментарии</Chip>
      {t >= C.enNext && <div style={{ position: 'absolute', left: 0, right: 0, top: 800 }}><Words t={t} at={C.enNext} text="следующий скилл — тоже там" size={34} color={T3} align="center" /></div>}
    </Phase>
    <AbsoluteFill style={{ background: '#000', opacity: fade }} />
  </Cam>;
};
