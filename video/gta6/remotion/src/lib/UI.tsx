import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, backOut, clamp, ease, glowText, ramp} from './theme';

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

export const Star: React.FC<{on: number; size?: number; flash?: string}> = ({on, size = 54, flash}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{overflow: 'visible'}}>
    <path
      d="M 0 -44 L 12 -14 L 44 -12 L 19 8 L 28 40 L 0 22 L -28 40 L -19 8 L -44 -12 L -12 -14 Z"
      fill={on > 0.5 ? flash ?? C.gold : 'rgba(255,255,255,0.06)'}
      stroke={on > 0.5 ? '#1A1206' : 'rgba(255,255,255,0.55)'}
      strokeWidth={6}
      strokeLinejoin="round"
      style={on > 0.5 ? {filter: `drop-shadow(0 0 10px ${flash ?? 'rgba(255,200,70,0.9)'})`} : {}}
      transform={`scale(${1 + 0.35 * Math.max(0, 1 - Math.abs(on - 0.75) * 4)})`}
    />
  </svg>
);

/** Circular minimap (own design) */
export const Minimap: React.FC<{alert?: boolean; o?: number}> = ({alert, o = 1}) => {
  const f = useCurrentFrame();
  const rot = f * 0.15;
  const ring = alert ? (Math.floor(f / 6) % 2 ? '#FF4D5E' : '#4DA3FF') : 'rgba(255,255,255,0.28)';
  return (
    <div style={{position: 'absolute', left: 56, bottom: 52, width: 230, height: 230, opacity: o}}>
      <svg width={230} height={230} viewBox="-115 -115 230 230">
        <defs>
          <clipPath id="mmclip"><circle r={104} /></clipPath>
          <radialGradient id="mmbg"><stop offset="0" stopColor="#1B2240" /><stop offset="1" stopColor="#0B0E1E" /></radialGradient>
        </defs>
        <circle r={110} fill="rgba(5,6,14,0.75)" />
        <g clipPath="url(#mmclip)">
          <circle r={104} fill="url(#mmbg)" />
          <g transform={`rotate(${rot})`}>
            {[-90, -40, 10, 60].map((y, i) => <rect key={'h' + i} x={-160} y={y} width={320} height={9} fill="#2C3560" />)}
            {[-70, -10, 50, 100].map((x, i) => <rect key={'v' + i} x={x} y={-160} width={9} height={320} fill="#2C3560" />)}
            {[[-60, -78, 40, 30], [8, -30, 34, 34], [-48, 20, 30, 24], [64, 66, 30, 26], [-110, 70, 34, 26]].map(([x, y, w, h], i) => (
              <rect key={'b' + i} x={x} y={y} width={w} height={h} rx={3} fill="#222A4C" />
            ))}
            <rect x={30} y={-104} width={60} height={40} rx={4} fill="#2A5A3E" opacity={0.8} />
            <g transform="translate(70 -70) rotate(45)"><rect x={-8} y={-8} width={16} height={16} rx={2} fill={C.gold} style={{filter: 'drop-shadow(0 0 6px rgba(255,210,64,0.9))'}} /></g>
          </g>
          {alert && <circle r={104} fill={ring} opacity={0.12} />}
        </g>
        <circle r={107} fill="none" stroke={ring} strokeWidth={5} />
        <path d="M 0 -16 L 12 12 L 0 5 L -12 12 Z" fill={C.hero} stroke="#0B0A0F" strokeWidth={3} />
        <text x={0} y={-90} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={18} fill="#F4EEE2" opacity={0.8}>С</text>
      </svg>
    </div>
  );
};

