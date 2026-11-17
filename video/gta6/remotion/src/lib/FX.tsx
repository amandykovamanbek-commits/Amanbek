import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, clamp, rnd} from './theme';

export const Vignette: React.FC<{s?: number}> = ({s = 0.85}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(2,2,8,${s}) 100%)`, pointerEvents: 'none'}} />
);

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.06, mixBlendMode: 'overlay'}}>
      <svg width={1920} height={1080}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 50} />
        </filter>
        <rect width={1920} height={1080} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** soft radial light pool (HTML) */
export const Light: React.FC<{x: string; y: string; color: string; size?: string; o?: number; blend?: string}> = ({x, y, color, size = '45%', o = 1, blend = 'screen'}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at ${x} ${y}, ${color} 0%, rgba(0,0,0,0) ${size})`, opacity: o, mixBlendMode: blend as any}} />
);

/** Camera: slow push / pan. from/to = [scale, x%, y%] transform origin */
export const Cam: React.FC<{dur: number; from?: number; to?: number; ox?: string; oy?: string; dx?: number; dy?: number; shake?: number; children: React.ReactNode}> = ({
  dur, from = 1, to = 1.06, ox = '50%', oy = '50%', dx = 0, dy = 0, shake = 0, children,
}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, Math.max(1, dur)], [0, 1], clamp);
  const s = from + (to - from) * k;
  const sx = shake ? Math.sin(f * 2.3) * shake + Math.sin(f * 5.1) * shake * 0.5 : 0;
  const sy = shake ? Math.cos(f * 2.9) * shake : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${dx * k + sx}px, ${dy * k + sy}px) scale(${s})`, transformOrigin: `${ox} ${oy}`}}>{children}</AbsoluteFill>
  );
};

/** Falling bills */
export const MoneyRain: React.FC<{n?: number; start?: number; speed?: number}> = ({n = 70, start = 0, speed = 1}) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      {Array.from({length: n}).map((_, i) => {
        const x0 = rnd(i) * 2000 - 40;
        const v = (3 + rnd(i + 3) * 4) * speed;
        const y = -80 - rnd(i + 7) * 900 + f * v;
        if (y > 1150) return null;
        const sw = Math.sin(f / 9 + i) * 40;
        const rot = Math.sin(f / 7 + i * 2) * 50 + rnd(i + 5) * 180;
        const sc = 0.7 + rnd(i + 11) * 0.7;
        return (
          <g key={i} transform={`translate(${x0 + sw} ${y}) rotate(${rot}) scale(${sc} ${sc * (0.6 + 0.4 * Math.abs(Math.cos(f / 6 + i)))})`}>
            <rect x={-34} y={-17} width={68} height={34} rx={3} fill="#5FBF6E" stroke="#1E4D2A" strokeWidth={3} />
            <circle r={8} fill="none" stroke="#1E4D2A" strokeWidth={2.5} />
          </g>
        );
      })}
    </svg>
  );
};

/** Rain streaks + lightning flash at given local frames */
export const Storm: React.FC<{flashes?: number[]}> = ({flashes = []}) => {
  const f = useCurrentFrame();
  const fl = Math.max(0, ...flashes.map((a) => (f >= a && f < a + 10 ? (f - a < 2 ? 1 : f - a < 4 ? 0.3 : f - a < 6 ? 0.8 : 0.2 * (10 - (f - a)) / 4) : 0)));
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {Array.from({length: 120}).map((_, i) => {
          const x = (rnd(i) * 2200 + f * 9) % 2200 - 140;
          const y = (rnd(i + 9) * 1300 + f * (38 + rnd(i) * 12)) % 1300 - 120;
          return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 46} stroke="#9FB6E8" strokeWidth={2} opacity={0.35} />;
        })}
      </svg>
      <AbsoluteFill style={{background: '#DDE7FF', opacity: fl * 0.55, mixBlendMode: 'screen'}} />
    </>
  );
};

/** Lightning bolt path (svg element) */
export const Bolt: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M 0 0 L -30 120 L 10 116 L -24 260 L 60 90 L 18 94 L 40 0 Z" fill="#F4F7FF" style={{filter: 'drop-shadow(0 0 18px #9FC0FF)'}} />
  </g>
);

export const Sparkle: React.FC<{x: number; y: number; s?: number; phase?: number; color?: string}> = ({x, y, s = 1, phase = 0, color = '#FFE59A'}) => {
  const f = useCurrentFrame();
  const k = 0.55 + 0.45 * Math.sin(f / 4 + phase);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k * 2.4}) rotate(${f * 2 + phase * 30})`}>
      <path d="M 0 -20 Q 3 -3 20 0 Q 3 3 0 20 Q -3 3 -20 0 Q -3 -3 0 -20 Z" fill={color} style={{filter: 'drop-shadow(0 0 8px rgba(255,200,90,0.9))'}} />
    </g>
  );
};

