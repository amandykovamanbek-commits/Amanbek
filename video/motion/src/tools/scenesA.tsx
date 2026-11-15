// Hook + "connectors & skills" explainer
import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { TX, T2, T3, OR, OR2, OR3, CL, RED, DISPLAY, TEXT, WIDE, MONO, clamp, lerp, ex, ei, eio, eo, pr, decay, back, popS, rise, fall, rgba, impulse, typed, Title, Words, Eyebrow, BigNum, Tile, ToolK, LockIcon, Ring, Burst, Flash, Win, Chip, glass, SketchArrow, Spark, IC } from './kit';
import { ClaudeShell, UserMsg, AiMsg, Stream, Composer, CB } from './apps';
import { C, S, Phase, Cam, TOOLS } from './common';
import { FPS } from './timeline';

const KS: ToolK[] = ['el', 'figma', 'canva', 'vidiq', 'notion', 'github', 'brag', 'docs', 'skill', 'research'];
const WALL = 'Чтобы сделать видео, вам понадобится:\n1. Выберите видеоредактор — например, CapCut или Premiere Pro.\n2. Напишите сценарий и подготовьте раскадровку.\n3. Запишите озвучку на микрофон.\n4. Подберите музыку без авторских прав.\n5. Смонтируйте ролик и добавьте субтитры.\n6. Экспортируйте в 1080p…';

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const s = S('h');
  const A_end = C.hNow - .2, B_end = C.hDiff - .3;
  // phase A camera: push into the composer while typing, pull back for the answer
  const push = eio(pr(t, C.hAsk - .4, .9)) * (1 - eio(pr(t, C.hGet - .5, .9)));
  const dim = ex(pr(t, C.hText - .05, .5)) * (1 - ex(pr(t, C.hNow - .5, .6)));
  const prompt = 'Сделай мне видео';
  // phase B: tools orbit, then dock into the composer
  const dock = (i: number) => eio(pr(t, C.hTools + .05 + i * .07, .65));
  const sent2 = C.hTools + .95;
  return <Cam t={t} id="h" push={.02}>
    <Phase t={t} a={-1} b={B_end} din={.01}>
      <AbsoluteFill style={{ transform: `scale(${1 + .22 * push})`, transformOrigin: '960px 820px' }}>
        <div style={{ position: 'absolute', inset: 0, filter: dim > .01 ? `brightness(${1 - .6 * dim}) blur(${dim * 3}px)` : undefined }}>
          <Win t={t} at={.05} x={300} y={140} w={1320} h={790} title="Claude" bg={CB.bg} bar="#1f1e1d">
            <ClaudeShell t={t} title={t < A_end ? 'Новый чат' : 'Новый чат · с инструментами'}>
              {t < A_end ? <>
                <UserMsg t={t} at={C.hGet - .3} text={prompt} y={36} />
                <AiMsg t={t} at={C.hGet} y={112} w={860}><Stream t={t} at={C.hGet + .05} text={WALL} cps={120} style={{ color: '#c9c6bf', fontSize: 20, lineHeight: 1.55 }} /></AiMsg>
                {t < C.hGet - .3 && <Composer t={t} y={520} w={970} text={typed(prompt, t, C.hAsk + .15, .95)} caret={t > C.hAsk} active={t > C.hAsk} sendAt={C.hGet - .35} />}
              </> : <>
                {t >= sent2 && <UserMsg t={t} at={sent2} text={prompt} y={36} />}
                {t >= sent2 && <div style={{ position: 'absolute', left: 116, top: 96, display: 'flex', gap: 6, ...rise(t, sent2, .5, 10) }}>{KS.map((k) => <Tile key={k} k={k} s={24} />)}</div>}
                <AiMsg t={t} at={C.hReady - .15} y={146} w={900}>
                  <div style={{ fontSize: 19, color: '#c9c6bf', marginBottom: 12 }}>Готово ✓ Вот твой ролик:</div>
                  <div style={{ width: 720, height: 405, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
                    <Sequence from={Math.round(C.hReady * FPS)} layout="none"><OffthreadVideo src={staticFile('tools/ricksH.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Sequence>
                    <div style={{ position: 'absolute', left: 14, bottom: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, background: 'rgba(0,0,0,.6)', fontSize: 15, color: '#fff' }}>{IC.play(14)} 1080p · готовый ролик</div>
                  </div>
                </AiMsg>
                {t < sent2 && <Composer t={t} y={520} w={970} text={prompt} active sendAt={sent2 - .1}
                  chips={[{ at: C.hTools + .5, node: <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 8px', borderRadius: 12, background: '#3a3936', border: `1px solid ${rgba(OR, .6)}`, fontSize: 15, color: CB.txt }}><div style={{ display: 'flex' }}>{KS.slice(0, 5).map((k, i) => <div key={k} style={{ marginLeft: i ? -6 : 0 }}><Tile k={k} s={22} /></div>)}</div>10 инструментов подключено</div> }]} />}
              </>}
            </ClaudeShell>
          </Win>
        </div>
      </AbsoluteFill>
      {/* phase A: "just text" */}
      {t >= C.hText - .05 && t < A_end + .5 && <div style={{ position: 'absolute', left: 0, right: 0, top: 330, ...fall(t, A_end - .1) }}>
        <Title t={t} at={C.hText - .05} text="ТЕКСТ." size={230} weight={900} font={WIDE} align="center" color="#f6efe6" glow={OR} glowO={.45} chroma={[C.hText + .05]} stagger={.04} track={-.02} />
        {t >= C.hTip - .1 && <Words t={t} at={C.hTip - .1} text="и совет, как сделать видео самому" size={46} color={T2} align="center" style={{ marginTop: 26 }} hi={{ самому: OR2 }} />}
      </div>}
      {/* phase B: tools orbit the window, then dock */}
      {t >= C.hNow - .1 && t < C.hTools + 1.2 && KS.map((k, i) => {
        const a = i / 10 * Math.PI * 2 + t * .35, k0 = back(pr(t, C.hNow + i * .06, .6)), d = dock(i);
        const ox = 960 + Math.cos(a) * 820, oy = 520 + Math.sin(a) * 430, tx = 420 + i * 30, ty = 700;
        const x = lerp(ox, tx, d), y = lerp(oy, ty, d), sc = lerp(1, .25, d) * k0;
        return <div key={k} style={{ position: 'absolute', left: x - 55, top: y - 55, transform: `scale(${sc}) rotate(${(1 - d) * Math.sin(a) * 12}deg)`, opacity: 1 - ei(pr(t, C.hTools + .55 + i * .07, .2)) }}><Tile k={k} s={110} glow={.8} /></div>;
      })}
      {t >= C.hTools + .2 && t < C.hTools + 1.2 && <Ring t={t} at={C.hTools + .5} x={560} y={720} r={160} color={OR} />}
      <Chip t={t} at={C.hAnim} x={1440} y={330} out={B_end - .4} accent={OR}>анимация</Chip>
      <Chip t={t} at={C.hVoice} x={1470} y={430} out={B_end - .35} accent="#9aa6ff" float={1}>озвучка</Chip>
      <Chip t={t} at={C.hMusic} x={1450} y={530} out={B_end - .3} accent="#22d3d8" float={2}>музыка</Chip>
    </Phase>
    {/* phase C: the number ten, the row, the locked eleventh */}
    <Phase t={t} a={B_end} b={s.end + 1}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center' }}><Eyebrow t={t} at={C.hDiff - .1} text="ВСЯ РАЗНИЦА —" size={24} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center' }}>
        {t < C.hEleven ? <BigNum t={t} at={C.hTen - .2} value="10" from="00" size={400} sweep={C.hTen + .6} chroma={[C.hTen]} />
          : <BigNum t={t} at={C.hEleven - .05} inAt={-10} value="11" from="10" size={400} grad={['#ffe9e4', '#ff4d3d']} glow="#ff3b30" sweep={C.hEleven + .4} chroma={[C.hEleven, C.hWill]} />}
      </div>
      {t < C.hWill - .1 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 612 }}>
        {t < C.hEleven - .05 ? <Words t={t} at={C.hTen + .2} text="вещей, которые я подключаю первым делом" size={44} color={T2} align="center" out={C.hEleven - .4} hi={{ первым: OR2, делом: OR2 }} />
          : <Words t={t} at={C.hEleven} text="самую важную я сделал сам" size={44} color={T2} align="center" hi={{ сам: '#ff8f80' }} />}
      </div> : <div style={{ position: 'absolute', left: 0, right: 0, top: 600 }}><Title t={t} at={C.hWill - .1} text="НЕ В ЭТОМ ВИДЕО" size={78} weight={900} font={WIDE} align="center" grad={['#ffe6df', '#ff4d3d']} glow="#ff3b30" chroma={[C.hWill]} stagger={.025} track={-.01} /></div>}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 742, display: 'flex', justifyContent: 'center', gap: 20 }}>
        {KS.map((k, i) => { const at = C.hShow + .15 + i * .085, kk = popS(t, at, .5);
          return <div key={k} style={{ transform: `translateY(${(1 - kk) * 30}px) scale(${kk})`, opacity: clamp(kk * 2) * (t >= C.hEleven ? .55 : 1) }}><Tile k={k} s={90} glow={decay(t, at, 2)} /></div>; })}
        {t >= C.hEleven - .05 && <div style={{ position: 'relative', transform: `scale(${popS(t, C.hEleven, .6)}) translateX(${impulse(t, C.hWill, .4) * Math.sin(t * 90) * 8}px)` }}>
          <div style={{ width: 90, height: 90, borderRadius: 22, ...glass('#ff3b30', .1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: WIDE, fontWeight: 900, fontSize: 40, color: '#ffb3a8', boxShadow: `inset 0 0 0 1.5px rgba(255,90,70,.8), 0 0 ${30 + 20 * Math.sin(t * 3)}px rgba(255,60,40,.55)` }}>{t < C.hWill - .05 ? '?' : ''}</div>
          {t >= C.hWill - .1 && <div style={{ position: 'absolute', left: 21, top: 18, transform: `scale(${lerp(3.2, 1, back(pr(t, C.hWill - .1, .4)))})`, opacity: clamp(pr(t, C.hWill - .1, .15)) }}><LockIcon s={48} c="#ffe1db" /></div>}
          <Ring t={t} at={C.hWill} x={45} y={45} r={120} color="#ff4d3d" />
        </div>}
      </div>
      {t >= C.hSelf && t < C.hWill + .2 && <SketchArrow t={t} at={C.hSelf} d="M 60 10 C 120 40, 150 90, 130 150" head="M 108 132 L 130 152 L 146 124" box={[200, 170]} style={{ left: 1500, top: 600 }} color="#ffb3a8" />}
      <Flash t={t} at={C.hWill} c="#ff5a3c" o={.28} />
    </Phase>
  </Cam>;
};

// ---------- explainer: connectors are hands, skills are know-how
const Cable: React.FC<{ t: number; at: number; d: string; c: string }> = ({ t, at, d, c }) => {
  const k = eo(pr(t, at, .7)); if (k <= 0) return null;
  const off = ((t * .55) % 1);
  return <g>
    <path d={d} stroke={rgba(c, .35)} strokeWidth={3} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
    {k >= 1 && [0, .33, .66].map((o) => <path key={o} d={d} stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray=".04 .96" strokeDashoffset={-((off + o) % 1)} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />)}
  </g>;
};
const Node: React.FC<{ t: number; at: number; x: number; y: number; k: ToolK; label: string; c: string }> = ({ t, at, x, y, k, label, c }) => {
  const p = popS(t, at, .6); if (!p) return null;
  return <div style={{ position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 20, transform: `scale(${p})`, transformOrigin: '0 50%' }}>
    <Tile k={k} s={96} glow={decay(t, at, 2) + .3} />
    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: TX, letterSpacing: '-.02em' }}>{label}</div>
    <Ring t={t} at={at} x={48} y={48} r={90} color={c} />
  </div>;
};
const SkillDoc: React.FC<{ t: number; at: number; i: number; name: string; desc: string; spread: number }> = ({ t, at, i, name, desc, spread }) => {
  const k = ex(pr(t, at + i * .12, .8)); if (k <= 0) return null;
  const rot = (i - 1) * 9 * spread, dx = (i - 1) * 190 * spread, dy = Math.abs(i - 1) * 30 * spread;
  return <div style={{ position: 'absolute', left: 1180 + dx, top: 250 + dy + (1 - k) * 80, width: 340, height: 430, borderRadius: 22, ...glass(OR), padding: 26, transform: `rotate(${rot}deg)`, opacity: clamp(k * 1.5), fontFamily: MONO, fontSize: 17, lineHeight: 1.6, color: '#d8d4cc', zIndex: i === 1 ? 2 : 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: TEXT, fontWeight: 700, fontSize: 20, color: TX, marginBottom: 14 }}><div style={{ width: 30, height: 36, borderRadius: 6, background: OR, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontSize: 9, color: '#fff', paddingBottom: 3 }}>MD</div>SKILL.md</div>
    <div style={{ color: T3 }}>---</div><div><span style={{ color: OR2 }}>name:</span> {name}</div><div><span style={{ color: OR2 }}>description:</span></div><div style={{ color: '#bdb8b0' }}>{desc}</div><div style={{ color: T3 }}>---</div>
    {[88, 70, 80, 56, 74].map((w, j) => <i key={j} style={{ display: 'block', height: 8, width: `${w}%`, borderRadius: 4, background: 'rgba(255,255,255,.1)', margin: '12px 0' }} />)}
  </div>;
};
const Toggle: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const k = eio(pr(t, at, .45));
  return <div style={{ width: 132, height: 76, borderRadius: 38, background: k > .5 ? `linear-gradient(180deg, ${OR2}, ${OR})` : 'rgba(255,255,255,.14)', boxShadow: k > .5 ? `0 0 40px ${rgba(OR, .55)}` : 'inset 0 0 0 1px rgba(255,255,255,.1)', position: 'relative' }}>
    <div style={{ position: 'absolute', top: 6, left: lerp(6, 62, k), width: 64, height: 64, borderRadius: 32, background: '#fff', boxShadow: '0 6px 14px rgba(0,0,0,.35)' }} />
  </div>;
};
export const Explain: React.FC<{ t: number }> = ({ t }) => {
  const s = S('ex');
  return <Cam t={t} id="ex">
    <Phase t={t} a={s.start} b={C.exConn - .15}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 210, display: 'flex', justifyContent: 'center' }}><Eyebrow t={t} at={s.start + .2} text="ДВА СЛОВА, КОТОРЫЕ НАДО ЗНАТЬ" size={24} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', gap: 50 }}>
        {[['Коннекторы', '#4f8cff', C.exWords, 'link'], ['Скиллы', OR, C.exWords + .35, 'star']].map(([n, c, at, ic], i) => { const k = popS(t, at as number, .7);
          return <div key={i} style={{ width: 620, height: 340, borderRadius: 40, ...glass(c as string), display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 54px', transform: `scale(${k}) rotate(${(1 - k) * (i ? 6 : -6)}deg)`, opacity: clamp(k * 2), boxShadow: `inset 0 1px 0 rgba(255,255,255,.1), 0 40px 90px rgba(0,0,0,.5), 0 0 80px ${rgba(c as string, .22)}` }}>
            <div style={{ width: 78, height: 78, borderRadius: 22, background: `linear-gradient(150deg, ${c}, ${rgba(c as string, .5)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>{(IC as any)[ic as string](40, '#fff')}</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 92, letterSpacing: '-.04em', color: TX }}>{n as string}</div>
          </div>; })}
      </div>
    </Phase>
    <Phase t={t} a={C.exConn - .2} b={C.exSkills - .2}>
      <div style={{ position: 'absolute', left: 130, top: 300, width: 700 }}>
        <Eyebrow t={t} at={C.exConn - .1} text="КОННЕКТОРЫ" color="#6aa0ff" size={24} />
        <Title t={t} at={C.exHands - .15} text="Руки Claude" size={128} weight={800} grad={['#ffffff', '#c8d6ff']} glow="#4f8cff" glowO={.45} sweep={C.exHands + .6} style={{ marginTop: 18 }} />
        <Words t={t} at={C.exVia} text="Через них он заходит в другие сервисы" size={40} color={T2} style={{ marginTop: 22 }} />
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <Cable t={t} at={C.exHands} d="M 1110 540 C 1260 540, 1300 300, 1430 290" c="#9aa6ff" />
        <Cable t={t} at={C.exHands + .1} d="M 1110 540 C 1260 540, 1300 540, 1430 540" c="#b07bff" />
        <Cable t={t} at={C.exHands + .2} d="M 1110 540 C 1260 540, 1300 780, 1430 790" c="#ff4d4d" />
      </svg>
      <div style={{ position: 'absolute', left: 1010, top: 440, transform: `scale(${popS(t, C.exConn, .7)}) rotate(${t * 30}deg)`, filter: `drop-shadow(0 0 30px ${rgba(OR, .8)})` }}><Spark size={200} color={CL} /></div>
      <Node t={t} at={C.exVoice} x={1430} y={242} k="el" label="озвучка" c="#9aa6ff" />
      <Node t={t} at={C.exDesign} x={1430} y={492} k="figma" label="дизайн" c="#b07bff" />
      <Node t={t} at={C.exYT} x={1430} y={742} k="yt" label="YouTube" c="#ff4d4d" />
    </Phase>
    <Phase t={t} a={C.exSkills - .25} b={C.exWithout - .2}>
      <div style={{ position: 'absolute', left: 130, top: 290, width: 860 }}>
        <Eyebrow t={t} at={C.exSkills - .15} text="СКИЛЛЫ" size={24} />
        <Title t={t} at={C.exSkills} text="Навыки Claude" size={128} weight={800} grad={['#ffffff', '#ffd9c2']} glow={OR} glowO={.45} sweep={C.exSkills + .7} style={{ marginTop: 18 }} />
        <Words t={t} at={C.exInstr - .1} text="Готовые инструкции, как сделать задачу" size={40} color={T2} style={{ marginTop: 22 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 34, ...rise(t, C.exPro - .5, .6) }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, color: t >= C.exNewb ? T3 : T2, textDecoration: t >= C.exNewb ? 'line-through' : 'none', textDecorationColor: '#ff6b5c' }}>новичок</span>
          <Toggle t={t} at={C.exPro} />
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, color: t >= C.exPro + .2 ? OR2 : T3, textShadow: t >= C.exPro + .2 ? `0 0 24px ${rgba(OR, .6)}` : 'none' }}>профи</span>
        </div>
      </div>
      {[['brag-slim', 'Промо-ролик из проекта'], ['pdf', 'Готовые PDF-файлы'], ['deep-research', 'Глубокий поиск']].map(([n, d], i) => <SkillDoc key={i} t={t} at={C.exSkills + .1} i={i} name={n} desc={d} spread={eio(pr(t, C.exInstr, .9))} />)}
    </Phase>
    <Phase t={t} a={C.exWithout - .25} b={s.end + 1}>
      {[0, 1].map((side) => { const on = side === 1, at = on ? C.exWith - .15 : C.exWithout - .1, k = ex(pr(t, at, .8)); if (k <= 0) return null;
        return <div key={side} style={{ position: 'absolute', left: on ? 1000 : 120, top: 170, width: 800, height: 700, borderRadius: 44, ...glass(on ? OR : '#ffffff', on ? .06 : .02), opacity: clamp(k * 1.4) * (on ? 1 : lerp(1, .6, ex(pr(t, C.exWith, .6)))), transform: `translateY(${(1 - k) * 50}px) scale(${lerp(.95, 1, k)})`,
          boxShadow: on ? `inset 0 1px 0 rgba(255,255,255,.1), 0 40px 100px rgba(0,0,0,.5), 0 0 ${70 + 50 * decay(t, C.exDo, 2)}px ${rgba(OR, .3)}` : undefined }}>
          <div style={{ position: 'absolute', left: 50, top: 44 }}><Eyebrow t={t} at={at + .1} text={on ? 'С НИМИ' : 'БЕЗ НИХ'} color={on ? OR : T3} size={24} /></div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center' }}>
            {on ? <div style={{ position: 'relative', width: 260, height: 260 }}>
              <div style={{ position: 'absolute', left: 30, top: 30, transform: `rotate(${t * 40}deg)`, filter: `drop-shadow(0 0 40px ${rgba(OR, .9)})` }}><Spark size={200} color={CL} t={t} breathe={1} /></div>
              {KS.map((kk, i) => { const a = i / 10 * Math.PI * 2 + t * .6, p = popS(t, C.exWith + i * .04, .5); return <div key={kk} style={{ position: 'absolute', left: 130 + Math.cos(a) * 190 - 26, top: 130 + Math.sin(a) * 150 - 26, transform: `scale(${p})` }}><Tile k={kk} s={52} /></div>; })}
            </div> : <svg width={240} height={240} viewBox="-100 -100 200 200" style={{ opacity: .7 }}><circle r={80} stroke="rgba(255,255,255,.25)" strokeWidth={4} strokeDasharray="10 12" fill="none" style={{ transform: `rotate(${t * 20}deg)` }} />{[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1={Math.cos(a * Math.PI / 180) * 14} y1={Math.sin(a * Math.PI / 180) * 14} x2={Math.cos(a * Math.PI / 180) * 54} y2={Math.sin(a * Math.PI / 180) * 54} stroke="rgba(255,255,255,.35)" strokeWidth={10} strokeLinecap="round" />)}</svg>}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center' }}>
            {on ? <Title t={t} at={C.exDo - .1} text="ДЕЛАЕТ" size={110} weight={900} font={WIDE} align="center" grad={['#fff3ea', OR]} glow={OR} glowO={.6} sweep={C.exDo + .35} chroma={[C.exDo]} track={-.01} />
              : <><Title t={t} at={C.exEmpty - .25} text="умный, но пустой" size={58} weight={700} align="center" color={T2} shadow={false} />
                {t >= C.exAdv - .15 && <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 18, background: 'rgba(255,255,255,.06)', fontFamily: TEXT, fontSize: 30, color: T3, ...rise(t, C.exAdv - .15, .6) }}><svg width={30} height={30} viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" stroke="#6e6e73" strokeWidth={2} fill="none" strokeLinejoin="round" /></svg>только советует</div>}</>}
          </div>
        </div>; })}
      <Flash t={t} at={C.exDo} c={OR} o={.22} />
    </Phase>
  </Cam>;
};
