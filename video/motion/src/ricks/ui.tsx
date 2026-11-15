// Detailed UI mockups + motion primitives for the Rick's Clips tutorial (1920x1080)
import React from 'react';
import { AbsoluteFill, Img, staticFile, delayRender, continueRender } from 'remotion';
import { OR, OR2, TX, MU, SANS, SERIF, MONO, clamp, lerp, eo, ex, ei, eio, back, pr, decay, Spark, FileGlyph } from '../v3/V3';

export const DISP = 'Unbounded, Onest, sans-serif';
if (typeof document !== 'undefined' && !(window as any).__unbFonts) {
  (window as any).__unbFonts = true;
  const h = delayRender('unbounded');
  const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116', LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212';
  const ps: Promise<any>[] = [];
  for (const [sub, rng] of [['cyrillic', CYR], ['latin', LAT]]) for (const w of ['400', '500', '600', '700'])
    ps.push(new FontFace('Unbounded', `url(${staticFile(`fonts/unbounded-${sub}-${w}-normal.woff2`)})`, { weight: w, unicodeRange: rng }).load().then((f) => (document as any).fonts.add(f)));
  Promise.all(ps).then(() => continueRender(h)).catch(() => continueRender(h));
}

// ---------- motion primitives
// letters rise out of a mask with blur and a slight tilt; optional exit
export const Reveal: React.FC<{ t: number; at: number; text: string; size: number; color?: string; weight?: number; font?: string; stagger?: number; out?: number; style?: React.CSSProperties; align?: 'left' | 'center' }> =
  ({ t, at, text, size, color = TX, weight = 600, font = DISP, stagger = .022, out = 1e9, style, align = 'left' }) => {
    let idx = 0;
    return <div style={{ fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: -size * .025, lineHeight: 1.12, color, textAlign: align, ...style }}>
      {text.split(' ').map((word, wi) => <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '.3em' }}>
        {[...word].map((ch, ci) => { const i = idx++; const k = ex(pr(t, at + i * stagger, .7)), o = ei(pr(t, out + i * .008, .35));
          return <span key={ci} style={{ display: 'inline-block', overflow: 'hidden', padding: '.06em 0 .14em', margin: '-.06em 0 -.14em', verticalAlign: 'top' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - k) * 110 - o * 110}%) rotate(${(1 - k) * 10}deg)`, transformOrigin: '0 100%', opacity: Math.min(1, k * 1.5) * (1 - o), filter: k < .97 ? `blur(${(1 - k) * 7}px)` : 'none' }}>{ch}</span></span>; })}
      </span>)}
    </div>;
  };
// a sub-stage inside a scene that cross-dissolves in/out smoothly
export const Phase: React.FC<{ t: number; a: number; b: number; children: React.ReactNode; dy?: number }> = ({ t, a, b, children, dy = 40 }) => {
  if (t < a || t > b) return null;
  const ki = ex(pr(t, a, .65)), ko = ei(pr(t, b - .45, .45)), bl = (1 - ki) * 10 + ko * 12;
  return <AbsoluteFill style={{ opacity: Math.min(1, ki * 1.3) * (1 - ko), transform: `translateY(${(1 - ki) * dy - ko * dy * .6}px) scale(${lerp(.975, 1, ki) * lerp(1, 1.025, ko)})`, filter: bl > .3 ? `blur(${bl}px)` : 'none' }}>{children}</AbsoluteFill>;
};
export const rise = (t: number, at: number, d = .7): React.CSSProperties => { const k = ex(pr(t, at, d)); return { opacity: Math.min(1, k * 1.3), transform: `translateY(${(1 - k) * 46}px) scale(${lerp(.96, 1, k)})`, filter: k < .97 ? `blur(${(1 - k) * 10}px)` : 'none' }; };
export const popS = (t: number, at: number, d = .55) => (t < at ? 0 : back(pr(t, at, d)));

// ---------- small icons
const I = (d: string, s = 26, c = '#f1f1f1', w = 2) => <svg width={s} height={s} viewBox="0 0 24 24"><path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
export const IC = {
  menu: (c?: string) => I('M3 6h18M3 12h18M3 18h18', 26, c), search: (c?: string, s = 24) => I('M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM20 20l-4.5-4.5', s, c), mic: () => I('M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3'),
  bell: () => I('M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4'), home: (c?: string) => I('M4 11l8-7 8 7v9h-5v-6H9v6H4z', 24, c), shorts: (c?: string) => I('M15 3l-8 5v8l8 5 4-2.5V5.5zM10 9.5v5l4-2.5z', 24, c),
  subs: (c?: string) => I('M4 6h16v12H4zM10 9.5v5l4-2.5z', 24, c), you: (c?: string) => I('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', 24, c), hist: (c?: string) => I('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3', 24, c),
  lock: () => I('M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3', 18, '#b8b2ab'), back: () => I('M15 5l-7 7 7 7', 22, '#b8b2ab'), fwd: () => I('M9 5l7 7-7 7', 22, '#6c665f'), reload: () => I('M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5', 22, '#b8b2ab'),
  pin: () => I('M9 4h6l-1 6 3 3H7l3-3zM12 13v7', 22, '#6ab3f3'), eye: () => I('M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 18, '#7f91a4'),
  dl: (c = '#fff') => I('M12 4v11M7 11l5 5 5-5M5 20h14', 26, c, 2.4), plus: (c?: string) => I('M12 5v14M5 12h14', 24, c), dots: () => I('M5 12h.01M12 12h.01M19 12h.01', 24, '#aaa', 3.2), chev: (c = '#aaa') => I('M6 9l6 6 6-6', 18, c),
};

// ---------- window frames
export const Frame: React.FC<{ x: number; y: number; w: number; h: number; children?: React.ReactNode; style?: React.CSSProperties; bg?: string; radius?: number }> = ({ x, y, w, h, children, style, bg = '#141212', radius = 22 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: radius, overflow: 'hidden', background: bg, boxShadow: '0 50px 120px rgba(0,0,0,.7), 0 0 0 1.5px rgba(255,255,255,.08)', ...style }}>{children}</div>
);
// browser chrome: tab strip + address bar
export const Browser: React.FC<{ url: string; tab: string; favicon?: React.ReactNode; children?: React.ReactNode; caret?: boolean; t?: number }> = ({ url, tab, favicon, children, caret, t = 0 }) => (
  <>
    <div style={{ height: 46, background: '#0b0a0a', display: 'flex', alignItems: 'flex-end', padding: '0 16px', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignSelf: 'center', marginRight: 14 }}>{['#ff5f57', '#febc2e', '#28c840'].map((c) => <i key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}</div>
      <div style={{ height: 36, width: 260, borderRadius: '12px 12px 0 0', background: '#1f1d1c', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontFamily: SANS, fontSize: 17, color: '#e8e3dd' }}>{favicon}<span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab}</span><span style={{ color: '#8a847d' }}>×</span></div>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 10px', color: '#8a847d', fontSize: 22 }}>+</div>
    </div>
    <div style={{ height: 52, background: '#1f1d1c', display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', borderBottom: '1px solid #2c2926' }}>
      {IC.back()}{IC.fwd()}{IC.reload()}
      <div style={{ flex: 1, height: 36, borderRadius: 18, background: '#121110', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: SANS, fontSize: 19, color: '#ece7e1' }}>{IC.lock()}<span>{url}</span>{caret && <span style={{ width: 2, height: 22, background: OR, opacity: Math.sin(t * 14) > 0 ? 1 : 0 }} />}</div>
      <span style={{ color: '#8a847d', fontSize: 22 }}>☆</span>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 98, bottom: 0 }}>{children}</div>
  </>
);

// ---------- YouTube (dark) channel page, recreated
const YT_TITLES = ['Levels of Pirate Cannonballs', 'The Ancient Jar That Warned an Empire'];
export const YTLogo: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 * s }}>
    <div style={{ width: 40 * s, height: 28 * s, borderRadius: 8 * s, background: '#ff0033', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width={14 * s} height={14 * s} viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z" fill="#fff" /></svg></div>
    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24 * s, letterSpacing: -1, color: '#fff' }}>YouTube</span>
  </div>
);
export const YouTube: React.FC<{ t: number; thumbs: string[]; selIdx?: number; selAt?: number; hideIdx?: number; grow?: number; showAt?: number }> = ({ t, thumbs, selIdx = -1, selAt = 1e9, hideIdx = -1, grow = 0, showAt = -1e9 }) => {
  const side = [['home', 'Главная'], ['shorts', 'Shorts'], ['subs', 'Подписки'], ['you', 'Вы'], ['hist', 'История']] as const;
  return <AbsoluteFill style={{ background: '#0f0f0f' }}>
    <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 20 }}>
      {IC.menu()}<YTLogo />
      <div style={{ marginLeft: 'auto', width: 560, height: 42, borderRadius: 21, border: '1px solid #303030', background: '#121212', display: 'flex', alignItems: 'center', padding: '0 0 0 18px', fontFamily: SANS, fontSize: 18, color: '#888' }}>Введите запрос<div style={{ marginLeft: 'auto', width: 64, height: 40, borderRadius: '0 20px 20px 0', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IC.search('#f1f1f1', 22)}</div></div>
      <div style={{ width: 42, height: 42, borderRadius: 21, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IC.mic()}</div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}><div style={{ padding: '8px 16px', borderRadius: 20, background: '#272727', fontFamily: SANS, fontSize: 17, color: '#f1f1f1', display: 'flex', gap: 6, alignItems: 'center' }}>{IC.plus()}Создать</div>{IC.bell()}<div style={{ width: 34, height: 34, borderRadius: 17, background: 'linear-gradient(135deg,#ee7a3f,#8b3fd9)' }} /></div>
    </div>
    <div style={{ position: 'absolute', left: 0, top: 64, width: 210, bottom: 0, padding: '10px 12px' }}>
      {side.map(([k, n], i) => <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '12px 14px', borderRadius: 10, background: i === 0 ? '#272727' : 'transparent', fontFamily: SANS, fontSize: 17, color: '#f1f1f1' }}>{(IC as any)[k]()}{n}</div>)}
      <div style={{ height: 1, background: '#303030', margin: '10px 4px' }} />
      {[0, 1, 2].map((i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px' }}><i style={{ width: 26, height: 26, borderRadius: 13, background: ['#3a5a8c', '#7a3b2e', '#2f6b4c'][i] }} /><i style={{ height: 10, width: 100 - i * 18, borderRadius: 5, background: '#2a2a2a' }} /></div>)}
    </div>
    <div style={{ position: 'absolute', left: 230, right: 30, top: 70, bottom: 0 }}>
      <div style={{ height: 104, borderRadius: 16, overflow: 'hidden', position: 'relative', display: 'flex' }}>
        {thumbs.slice(0, 6).map((s, i) => <Img key={i} src={staticFile(s)} style={{ flex: 1, height: '100%', objectFit: 'cover', filter: 'saturate(1.2)' }} />)}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,15,15,.2), rgba(15,15,15,.75))' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 18 }}>
        <div style={{ width: 104, height: 104, borderRadius: 52, overflow: 'hidden', flex: 'none' }}><Img src={staticFile(thumbs[2])} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%' }} /></div>
        <div><div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#f1f1f1', letterSpacing: -1 }}>Rick's Clips</div>
          <div style={{ fontFamily: SANS, fontSize: 17, color: '#aaa', marginTop: 4 }}>Короткие мультики про историю · Shorts</div>
          <div style={{ marginTop: 10, display: 'inline-block', padding: '8px 18px', borderRadius: 20, background: '#f1f1f1', fontFamily: SANS, fontWeight: 600, fontSize: 16, color: '#0f0f0f' }}>Подписаться</div></div>
      </div>
      <div style={{ display: 'flex', gap: 34, marginTop: 16, borderBottom: '1px solid #303030', fontFamily: SANS, fontWeight: 500, fontSize: 18, color: '#aaa' }}>
        {['Главная', 'Видео', 'Shorts', 'Плейлисты', 'Сообщество'].map((n) => <div key={n} style={{ padding: '10px 0', color: n === 'Shorts' ? '#f1f1f1' : undefined, borderBottom: n === 'Shorts' ? '3px solid #f1f1f1' : '3px solid transparent' }}>{n}</div>)}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
        {thumbs.slice(0, 7).map((s, i) => { const sel = i === selIdx && t >= selAt, k = popS(t, showAt + i * .06, .5) || (showAt < 0 ? 1 : 0);
          return <div key={i} style={{ width: 172, opacity: i === hideIdx ? 1 - grow : 1, transform: `scale(${(showAt > 0 ? k : 1) * (sel ? 1.06 : 1)})`, transformOrigin: '50% 30%' }}>
            <div style={{ height: 290, borderRadius: 12, overflow: 'hidden', boxShadow: sel ? `0 0 0 4px ${OR}, 0 0 40px rgba(238,122,63,.7)` : 'none' }}><Img src={staticFile(s)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            {i < 2 ? <div style={{ marginTop: 8, fontFamily: SANS, fontWeight: 500, fontSize: 15, lineHeight: 1.3, color: '#f1f1f1' }}>{YT_TITLES[i]}</div>
              : <><i style={{ display: 'block', marginTop: 10, height: 10, width: '92%', borderRadius: 5, background: '#2a2a2a' }} /><i style={{ display: 'block', marginTop: 8, height: 10, width: '60%', borderRadius: 5, background: '#2a2a2a' }} /></>}
          </div>; })}
      </div>
    </div>
  </AbsoluteFill>;
};

// ---------- Telegram desktop (dark), recreated
const TG = { bg: '#0e1621', panel: '#17212b', hi: '#2b5278', acc: '#5288c1', txt: '#f5f5f5', sub: '#7f91a4', bub: '#182533' };
export const Telegram: React.FC<{ t: number; pinAt: number; postAt: number; dl: number[]; clickAt?: number }> = ({ t, pinAt, postAt, dl }) => {
  const chats = [['Избранное', '#5288c1', 'И'], ['@claudecode09', 'me', ''], ['Новости ИИ', '#b0522f', 'Н'], ['Моушен-дизайн', '#3c8d5a', 'М'], ['Друзья', '#8a4fb0', 'Д'], ['Монтаж чат', '#a8842c', 'М']];
  return <AbsoluteFill style={{ background: TG.bg, fontFamily: SANS }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 420, background: TG.panel, borderRight: '1px solid #0b121a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px' }}>{IC.menu('#7f91a4')}<div style={{ flex: 1, height: 40, borderRadius: 20, background: '#242f3d', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontSize: 17, color: TG.sub }}>{IC.search('#7f91a4', 18)}Поиск</div></div>
      {chats.map(([n, c, l], i) => { const me = c === 'me';
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', background: me ? TG.hi : 'transparent' }}>
          {me ? <Img src={staticFile('avatar.jpg')} style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover' }} /> : <div style={{ width: 56, height: 56, borderRadius: 28, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600, color: '#fff' }}>{l}</div>}
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600, color: TG.txt }}><span>{n}</span><span style={{ fontSize: 14, fontWeight: 400, color: me ? '#c9d9ec' : TG.sub }}>{['вчера', '12:30', '11:02', '09:47', 'пн', 'вс'][i]}</span></div>
            <div style={{ fontSize: 15, color: me ? '#c9d9ec' : TG.sub, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me ? '📌 Промпты и материалы для роликов…' : ['Сохранённое', '', 'Новая модель вышла…', 'Референсы недели', 'Го завтра?', 'Кто рендерит в 4K?'][i]}</div></div>
        </div>; })}
    </div>
    <div style={{ position: 'absolute', left: 420, right: 0, top: 0, height: 62, background: TG.panel, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', borderBottom: '1px solid #0b121a' }}>
      <Img src={staticFile('avatar.jpg')} style={{ width: 42, height: 42, borderRadius: 21, objectFit: 'cover' }} />
      <div><div style={{ fontSize: 19, fontWeight: 600, color: TG.txt }}>@claudecode09</div><div style={{ fontSize: 14, color: TG.sub }}>канал · видео в Claude, промпты, разборы</div></div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>{IC.search('#7f91a4', 22)}{IC.dots()}</div>
    </div>
    <div style={{ position: 'absolute', left: 420, right: 0, top: 62, height: 52, background: TG.panel, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', borderBottom: '1px solid #0b121a', boxShadow: t >= pinAt ? `inset 3px 0 0 ${TG.acc}` : 'none', opacity: t >= pinAt - .3 ? 1 : .0 }}>
      {IC.pin()}<div><div style={{ fontSize: 15, fontWeight: 600, color: '#6ab3f3' }}>Закреплённое сообщение</div><div style={{ fontSize: 15, color: TG.txt }}>Промпты и материалы — видео как у Rick's Clips</div></div>
    </div>
    <div style={{ position: 'absolute', left: 420, right: 0, top: 114, bottom: 0, backgroundImage: 'radial-gradient(rgba(82,136,193,.07) 2px, transparent 2.5px)', backgroundSize: '26px 26px' }}>
      {t >= postAt && <div style={{ position: 'absolute', left: 60, top: 40, width: 640, borderRadius: '18px 18px 18px 6px', background: TG.bub, padding: '16px 18px 12px', ...rise(t, postAt, .6) }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#6ab3f3', marginBottom: 6 }}>@claudecode09</div>
        <div style={{ fontSize: 19, lineHeight: 1.45, color: TG.txt }}>🎬 Всё для роликов в стиле Rick's Clips.<br />Скачай файлы и закинь их в Claude 👇</div>
        {[['промпты.txt', 'TXT · промпты по шагам'], ['материалы.zip', 'ZIP · шаблоны и примеры']].map(([n, d], i) => { const p = dl[i] || 0;
          return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
            <div style={{ position: 'relative', width: 54, height: 54, borderRadius: 27, background: p >= 1 ? '#4fae4e' : TG.acc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p > 0 && p < 1 ? <svg width={54} height={54} style={{ position: 'absolute' }}><circle cx={27} cy={27} r={22} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={3} /><circle cx={27} cy={27} r={22} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={138} strokeDashoffset={138 * (1 - p)} transform="rotate(-90 27 27)" strokeLinecap="round" /></svg> : null}
              {p >= 1 ? I('M5 12l5 5 9-10', 26, '#fff', 2.6) : IC.dl()}</div>
            <div><div style={{ fontSize: 17, fontWeight: 600, color: TG.txt }}>{n}</div><div style={{ fontSize: 14, color: TG.sub }}>{p > 0 && p < 1 ? `Загрузка… ${Math.round(p * 100)}%` : p >= 1 ? 'Скачано' : d}</div></div>
          </div>; })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          {['🔥', '👍', '❤️'].map((e) => <span key={e} style={{ padding: '4px 12px', borderRadius: 14, background: '#2b5278', fontSize: 16 }}>{e}</span>)}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TG.sub }}>{IC.eye()} 12:30</span></div>
      </div>}
    </div>
    <div style={{ position: 'absolute', left: 420, right: 0, bottom: 0, height: 60, background: TG.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#6ab3f3', fontWeight: 600, letterSpacing: .5 }}>ОТКЛЮЧИТЬ ЗВУК</div>
  </AbsoluteFill>;
};

// ---------- Claude desktop app, recreated
export const ClaudeApp: React.FC<{ t: number; children?: React.ReactNode; tab?: 'chat' | 'code'; tabAt?: number; model?: string }> = ({ t, children, tab = 'chat', tabAt = 1e9, model = 'Opus 5.5' }) => (
  <AbsoluteFill style={{ background: '#1a1817', fontFamily: SANS }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 270, background: '#141312', borderRight: '1px solid #2a2724', padding: '18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><Spark size={30} /><span style={{ fontFamily: SERIF, fontSize: 28, color: TX }}>Claude</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: '#2a2522', color: OR2, fontSize: 17, fontWeight: 600 }}>{IC.plus(OR2)}Новый чат</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>{['Чат', 'Код'].map((n) => { const on = (n === 'Код') === (tab === 'code' && t >= tabAt); return <div key={n} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 10, fontSize: 16, fontWeight: 600, background: on ? OR : '#1f1d1b', color: on ? '#170e09' : '#bdb6ad', boxShadow: on && n === 'Код' ? `0 0 ${18 + 30 * decay(t, tabAt, 3)}px rgba(238,122,63,.7)` : 'none' }}>{n === 'Код' ? '</> Код' : 'Чат'}</div>; })}</div>
      <div style={{ fontSize: 13, color: '#7a736b', margin: '22px 4px 10px', letterSpacing: 1 }}>НЕДАВНИЕ</div>
      {[82, 64, 74, 52, 68].map((w, i) => <i key={i} style={{ display: 'block', height: 11, width: `${w}%`, borderRadius: 6, background: '#262321', margin: '14px 6px' }} />)}
      <div style={{ position: 'absolute', left: 16, bottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 17, background: 'linear-gradient(135deg,#ee7a3f,#8b3fd9)' }} /><span style={{ fontSize: 15, color: '#bdb6ad' }}>План Pro</span></div>
    </div>
    <div style={{ position: 'absolute', left: 270, right: 0, top: 0, height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #2a2724' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: '#24211f', fontSize: 16, color: '#e6dfd7' }}>{model} {IC.chev('#8d857c')}</div>
    </div>
    <div style={{ position: 'absolute', left: 270, right: 0, top: 56, bottom: 0 }}>{children}</div>
  </AbsoluteFill>
);
export const Composer: React.FC<{ t: number; text: string; caret?: boolean; chips?: [number, string, string][]; active?: boolean; style?: React.CSSProperties }> = ({ t, text, caret, chips = [], active, style }) => (
  <div style={{ position: 'absolute', left: 60, right: 60, bottom: 40, borderRadius: 26, background: '#24211f', border: `2px solid ${active ? OR : '#3b3632'}`, padding: '18px 22px 16px', boxShadow: active ? '0 0 40px rgba(238,122,63,.25)' : '0 20px 60px rgba(0,0,0,.4)', ...style }}>
    {chips.some(([at]) => t >= at) && <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>{chips.map(([at, k, n], i) => t >= at && <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 8px 10px', borderRadius: 14, background: '#2f2b28', border: '1.5px solid #4a433d', fontFamily: SANS, fontSize: 18, color: TX, transform: `scale(${popS(t, at)})`, boxShadow: `0 0 ${26 * decay(t, at, 2.5)}px rgba(238,122,63,.7)` }}><FileGlyph k={k} />{n}</div>)}</div>}
    <div style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.45, color: text ? TX : '#7a736b', minHeight: 32 }}>{text || 'Чем помочь сегодня?'}{caret && <span style={{ display: 'inline-block', width: 2, height: 24, marginLeft: 2, verticalAlign: -4, background: OR, opacity: Math.sin(t * 14) > 0 ? 1 : 0 }} />}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #4a433d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IC.plus('#bdb6ad')}</div>
      <span style={{ marginLeft: 'auto', fontFamily: SANS, fontSize: 16, color: '#8d857c' }}>Opus 5.5</span>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: text ? OR : '#3a3531', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I('M12 19V5M5 12l7-7 7 7', 22, text ? '#1a1310' : '#8d857c', 2.6)}</div>
    </div>
  </div>
);
