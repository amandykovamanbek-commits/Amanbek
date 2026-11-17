import React from 'react';
import {C, mixHex} from './theme';

export type Mouth = 'none' | 'line' | 'smirk' | 'smile' | 'curve' | 'frown' | 'o' | 'wavy' | 'teeth' | 'bigO';
export type Face = {
  eyeOpen?: number;
  eyes?: 'oval' | 'happy' | 'round' | 'dot' | 'closed';
  brow?: number; // + angry (inner down), - worried (inner up)
  browY?: number;
  mouth?: Mouth;
  lx?: number; // look offset x
  ly?: number;
  tear?: boolean;
  blush?: boolean;
};

export const FACES: Record<string, Face> = {
  neutral: {mouth: 'line'},
  smile: {mouth: 'curve'},
  grin: {mouth: 'smile'},
  happy: {eyes: 'happy', mouth: 'smile', browY: -4},
  shock: {eyes: 'round', mouth: 'o', browY: -8, brow: -8},
  scream: {eyes: 'round', mouth: 'bigO', browY: -10, brow: -12},
  scared: {eyes: 'round', mouth: 'wavy', brow: -16, browY: -2},
  sad: {mouth: 'frown', brow: -16, browY: 2},
  angry: {eyeOpen: 0.7, mouth: 'teeth', brow: 20, browY: 6},
  smirk: {eyeOpen: 0.72, mouth: 'smirk', brow: 10, browY: 4},
  determined: {eyeOpen: 0.7, mouth: 'line', brow: 18, browY: 6},
  sly: {eyeOpen: 0.45, mouth: 'smirk', brow: 6, browY: 6},
  worried: {mouth: 'line', brow: -14, browY: 0},
  love: {eyes: 'happy', mouth: 'curve', blush: true, browY: -4},
  blink: {eyes: 'closed', mouth: 'line'},
  dots: {eyes: 'dot', mouth: 'line', browY: -6},
};

export type Legs = 'stand' | 'walk' | 'run' | 'sit' | 'jump' | 'none';
export type Hold = 'none' | 'gamepad' | 'books' | 'cat' | 'phone' | 'box' | 'bucket' | 'money' | 'disc' | 'phoneUp';
export type Hair = 'none' | 'pony' | 'bun' | 'cap' | 'scarf' | 'spiky';

export type ManProps = {
  color: string;
  rim?: string;
  rimDx?: number;
  rimDy?: number;
  armL?: [number, number];
  armR?: [number, number];
  legs?: Legs;
  phase?: number; // walk/run cycle 0..1
  face?: Face | keyof typeof FACES;
  hair?: Hair;
  hairColor?: string;
  hold?: Hold;
  tie?: boolean;
  headTilt?: number;
  lean?: number;
  simple?: boolean; // crowd: no rim, no gloss
  glowScreen?: number; // light the face from a screen (0..1)
  dir?: number; // walking direction 1 right, -1 left
};

const HEAD = {x: 0, y: -528, r: 62};
const BODY_D = 'M -58 -428 Q 0 -446 58 -428 L 66 -262 Q 0 -250 -66 -262 Z';

export const armPts = (side: number, a1: number, a2: number) => {
  const s = {x: side * 50, y: -418};
  const r1 = (a1 * Math.PI) / 180;
  const r2 = ((a1 + a2) * Math.PI) / 180;
  const e = {x: s.x + side * Math.sin(r1) * 115, y: s.y + Math.cos(r1) * 115};
  const h = {x: e.x + side * Math.sin(r2) * 110, y: e.y + Math.cos(r2) * 110};
  return {s, e, h};
};

const legPts = (side: number, thigh: number, knee: number, hipY: number) => {
  const hip = {x: side * 26, y: hipY};
  const r1 = (thigh * Math.PI) / 180;
  const k = {x: hip.x + Math.sin(r1) * 135, y: hip.y + Math.cos(r1) * 135};
  const r2 = ((thigh - knee) * Math.PI) / 180;
  const f = {x: k.x + Math.sin(r2) * 135, y: k.y + Math.cos(r2) * 135};
  return {hip, k, f};
};

