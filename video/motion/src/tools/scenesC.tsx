// Tools 4-6 (vidIQ, Notion, GitHub) + the mid-roll funnel
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { TX, T2, T3, OR, OR2, CL, GRN, DISPLAY, TEXT, WIDE, MONO, SERIF, clamp, lerp, ex, ei, eio, eo, pr, decay, back, popS, rise, rgba, typed, impulse, Title, Words, Eyebrow, Tile, ToolK, Win, Chip, glass, Spark, IC, Cursor, curPos, Ring, Burst, SketchArrow, LockIcon, TgBadge, Flash } from './kit';
import { VQ, VidRow, NotionCard, GH, CommitRow } from './apps';
import { C, S, SH, Phase, Cam, ToolHead, Funnel, ShowSide, ShowTitle, TOOLS } from './common';

export const SHEET = ['tools/s01.jpg', 'tools/s02.jpg', 'tools/s03.jpg', 'tools/s04.jpg', 'tools/s05.jpg', 'tools/s06.jpg', 'tools/s07.jpg', 'tools/s08.jpg'];

// ===================== 4 · vidIQ
const ROWS = [['tools/r1_0.jpg', 'Сделал мультик через Claude за вечер', '1,2 млн', '×12', true], ['tools/r2_1.jpg', 'Claude Code: полный гайд для новичков', '340 тыс.', '×3', false], ['tools/r1_2.jpg', 'ИИ-анимация без After Effects', '870 тыс.', '×9', true], ['tools/r2_3.jpg', 'Нейросети для видео — что работает', '120 тыс.', '×1,4', false], ['tools/r1_4.jpg', 'Как я делаю Shorts через ИИ', '410 тыс.', '×4', false]] as const;
const TAGS = ['claude', 'claude code', 'нейросети', 'ии видео', 'мультик', 'remotion', 'без монтажа', 'ии анимация'];
const Trip: React.FC<{ srcs: string[] }> = ({ srcs }) => <div style={{ display: 'flex', width: '100%', height: '100%', gap: 4, background: '#000' }}>{srcs.map((s, i) => <Img key={i} src={staticFile(s)} style={{ flex: 1, height: '100%', objectFit: 'cover' }} />)}</div>;
export const T4: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t4'), m = C.t4n + 1.55, [sa, sb] = SH.t4;
  const colHi = (at: number, b: number) => ex(pr(t, at, .4)) * (1 - ex(pr(t, b, .4)));
  return <Cam t={t} id="t4">
    <ToolHead t={t} i={3} />
    <Phase t={t} a={m - .05} b={C.t4Mine - .2}>
      <Win t={t} at={m} x={110} y={190} w={1120} h={780} title="vidIQ — выбросы" bg={VQ.bg} bar="#0f1630">
        <div style={{ position: 'absolute', left: 20, right: 20, top: 18, height: 56, borderRadius: 14, background: VQ.panel, border: `1px solid ${VQ.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', fontFamily: TEXT, fontSize: 20, color: VQ.txt }}>
          {IC.search(20, VQ.sub)}{typed('claude видео', t, m + .1, .6)}<span style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 9, background: rgba(VQ.blue, .2), color: '#8db8ff', fontSize: 15, fontWeight: 600 }}>Выбросы за 30 дней</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 92, height: 24, display: 'flex', fontFamily: TEXT, fontSize: 13, letterSpacing: '.08em', color: VQ.sub }}><span style={{ marginLeft: 16, width: 146, color: colHi(C.t4Cov, C.t4Titles) > .3 ? VQ.green : undefined }}>ОБЛОЖКА</span><span style={{ flex: 1, color: colHi(C.t4Titles, C.t4Tags) > .3 ? VQ.green : undefined }}>НАЗВАНИЕ</span><span style={{ marginRight: 16 }}>ВЫБРОС</span></div>
        {ROWS.map(([img, title, views, mult, hot], i) => <VidRow key={i} t={t} at={C.t4Look - .1 + i * .12} img={img} title={title} views={views} mult={mult} hot={hot} hotAt={C.t4Shot + (i ? .15 : 0)} y={126 + i * 104} w={1120} />)}
        <div style={{ position: 'absolute', left: 30, top: 120, width: 152, height: 530, borderRadius: 14, boxShadow: `inset 0 0 0 2px ${rgba(VQ.green, colHi(C.t4Cov, C.t4Titles))}`, background: rgba(VQ.green, .06 * colHi(C.t4Cov, C.t4Titles)) }} />
        <div style={{ position: 'absolute', left: 190, top: 120, width: 620, height: 530, borderRadius: 14, boxShadow: `inset 0 0 0 2px ${rgba(VQ.green, colHi(C.t4Titles, C.t4Tags))}`, background: rgba(VQ.green, .06 * colHi(C.t4Titles, C.t4Tags)) }} />
      </Win>
      <Burst t={t} at={C.t4Shot} x={1150} y={330} r={60} color={VQ.green} />
      {t >= C.t4Tags - .3 && <div style={{ position: 'absolute', left: 1280, top: 260, width: 520, borderRadius: 28, ...glass('#4f8cff'), padding: '26px 26px 20px', ...rise(t, C.t4Tags - .3, .6) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: TEXT, fontWeight: 600, fontSize: 20, color: T2, marginBottom: 18 }}><Tile k="vidiq" s={34} />Теги для ролика</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>{TAGS.map((g, i) => <span key={g} style={{ padding: '10px 18px', borderRadius: 99, background: 'rgba(79,140,255,.16)', border: '1px solid rgba(79,140,255,.45)', fontFamily: TEXT, fontWeight: 600, fontSize: 21, color: '#cfe0ff', transform: `scale(${popS(t, C.t4Tags + i * .08, .5)})` }}>#{g}</span>)}</div>
      </div>}
    </Phase>
    <Phase t={t} a={C.t4Mine - .25} b={sb + 1}>
      <div style={{ position: 'absolute', left: 150, top: 250, width: 700, height: 394, borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)', transform: `rotate(-2deg) scale(${lerp(1, 1.03, pr(t, sa, sb - sa))})`, ...rise(t, C.t4Mine - .2, .8) }}>
        <Trip srcs={['tools/r1_0.jpg', 'tools/r2_1.jpg', 'tools/r1_2.jpg']} />
        <div style={{ position: 'absolute', left: 22, top: 18, fontFamily: SERIF, fontSize: 64, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,.6)' }}>Claude</div>
      </div>
      <Chip t={t} at={C.t4Mine + .2} x={180} y={680} accent={VQ.green} icon={<Tile k="vidiq" s={30} />}>найдено в vidIQ · выброс ×12</Chip>
      <SketchArrow t={t} at={C.t4Found - .3} d="M 10 120 C 70 30, 150 20, 210 70" head="M 182 52 L 212 72 L 186 98" box={[230, 140]} style={{ left: 845, top: 330 }} color="#fff" />
      <div style={{ position: 'absolute', left: 1070, top: 250, width: 700, height: 394, borderRadius: 22, overflow: 'hidden', boxShadow: `0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.12), 0 0 90px ${rgba(OR, .25)}`, transform: `rotate(2deg) scale(${lerp(1, 1.05, pr(t, sa, sb - sa))})`, ...rise(t, C.t4Found - .1, .8) }}>
        <Img src={staticFile('tools/thA.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <Chip t={t} at={C.t4Found + .2} x={1100} y={680} accent={OR} icon={<Spark size={24} color={CL} />}>моя обложка · сделал Claude</Chip>
      <ShowTitle t={t} id="t4" text="Нашёл, что работает, — сделал своё" x={150} y={800} size={58} />
      <Funnel t={t} id="t4" />
    </Phase>
  </Cam>;
};

// ===================== 5 · Notion
const NCOLS = [['Идеи', '#e3e2e0'], ['Сценарий', '#fdecc8'], ['Монтаж', '#d3e5ef'], ['Готово', '#dbeddb']] as const;
const NotionPage: React.FC<{ t: number; children: React.ReactNode; title: string; at: number }> = ({ t, children, title, at }) => (
  <AbsoluteFill style={{ background: '#fff', fontFamily: TEXT }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 230, background: '#f7f7f5', borderRight: '1px solid #ededeb', padding: '18px 14px', fontSize: 15, color: '#5f5e5b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#37352f', marginBottom: 18 }}><Tile k="notion" s={24} />Мои ролики</div>
      {[['Главная', '#9b9a97'], ['Контент-план', OR], ['Идеи', '#e9b949'], ['Сценарии', '#5aa7d9'], ['Референсы', '#9a6dd7']].map(([n, c], i) => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 6, background: i === 1 ? '#ebebea' : 'transparent', color: i === 1 ? '#37352f' : undefined, fontWeight: i === 1 ? 600 : 400 }}><i style={{ width: 14, height: 14, borderRadius: 4, background: c }} />{n}</div>)}
    </div>
    <div style={{ position: 'absolute', left: 290, top: 34, display: 'flex', alignItems: 'center', gap: 16, ...rise(t, at, .6, 14) }}><div style={{ width: 54, height: 54, borderRadius: 12, background: `linear-gradient(150deg, ${OR2}, ${OR})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IC.play(26)}</div><span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, color: '#37352f', letterSpacing: '-.02em' }}>{title}</span></div>
    <div style={{ position: 'absolute', left: 290, right: 30, top: 130, bottom: 20 }}>{children}</div>
  </AbsoluteFill>
);
export const T5: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t5'), m = C.t5n + .85, [sa, sb] = SH.t5;
  const mv = eio(pr(t, C.t5Cont + .1, .9)), CW = 300, G = 22;
  const colX = (i: number) => i * (CW + G);
  return <Cam t={t} id="t5">
    <ToolHead t={t} i={4} until={m - .15} />
    <Phase t={t} a={m - .05} b={sa}>
      <Win t={t} at={m} x={130} y={190} w={1660} h={790} title="Notion" bg="#ffffff" bar="#f7f7f5" light>
        <NotionPage t={t} title="Контент-план" at={C.t5Base - .2}>
          {NCOLS.map(([n, c], i) => <div key={n} style={{ position: 'absolute', left: colX(i), top: 0, width: CW, ...rise(t, C.t5Base + i * .08, .5, 12) }}>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, background: c, fontSize: 15, fontWeight: 600, color: '#37352f' }}>{n}</span>
            <div style={{ height: 560, borderRadius: 12, background: '#f7f7f5', marginTop: 12 }} />
          </div>)}
          <div style={{ position: 'absolute', left: colX(0) + 10, top: 60, width: CW - 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <NotionCard t={t} at={C.t5Ideas} text="Claude против дизайнера" tag={['идея · пн', '#e3e2e0']} />
            <NotionCard t={t} at={C.t5Ideas + .2} text="Мультик за один промпт" tag={['идея · ср', '#e3e2e0']} />
            <NotionCard t={t} at={C.t5Writes} text="Claude против монтажёра" typing={1.3} claude tag={['новая идея', '#fde2dd']} />
          </div>
          <div style={{ position: 'absolute', left: colX(1) + 10 + mv * (CW + G), top: 60, width: CW - 20 }}><NotionCard t={t} at={C.t5Scr} text="10 инструментов для Claude" tag={[mv > .5 ? 'монтаж · пт' : 'сценарий · пт', mv > .5 ? '#d3e5ef' : '#fdecc8']} style={{ boxShadow: mv > 0 && mv < 1 ? '0 20px 40px rgba(15,15,15,.2)' : undefined, transform: `rotate(${Math.sin(Math.PI * mv) * 3}deg)` }} /></div>
          <div style={{ position: 'absolute', left: colX(2) + 10, top: 60 + (mv > 0 ? 100 * mv : 0), width: CW - 20 }}><NotionCard t={t} at={C.t5Plan} text="Ролик как у Rick's Clips" tag={['монтаж · вт', '#d3e5ef']} /></div>
          <div style={{ position: 'absolute', left: colX(3) + 10, top: 60, width: CW - 20 }}><NotionCard t={t} at={C.t5Plan + .2} text="Гайд: моушен в Claude" tag={['готово · PDF', '#dbeddb']} /></div>
          {t >= C.t5Next - .1 && <div style={{ position: 'absolute', right: 10, bottom: 10, width: 470, borderRadius: 18, background: '#262624', padding: '16px 18px', fontFamily: TEXT, boxShadow: '0 20px 50px rgba(0,0,0,.3)', ...rise(t, C.t5Next - .1, .5, 16) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#9c9a92', marginBottom: 8 }}><Spark size={16} color={CL} />Claude · Notion</div>
            <div style={{ fontSize: 19, lineHeight: 1.45, color: '#ece9e4' }}>{typed('Продолжаю с того же места: сценарий готов — переношу в «Монтаж».', t, C.t5Next, 1.3)}</div>
          </div>}
        </NotionPage>
      </Win>
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <Win t={t} at={sa - .05} x={110} y={200} w={1100} h={700} title="Notion" bg="#ffffff" bar="#f7f7f5" light>
        <NotionPage t={t} title="Контент-план" at={-10}>
          {[['Монтаж', '#d3e5ef'], ['Готово', '#dbeddb']].map(([n, c], i) => <div key={n} style={{ position: 'absolute', left: i * 390, top: 0, width: 370 }}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, background: c, fontSize: 15, fontWeight: 600, color: '#37352f' }}>{n}</span><div style={{ height: 470, borderRadius: 12, background: '#f7f7f5', marginTop: 12 }} /></div>)}
          {(() => { const k = eio(pr(t, sa + 1.2, 1)); return <div style={{ position: 'absolute', left: 10 + k * 390, top: 60, width: 350, transform: `rotate(${Math.sin(Math.PI * k) * 3}deg)` }}><NotionCard t={t} at={-10} text="10 инструментов для Claude" tag={[k > .5 ? 'готово ✓' : 'монтаж', k > .5 ? '#dbeddb' : '#d3e5ef']} /></div>; })()}
          <div style={{ position: 'absolute', left: 400, top: 160, width: 350, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <NotionCard t={t} at={-10} text="Гайд: моушен в Claude" tag={['готово · PDF', '#dbeddb']} />
            <NotionCard t={t} at={-10} text="Ролик как у Rick's Clips" tag={['готово · 3:24', '#dbeddb']} />
          </div>
        </NotionPage>
      </Win>
      <ShowSide t={t} id="t5" title="Claude помнит, где вы остановились" sub="идеи, план и сценарии — в одной базе" size={66} />
      <Funnel t={t} id="t5" />
    </Phase>
  </Cam>;
};

// ===================== 6 · GitHub
const COMMITS = [['Сценарий: 10 инструментов для Claude', '1d02b03', '2 ч назад'], ['Обложки: 3 варианта по референсам', '8be4410', 'вчера'], ["Rick's Clips: финальный рендер 3:24", 'c71e9a2', 'вчера'], ['Гайд PDF: моушен-ролики в Claude', '4f0d6b1', '2 дня назад'], ['V3: переозвучка голосом Nikolay', '93ab2c7', '3 дня назад'], ['Кинематографичная версия ролика', '5e2d8f0', '4 дня назад']];
export const T6: React.FC<{ t: number }> = ({ t }) => {
  const s = S('t6'), m = C.t6n + 1.55, [sa, sb] = SH.t6;
  const bad = t >= C.t6Broke - .15, rev = eio(pr(t, C.t6Back + .3, .6)), fixed = t >= C.t6Back + .5;
  const badH = bad ? 64 * ex(pr(t, C.t6Broke - .15, .4)) * (1 - rev) : 0;
  const glitch = bad && !fixed ? 1 : 0;
  const [cx, cy] = curPos(t, [[C.t6Broke + .2, 900, 700], [C.t6Back, 966, 336], [C.t6Back + .7, 940, 430]]);
  return <Cam t={t} id="t6">
    <ToolHead t={t} i={5} />
    <Phase t={t} a={m - .2} b={sa}>
      <Win t={t} at={m - .15} x={110} y={190} w={1080} h={760} title="GitHub" bg={GH.bg} bar={GH.panel}>
        <div style={{ position: 'absolute', left: 24, right: 24, top: 18, display: 'flex', alignItems: 'center', gap: 12, fontFamily: TEXT, fontSize: 22, color: GH.txt }}>
          {IC.branch(22, GH.sub)}<span style={{ color: GH.blue }}>videos</span><span style={{ color: GH.sub }}>/</span><b style={{ color: GH.blue, fontWeight: 600 }}>motion</b>
          <span style={{ marginLeft: 12, padding: '3px 10px', borderRadius: 99, border: `1px solid ${GH.line}`, fontSize: 13, color: GH.sub }}>Private</span>
          <span style={{ marginLeft: 'auto', fontSize: 15, color: GH.sub }}>70 коммитов</span>
        </div>
        <div style={{ position: 'absolute', left: 24, right: 24, top: 74, height: 46, borderRadius: '10px 10px 0 0', background: GH.panel, border: `1px solid ${GH.line}`, display: 'flex', alignItems: 'center', padding: '0 18px', fontFamily: TEXT, fontSize: 15, color: GH.sub }}>Коммиты · main</div>
        <div style={{ position: 'absolute', left: 24, right: 24, top: 120, height: 560, border: `1px solid ${GH.line}`, borderTop: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: badH, overflow: 'hidden' }}>
            <CommitRow t={t} at={C.t6Broke - .15} msg="Правка: новый переход в сцене 4" sha="f3a91c0" when="только что" y={0} w={1030} red={1} />
            {bad && !fixed && <div style={{ position: 'absolute', right: 140, top: 14, padding: '7px 14px', borderRadius: 8, background: '#21262d', border: `1px solid ${GH.line}`, display: 'flex', alignItems: 'center', gap: 8, fontFamily: TEXT, fontSize: 15, color: GH.txt, boxShadow: t >= C.t6Back - .2 ? `0 0 0 2px ${GH.blue}` : 'none' }}>{IC.undo(16, GH.txt)}Откатить</div>}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: badH }}>
            {COMMITS.map(([msg, sha, when], i) => <CommitRow key={i} t={t} at={C.t6Keep - .2 + i * .14} msg={msg} sha={sha} when={when} y={i * 64} w={1030} hi={i === 0 && fixed ? ex(pr(t, C.t6Back + .5, .4)) : 0} />)}
            {fixed && <div style={{ position: 'absolute', right: 140, top: 16, padding: '5px 12px', borderRadius: 99, background: rgba(GH.green, .18), color: GH.green, fontFamily: TEXT, fontSize: 14, fontWeight: 600, transform: `scale(${popS(t, C.t6Back + .55)})` }}>текущая версия ✓</div>}
          </div>
        </div>
        {t >= C.t6Broke + .2 && t < C.t6Back + 1 && <Cursor t={t} x={cx - 110} y={cy - 190} hand clicks={[C.t6Back + .1]} />}
      </Win>
      <div style={{ position: 'absolute', left: 1240, top: 230, width: 560, ...rise(t, C.t6Keep, .7) }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 18, color: T2, marginBottom: 12 }}>Превью ролика</div>
        <div style={{ position: 'relative', width: 560, height: 315, borderRadius: 18, overflow: 'hidden', boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.1)${fixed ? `, 0 0 0 3px ${rgba(GH.green, decay(t, C.t6Back + .5, 1.5))}` : ''}` }}>
          <Img src={staticFile('tools/thA.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: glitch ? 'saturate(.4) brightness(.6)' : undefined }} />
          {glitch > 0 && <>
            <Img src={staticFile('tools/thA.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'screen', opacity: .5, transform: `translateX(${8 + Math.sin(t * 50) * 6}px)`, filter: 'sepia(1) hue-rotate(-50deg) saturate(6)', clipPath: `inset(${(Math.sin(t * 23) * .5 + .5) * 60}% 0 ${(Math.cos(t * 17) * .5 + .5) * 30}% 0)` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 125, height: 64, background: 'rgba(248,81,73,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: TEXT, fontWeight: 700, fontSize: 24, color: '#fff' }}>{IC.x(24)}Ошибка рендера</div>
          </>}
          {fixed && <div style={{ position: 'absolute', left: 14, bottom: 14, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: TEXT, fontSize: 17, color: '#fff', transform: `scale(${popS(t, C.t6Back + .6)})` }}><span style={{ color: GH.green }}>✓</span>версия восстановлена</div>}
        </div>
      </div>
      <Chip t={t} at={C.t6Sec} x={1240} y={640} accent={GH.green} icon={IC.clock(26, GH.green)}>откат ≈ 1 секунда</Chip>
      <div style={{ position: 'absolute', left: 1240, top: 740, display: 'flex', gap: 14 }}>{['ricks/', 'v3/', 'cine/', 'tools/'].map((f, i) => <div key={f} style={{ padding: '12px 18px', borderRadius: 14, ...glass(GH.green), fontFamily: MONO, fontSize: 19, color: TX, display: 'flex', alignItems: 'center', gap: 10, transform: `scale(${popS(t, C.t6All + i * .1)})` }}><svg width={22} height={22} viewBox="0 0 24 24"><path d="M3 6h7l2 2h9v11H3z" fill="#54aeff" /></svg>{f}</div>)}</div>
      <Flash t={t} at={C.t6Broke} c="#f85149" o={.18} />
    </Phase>
    <Phase t={t} a={sa - .1} b={sb + 1}>
      <div style={{ position: 'absolute', left: 120, top: 250, borderRadius: 28, ...glass(GH.green), padding: '30px 34px', ...rise(t, sa, .8) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: TEXT, color: T2, fontSize: 22, marginBottom: 22 }}><span style={{ fontFamily: WIDE, fontWeight: 900, fontSize: 64, color: TX }}>{Math.round(70 * eo(pr(t, sa + .2, 2)))}</span>коммитов в этом проекте</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(26, 26px)', gridAutoRows: '26px', gap: 7 }}>
          {Array.from({ length: 26 * 7 }, (_, i) => { const col = Math.floor(i / 7), row = i % 7, h = Math.abs(Math.sin(i * 7.31) * 43758.5) % 1, lvl = h > .45 ? Math.ceil((h - .45) / .14) : 0, k = ex(pr(t, sa + .3 + col * .06 + row * .02, .5));
            const cs = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
            return <i key={i} style={{ gridColumn: col + 1, gridRow: row + 1, borderRadius: 6, background: k > .5 ? cs[Math.min(4, lvl)] : '#161b22', transform: `scale(${lerp(.4, 1, k)})`, boxShadow: lvl >= 4 && k > .5 ? '0 0 10px rgba(57,211,83,.5)' : 'none' }} />; })}
        </div>
      </div>
      <ShowSide t={t} id="t6" title="Ничего не теряется" sub="каждая версия каждого ролика" x={1300} y={330} />
      <Funnel t={t} id="t6" />
    </Phase>
  </Cam>;
};

// ===================== mid-roll: connectors done → cheat sheet in Telegram → skills
export const Mid: React.FC<{ t: number }> = ({ t }) => {
  const s = S('mid');
  const conn = TOOLS.slice(0, 6), skills = TOOLS.slice(6);
  const pdfK = ex(pr(t, C.midHow - .1, 1)), big = ex(pr(t, C.midSheet - .1, .7));
  return <Cam t={t} id="mid">
    <Phase t={t} a={s.start} b={C.midHow - .15}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', gap: 34 }}>
        {conn.map((tool, i) => { const at = C.midDone - .3 + i * .09, k = popS(t, at, .55);
          return <div key={tool.id} style={{ position: 'relative', transform: `scale(${k})` }}><Tile k={tool.k} s={140} glow={decay(t, C.midDone + .3, 1.5)} />
            <div style={{ position: 'absolute', right: -10, top: -10, width: 46, height: 46, borderRadius: 23, background: GRN, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${popS(t, C.midDone + .25 + i * .08)})`, boxShadow: '0 6px 16px rgba(0,0,0,.4)' }}>{IC.check(26)}</div></div>; })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 540 }}><Title t={t} at={C.midDone - .1} text="6 коннекторов" size={120} weight={800} align="center" grad={['#ffffff', '#cfcfd4']} glow={OR} glowO={.3} sweep={C.midDone + .5} /></div>
    </Phase>
    <Phase t={t} a={C.midHow - .2} b={C.midNext - .2}>
      <div style={{ position: 'absolute', left: 130, top: 240, width: 820 }}>
        <Eyebrow t={t} at={C.midHow - .15} text="ШПАРГАЛКА" color="#5bb8f0" size={24} />
        <Title t={t} at={C.midHow} text="Как подключить каждый" size={96} weight={800} grad={['#ffffff', '#d6ecfb']} glow="#3aa7e8" glowO={.35} sweep={C.midHow + 1} lh={1.02} style={{ marginTop: 18 }} />
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[[C.midSteps, 'по шагам'], [C.midShots, 'со скриншотами'], [C.midPrompt, 'с первым промптом']].map(([at, n], i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, color: TX, ...rise(t, (at as number) - .15, .6, 20) }}>
            <span style={{ width: 52, height: 52, borderRadius: 26, background: GRN, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${popS(t, at as number)})`, boxShadow: `0 0 ${24 * decay(t, at as number, 2)}px ${rgba(GRN, .8)}` }}>{IC.check(30)}</span>{n as string}</div>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1120, top: 170, width: 560, height: 700, perspective: 2000 }}>
        <div style={{ position: 'absolute', inset: 0, transform: `rotateY(${lerp(-26, -12, big)}deg) rotateX(4deg) translateY(${(1 - pdfK) * 120}px) scale(${lerp(.92, 1, pdfK) * lerp(1, 1.04, big)})`, opacity: clamp(pdfK * 1.4), transformStyle: 'preserve-3d' }}>
          {[3, 2, 1].map((j) => <div key={j} style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', transform: `translate(${j * 18 * ex(pr(t, C.midSteps + j * .1, .6))}px, ${j * 10}px) translateZ(${-j * 30}px)`, opacity: .9 - j * .15, boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}><Img src={staticFile(SHEET[j])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>)}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', boxShadow: `0 50px 120px rgba(0,0,0,.6), 0 0 ${60 * big}px ${rgba('#3aa7e8', .45)}` }}><Img src={staticFile(SHEET[0])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
        </div>
        {t >= C.midTg - .2 && <div style={{ position: 'absolute', left: -60, bottom: -10, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px 12px 12px', borderRadius: 999, ...glass('#3aa7e8'), transform: `scale(${popS(t, C.midTg - .2)})`, transformOrigin: '0 50%', boxShadow: `inset 0 1px 0 rgba(255,255,255,.1), 0 20px 50px rgba(0,0,0,.5), 0 0 40px rgba(58,167,232,.4)` }}>
          <TgBadge s={52} /><div style={{ fontFamily: TEXT }}><div style={{ fontSize: 22, fontWeight: 700, color: TX }}>@claudecode09</div><div style={{ fontSize: 16, color: T2 }}>только в Telegram</div></div><LockIcon s={22} c="#ffd7cf" />
        </div>}
      </div>
    </Phase>
    <Phase t={t} a={C.midNext - .25} b={s.end + 1}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 250 }}>
        <Eyebrow t={t} at={C.midNext - .1} text="А ДАЛЬШЕ" size={24} style={{ justifyContent: 'center' }} />
        <Title t={t} at={C.midNext + .1} text="СКИЛЛЫ" size={210} weight={900} font={WIDE} align="center" grad={['#fff3ea', OR]} glow={OR} glowO={.6} sweep={C.midInt} chroma={[C.midInt]} stagger={.05} track={-.01} style={{ marginTop: 16 }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center', gap: 34 }}>{skills.map((tool, i) => <div key={tool.id} style={{ transform: `scale(${popS(t, C.midNext + .4 + i * .12)}) translateY(${Math.sin(t * 1.5 + i) * 6}px)` }}><Tile k={tool.k} s={120} glow={.6 + .4 * decay(t, C.midInt, 2)} /></div>)}</div>
      <Flash t={t} at={C.midInt} c={OR} o={.2} />
    </Phase>
  </Cam>;
};