/** In-world game HUD v2: money pill + wanted stars + minimap */
export const HUD: React.FC<{money: number; stars: number; o?: number; pop?: number; flash?: boolean; starAnim?: number[]; map?: boolean}> = ({money, stars, o = 1, pop = 0, flash, starAnim = [], map = true}) => {
  const f = useCurrentFrame();
  const fl = flash ? (Math.floor(f / 6) % 2 ? '#FF4D5E' : '#4DA3FF') : undefined;
  return (
    <>
      <div style={{position: 'absolute', left: 56, top: 46, opacity: o, fontFamily: FONT}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: 'linear-gradient(90deg, rgba(6,8,18,0.85), rgba(6,8,18,0.55))', borderRadius: 40, padding: '8px 28px 8px 10px', border: '2px solid rgba(91,227,138,0.35)', boxShadow: '0 8px 30px rgba(0,0,0,0.45)', transform: `scale(${1 + 0.1 * pop})`, transformOrigin: 'left center'}}>
          <div style={{width: 56, height: 56, borderRadius: 28, background: 'linear-gradient(180deg, #6EF0A0, #2FAE62)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B2A16', fontWeight: 900, fontSize: 36, boxShadow: '0 0 18px rgba(91,227,138,0.6)'}}>$</div>
          <div style={{color: '#E9FFF1', fontWeight: 900, fontSize: 52, letterSpacing: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 16px rgba(91,227,138,0.6), 0 3px 0 rgba(0,0,0,0.5)'}}>
            {Math.round(money).toLocaleString('ru-RU').replace(/\u00A0/g, ' ')}
          </div>
        </div>
        <div style={{display: 'flex', gap: 6, marginTop: 12, marginLeft: 6}}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} on={starAnim[i] ?? (i < stars ? 1 : 0)} size={48} flash={i < stars ? fl : undefined} />
          ))}
        </div>
      </div>
      {map && <Minimap alert={stars > 0} o={o} />}
    </>
  );
};