/** Police lights wash */
export const Siren: React.FC<{o?: number}> = ({o = 1}) => {
  const f = useCurrentFrame();
  const red = Math.floor(f / 6) % 2 === 0;
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(circle at 15% 100%, rgba(255,50,70,${red ? 0.45 : 0.08}) 0%, rgba(0,0,0,0) 50%)`, opacity: o, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 85% 100%, rgba(60,120,255,${red ? 0.08 : 0.45}) 0%, rgba(0,0,0,0) 50%)`, opacity: o, mixBlendMode: 'screen'}} />
    </>
  );
};

/** Helicopter spotlight cone sweeping (svg layer) */
export const Spotlight: React.FC<{x0: number; y0: number; sweep?: number; o?: number}> = ({x0, y0, sweep = 260, o = 1}) => {
  const f = useCurrentFrame();
  const tx = 960 + Math.sin(f / 40) * sweep;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', mixBlendMode: 'screen'}} opacity={o}>
      <defs>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFBE6" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFFBE6" stopOpacity={0.08} />
        </linearGradient>
      </defs>
      <path d={`M ${x0 - 12} ${y0} L ${x0 + 12} ${y0} L ${tx + 170} 1080 L ${tx - 170} 1080 Z`} fill="url(#cone)" />
      <ellipse cx={tx} cy={1040} rx={190} ry={36} fill="#FFFBE6" opacity={0.25} />
    </svg>
  );
};

/** Particles dissolving upward from a rect area (for HUD melting) */
export const Dissolve: React.FC<{x: number; y: number; w: number; h: number; start: number; color?: string}> = ({x, y, w, h, start, color = C.gold}) => {
  const f = useCurrentFrame() - start;
  if (f < 0 || f > 80) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      {Array.from({length: 90}).map((_, i) => {
        const px = x + rnd(i) * w + Math.sin(f / 8 + i) * 12;
        const py = y + rnd(i + 4) * h - f * (1.5 + rnd(i + 2) * 3);
        const o = interpolate(f, [rnd(i + 8) * 20, 80], [1, 0], clamp);
        return <circle key={i} cx={px} cy={py} r={2 + rnd(i + 1) * 4} fill={color} opacity={o} style={{filter: 'drop-shadow(0 0 6px rgba(255,200,90,0.8))'}} />;
      })}
    </svg>
  );
};

/** Dust motes in a light beam */
export const Dust: React.FC<{n?: number; area?: [number, number, number, number]}> = ({n = 40, area = [0, 0, 1920, 1080]}) => {
  const f = useCurrentFrame();
  const [ax, ay, aw, ah] = area;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      {Array.from({length: n}).map((_, i) => (
        <circle
          key={i}
          cx={ax + ((rnd(i) * aw + f * (0.3 + rnd(i + 1) * 0.6)) % aw)}
          cy={ay + ((rnd(i + 2) * ah - f * (0.2 + rnd(i + 3) * 0.4) + ah * 10) % ah)}
          r={1.5 + rnd(i + 5) * 2}
          fill="#FFF3D6"
          opacity={0.25 + 0.35 * Math.sin(f / 10 + i)}
        />
      ))}
    </svg>
  );
};
