import React from 'react';
import {C} from './theme';

export const Heli: React.FC<{x: number; y: number; f: number; s?: number}> = ({x, y, f, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-6} width={300} height={8} fill="#05050C" transform={`scale(${Math.cos(f * 1.7)} 1)`} />
    <rect x={-4} y={-6} width={8} height={24} fill="#05050C" />
    <ellipse cx={0} cy={40} rx={80} ry={36} fill="#05050C" />
    <rect x={60} y={30} width={140} height={14} fill="#05050C" />
    <rect x={190} y={14} width={12} height={34} fill="#05050C" />
    <ellipse cx={-34} cy={34} rx={26} ry={16} fill="#2A3350" />
    <circle cx={-10} cy={78} r={6} fill={Math.floor(f / 8) % 2 ? '#FF4D5E' : '#05050C'} />
  </g>
);

export const PoliceCar: React.FC<{x: number; y: number; f: number; s?: number}> = ({x, y, f, s = 1}) => {
  const red = Math.floor(f / 6) % 2 === 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -170 -40 L -110 -40 L -70 -90 L 70 -90 L 110 -40 L 170 -40 Q 180 -40 180 -28 L 180 0 L -180 0 L -180 -28 Q -180 -40 -170 -40 Z" fill="#1A1C2E" stroke="#05050C" strokeWidth={6} />
      <rect x={-60} y={-80} width={55} height={36} fill="#3A4C70" />
      <rect x={5} y={-80} width={55} height={36} fill="#3A4C70" />
      <rect x={-50} y={-108} width={46} height={16} rx={4} fill={red ? '#FF4D5E' : '#3A1A22'} style={{filter: red ? 'drop-shadow(0 0 14px #FF4D5E)' : undefined}} />
      <rect x={4} y={-108} width={46} height={16} rx={4} fill={!red ? '#4DA3FF' : '#1A2A44'} style={{filter: !red ? 'drop-shadow(0 0 14px #4DA3FF)' : undefined}} />
      <rect x={-180} y={-34} width={360} height={10} fill="#E8ECF4" />
      <circle cx={-110} cy={0} r={30} fill="#05050C" />
      <circle cx={110} cy={0} r={30} fill="#05050C" />
    </g>
  );
};

export const CCTV: React.FC<{x: number; y: number; f: number; s?: number; flip?: boolean}> = ({x, y, f, s = 1, flip}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <rect x={-4} y={0} width={8} height={300} fill="#16151F" />
    <g transform={`rotate(${15 + Math.sin(f / 15) * 12})`}>
      <rect x={-20} y={-30} width={120} height={50} rx={10} fill="#D8DCE6" stroke="#16151F" strokeWidth={5} />
      <circle cx={100} cy={-5} r={18} fill="#16151F" />
      <circle cx={104} cy={-5} r={8} fill={C.red} style={{filter: 'drop-shadow(0 0 8px #FF4D5E)'}} />
    </g>
  </g>
);

export const CatOnBranch: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={0} rx={40} ry={24} fill={C.head} />
    <circle cx={-34} cy={-24} r={22} fill={C.head} />
    <path d="M -52 -36 L -50 -60 L -38 -42 Z M -26 -42 L -16 -60 L -14 -34 Z" fill={C.head} />
    <circle cx={-41} cy={-26} r={4} fill={C.green} />
    <circle cx={-28} cy={-26} r={4} fill={C.green} />
    <path d="M 38 4 Q 60 40 40 60" stroke={C.head} strokeWidth={9} fill="none" strokeLinecap="round" />
  </g>
);

export const Box: React.FC<{x: number; y: number; s?: number; open?: number; glow?: number}> = ({x, y, s = 1, open = 0, glow = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow > 0 && <ellipse cx={0} cy={-160} rx={170} ry={120} fill="#FFD27A" opacity={glow * 0.5} style={{filter: 'blur(30px)'}} />}
    <rect x={-130} y={-150} width={260} height={150} rx={6} fill="#B98A5A" stroke={C.head} strokeWidth={6} />
    <rect x={-22} y={-150} width={44} height={150} fill="#D9B07E" />
    <g transform={`translate(-130 -150) rotate(${-open * 110})`}>
      <rect x={0} y={-24} width={260} height={28} rx={4} fill="#C99A68" stroke={C.head} strokeWidth={6} />
    </g>
  </g>
);

export const Firework: React.FC<{x: number; y: number; f: number; start: number; color: string}> = ({x, y, f, start, color}) => {
  const t = f - start;
  if (t < 0 || t > 40) return null;
  const r = 20 + t * 5;
  const o = 1 - t / 40;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      {Array.from({length: 16}).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r + t * 0.8} r={4} fill={color} style={{filter: `drop-shadow(0 0 6px ${color})`}} />;
      })}
    </g>
  );
};