/** Floating quest marker anchored at screen point (x,y) = above a head */
export const Quest: React.FC<{x: number; y: number; title: string; reward?: string; start?: number; red?: boolean; done?: number; scale?: number}> = ({
  x, y, title, reward, start = 0, red, done = -1, scale = 1,
}) => {
  const f = useCurrentFrame();
  const k = ramp(f, start, 9, backOut);
  if (f < start) return null;
  const bob = Math.sin((f - start) / 9) * 6;
  const col = red ? C.red : C.gold;
  const isDone = done >= 0 && f >= done;
  return (
    <div style={{position: 'absolute', left: x, top: y + bob, transform: `translate(-50%, -100%) scale(${k * scale})`, transformOrigin: '50% 100%', fontFamily: FONT, textAlign: 'left'}}>
      <div style={{display: 'flex', alignItems: 'stretch', background: 'linear-gradient(180deg, rgba(22,20,40,0.94), rgba(10,10,22,0.94))', borderRadius: 14, overflow: 'hidden', boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 0 2px ${col}55`, whiteSpace: 'nowrap'}}>
        <div style={{width: 10, background: col}} />
        <div style={{padding: '10px 18px 12px'}}>
          <div style={{color: col, fontWeight: 900, fontSize: 17, letterSpacing: 3}}>{red ? 'ОСОБОЕ ЗАДАНИЕ' : 'ЗАДАНИЕ'}</div>
          <div style={{color: '#F4EEE2', fontWeight: 800, fontSize: 28, marginTop: 2, textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1}}>{title}</div>
          {reward && <div style={{display: 'inline-block', marginTop: 6, color: '#0B2A16', background: C.green, fontWeight: 900, fontSize: 22, padding: '2px 12px', borderRadius: 20}}>{reward}</div>}
        </div>
      </div>
      <div style={{width: 0, height: 0, margin: '0 auto', borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '16px solid rgba(16,15,30,0.94)'}} />
      <div style={{width: 36, height: 36, margin: '6px auto 0', transform: 'rotate(45deg)', background: col, borderRadius: 7, boxShadow: `0 0 20px ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(0,0,0,0.35)'}}>
        <span style={{transform: 'rotate(-45deg)', fontWeight: 900, fontSize: 24, color: '#1A1206'}}>{isDone ? '✓' : '!'}</span>
      </div>
    </div>
  );
};

/** Big centred "mission passed" style banner */
export const Mission: React.FC<{title: string; sub?: string; start: number; dur?: number; color?: string}> = ({title, sub, start, dur = 75, color = C.gold}) => {
  const f = useCurrentFrame() - start;
  if (f < 0 || f > dur) return null;
  const band = interpolate(f, [0, 8], [0, 1], {...clamp, easing: ease});
  const txt = interpolate(f, [4, 12], [1.35, 1], {...clamp, easing: ease});
  const out = 1 - ramp(f, dur - 10, 10);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: out, fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 0, right: 0, height: 250, background: 'linear-gradient(90deg, rgba(0,0,0,0), rgba(4,4,12,0.88) 25%, rgba(4,4,12,0.88) 75%, rgba(0,0,0,0))', transform: `scaleX(${band})`}} />
      <div style={{position: 'absolute', left: '22%', right: '22%', height: 3, top: 'calc(50% - 112px)', background: color, opacity: 0.7, transform: `scaleX(${band})`}} />
      <div style={{position: 'absolute', left: '22%', right: '22%', height: 3, top: 'calc(50% + 110px)', background: color, opacity: 0.7, transform: `scaleX(${band})`}} />
      <div style={{position: 'relative', textAlign: 'center', transform: `scale(${txt})`, opacity: ramp(f, 4, 6)}}>
        <div style={{color, fontWeight: 900, fontSize: 104, letterSpacing: 4, fontStyle: 'italic', textShadow: `0 0 30px ${color}88, 0 5px 0 rgba(0,0,0,0.6)`}}>{title}</div>
        {sub && <div style={{color: '#F4EEE2', fontWeight: 800, fontSize: 40, marginTop: 4, opacity: ramp(f, 14, 8)}}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

/** Chapter tag (top-right) */
export const Chapter: React.FC<{n: string; title: string; start?: number; dur?: number}> = ({n, title, start = 0, dur = 84}) => {
  const f = useCurrentFrame() - start;
  if (f < 0 || f > dur) return null;
  const k = Math.min(ramp(f, 0, 12), 1 - ramp(f, dur - 12, 12));
  return (
    <div style={{position: 'absolute', right: 60, top: 54, fontFamily: FONT, textAlign: 'right', opacity: k, transform: `translateX(${(1 - k) * 60}px)`}}>
      <div style={{color: C.gold, fontWeight: 900, fontSize: 24, letterSpacing: 8}}>ГЛАВА {n}</div>
      <div style={{color: '#F4EEE2', fontWeight: 900, fontSize: 48, letterSpacing: 2, marginTop: 2, textShadow: '0 3px 0 rgba(0,0,0,0.5)'}}>{title}</div>
      <div style={{height: 5, background: C.gold, marginTop: 8, marginLeft: 'auto', width: `${100 * ramp(f, 4, 16)}%`, borderRadius: 3, boxShadow: '0 0 12px rgba(255,210,64,0.7)'}} />
    </div>
  );
};

/** Pop-up "+$50" floating up */
export const Gain: React.FC<{x: number; y: number; text: string; start: number; color?: string; size?: number}> = ({x, y, text, start, color = C.green, size = 64}) => {
  const f = useCurrentFrame() - start;
  if (f < 0 || f > 40) return null;
  const k = ramp(f, 0, 8, backOut);
  const o = interpolate(f, [26, 40], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y - f * 2.2, transform: `translate(-50%,-50%) scale(${k})`, opacity: o, fontFamily: FONT, fontWeight: 900, fontSize: size, color, textShadow: '0 0 16px rgba(0,0,0,0.6), 0 4px 0 #0B0A0F'}}>{text}</div>
  );
};