const Arm: React.FC<{p: ReturnType<typeof armPts>; color: string; rim?: boolean; simple?: boolean}> = ({p, color, rim, simple}) => {
  const d = `M ${p.s.x} ${p.s.y} L ${p.e.x} ${p.e.y} L ${p.h.x} ${p.h.y}`;
  if (rim)
    return (
      <g>
        <path d={d} stroke={color} strokeWidth={46} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={p.h.x} cy={p.h.y} r={24} fill={color} />
      </g>
    );
  if (simple) return <path d={d} stroke={C.head} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <g>
      <path d={d} stroke={C.head} strokeWidth={42} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth={30} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={p.h.x} cy={p.h.y} r={20} fill={C.head} />
    </g>
  );
};

const FaceG: React.FC<{f: Face}> = ({f}) => {
  const open = f.eyeOpen ?? 1;
  const lx = f.lx ?? 0;
  const ly = f.ly ?? 0;
  const brow = f.brow ?? 0;
  const by = f.browY ?? 0;
  const eyes = f.eyes ?? 'oval';
  const m = f.mouth ?? 'line';
  return (
    <g transform={`translate(${HEAD.x + lx} ${HEAD.y + ly})`}>
      {[-1, 1].map((s) => (
        <g key={s}>
          {eyes === 'happy' && (
            <path d={`M ${s * 21 - 12} 2 Q ${s * 21} -16 ${s * 21 + 12} 2`} stroke={C.face} strokeWidth={7} fill="none" strokeLinecap="round" />
          )}
          {eyes === 'closed' && <path d={`M ${s * 21 - 11} -2 L ${s * 21 + 11} -2`} stroke={C.face} strokeWidth={6} strokeLinecap="round" />}
          {eyes === 'dot' && <circle cx={s * 21} cy={-2} r={5} fill={C.face} />}
          {(eyes === 'oval' || eyes === 'round') && (
            <ellipse cx={s * 21} cy={-2} rx={eyes === 'round' ? 15 : 12} ry={(eyes === 'round' ? 16 : 17) * Math.max(0.08, open)} fill={C.face} />
          )}
          <rect x={s * 21 - 13} y={-34 + by} width={26} height={7} rx={3.5} fill={C.face} transform={`rotate(${-s * brow} ${s * 21} ${-30 + by})`} />
          {f.blush && <ellipse cx={s * 36} cy={16} rx={9} ry={5} fill="#FF7A9A" opacity={0.75} />}
        </g>
      ))}
      {f.tear && <path d="M 30 10 Q 36 24 30 30 Q 24 24 30 10 Z" fill="#9FD8FF" />}
      {m === 'smirk' && <path d="M -10 30 Q 6 38 20 24" stroke={C.face} strokeWidth={6} fill="none" strokeLinecap="round" />}
      {m === 'line' && <path d="M -9 30 L 9 30" stroke={C.face} strokeWidth={6} strokeLinecap="round" />}
      {m === 'curve' && <path d="M -14 26 Q 0 38 14 26" stroke={C.face} strokeWidth={6} fill="none" strokeLinecap="round" />}
      {m === 'frown' && <path d="M -13 34 Q 0 24 13 34" stroke={C.face} strokeWidth={6} fill="none" strokeLinecap="round" />}
      {m === 'smile' && <path d="M -20 22 Q 0 22 20 22 Q 18 46 0 46 Q -18 46 -20 22 Z" fill={C.face} />}
      {m === 'o' && <ellipse cx={0} cy={32} rx={8} ry={11} fill={C.face} />}
      {m === 'bigO' && <ellipse cx={0} cy={34} rx={13} ry={17} fill={C.face} />}
      {m === 'wavy' && <path d="M -16 32 Q -10 26 -5 32 Q 0 38 5 32 Q 10 26 16 32" stroke={C.face} strokeWidth={5} fill="none" strokeLinecap="round" />}
      {m === 'teeth' && (
        <g>
          <rect x={-18} y={24} width={36} height={14} rx={4} fill={C.face} />
          <path d="M -6 24 L -6 38 M 6 24 L 6 38" stroke={C.head} strokeWidth={2.5} />
        </g>
      )}
    </g>
  );
};

const HairBack: React.FC<{hair: Hair; color: string; fill: string}> = ({hair, fill}) => {
  if (hair === 'pony')
    return (
      <g>
        <circle cx={48} cy={-560} r={24} fill={fill} />
        <path d="M 58 -560 Q 104 -520 84 -452 Q 78 -440 70 -452 Q 82 -510 44 -548 Z" fill={fill} />
      </g>
    );
  if (hair === 'bun') return <circle cx={0} cy={-598} r={26} fill={fill} />;
  return null;
};

