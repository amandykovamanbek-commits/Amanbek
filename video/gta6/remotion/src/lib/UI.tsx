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

/** In-world game HUD: money + wanted stars. `pop` 0..1 pulses money */
export const HUD: React.FC<{money: number; stars: number; o?: number; pop?: number; flash?: boolean; starAnim?: number[]}> = ({money, stars, o = 1, pop = 0, flash, starAnim = []}) => {
  const f = useCurrentFrame();
  const fl = flash ? (Math.floor(f / 6) % 2 ? '#FF4D5E' : '#4DA3FF') : undefined;
  return (
    <div style={{position: 'absolute', left: 56, top: 48, opacity: o, fontFamily: FONT}}>
      <div style={{background: 'rgba(8,8,20,0.62)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: '14px 26px 16px', boxShadow: '0 0 40px rgba(0,0,0,0.5)'}}>
        <div style={{color: C.green, fontWeight: 800, fontSize: 54, letterSpacing: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 18px rgba(91,227,138,0.55)', transform: `scale(${1 + 0.12 * pop})`, transformOrigin: 'left center'}}>
          {fmt(money)}
        </div>
        <div style={{display: 'flex', gap: 8, marginTop: 6}}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} on={starAnim[i] ?? (i < stars ? 1 : 0)} flash={i < stars ? fl : undefined} />
          ))}
        </div>
      </div>
    </div>
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
    <div style={{position: 'absolute', left: x, top: y + bob, transform: `translate(-50%, -100%) scale(${k * scale})`, transformOrigin: '50% 100%', fontFamily: FONT, textAlign: 'center'}}>
      <div style={{background: 'rgba(10,10,22,0.82)', border: `3px solid ${col}`, borderRadius: 16, padding: '10px 18px', boxShadow: `0 0 24px ${red ? 'rgba(255,77,94,0.45)' : 'rgba(255,200,70,0.4)'}`, whiteSpace: 'nowrap'}}>
        <div style={{color: '#F4EEE2', fontWeight: 800, fontSize: 26, textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1}}>{title}</div>
        {reward && <div style={{color: C.green, fontWeight: 800, fontSize: 26, marginTop: 2}}>{reward}</div>}
      </div>
      <div style={{width: 0, height: 0, margin: '0 auto', borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: `16px solid ${col}`}} />
      <div style={{width: 34, height: 34, margin: '6px auto 0', transform: 'rotate(45deg)', background: col, borderRadius: 6, boxShadow: `0 0 18px ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={{transform: 'rotate(-45deg)', fontWeight: 900, fontSize: 24, color: '#1A1206'}}>{isDone ? '✓' : '!'}</span>
      </div>
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