/** Notification toast bottom-right */
export const Toast: React.FC<{text: string; sub?: string; start: number; dur?: number; color?: string; icon?: string}> = ({text, sub, start, dur = 75, color = C.gold, icon = '▲'}) => {
  const f = useCurrentFrame() - start;
  if (f < 0 || f > dur) return null;
  const k = Math.min(ramp(f, 0, 10), 1 - ramp(f, dur - 10, 10));
  return (
    <div style={{position: 'absolute', right: 60, bottom: 70, transform: `translateX(${(1 - k) * 120}px)`, opacity: k, fontFamily: FONT}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(10,10,22,0.85)', borderLeft: `8px solid ${color}`, borderRadius: 14, padding: '18px 28px', boxShadow: '0 0 30px rgba(0,0,0,0.5)'}}>
        <div style={{fontSize: 40, color, fontWeight: 900}}>{icon}</div>
        <div>
          <div style={{color: '#F4EEE2', fontWeight: 800, fontSize: 34}}>{text}</div>
          {sub && <div style={{color: '#B9B3C9', fontWeight: 700, fontSize: 24, marginTop: 2}}>{sub}</div>}
        </div>
      </div>
    </div>
  );
};

/** Big centred title card text */
export const BigText: React.FC<{small?: string; big: string; start?: number; color?: string; size?: number; y?: number; strike?: number; sub?: string}> = ({
  small, big, start = 0, color = C.gold, size = 110, y = 0, strike = -1, sub,
}) => {
  const f = useCurrentFrame();
  const a = ramp(f, start, 10);
  const b = ramp(f, start + 6, 12);
  const s = strike >= 0 ? ramp(f, strike, 10) : 0;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, transform: `translateY(${y}px)`}}>
      {small && <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 38, letterSpacing: 8, opacity: a, transform: `translateY(${(1 - a) * 16}px)`}}>{small}</div>}
      <div style={{position: 'relative', color, fontWeight: 900, fontSize: size, marginTop: 10, textShadow: color === C.gold ? glowText : `0 0 20px ${color}88`, opacity: b, transform: `scale(${0.94 + 0.06 * b})`, textAlign: 'center', lineHeight: 1.05}}>
        {big}
        {s > 0 && <div style={{position: 'absolute', left: '-3%', top: '52%', height: 12, width: `${106 * s}%`, background: C.red, borderRadius: 6, boxShadow: '0 0 16px rgba(255,77,94,0.8)'}} />}
      </div>
      {sub && <div style={{color: '#B9B3C9', fontWeight: 700, fontSize: 34, marginTop: 18, opacity: ramp(f, start + 14, 10)}}>{sub}</div>}
    </AbsoluteFill>
  );
};