const HairFront: React.FC<{hair: Hair; color: string}> = ({hair, color}) => {
  if (hair === 'pony') return <rect x={40} y={-578} width={14} height={20} rx={5} fill={color} transform="rotate(30 47 -568)" />;
  if (hair === 'cap')
    return (
      <g>
        <path d="M -60 -548 Q -58 -602 0 -604 Q 58 -602 60 -548 Z" fill={color} stroke={C.head} strokeWidth={6} />
        <path d="M -64 -548 L 40 -548 Q 52 -536 30 -534 L -64 -536 Z" fill={mixHex(color, '#000000', 0.3)} stroke={C.head} strokeWidth={5} />
      </g>
    );
  if (hair === 'scarf')
    return (
      <g>
        <path d="M -63 -540 Q -60 -600 0 -604 Q 60 -600 63 -540 Q 0 -560 -63 -540 Z" fill={color} stroke={C.head} strokeWidth={6} />
        <circle cx={58} cy={-536} r={9} fill={color} stroke={C.head} strokeWidth={4} />
      </g>
    );
  if (hair === 'spiky') return <path d="M -40 -578 L -30 -612 L -12 -584 L 2 -620 L 16 -586 L 34 -612 L 42 -576 Z" fill={C.head} />;
  return null;
};

const HoldG: React.FC<{hold: Hold; L: ReturnType<typeof armPts>; R: ReturnType<typeof armPts>}> = ({hold, L, R}) => {
  const mx = (L.h.x + R.h.x) / 2;
  const my = (L.h.y + R.h.y) / 2;
  switch (hold) {
    case 'gamepad':
      return (
        <g transform={`translate(${mx} ${my - 6})`}>
          <path d="M -46 -16 Q -50 -22 -38 -22 L 38 -22 Q 50 -22 46 -16 L 52 14 Q 54 26 40 22 L 22 8 L -22 8 L -40 22 Q -54 26 -52 14 Z" fill="#1C1B26" stroke={C.head} strokeWidth={4} />
          <circle cx={-24} cy={-6} r={7} fill="#3A394A" />
          <circle cx={26} cy={-10} r={5} fill="#5BE38A" />
          <circle cx={36} cy={-2} r={5} fill="#FF4D5E" />
          <circle cx={16} cy={-2} r={5} fill="#4DA3FF" />
        </g>
      );
    case 'books':
      return (
        <g transform={`translate(${mx} ${my - 10})`}>
          <rect x={-56} y={-14} width={112} height={26} rx={4} fill="#C94F4F" stroke={C.head} strokeWidth={4} />
          <rect x={-50} y={-38} width={100} height={24} rx={4} fill="#4F86C9" stroke={C.head} strokeWidth={4} />
          <rect x={-58} y={-62} width={112} height={24} rx={4} fill="#E3B341" stroke={C.head} strokeWidth={4} />
        </g>
      );
    case 'box':
      return (
        <g transform={`translate(${mx} ${my - 20})`}>
          <rect x={-70} y={-60} width={140} height={100} rx={6} fill="#B98A5A" stroke={C.head} strokeWidth={5} />
          <rect x={-12} y={-60} width={24} height={100} fill="#D9B07E" />
        </g>
      );
    case 'cat':
      return (
        <g transform={`translate(${mx} ${my - 18})`}>
          <ellipse cx={0} cy={6} rx={46} ry={28} fill={C.head} />
          <circle cx={-34} cy={-22} r={24} fill={C.head} />
          <path d="M -54 -36 L -52 -62 L -38 -44 Z M -26 -44 L -14 -62 L -12 -36 Z" fill={C.head} />
          <circle cx={-42} cy={-24} r={4} fill={C.green} />
          <circle cx={-28} cy={-24} r={4} fill={C.green} />
          <path d="M 44 6 Q 76 -10 64 -40" stroke={C.head} strokeWidth={10} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'phone':
      return (
        <g transform={`translate(${R.h.x - 4} ${R.h.y - 30})`}>
          <rect x={-18} y={-30} width={36} height={62} rx={7} fill="#15141E" stroke={C.head} strokeWidth={4} />
          <rect x={-13} y={-24} width={26} height={48} rx={3} fill="#9FD8FF" opacity={0.9} />
        </g>
      );
    case 'phoneUp':
      return (
        <g transform={`translate(${R.h.x} ${R.h.y - 40})`}>
          <rect x={-22} y={-38} width={44} height={76} rx={8} fill="#15141E" stroke={C.head} strokeWidth={4} />
          <rect x={-16} y={-31} width={32} height={60} rx={3} fill="#FFE7A3" />
        </g>
      );
    case 'disc':
      return (
        <g transform={`translate(${R.h.x + 6} ${R.h.y - 40})`}>
          <circle r={44} fill="#D8DCE8" stroke={C.head} strokeWidth={4} />
          <circle r={44} fill="url(#discSheen)" opacity={0.7} />
          <circle r={10} fill={C.head} />
        </g>
      );
    case 'bucket':
      return (
        <g transform={`translate(${R.h.x} ${R.h.y + 40})`}>
          <path d="M -30 -30 Q 0 -60 30 -30" stroke={C.head} strokeWidth={4} fill="none" />
          <path d="M -32 -30 L 32 -30 L 24 30 L -24 30 Z" fill="#8A93A6" stroke={C.head} strokeWidth={5} />
        </g>
      );
    case 'money':
      return (
        <g transform={`translate(${R.h.x} ${R.h.y - 26})`}>
          {[-18, 0, 18].map((r, i) => (
            <rect key={i} x={-30} y={-16} width={60} height={32} rx={3} fill="#5FBF6E" stroke="#1E4D2A" strokeWidth={3} transform={`rotate(${r})`} />
          ))}
        </g>
      );
    default:
      return null;
  }
};

export const Stickman: React.FC<ManProps> = (p) => {
  const {
    color, rim = C.rimCold, rimDx = -8, rimDy = -6, armL = [10, 6], armR = [10, 6], legs = 'stand', phase = 0,
    hair = 'none', hairColor, hold = 'none', tie, headTilt = 0, lean = 0, simple, glowScreen = 0,
  } = p;
  const face: Face = typeof p.face === 'string' ? FACES[p.face] : p.face ?? FACES.neutral;
  const s2 = Math.sin(phase * Math.PI * 2);
  const dir = p.dir ?? 1;
  let drop = 0;
  let th: [number, number] = [-3, 3];
  let kn: [number, number] = [0, 0];
  if (legs === 'walk') {
    th = [dir * 22 * s2, -dir * 22 * s2];
    kn = [dir * Math.max(0, -s2) * 30, dir * Math.max(0, s2) * 30];
    drop = 8 - Math.abs(s2) * 8;
  } else if (legs === 'run') {
    th = [dir * 42 * s2, -dir * 42 * s2];
    kn = [dir * (20 + Math.max(0, -s2) * 70), dir * (20 + Math.max(0, s2) * 70)];
    drop = 26 - Math.abs(s2) * 18;
  } else if (legs === 'sit') {
    drop = 112;
  } else if (legs === 'jump') {
    th = [-30, 30];
    kn = [-70, 70];
  }
  const hipY = -266 + drop;
  const LL = legs === 'sit' ? {hip: {x: -26, y: hipY}, k: {x: -46, y: hipY + 34}, f: {x: -46, y: 0}} : legPts(-1, th[0], kn[0], hipY);
  const RL = legs === 'sit' ? {hip: {x: 26, y: hipY}, k: {x: 46, y: hipY + 34}, f: {x: 46, y: 0}} : legPts(1, th[1], kn[1], hipY);
  const legD = (l: typeof LL) => `M ${l.hip.x} ${l.hip.y} L ${l.k.x} ${l.k.y} L ${l.f.x} ${l.f.y}`;
  const legsD = legs === 'none' ? '' : `${legD(LL)} ${legD(RL)}`;
  const L = armPts(-1, armL[0], armL[1]);
  const R = armPts(1, armR[0], armR[1]);
  const glossA = (a: number) => [HEAD.x + Math.cos(a) * (HEAD.r - 11), HEAD.y + Math.sin(a) * (HEAD.r - 11)];
  const [g1x, g1y] = glossA((-115 * Math.PI) / 180);
  const [g2x, g2y] = glossA((-40 * Math.PI) / 180);
  const headG = (fill: string, isRim = false) => (
    <g transform={`rotate(${headTilt} 0 -470)`}>
      <HairBack hair={hair} color={hairColor ?? color} fill={fill} />
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={fill} />
      {isRim && (hair === 'cap' || hair === 'scarf') && <path d="M -64 -540 Q -60 -606 0 -608 Q 60 -606 64 -540 Z" fill={fill} />}
    </g>
  );
  return (
    <g transform={`rotate(${lean} 0 -260)`}>
      {!simple && (
        <g transform={`translate(${rimDx} ${rimDy})`}>
          <path d={legsD} stroke={rim} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <g transform={`translate(0 ${drop})`}>
            <path d={BODY_D} fill={rim} stroke={rim} strokeWidth={6} />
            {headG(rim, true)}
            <Arm p={L} color={rim} rim />
            <Arm p={R} color={rim} rim />
          </g>
        </g>
      )}
      <path d={legsD} stroke={C.head} strokeWidth={simple ? 12 : 14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <g transform={`translate(0 ${drop})`}>
        <path d={BODY_D} fill={color} stroke={C.head} strokeWidth={6} strokeLinejoin="round" />
        {!simple && <path d="M -40 -430 Q 0 -390 40 -430 Q 0 -446 -40 -430 Z" fill={mixHex(color, '#000000', 0.3)} />}
        {!simple && !tie && <path d="M -11 -414 L -13 -360 M 11 -414 L 13 -360" stroke={C.face} strokeWidth={4} strokeLinecap="round" opacity={0.85} />}
        {tie && (
          <g>
            <path d="M -26 -432 L 0 -380 L 26 -432 Z" fill="#EDEFF5" />
            <path d="M -7 -426 L 7 -426 L 10 -330 L 0 -316 L -10 -330 Z" fill="#B23A3A" stroke={C.head} strokeWidth={3} />
          </g>
        )}
        <rect x={-8} y={-480} width={16} height={60} fill={C.head} />
        {headG(C.head)}
        <g transform={`rotate(${headTilt} 0 -470)`}>
          {!simple && (
            <path d={`M ${g1x} ${g1y} A ${HEAD.r - 11} ${HEAD.r - 11} 0 0 1 ${g2x} ${g2y}`} stroke={C.gloss} strokeWidth={6} fill="none" strokeLinecap="round" />
          )}
          {glowScreen > 0 && <circle cx={0} cy={-528} r={62} fill="url(#screenGlow)" opacity={glowScreen} />}
          <FaceG f={face} />
          <HairFront hair={hair} color={hairColor ?? color} />
        </g>
        <Arm p={L} color={color} simple={simple} />
        <Arm p={R} color={color} simple={simple} />
        <HoldG hold={hold} L={L} R={R} />
      </g>
    </g>
  );
};

/** Shared SVG defs used by characters (gradients). Put once per <svg>. */
export const ManDefs: React.FC = () => (
  <defs>
    <radialGradient id="screenGlow" cx="0.5" cy="0.75" r="0.8">
      <stop offset="0" stopColor="#7FB8FF" stopOpacity={0.35} />
      <stop offset="1" stopColor="#7FB8FF" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="discSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FF9AD5" />
      <stop offset="0.35" stopColor="#9AE6FF" />
      <stop offset="0.7" stopColor="#FFF3A0" />
      <stop offset="1" stopColor="#B49AFF" />
    </linearGradient>
  </defs>
);

/** Arm presets */
export const ARMS = {
  down: [[10, 6], [10, 6]] as [number, number][],
  hold: [[25, -110], [25, -110]] as [number, number][], // hands meet at chest (gamepad/books/box)
  up: [[160, 12], [160, 12]] as [number, number][],
  headGrab: [[150, 85], [150, 85]] as [number, number][],
  shrug: [[60, -70], [60, -70]] as [number, number][],
  wave: [[10, 6], [140, 20]] as [number, number][],
  point: [[10, 6], [95, -5]] as [number, number][],
  run: (ph: number) => {
    const s = Math.sin(ph * Math.PI * 2);
    return [[20 + 40 * s, -70], [20 - 40 * s, -70]] as [number, number][];
  },
  walk: (ph: number) => {
    const s = Math.sin(ph * Math.PI * 2);
    return [[8 - 14 * s, 10], [8 + 14 * s, 10]] as [number, number][];
  },
};
