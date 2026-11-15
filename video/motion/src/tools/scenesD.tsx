// Tools 7-10: brag-slim, documents, skill-creator, deep-research
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { TX, T2, T3, OR, OR2, CL, GRN, DISPLAY, TEXT, WIDE, MONO, clamp, lerp, ex, ei, eio, eo, pr, decay, back, popS, rise, rgba, typed, impulse, Title, Words, Eyebrow, Tile, Win, Chip, glass, Spark, IC, Ring, Burst, SketchArrow, LockIcon, Flash } from './kit';
import { ClaudeShell, UserMsg, AiMsg, Composer, CB, Term, FileChip } from './apps';
import { C, S, SH, Phase, Cam, ToolHead, Funnel, ShowSide, ShowTitle } from './common';
import { SHEET } from './scenesC';
import { FPS } from './timeline';

const Phone: React.FC<{ t: number; at: number; w: number; src: string; label?: string; glow?: string }> = ({ t, at, w, src, label, glow = OR }) => (
  <div style={{ width: w, height: w * 16 / 9, borderRadius: w * .11, padding: w * .028, background: 'linear-gradient(160deg, #3a3633, #121110)', boxShadow: `0 50px 110px rgba(0,0,0,.65), 0 0 90px ${rgba(glow, .28)}, inset 0 1px 0 rgba(255,255,255,.15)` }}>
    <div style={{ width: '100%', height: '100%', borderRadius: w * .085, overflow: 'hidden', background: '#000', position: 'relative' }}>
      {t >= at ? <Sequence from={Math.round(at * FPS)} layout="none"><OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Sequence>
        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: TEXT, fontSize: 20, color: T3 }}><div style={{ width: 54, height: 54, borderRadius: 27, border: `4px solid ${rgba(OR, .25)}`, borderTopColor: OR, transform: `rotate(${t * 400}deg)` }} />рендер…</div>}
      {label && <div style={{ position: 'absolute', left: 14, top: 14, padding: '6px 14px', borderRadius: 12, background: 'rgba(0,0,0,.55)', fontFamily: TEXT, fontWeight: 600, fontSize: 16, color: '#fff' }}>{label}</div>}
    </div>
  </div>
);