/** Stamp text (e.g. ОТМЕНЕНО) */
export const Stamp: React.FC<{text: string; start: number; x?: number; y?: number; color?: string; rot?: number; size?: number}> = ({text, start, x = 960, y = 540, color = C.red, rot = -12, size = 120}) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return null;
  const k = interpolate(f, [0, 5, 9], [2.2, 0.92, 1], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${k})`, fontFamily: FONT, fontWeight: 900, fontSize: size, color, border: `10px solid ${color}`, borderRadius: 18, padding: '6px 34px', opacity: interpolate(f, [0, 3], [0, 0.92], clamp), letterSpacing: 4, textShadow: `0 0 18px ${color}88`, boxShadow: `0 0 30px ${color}55`}}>
      {text}
    </div>
  );
};

/** Dialogue box at the bottom with options */
export const Dialog: React.FC<{who: string; options: string[]; pick?: number; start: number; pickAt?: number}> = ({who, options, pick = 0, start, pickAt = 1e9}) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return null;
  const k = ramp(f, 0, 10);
  return (
    <div style={{position: 'absolute', left: '50%', bottom: 60, width: 1300, transform: `translate(-50%, ${(1 - k) * 60}px)`, opacity: k, fontFamily: FONT}}>
      <div style={{background: 'rgba(10,10,22,0.9)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '22px 34px'}}>
        <div style={{color: C.gold, fontWeight: 800, fontSize: 28, letterSpacing: 3, marginBottom: 12}}>{who}</div>
        {options.map((o, i) => {
          const sel = i === pick;
          const chosen = sel && f >= pickAt - start;
          return (
            <div key={i} style={{display: 'flex', gap: 16, alignItems: 'center', padding: '10px 16px', borderRadius: 12, marginTop: 6, background: sel ? (chosen ? 'rgba(91,227,138,0.25)' : 'rgba(255,210,64,0.14)') : 'transparent', color: sel ? '#FFF' : '#8E89A0', fontWeight: 800, fontSize: 34, opacity: ramp(f, 6 + i * 4, 8)}}>
              <span style={{color: sel ? C.gold : '#55516A'}}>{sel ? '▶' : '•'}</span>
              {o}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Full screen game menu */
export const Menu: React.FC<{title: string; items: string[]; active?: number; start?: number; danger?: number[]; disabled?: number[]; bg?: number}> = ({
  title, items, active = 0, start = 0, danger = [], disabled = [], bg = 0.78,
}) => {
  const f = useCurrentFrame() - start;
  const k = ramp(f, 0, 10);
  return (
    <AbsoluteFill style={{background: `rgba(4,4,12,${bg * k})`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
      <div style={{opacity: k, transform: `scale(${(0.96 + 0.04 * k) * 1.3})`, width: 900}}>
        <div style={{color: '#EDE7DA', fontWeight: 900, fontSize: 64, letterSpacing: 10, textAlign: 'center', marginBottom: 34}}>{title}</div>
        {items.map((it, i) => {
          const sel = i === active;
          const dz = danger.includes(i);
          const dis = disabled.includes(i);
          const pulse = sel ? 0.5 + 0.5 * Math.sin(f / 5) : 0;
          return (
            <div key={i} style={{padding: '22px 34px', marginTop: 14, borderRadius: 16, fontWeight: 800, fontSize: 44, textAlign: 'center',
              color: dis ? '#4C4860' : sel ? (dz ? '#FFF' : '#1A1206') : '#B9B3C9',
              background: sel ? (dz ? `rgba(255,77,94,${0.55 + 0.3 * pulse})` : C.gold) : 'rgba(255,255,255,0.05)',
              boxShadow: sel ? `0 0 ${30 + 30 * pulse}px ${dz ? 'rgba(255,77,94,0.7)' : 'rgba(255,200,70,0.6)'}` : 'none',
              textDecoration: dis ? 'line-through' : 'none', opacity: ramp(f, 4 + i * 3, 8)}}>
              {it}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Code entry field with typing */
export const CodeInput: React.FC<{code: string; start: number; label?: string}> = ({code, start, label = 'ВВЕДИТЕ КОД'}) => {
  const f = useCurrentFrame() - start;
  const n = Math.max(0, Math.min(code.length, Math.floor(f / 3)));
  const ok = f > code.length * 3 + 8;
  return (
    <div style={{fontFamily: FONT, textAlign: 'center'}}>
      <div style={{color: '#B9B3C9', fontWeight: 800, fontSize: 30, letterSpacing: 6}}>{label}</div>
      <div style={{marginTop: 14, display: 'inline-block', minWidth: 640, padding: '18px 30px', borderRadius: 16, border: `3px solid ${ok ? C.green : 'rgba(255,255,255,0.3)'}`, background: 'rgba(10,10,22,0.85)', color: ok ? C.green : '#FFF', fontWeight: 900, fontSize: 64, letterSpacing: 10, fontFamily: "'DejaVu Sans Mono', monospace", boxShadow: ok ? '0 0 30px rgba(91,227,138,0.5)' : 'none'}}>
        {code.slice(0, n)}
        <span style={{opacity: Math.floor(f / 8) % 2 ? 0 : 1}}>_</span>
      </div>
      {ok && <div style={{color: C.green, fontWeight: 800, fontSize: 32, marginTop: 14}}>КОД АКТИВИРОВАН</div>}
    </div>
  );
};

/** Animated counter text */
export const Counter: React.FC<{from: number; to: number; start: number; dur?: number; prefix?: string; suffix?: string; size?: number; color?: string}> = ({from, to, start, dur = 30, prefix = '', suffix = '', size = 150, color = C.gold}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [start, start + dur], [0, 1], {...clamp, easing: ease});
  const v = from + (to - from) * k;
  return (
    <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color, textShadow: color === C.gold ? glowText : `0 0 24px ${color}88`, fontVariantNumeric: 'tabular-nums'}}>
      {prefix}
      {Math.round(v).toLocaleString('ru-RU').replace(/ /g, ' ')}
      {suffix}
    </div>
  );
};

/** Speech bubble at (x,y) pointing down-left */
export const Bubble: React.FC<{x: number; y: number; text: string; start: number; w?: number; size?: number}> = ({x, y, text, start, w = 560, size = 40}) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return null;
  const k = ramp(f, 0, 9, backOut);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-20%,-100%) scale(${k})`, transformOrigin: '20% 100%', fontFamily: FONT}}>
      <div style={{background: '#F6EEE3', color: '#0B0A0F', borderRadius: 26, padding: '22px 30px', width: w, fontWeight: 800, fontSize: size, lineHeight: 1.2, boxShadow: '0 0 30px rgba(0,0,0,0.4)'}}>{text}</div>
      <div style={{marginLeft: 60, width: 0, height: 0, borderLeft: '18px solid transparent', borderRight: '18px solid transparent', borderTop: '26px solid #F6EEE3'}} />
    </div>
  );
};
