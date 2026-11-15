// App mockups (recreated UIs, simplified): Claude, Figma, Canva, vidIQ, Notion, GitHub, terminal, Telegram.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { TX, T2, T3, OR, OR2, CL, DISPLAY, TEXT, MONO, SERIF, clamp, lerp, ex, ei, eio, pr, decay, popS, rise, typed, rgba, Spark, IC, Tile, TgIcon, LockIcon } from './kit';

// ---------- Claude (dark)
export const CB = { bg: '#262624', side: '#1f1e1d', bub: '#141413', comp: '#30302e', bord: '#45443f', txt: '#ece9e4', sub: '#9c9a92' };
export const ClaudeShell: React.FC<{ t: number; children?: React.ReactNode; title?: string; side?: boolean }> = ({ t, children, title = 'Новый чат', side = true }) => (
  <AbsoluteFill style={{ background: CB.bg, fontFamily: TEXT }}>
    {side && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 230, background: CB.side, borderRight: '1px solid #2f2e2b', padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}><Spark size={26} color={CL} /><span style={{ fontFamily: SERIF, fontSize: 25, color: CB.txt }}>Claude</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#2b2a27', color: CB.txt, fontSize: 16, fontWeight: 500 }}>{IC.plus(18, CL)}Новый чат</div>
      <div style={{ fontSize: 12, color: '#77756e', margin: '24px 6px 10px', letterSpacing: '.08em' }}>НЕДАВНИЕ</div>
      {[78, 60, 70, 48, 64, 56].map((w, i) => <i key={i} style={{ display: 'block', height: 9, width: `${w}%`, borderRadius: 5, background: '#2c2b28', margin: '15px 6px' }} />)}
    </div>}
    <div style={{ position: 'absolute', left: side ? 230 : 0, right: 0, top: 0, height: 54, display: 'flex', alignItems: 'center', padding: '0 26px', borderBottom: '1px solid #33322f', color: CB.sub, fontSize: 16 }}>
      {title}<span style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 9, background: '#302f2c', color: CB.txt, fontSize: 14 }}>Opus 5.5</span>
    </div>
    <div style={{ position: 'absolute', left: side ? 230 : 0, right: 0, top: 54, bottom: 0 }}>{children}</div>
  </AbsoluteFill>
);
export const UserMsg: React.FC<{ t: number; at: number; text: string; x?: number; y: number; w?: number; size?: number }> = ({ t, at, text, x = 60, y, w = 760, size = 22 }) => {
  if (t < at) return null;
  return <div style={{ position: 'absolute', left: x, top: y, maxWidth: w, display: 'flex', gap: 14, alignItems: 'flex-start', ...rise(t, at, .6, 24) }}>
    <div style={{ width: 34, height: 34, borderRadius: 17, background: '#d7d3cb', color: '#2a2925', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>А</div>
    <div style={{ padding: '12px 18px', borderRadius: 16, background: CB.bub, color: CB.txt, fontSize: size, lineHeight: 1.45 }}>{text}</div>
  </div>;
};
export const AiMsg: React.FC<{ t: number; at: number; x?: number; y: number; w?: number; children: React.ReactNode }> = ({ t, at, x = 60, y, w = 900, children }) => {
  if (t < at) return null;
  return <div style={{ position: 'absolute', left: x, top: y, width: w, display: 'flex', gap: 16, ...rise(t, at, .6, 20) }}>
    <div style={{ flex: 'none', marginTop: 2, transform: `rotate(${t * 40}deg)` }}><Spark size={30} color={CL} /></div>
    <div style={{ flex: 1, color: CB.txt, fontSize: 21, lineHeight: 1.5 }}>{children}</div>
  </div>;
};
// streaming plain text
export const Stream: React.FC<{ t: number; at: number; text: string; cps?: number; style?: React.CSSProperties; dim?: number }> = ({ t, at, text, cps = 90, style, dim = 0 }) => {
  const n = Math.max(0, Math.floor((t - at) * cps)), s = text.slice(0, n);
  return <div style={{ whiteSpace: 'pre-wrap', color: dim ? `rgba(236,233,228,${1 - dim * .6})` : undefined, ...style }}>{s}{n < text.length && n > 0 && <span style={{ display: 'inline-block', width: 9, height: 20, background: CL, marginLeft: 2, verticalAlign: -3, borderRadius: 2 }} />}</div>;
};
export const Composer: React.FC<{ t: number; text: string; caret?: boolean; active?: boolean; x?: number; y: number; w: number; chips?: { at: number; node: React.ReactNode }[]; sendAt?: number; placeholder?: string }> = ({ t, text, caret, active, x = 60, y, w, chips = [], sendAt = 1e9, placeholder = 'Напишите сообщение…' }) => {
  const press = t >= sendAt && t < sendAt + .2 ? Math.sin(Math.PI * (t - sendAt) / .2) : 0;
  return <div style={{ position: 'absolute', left: x, top: y, width: w, borderRadius: 22, background: CB.comp, border: `1.5px solid ${active ? rgba(CL, .9) : CB.bord}`, padding: '16px 20px 14px', boxShadow: active ? `0 0 0 4px ${rgba(CL, .14)}, 0 20px 50px rgba(0,0,0,.35)` : '0 20px 50px rgba(0,0,0,.35)', fontFamily: TEXT }}>
    {chips.some((c) => t >= c.at) && <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>{chips.map((c, i) => t >= c.at && <div key={i} style={{ transform: `scale(${popS(t, c.at)})`, transformOrigin: '0 50%' }}>{c.node}</div>)}</div>}
    <div style={{ fontSize: 22, lineHeight: 1.45, color: text ? CB.txt : '#7d7b74', minHeight: 32 }}>{text || placeholder}{caret && <span style={{ display: 'inline-block', width: 2, height: 24, marginLeft: 2, verticalAlign: -4, background: CL, opacity: Math.sin(t * 12) > 0 ? 1 : .15 }} />}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${CB.bord}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IC.plus(18, '#b3b0a8')}</div>
      <div style={{ marginLeft: 'auto', width: 38, height: 38, borderRadius: 12, background: text ? CL : '#45443f', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - .12 * press})` }}>{IC.arrowUp(20, text ? '#1d120c' : '#8b8982')}</div>
    </div>
  </div>;
};
export const FileChip: React.FC<{ name: string; meta?: string; color?: string; label?: string }> = ({ name, meta, color = '#e8553e', label = 'MD' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px 8px 8px', borderRadius: 14, background: '#3a3936', border: '1px solid #4d4c47' }}>
    <div style={{ width: 40, height: 46, borderRadius: 8, background: color, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 5, fontFamily: TEXT, fontWeight: 800, fontSize: 11, color: '#fff' }}>{label}</div>
    <div><div style={{ fontSize: 17, fontWeight: 600, color: CB.txt }}>{name}</div>{meta && <div style={{ fontSize: 13, color: CB.sub }}>{meta}</div>}</div>
  </div>
);
// tool call card (connector in action)
export const ToolCall: React.FC<{ t: number; at: number; k: any; name: string; action: string; p: number; children?: React.ReactNode; accent?: string }> = ({ t, at, k, name, action, p, children, accent = OR }) => {
  if (t < at) return null;
  return <div style={{ borderRadius: 16, border: '1px solid #44433e', background: '#2c2b28', padding: '14px 16px', ...rise(t, at, .6, 16) }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, color: CB.txt }}>
      <Tile k={k} s={34} /><b style={{ fontWeight: 600 }}>{name}</b><span style={{ color: CB.sub, fontFamily: MONO, fontSize: 15 }}>{action}</span>
      <span style={{ marginLeft: 'auto', fontSize: 15, color: p >= 1 ? '#7bd389' : OR2 }}>{p >= 1 ? 'готово ✓' : `${Math.round(p * 100)}%`}</span>
    </div>
    <div style={{ height: 4, borderRadius: 2, background: '#3d3c38', marginTop: 12, overflow: 'hidden' }}><div style={{ width: `${p * 100}%`, height: '100%', background: p >= 1 ? '#5ac46a' : `linear-gradient(90deg, ${accent}, ${OR2})` }} /></div>
    {children}
  </div>;
};

// ---------- Figma (dark UI)
export const FigmaUI: React.FC<{ t: number; layers: { at: number; name: string; kind: string }[]; sel?: number; children?: React.ReactNode; props?: [string, string][] }> = ({ t, layers, sel = -1, children, props = [] }) => (
  <AbsoluteFill style={{ background: '#1e1e1e', fontFamily: TEXT }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 48, background: '#2c2c2c', display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderBottom: '1px solid #383838' }}>
      <div style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d99ff' }}><svg width={16} height={16} viewBox="0 0 24 24"><path d="M5 3l14 8-6 2-3 6z" fill="#fff" /></svg></div>
      {['#', '□', '✎', 'T', '◯'].map((c, i) => <div key={i} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cfcfcf', fontSize: 16 }}>{c}</div>)}
      <div style={{ marginLeft: 'auto', marginRight: 'auto', color: '#e6e6e6', fontSize: 14 }}>Обложки / <b style={{ fontWeight: 600 }}>YouTube Thumbnail</b></div>
      <div style={{ display: 'flex', gap: -6 }}>{['#ff8a4c', '#0d99ff'].map((c, i) => <div key={i} style={{ width: 28, height: 28, borderRadius: 14, background: c, border: '2px solid #2c2c2c', marginLeft: i ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{i ? 'А' : <Spark size={14} color="#fff" />}</div>)}</div>
      <div style={{ padding: '6px 14px', borderRadius: 7, background: '#0d99ff', color: '#fff', fontSize: 13, fontWeight: 600, marginLeft: 10 }}>Share</div>
    </div>
    <div style={{ position: 'absolute', left: 0, top: 48, bottom: 0, width: 250, background: '#2c2c2c', borderRight: '1px solid #383838', padding: '12px 0' }}>
      <div style={{ padding: '4px 16px 10px', color: '#fff', fontSize: 13, fontWeight: 600 }}>Слои</div>
      <div style={{ padding: '7px 16px', color: '#e6e6e6', fontSize: 13, display: 'flex', gap: 8 }}><span style={{ color: '#8f8f8f' }}>#</span>Thumbnail 1280×720</div>
      {layers.map((l, i) => t >= l.at && <div key={i} style={{ padding: '7px 16px 7px 34px', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center', color: '#e6e6e6', background: i === sel ? '#0d99ff33' : 'transparent', boxShadow: i === sel ? 'inset 2px 0 0 #0d99ff' : 'none', ...rise(t, l.at, .45, 10) }}>
        <span style={{ width: 16, color: '#9a9a9a', textAlign: 'center' }}>{l.kind}</span>{l.name}</div>)}
    </div>
    <div style={{ position: 'absolute', right: 0, top: 48, bottom: 0, width: 260, background: '#2c2c2c', borderLeft: '1px solid #383838', padding: '14px 16px', color: '#e6e6e6', fontSize: 13 }}>
      <div style={{ display: 'flex', gap: 16, fontWeight: 600, marginBottom: 16 }}><span>Design</span><span style={{ color: '#8f8f8f' }}>Prototype</span></div>
      {props.map(([a, b], i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 10px', borderRadius: 6, background: '#383838', marginBottom: 8 }}><span style={{ color: '#9a9a9a' }}>{a}</span><span>{b}</span></div>)}
    </div>
    <div style={{ position: 'absolute', left: 250, right: 260, top: 48, bottom: 0, overflow: 'hidden', backgroundImage: 'radial-gradient(#2a2a2a 1px, transparent 1.4px)', backgroundSize: '22px 22px' }}>{children}</div>
  </AbsoluteFill>
);
export const SelBox: React.FC<{ x: number; y: number; w: number; h: number; label?: string; o?: number }> = ({ x, y, w, h, label, o = 1 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, border: '2px solid #0d99ff', opacity: o, pointerEvents: 'none' }}>
    {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => <i key={i} style={{ position: 'absolute', left: a * w - 6, top: b * h - 6, width: 10, height: 10, background: '#fff', border: '2px solid #0d99ff' }} />)}
    {label && <div style={{ position: 'absolute', left: '50%', bottom: -30, transform: 'translateX(-50%)', padding: '3px 8px', borderRadius: 4, background: '#0d99ff', color: '#fff', fontFamily: TEXT, fontSize: 12, whiteSpace: 'nowrap' }}>{label}</div>}
  </div>
);

// ---------- Canva-like editor (light)
export const CanvaUI: React.FC<{ t: number; children?: React.ReactNode; tplAt?: number }> = ({ t, children, tplAt = 0 }) => (
  <AbsoluteFill style={{ background: '#ebecf0', fontFamily: TEXT }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 54, background: 'linear-gradient(90deg, #00c4cc, #7d2ae8)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 18, color: '#fff', fontSize: 15, fontWeight: 600 }}>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 26 }}>Canva</span><span style={{ opacity: .85 }}>Файл</span><span style={{ opacity: .85 }}>Изменить размер</span>
      <span style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,.22)' }}>Поделиться</span>
    </div>
    <div style={{ position: 'absolute', left: 0, top: 54, bottom: 0, width: 72, background: '#18191b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, paddingTop: 20 }}>
      {['▦', 'T', '◇', '⬆', '☰'].map((c, i) => <div key={i} style={{ width: 40, height: 40, borderRadius: 10, background: i === 0 ? '#3a3b3f' : 'transparent', color: '#e8e8ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c}</div>)}
    </div>
    <div style={{ position: 'absolute', left: 72, top: 54, bottom: 0, width: 330, background: '#252627', padding: 16 }}>
      <div style={{ height: 40, borderRadius: 8, background: '#3a3b3f', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', color: '#a8a8ad', fontSize: 14 }}>{IC.search(16, '#a8a8ad')}Шаблоны</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        {['#ff8a4c,#7d2ae8', '#00c4cc,#1d3b8f', '#fbd24c,#ff5f57', '#111,#ff8a4c', '#7d2ae8,#ff5fa8', '#22c55e,#0e7490', '#f5f5f7,#c7c7cc', '#0a84ff,#00c4cc'].map((g, i) => { const k = ex(pr(t, tplAt + i * .05, .5));
          return <div key={i} style={{ height: i % 3 === 1 ? 170 : 120, borderRadius: 8, background: `linear-gradient(150deg, ${g})`, opacity: k, transform: `scale(${lerp(.9, 1, k)})` }}><i style={{ display: 'block', margin: '18px 12px 0', height: 8, width: '70%', borderRadius: 4, background: 'rgba(255,255,255,.75)' }} /><i style={{ display: 'block', margin: '8px 12px', height: 8, width: '45%', borderRadius: 4, background: 'rgba(255,255,255,.5)' }} /></div>; })}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 402, right: 0, top: 54, bottom: 0 }}>{children}</div>
  </AbsoluteFill>
);

// ---------- vidIQ-like analytics (dark navy)
export const VQ = { bg: '#0b1020', panel: '#121a33', line: '#1f2a4d', txt: '#e6ebff', sub: '#8b96bd', blue: '#3d8bff', green: '#2bd38f' };
export const VidRow: React.FC<{ t: number; at: number; img: string; title: string; views: string; mult: string; y: number; hot?: boolean; hotAt?: number; w: number }> = ({ t, at, img, title, views, mult, y, hot, hotAt = 1e9, w }) => {
  if (t < at) return null;
  const h = hot && t >= hotAt ? ex(pr(t, hotAt, .5)) : 0;
  return <div style={{ position: 'absolute', left: 20, top: y, width: w - 40, height: 92, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', background: h ? `rgba(43,211,143,${.08 * h})` : 'transparent', border: `1px solid ${h ? rgba(VQ.green, .5 * h) : 'transparent'}`, ...rise(t, at, .5, 14), fontFamily: TEXT }}>
    <div style={{ width: 128, height: 72, borderRadius: 8, overflow: 'hidden', flex: 'none' }}><Img src={staticFile(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 18, fontWeight: 600, color: VQ.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div><div style={{ fontSize: 14, color: VQ.sub, marginTop: 4 }}>{views} просмотров</div></div>
    <div style={{ padding: '6px 12px', borderRadius: 9, background: hot ? rgba(VQ.green, .16 + .2 * h) : '#1b2546', color: hot ? VQ.green : VQ.sub, fontWeight: 700, fontSize: 16, transform: `scale(${1 + .25 * h * decay(t, hotAt, 3)})` }}>{mult}</div>
  </div>;
};

// ---------- Notion-like page (light)
export const NotionCard: React.FC<{ t: number; at: number; text: string; tag?: [string, string]; typing?: number; claude?: boolean; style?: React.CSSProperties }> = ({ t, at, text, tag, typing, claude, style }) => {
  if (t < at) return null;
  const s = typing !== undefined ? typed(text, t, at, typing) : text;
  return <div style={{ position: 'relative', borderRadius: 10, background: '#fff', boxShadow: '0 1px 2px rgba(15,15,15,.1), 0 0 0 1px rgba(15,15,15,.06)', padding: '12px 14px', fontFamily: TEXT, ...rise(t, at, .5, 12), ...style }}>
    <div style={{ fontSize: 17, fontWeight: 600, color: '#37352f', minHeight: 22 }}>{s}{typing !== undefined && s.length < text.length && <span style={{ display: 'inline-block', width: 2, height: 18, background: CL, marginLeft: 1, verticalAlign: -3 }} />}</div>
    {tag && <span style={{ display: 'inline-block', marginTop: 8, padding: '2px 8px', borderRadius: 4, fontSize: 13, background: tag[1], color: '#37352f' }}>{tag[0]}</span>}
    {claude && typing !== undefined && s.length < text.length && <div style={{ position: 'absolute', right: -6, top: -14, padding: '2px 8px', borderRadius: 6, background: CL, color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Spark size={12} color="#fff" />Claude</div>}
  </div>;
};

// ---------- GitHub-like repo (dark)
export const GH = { bg: '#0d1117', panel: '#161b22', line: '#30363d', txt: '#e6edf3', sub: '#7d8590', blue: '#2f81f7', green: '#3fb950', red: '#f85149' };
export const CommitRow: React.FC<{ t: number; at: number; msg: string; sha: string; when: string; y: number; w: number; hi?: number; red?: number }> = ({ t, at, msg, sha, when, y, w, hi = 0, red = 0 }) => {
  if (t < at) return null;
  return <div style={{ position: 'absolute', left: 0, top: y, width: w, height: 64, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', borderBottom: `1px solid ${GH.line}`, background: red ? `rgba(248,81,73,${.12 * red})` : hi ? `rgba(47,129,247,${.14 * hi})` : 'transparent', fontFamily: TEXT, ...rise(t, at, .45, 10) }}>
    <div style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${red ? GH.red : GH.sub}`, flex: 'none' }} />
    <div style={{ flex: 1, minWidth: 0, fontSize: 17, color: GH.txt, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</div>
    <span style={{ fontFamily: MONO, fontSize: 14, color: GH.sub }}>{sha}</span><span style={{ fontSize: 14, color: GH.sub, width: 110, textAlign: 'right' }}>{when}</span>
  </div>;
};

// ---------- terminal (Claude Code)
export const Term: React.FC<{ t: number; lines: { at: number; text: string; c?: string; d?: number; prompt?: boolean }[]; fontSize?: number; children?: React.ReactNode }> = ({ t, lines, fontSize = 21, children }) => (
  <AbsoluteFill style={{ background: '#141210', padding: '22px 26px', fontFamily: MONO, fontSize, lineHeight: 1.65, color: '#e7e1d9' }}>
    {lines.map((l, i) => t >= l.at && <div key={i} style={{ color: l.c || '#e7e1d9', whiteSpace: 'pre' }}>{l.prompt && <span style={{ color: OR2 }}>{'> '}</span>}{l.d ? typed(l.text, t, l.at, l.d) : l.text}{l.d && t < l.at + l.d + .4 && <span style={{ display: 'inline-block', width: fontSize * .55, height: fontSize * 1.05, background: OR2, verticalAlign: -3, marginLeft: 2, opacity: Math.sin(t * 12) > 0 ? 1 : .2 }} />}</div>)}
    {children}
  </AbsoluteFill>
);

// ---------- Telegram channel post
export const TG = { bg: '#0e1621', panel: '#17212b', bub: '#182533', txt: '#f5f5f5', sub: '#7f91a4', link: '#6ab3f3', acc: '#5288c1' };
export const TgFile: React.FC<{ name: string; meta: string; color?: string; p?: number; locked?: boolean }> = ({ name, meta, color = TG.acc, p = 0, locked }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontFamily: TEXT }}>
    <div style={{ position: 'relative', width: 58, height: 58, borderRadius: 29, background: p >= 1 ? '#4fae4e' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      {p > 0 && p < 1 && <svg width={58} height={58} style={{ position: 'absolute' }}><circle cx={29} cy={29} r={24} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={3} /><circle cx={29} cy={29} r={24} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={151} strokeDashoffset={151 * (1 - p)} transform="rotate(-90 29 29)" strokeLinecap="round" /></svg>}
      {p >= 1 ? IC.check(26) : locked ? <LockIcon s={24} /> : IC.dl(26)}
    </div>
    <div><div style={{ fontSize: 19, fontWeight: 600, color: TG.txt }}>{name}</div><div style={{ fontSize: 15, color: TG.sub, marginTop: 2 }}>{p > 0 && p < 1 ? `Загрузка… ${Math.round(p * 100)}%` : p >= 1 ? 'Скачано' : meta}</div></div>
  </div>
);