// ===================== 7 · brag-slim
const SHARE = 'Этот ролик целиком собран в Claude: открыл, выбрал «Код», скинул сценарий, референсы и музыку — и написал один промпт. Анимация, звук и рендер — кодом, без After Effects.';
export const T7: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t7'), m = C.t7n + .75, [sa, sb] = SH.t7;
  const beat = (t - C.t7Beat) * 119 / 60, bp = t >= C.t7Beat ? Math.pow(1 - (beat % 1), 3) : 0;
  return <Cam t={t} id="t7">
    <ToolHead t={t} i={6} until={m - .2} />
    <Phase t={t} a={m - .25} b={sa}>
      <Win t={t} at={m + .15} x={110} y={190} w={1050} h={760} title="Claude Code — ~/мой-проект" bg="#141210" bar="#1c1a17">
        <Term t={t} fontSize={22} lines={[
          { at: m - .05, text: 'Claude Code · Opus 5.5', c: '#8a847d' },
          { at: C.t7Give - .25, text: '/brag-slim ./мой-проект', prompt: true, d: .8, c: '#ffffff' },
          { at: C.t7Link + .2, text: '  ✓ Прочитал проект: код, README, скриншоты', c: '#9fd49a' },
          { at: C.t7Make - .2, text: '  ◆ Сценарий и раскадровка — 8 сцен', c: '#e7e1d9' },
          { at: C.t7Hook, text: '  ◆ Хук — первые 2 секунды', c: OR2 },
          { at: C.t7Beat, text: '  ◆ Музыка в бит · склейки на долях', c: OR2 },
          { at: C.t7Post, text: '  ◆ Текст для поста — готов', c: OR2 },
          { at: C.t7Post + .7, text: '  ● Рендер 1080×1920 ··· 100% → out/promo.mp4', c: '#9fd49a' },
        ]} />
      </Win>
      <div style={{ position: 'absolute', left: 1260, top: 170, ...rise(t, C.t7Make - .5, .8) }}>
        <Phone t={t} at={C.t7Make} w={420} src="tools/promo.mp4" glow={OR} />
        {t >= C.t7Hook && <div style={{ position: 'absolute', left: -24, top: 40, width: 468, height: 200, borderRadius: 30, border: `3px solid ${OR2}`, boxShadow: `0 0 30px ${rgba(OR, .6)}`, opacity: 1 - ei(pr(t, C.t7Beat - .2, .3)), transform: `scale(${popS(t, C.t7Hook)})` }}><div style={{ position: 'absolute', right: 18, top: -22, padding: '6px 14px', borderRadius: 10, background: OR, fontFamily: TEXT, fontWeight: 800, fontSize: 18, color: '#1c0f07' }}>ХУК</div></div>}
        {t >= C.t7Beat && <div style={{ position: 'absolute', left: 0, right: 0, top: 770, display: 'flex', justifyContent: 'center', gap: 10, ...rise(t, C.t7Beat, .4, 10) }}>{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ width: 12, height: 14 + 36 * (i % 4 === Math.floor(beat) % 4 ? bp : .1), borderRadius: 6, background: i % 4 === 0 ? OR2 : 'rgba(255,255,255,.35)' }} />)}</div>}
      </div>
      {t >= C.t7Post - .1 && <div style={{ position: 'absolute', left: 170, top: 700, width: 900, borderRadius: 22, ...glass(OR), padding: '18px 22px', fontFamily: TEXT, ...rise(t, C.t7Post - .1, .6) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: T3, marginBottom: 8 }}>{IC.file(18, T3)}share-copy.txt</div>
        <div style={{ fontSize: 20, lineHeight: 1.5, color: '#e6e1da' }}>{typed(SHARE, t, C.t7Post + .05, 1.6)}</div>
      </div>}
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <div style={{ position: 'absolute', left: 270, top: 180, transform: `rotate(-2deg) translateY(${Math.sin((t - sa) * .7) * 6}px)`, ...rise(t, sa - .1, .9) }}><Phone t={t} at={C.t7Make} w={430} src="tools/promo.mp4" /></div>
      <ShowSide t={t} id="t7" title="Промо-ролик одной командой" x={860} y={250} w={940} size={84} />
      <div style={{ position: 'absolute', left: 860, top: 560, width: 900, borderRadius: 24, ...glass(OR), padding: '22px 26px', fontFamily: TEXT, ...rise(t, sa + .6, .7) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, color: T3, marginBottom: 10 }}>{IC.file(18, T3)}текст для поста — тоже готов</div>
        <div style={{ fontSize: 23, lineHeight: 1.5, color: '#e6e1da' }}>{SHARE}</div>
      </div>
      <Funnel t={t} id="t7" />
    </Phase>
  </Cam>;
};

