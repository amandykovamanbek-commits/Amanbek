import React from 'react';
import { interpolate } from 'remotion';
import { pop, prog } from './util';

/**
 * The BILIM QADAM mark (bilim-qadam-app/design/logo.svg): a progress ring,
 * a three-step staircase and a goal star, each part animated from `t` (frames
 * since the logo started). Pass `static` to show it settled.
 */
export const LogoMark: React.FC<{ t: number; size: number; id: string; steps?: number[]; star?: number; ringDur?: number; still?: boolean }>
  = ({ t, size, id, steps = [45, 60, 75], star = 105, ringDur = 40, still = false }) => {
  const T = still ? 9999 : t;
  const ring = prog(T, 0, ringDur);
  const s = steps.map((st) => pop(T, st, 14));
  const st = pop(T, star, 18);
  const twinkle = still ? 1 : 1 + 0.06 * Math.sin((t - star) / 6);
  const g = (n: string) => `${id}-${n}`;
  const rects = [
    { x: 384, y: 574, w: 86, h: 74 },
    { x: 470, y: 490, w: 86, h: 158 },
    { x: 556, y: 406, w: 86, h: 242 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={g('ring')} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#38D6F5" /><stop offset=".55" stopColor="#7FC8FF" /><stop offset="1" stopColor="#FFC845" />
        </linearGradient>
        <linearGradient id={g('stairs')} gradientUnits="userSpaceOnUse" x1="384" y1="648" x2="642" y2="406">
          <stop offset="0" stopColor="#38D6F5" /><stop offset="1" stopColor="#FFC845" />
        </linearGradient>
        <radialGradient id={g('glow')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFC845" stopOpacity=".75" /><stop offset="1" stopColor="#FFC845" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M 756.3 423.1 A 260 260 0 1 1 557.1 255.9" fill="none" stroke={`url(#${g('ring')})`} strokeWidth={64}
        strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} opacity={ring > 0 ? 1 : 0} />
      {rects.map((r, i) => {
        const p = s[i];
        return (
          <g key={i} transform={`translate(0 ${648 * (1 - p)}) scale(1 ${Math.max(p, 0.0001)})`}>
            <rect x={r.x - (i === 0 ? 13 : 0)} y={r.y - 13} width={r.w + (i === 0 ? 13 : 0) + (i === 2 ? 13 : 0)} height={r.h + 26} rx={14}
              fill={`url(#${g('stairs')})`} />
            <line x1={r.x} y1={r.y} x2={r.x + r.w} y2={r.y} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={10} strokeLinecap="round" />
          </g>
        );
      })}
      <g transform={`translate(679 313) scale(${st * twinkle}) rotate(${interpolate(st, [0, 1], [-90, 0])})`} opacity={st > 0 ? 1 : 0}>
        <circle r={96} fill={`url(#${g('glow')})`} />
        <path d="M0 -68 C 7 -23 17 -13 63 -6 C 17 1 7 11 0 56 C -7 11 -17 1 -63 -6 C -17 -13 -7 -23 0 -68 Z" fill="#FFF4D1" />
      </g>
    </svg>
  );
};