// ===================== 8 · PDF / Word / PowerPoint
const FileTile: React.FC<{ c: string; ext: string; name: string; s: number }> = ({ c, ext, name, s }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ position: 'relative', width: s * .8, height: s, margin: '0 auto', borderRadius: s * .08, background: 'linear-gradient(180deg, #ffffff, #e9e9ee)', boxShadow: `0 30px 70px rgba(0,0,0,.5), 0 0 60px ${rgba(c, .3)}`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: 0, top: 0, width: s * .22, height: s * .22, background: 'linear-gradient(225deg, #d4d4da 50%, transparent 50%)' }} />
      {[0, 1, 2, 3].map((i) => <i key={i} style={{ position: 'absolute', left: s * .1, top: s * (.18 + i * .1), width: s * (.6 - (i % 2) * .15), height: s * .035, borderRadius: 4, background: '#d9d9de' }} />)}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: s * .36, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TEXT, fontWeight: 800, fontSize: s * .15, color: '#fff', letterSpacing: '.04em' }}>{ext}</div>
    </div>
    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: TX, marginTop: 28 }}>{name}</div>
  </div>
);
const Sheet: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ width: w, borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 70px rgba(0,0,0,.5)', fontFamily: TEXT, fontSize: w * .036 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#2b7cd3', color: '#fff', fontWeight: 700 }}>{['Инструмент', 'Тип', 'Цена'].map((h) => <div key={h} style={{ padding: `${w * .022}px ${w * .03}px` }}>{h}</div>)}</div>
    {[['ElevenLabs', 'коннектор', '0 ₽*'], ['Figma', 'коннектор', '0 ₽'], ['Canva', 'коннектор', '0 ₽'], ['vidIQ', 'коннектор', '0 ₽*'], ['brag-slim', 'скилл', '0 ₽'], ['deep-research', 'скилл', '0 ₽']].map((r, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: i % 2 ? '#f4f7fb' : '#fff', color: '#1d1d1f' }}>{r.map((c, j) => <div key={j} style={{ padding: `${w * .018}px ${w * .03}px`, color: j ? '#55555c' : undefined }}>{c}</div>)}</div>)}
  </div>
);
const Slide: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ width: w, height: w * 9 / 16, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(150deg, #1d1d22, #0d0d10)', boxShadow: '0 30px 70px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.08)', position: 'relative', fontFamily: TEXT }}>
    <div style={{ position: 'absolute', left: w * .07, top: w * .07, fontFamily: DISPLAY, fontWeight: 800, fontSize: w * .075, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.05 }}>Коннекторы<br /><span style={{ color: OR2 }}>и скиллы</span></div>
    <div style={{ position: 'absolute', right: w * .07, top: w * .1, display: 'flex', gap: w * .02 }}>{(['el', 'figma', 'canva'] as const).map((k) => <Tile key={k} k={k} s={w * .1} />)}</div>
    <div style={{ position: 'absolute', left: w * .07, bottom: w * .07, fontSize: w * .032, color: '#a1a1a6' }}>Слайд 3 из 12</div>
  </div>
);
export const T8: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t8'), m = C.t8n + 1.0, [sa, sb] = SH.t8;
  const cf = (t - C.t8Sheet) * .9;
  return <Cam t={t} id="t8">
    <ToolHead t={t} i={7} until={m} />
    <Phase t={t} a={m - .25} b={C.t8Guides - .15}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', gap: 150 }}>
        {[[C.t8Pdf, '#e5322d', 'PDF', 'PDF'], [C.t8Word, '#2b7cd3', 'DOCX', 'Word'], [C.t8Ppt, '#d24726', 'PPTX', 'PowerPoint']].map(([at, c, e, n], i) => { const k = back(pr(t, Math.max((at as number) - .1, m + .75 + i * .12), .6));
          return <div key={i} style={{ transform: `translateY(${(1 - clamp(k)) * -200}px) rotate(${(1 - clamp(k)) * (i - 1) * 20}deg)`, opacity: clamp(k * 3) }}><FileTile c={c as string} ext={e as string} name={n as string} s={300} /></div>; })}
      </div>
    </Phase>
    <Phase t={t} a={C.t8Guides - .2} b={C.t8Sheet - .15}>
      <div style={{ position: 'absolute', left: 140, top: 210, ...rise(t, C.t8Guides - .15, .7) }}>
        <div style={{ width: 400, height: 500, borderRadius: 14, overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.5)', transform: 'rotate(-3deg)' }}><Img src={staticFile(SHEET[2])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, color: TX, marginTop: 26 }}>Гайды</div>
      </div>
      <div style={{ position: 'absolute', left: 640, top: 300, ...rise(t, C.t8Pres - .15, .7) }}><Slide w={640} /><div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, color: TX, marginTop: 30 }}>Презентации</div></div>
      <div style={{ position: 'absolute', left: 1360, top: 280, ...rise(t, C.t8Tables - .15, .7) }}><Sheet w={430} /><div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, color: TX, marginTop: 30 }}>Таблицы</div></div>
      {[['гайд.pdf', '#e5322d', 'PDF', 150], ['слайды.pptx', '#d24726', 'PPT', 700], ['таблица.docx', '#2b7cd3', 'DOC', 1370]].map(([n, c, l, x], i) => t >= C.t8File + i * .1 && <div key={i} style={{ position: 'absolute', left: x as number, top: 860, transform: `scale(${popS(t, C.t8File + i * .1)})`, transformOrigin: '0 50%', display: 'flex', alignItems: 'center', gap: 12 }}><FileChip name={n as string} meta="готово ✓" color={c as string} label={l as string} /></div>)}
    </Phase>
    <Phase t={t} a={C.t8Sheet - .2} b={sb + 1}>
      <AbsoluteFill style={{ perspective: 1800 }}>
        {SHEET.map((src, i) => { const d = i - cf % SHEET.length, dd = ((d + SHEET.length * 1.5) % SHEET.length) - SHEET.length / 2, ad = Math.abs(dd);
          if (ad > 2.6) return null;
          return <div key={i} style={{ position: 'absolute', left: 640 - 210 + dd * 250, top: 190, width: 420, height: 525, borderRadius: 14, overflow: 'hidden', transform: `translateZ(${-ad * 170}px) rotateY(${-clamp(dd, -1, 1) * 42}deg)`, opacity: clamp(1.3 - ad * .32) * ex(pr(t, C.t8Sheet - .1, .8)), zIndex: 10 - Math.round(ad * 2), boxShadow: '0 40px 90px rgba(0,0,0,.6)' }}><Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>; })}
      </AbsoluteFill>
      <ShowSide t={t} id="t8" title="Шпаргалку сверстал Claude" sub="к этому видео — лежит в Telegram" x={1300} y={340} />
      <Funnel t={t} id="t8" text="Шпаргалка — в Telegram" />
    </Phase>
  </Cam>;
};

// ===================== 9 · skill-creator
const SKILL_LINES = ['---', 'name: youtube-cover', 'description: Обложка в моём стиле', '---', '## Шаги', '1. Найди 3 референса в vidIQ', '2. Текст — 2–3 слова, очень крупно', '3. Тёмный фон, оранжевый акцент', '4. Сохрани 1280×720 в /covers'];
export const T9: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t9'), m = C.t9n + 1.55, [sa, sb] = SH.t9;
  const ask = 'Запомни, как мы делаем обложки, и сохрани это как скилл';
  const send1 = C.t9Save - .35;
  return <Cam t={t} id="t9">
    <ToolHead t={t} i={8} />
    <Phase t={t} a={m - .1} b={sa}>
      <Win t={t} at={m + .3} x={110} y={190} w={1060} h={760} title="Claude" bg={CB.bg} bar="#1f1e1d">
        <ClaudeShell t={t} side={false} title="Новый навык">
          {t >= send1 && <UserMsg t={t} at={send1} text={ask} y={30} w={900} />}
          <AiMsg t={t} at={C.t9Save} y={130} w={920}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#2c2b28', border: '1px solid #44433e', fontSize: 17, width: 'fit-content' }}><Tile k="skill" s={28} /><b style={{ fontWeight: 600 }}>skill-creator</b><span style={{ fontFamily: MONO, fontSize: 14, color: CB.sub }}>SKILL.md</span><span style={{ color: t >= C.t9Skill ? '#7bd389' : OR2, fontSize: 15 }}>{t >= C.t9Skill ? 'сохранено ✓' : 'пишу…'}</span></div>
            {t >= C.t9Skill && <div style={{ marginTop: 14, ...rise(t, C.t9Skill, .5, 10) }}>Готово. Теперь хватит одной команды: <span style={{ fontFamily: MONO, color: OR2 }}>/youtube-cover</span></div>}
          </AiMsg>
          {t >= C.t9Cmd + .2 && <div style={{ position: 'absolute', left: 106, top: 330, display: 'flex', alignItems: 'center', gap: 12 }}>{['Референсы', 'Заголовок', 'Обложка'].map((n, i) => <React.Fragment key={n}><span style={{ padding: '10px 16px', borderRadius: 12, background: t >= C.t9Cmd + .4 + i * .35 ? rgba(OR, .2) : '#2c2b28', border: `1px solid ${t >= C.t9Cmd + .4 + i * .35 ? OR : '#44433e'}`, fontFamily: TEXT, fontSize: 18, color: CB.txt, transform: `scale(${popS(t, C.t9Cmd + .2 + i * .1)})` }}>{n}</span>{i < 2 && <span style={{ color: CB.sub }}>→</span>}</React.Fragment>)}</div>}
          {t < send1 ? <Composer t={t} y={540} w={940} text={typed(ask, t, C.t9Expl - .1, 1.3)} caret={t >= C.t9Expl - .2} active={t >= C.t9Expl - .2} sendAt={send1 - .05} />
            : <Composer t={t} y={540} w={940} text={typed('/youtube-cover', t, C.t9Next + .1, .6)} caret={t >= C.t9Next} active={t >= C.t9Next} sendAt={C.t9Cmd + .1} />}
        </ClaudeShell>
      </Win>
      {t >= C.t9Save - .1 && <div style={{ position: 'absolute', left: 1230, top: 230, width: 560, height: 560, borderRadius: 28, ...glass(OR), padding: '24px 28px', fontFamily: MONO, ...rise(t, C.t9Save - .1, .7) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: TEXT, fontWeight: 700, fontSize: 22, color: TX, marginBottom: 18 }}><div style={{ width: 34, height: 40, borderRadius: 7, background: OR, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontSize: 10, color: '#fff', paddingBottom: 4 }}>MD</div>youtube-cover / SKILL.md</div>
        {SKILL_LINES.map((l, i) => { const at = C.t9Save + .1 + i * .2; if (t < at) return null; return <div key={i} style={{ fontSize: 21, lineHeight: 1.7, color: l.startsWith('---') ? T3 : l.includes(':') && i < 3 ? OR2 : l.startsWith('#') ? '#fff' : '#d8d4cc', whiteSpace: 'pre' }}>{typed(l, t, at, .18)}</div>; })}
        {t >= C.t9Skill && <div style={{ position: 'absolute', right: -16, top: -18, padding: '10px 18px', borderRadius: 99, background: GRN, fontFamily: TEXT, fontWeight: 700, fontSize: 19, color: '#fff', transform: `scale(${popS(t, C.t9Skill)}) rotate(4deg)`, boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>навык сохранён ✓</div>}
      </div>}
      <Ring t={t} at={C.t9Skill} x={1770} y={220} r={110} color={GRN} />
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <div style={{ position: 'absolute', left: 120, top: 200, width: 1100, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, perspective: 1600 }}>
        {[['brag-slim', 'brag', 0], ['pdf', 'docs', 0], ['docx · pptx', 'docs', 0], ['deep-research', 'research', 0], ['skill-creator', 'skill', 0], ['youtube-cover', 'skill', 1], ['xlsx', 'docs', 0], ['motion-video', 'skill', 2]].map(([n, k, st], i) => { const kk = ex(pr(t, sa + i * .08, .7)), locked = st === 2, fresh = st === 1;
          return <div key={i} style={{ height: 150, borderRadius: 24, ...glass(locked ? '#ff4d3d' : fresh ? OR : '#ffffff', fresh ? .08 : .03), display: 'flex', alignItems: 'center', gap: 18, padding: '0 22px', transform: `translateY(${(1 - kk) * 40}px) rotateX(${(1 - kk) * 20}deg)`, opacity: clamp(kk * 1.4),
            boxShadow: locked ? `inset 0 0 0 1.5px rgba(255,90,70,.7), 0 0 ${30 + 20 * Math.sin(t * 3)}px rgba(255,60,40,.35)` : fresh ? `inset 0 0 0 1.5px ${rgba(OR, .8)}, 0 0 40px ${rgba(OR, .3)}` : undefined }}>
            <Tile k={k as any} s={70} />
            <div style={{ fontFamily: TEXT, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 24, color: TX, filter: locked ? 'blur(5px)' : undefined }}>{n as string}</div><div style={{ fontSize: 16, color: locked ? '#ff9b8f' : fresh ? OR2 : T3, marginTop: 4 }}>{locked ? 'только в Telegram' : fresh ? 'новый · мой' : 'скилл'}</div></div>
            {locked && <div style={{ marginLeft: 'auto' }}><LockIcon s={30} c="#ffd7cf" /></div>}
          </div>; })}
      </div>
      <ShowSide t={t} id="t9" title="Свои навыки — одной командой" sub="skill-creator пишет их сам" x={1300} y={300} />
      <Funnel t={t} id="t9" />
    </Phase>
  </Cam>;
};

// ===================== 10 · deep-research
const SRC = ['habr.com', 'vc.ru', 'youtube.com', 'github.com', 'remotion.dev', 'elevenlabs.io', 'reddit.com', 'arxiv.org', 'medium.com', 't.me', 'figma.com', 'producthunt.com', 'anthropic.com', 'stackoverflow.com', 'wikipedia.org', 'dev.to'];
const REPORT = [['h', 'Нейросети для видео в 2026'], ['p', 'Короткие ролики чаще всего собирают из трёх частей: сценарий, озвучка и анимация [1][2].'], ['p', 'Для озвучки на русском лидируют голосовые модели нового поколения [3].'], ['h2', 'Анимация кодом'], ['p', 'Remotion позволяет описывать каждый кадр как функцию времени и рендерить MP4 [4][5].'], ['p', 'Связка «ИИ-агент + код» убирает ручной монтаж ключевых кадров [6].']];
const Report: React.FC<{ t: number; at: number; linkAt: number; scroll?: number }> = ({ t, at, linkAt, scroll = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, padding: '34px 40px', fontFamily: TEXT, transform: `translateY(${-scroll}px)` }}>
    <div style={{ fontSize: 14, letterSpacing: '.12em', color: '#8a8a92', marginBottom: 10 }}>ОТЧЁТ · DEEP RESEARCH</div>
    {REPORT.map(([k, txt], i) => { const a = at + i * .35; if (t < a) return null;
      const parts = txt.split(/(\[\d\])/g);
      return <div key={i} style={{ fontFamily: k === 'p' ? TEXT : DISPLAY, fontWeight: k === 'h' ? 800 : k === 'h2' ? 700 : 400, fontSize: k === 'h' ? 38 : k === 'h2' ? 26 : 21, lineHeight: k === 'p' ? 1.55 : 1.15, color: '#1d1d1f', margin: k === 'p' ? '0 0 14px' : '6px 0 14px', letterSpacing: k === 'p' ? 0 : '-.02em', ...rise(t, a, .5, 10) }}>
        {parts.map((p, j) => /\[\d\]/.test(p) ? <span key={j} style={{ display: 'inline-block', padding: '0 6px', margin: '0 2px', borderRadius: 6, fontSize: 15, fontWeight: 700, verticalAlign: 2, background: t >= linkAt ? rgba('#38bdf8', .25 + .3 * decay(t, linkAt + j * .05, 2)) : '#eceff3', color: t >= linkAt ? '#0b6aa8' : '#6e6e73' }}>{p.slice(1, -1)}</span> : <span key={j}>{p}</span>)}
      </div>; })}
  </div>
);
export const T10: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t10'), m = C.t10n + 1.55, [sa, sb] = SH.t10;
  const n = Math.round(38 * eo(pr(t, C.t10Reads, Math.max(.5, C.t10Rep + .4 - C.t10Reads))));
  return <Cam t={t} id="t10">
    <ToolHead t={t} i={9} />
    <Phase t={t} a={m - .1} b={sa}>
      {SRC.map((d, i) => { const left = i % 2 === 0, row = Math.floor(i / 2), at = C.t10Reads - .2 + i * .09, k = ex(pr(t, at, .6));
        const x = left ? 110 + (row % 2) * 40 : 1440 - (row % 2) * 40, y = 190 + row * 92;
        return t >= at && <div key={d} style={{ position: 'absolute', left: x, top: y, width: 370, height: 76, borderRadius: 18, ...glass('#38bdf8'), display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', opacity: clamp(k * 1.4) * (t >= C.t10Hour ? .55 : 1), transform: `translateX(${(1 - k) * (left ? -60 : 60)}px)`, fontFamily: TEXT }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `hsl(${i * 47 % 360} 60% 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff', flex: 'none' }}>{d[0].toUpperCase()}</div>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 18, fontWeight: 600, color: TX }}>{d}</div><i style={{ display: 'block', height: 7, width: 180 - (i % 3) * 30, borderRadius: 4, background: 'rgba(255,255,255,.14)', marginTop: 8 }} /></div>
          {t >= C.t10Links && i < 6 && <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 6, background: rgba('#38bdf8', .3), color: '#bfe8ff', fontWeight: 700, fontSize: 14 }}>{i + 1}</span>}
        </div>; })}
      <div style={{ position: 'absolute', left: 620, top: 200, width: 680, height: 690, borderRadius: 22, background: '#fbfbfd', overflow: 'hidden', boxShadow: `0 50px 120px rgba(0,0,0,.6), 0 0 80px ${rgba('#38bdf8', .2)}`, ...rise(t, Math.max(C.t10Deep - .1, m + .25), .8) }}>
        {t < C.t10Rep && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: TEXT, color: '#55555c' }}><Tile k="research" s={90} glow={.5} /><div style={{ fontSize: 26, fontWeight: 600 }}>Читаю источники…</div><div style={{ fontFamily: WIDE, fontWeight: 800, fontSize: 64, color: '#0b6aa8' }}>{n}</div></div>}
        {t >= C.t10Rep && <Report t={t} at={C.t10Rep} linkAt={C.t10Links} />}
      </div>
      {t >= C.t10Hour - .1 && <div style={{ position: 'absolute', left: 120, top: 900, ...rise(t, C.t10Hour - .1, .5, 14) }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 99, background: 'rgba(255,255,255,.06)', fontFamily: TEXT, fontWeight: 600, fontSize: 26, color: T3, position: 'relative' }}>{IC.clock(26, T3)}час в Google<i style={{ position: 'absolute', left: 14, right: 14, top: '50%', height: 3, background: '#ff6b5c', transform: `scaleX(${ex(pr(t, C.t10Hour + .3, .4))})`, transformOrigin: '0 50%' }} /></div></div>}
      <Chip t={t} at={C.t10Mins} x={1480} y={900} accent="#38bdf8" icon={IC.clock(26, '#7fd3ff')}>пара минут</Chip>
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <div style={{ position: 'absolute', left: 150, top: 190, width: 900, height: 760, borderRadius: 24, background: '#fbfbfd', overflow: 'hidden', boxShadow: `0 50px 120px rgba(0,0,0,.6), 0 0 80px ${rgba('#38bdf8', .2)}`, transform: 'rotate(-1.5deg)', ...rise(t, sa - .1, .8) }}>
        <Report t={t} at={-10} linkAt={-10} scroll={eio(pr(t, sa + .8, sb - sa - 1.5)) * 60} />
      </div>
      <ShowSide t={t} id="t10" title="Отчёт со ссылками за пару минут" sub="Claude сам читает десятки источников" x={1180} y={330} w={640} />
      <Funnel t={t} id="t10" />
    </Phase>
  </Cam>;
};
