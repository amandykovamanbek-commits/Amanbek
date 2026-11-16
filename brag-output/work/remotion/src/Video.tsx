import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';

// ---------- palette (from the style breakdown) ----------
const C = {
  head: '#0B0A0F',
  face: '#F6EEE3',
  gloss: '#2A292E',
  night: '#0D0C26',
  nightTop: '#07071A',
  farB: '#15143A',
  nearB: '#0B0A1E',
  roof: '#08071A',
  orange: '#D68A1A',
  blue: '#3C6FD8',
  rimCold: '#A0B8FF',
  rimWarm: '#F6C38E',
  gold: '#FFD240',
  window: '#FFD27A',
};
const FONT = "'Inter', 'Inter Display', sans-serif";
const BEAT = 15;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);

// deterministic random
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (
    '#' +
    pa
      .map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0'))
      .join('')
  );
};

// ---------- city ----------
type Win = {x: number; y: number; w: number; h: number; order: number; base: boolean};
type Bld = {x: number; y: number; w: number; h: number};

const buildCity = () => {
  const far: Bld[] = [];
  const near: Bld[] = [];
  const wins: Win[] = [];
  let x = -40;
  let i = 0;
  while (x < 1960) {
    const w = 70 + rnd(i) * 90;
    const h = 260 + rnd(i + 50) * 260;
    far.push({x, y: 860 - h, w, h});
    x += w + 6;
    i++;
  }
  x = -60;
  i = 200;
  const hand = {x: 700, y: 520};
  while (x < 1980) {
    const w = 110 + rnd(i) * 120;
    const h = 170 + rnd(i + 70) * 330;
    const b = {x, y: 860 - h, w, h};
    near.push(b);
    const cols = Math.floor((w - 20) / 22);
    const rows = Math.floor((h - 30) / 30);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x + 14 + c * 22;
        const wy = b.y + 18 + r * 30;
        const k = i * 1000 + r * 50 + c;
        const d = Math.hypot(wx - hand.x, wy - hand.y) / 1400;
        wins.push({
          x: wx,
          y: wy,
          w: 11,
          h: 15,
          order: Math.min(0.999, d * 0.75 + rnd(k) * 0.25),
          base: rnd(k + 9) < 0.05,
        });
      }
    }
    x += w + 10 + rnd(i + 3) * 30;
    i++;
  }
  return {far, near, wins};
};
const CITY = buildCity();

const City: React.FC<{lit: number}> = ({lit}) => {
  const on = (w: Win) => {
    if (w.base) return 1;
    return interpolate(lit, [w.order - 0.04, w.order], [0, 1], clamp);
  };
  const litWins = CITY.wins.map((w) => ({w, o: on(w)})).filter((v) => v.o > 0.01);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.nightTop} />
          <stop offset="0.75" stopColor={mixHex(C.night, '#2A1E3A', lit * 0.8)} />
          <stop offset="1" stopColor={mixHex('#1A1840', '#5A3A2A', lit * 0.7)} />
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop offset="0" stopColor="#E9ECFF" stopOpacity={0.55} />
          <stop offset="0.3" stopColor="#9FB0FF" stopOpacity={0.18} />
          <stop offset="1" stopColor="#9FB0FF" stopOpacity={0} />
        </radialGradient>
        <filter id="wglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <rect width={1920} height={1080} fill="url(#sky)" />
      <circle cx={250} cy={250} r={260} fill="url(#moonGlow)" />
      <circle cx={250} cy={250} r={46} fill="#F4F1E6" />
      {CITY.far.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={mixHex(C.farB, '#2B2034', lit * 0.6)} />
      ))}
      {CITY.near.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={C.nearB} />
      ))}
      {CITY.wins.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} fill="#141331" />
      ))}
      <g filter="url(#wglow)" opacity={0.9}>
        {litWins.map(({w, o}, i) => (
          <rect key={i} x={w.x - 4} y={w.y - 4} width={w.w + 8} height={w.h + 8} fill="#FFB347" opacity={o * 0.8} />
        ))}
      </g>
      {litWins.map(({w, o}, i) => (
        <rect key={'l' + i} x={w.x} y={w.y} width={w.w} height={w.h} fill={C.window} opacity={o} />
      ))}
    </svg>
  );
};

// ---------- stickman ----------
type Face = {
  eyeOpen?: number;
  eyes?: 'oval' | 'happy' | 'round';
  brow?: number; // rotation deg, positive = angry (inner down)
  browY?: number;
  mouth?: 'line' | 'smirk' | 'smile' | 'o';
  look?: number;
};
type ManProps = {
  hoodie: string;
  rim: string;
  rimDx?: number;
  rimDy?: number;
  armL?: [number, number];
  armR?: [number, number];
  face?: Face;
};

const armPts = (side: number, a1: number, a2: number) => {
  const s = {x: side * 50, y: -418};
  const r1 = (a1 * Math.PI) / 180;
  const r2 = ((a1 + a2) * Math.PI) / 180;
  const e = {x: s.x + side * Math.sin(r1) * 115, y: s.y + Math.cos(r1) * 115};
  const h = {x: e.x + side * Math.sin(r2) * 110, y: e.y + Math.cos(r2) * 110};
  return {s, e, h};
};

const HEAD = {x: 0, y: -528, r: 62};
const BODY_D = 'M -58 -428 Q 0 -446 58 -428 L 66 -262 Q 0 -250 -66 -262 Z';

const Arm: React.FC<{p: ReturnType<typeof armPts>; color: string; rim?: boolean}> = ({p, color, rim}) => {
  const d = `M ${p.s.x} ${p.s.y} L ${p.e.x} ${p.e.y} L ${p.h.x} ${p.h.y}`;
  if (rim)
    return (
      <g>
        <path d={d} stroke={color} strokeWidth={46} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={p.h.x} cy={p.h.y} r={24} fill={color} />
      </g>
    );
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
  const lx = f.look ?? 0;
  const brow = f.brow ?? 0;
  const by = f.browY ?? 0;
  const eyes = f.eyes ?? 'oval';
  return (
    <g transform={`translate(${HEAD.x + lx} ${HEAD.y})`}>
      {[-1, 1].map((s) => (
        <g key={s}>
          {eyes === 'happy' ? (
            <path d={`M ${s * 21 - 12} 2 Q ${s * 21} -16 ${s * 21 + 12} 2`} stroke={C.face} strokeWidth={7} fill="none" strokeLinecap="round" />
          ) : (
            <ellipse
              cx={s * 21}
              cy={-2}
              rx={eyes === 'round' ? 15 : 12}
              ry={(eyes === 'round' ? 16 : 17) * Math.max(0.08, open)}
              fill={C.face}
            />
          )}
          <rect
            x={s * 21 - 13}
            y={-34 + by}
            width={26}
            height={7}
            rx={3.5}
            fill={C.face}
            transform={`rotate(${-s * brow} ${s * 21} ${-30 + by})`}
          />
        </g>
      ))}
      {f.mouth === 'smirk' && <path d="M -10 30 Q 6 38 20 24" stroke={C.face} strokeWidth={6} fill="none" strokeLinecap="round" />}
      {f.mouth === 'line' && <path d="M -9 30 L 9 30" stroke={C.face} strokeWidth={6} strokeLinecap="round" />}
      {f.mouth === 'smile' && <path d="M -20 22 Q 0 22 20 22 Q 18 46 0 46 Q -18 46 -20 22 Z" fill={C.face} />}
      {f.mouth === 'o' && <ellipse cx={0} cy={32} rx={8} ry={11} fill={C.face} />}
    </g>
  );
};

const Stickman: React.FC<ManProps> = ({hoodie, rim, rimDx = -8, rimDy = -6, armL = [10, 6], armR = [10, 6], face = {}}) => {
  const L = armPts(-1, armL[0], armL[1]);
  const R = armPts(1, armR[0], armR[1]);
  const legs = 'M -26 -266 L -34 0 M 26 -266 L 34 0';
  const glossA = (a: number) => [HEAD.x + Math.cos(a) * (HEAD.r - 11), HEAD.y + Math.sin(a) * (HEAD.r - 11)];
  const [g1x, g1y] = glossA((-115 * Math.PI) / 180);
  const [g2x, g2y] = glossA((-40 * Math.PI) / 180);
  return (
    <g>
      {/* hard rim shapes, offset toward the light, behind everything */}
      <g transform={`translate(${rimDx} ${rimDy})`}>
        <path d={legs} stroke={rim} strokeWidth={16} strokeLinecap="round" />
        <path d={BODY_D} fill={rim} stroke={rim} strokeWidth={6} />
        <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={rim} />
        <Arm p={L} color={rim} rim />
        <Arm p={R} color={rim} rim />
      </g>
      <path d={legs} stroke={C.head} strokeWidth={14} strokeLinecap="round" />
      <path d={BODY_D} fill={hoodie} stroke={C.head} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -40 -430 Q 0 -390 40 -430 Q 0 -446 -40 -430 Z" fill={mixHex(hoodie, '#000000', 0.3)} />
      <path d="M -11 -414 L -13 -360 M 11 -414 L 13 -360" stroke={C.face} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
      <rect x={-8} y={-480} width={16} height={60} fill={C.head} />
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={C.head} />
      <path d={`M ${g1x} ${g1y} A ${HEAD.r - 11} ${HEAD.r - 11} 0 0 1 ${g2x} ${g2y}`} stroke={C.gloss} strokeWidth={6} fill="none" strokeLinecap="round" />
      <FaceG f={face} />
      <Arm p={L} color={hoodie} />
      <Arm p={R} color={hoodie} />
    </g>
  );
};

// ---------- shared overlays ----------
const Vignette: React.FC<{strength?: number}> = ({strength = 0.85}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(2,2,8,${strength}) 100%)`,
    }}
  />
);

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
      <svg width={1920} height={1080}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2)} />
        </filter>
        <rect width={1920} height={1080} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const Dip: React.FC<{dur: number; children: React.ReactNode; fin?: number; fout?: number}> = ({dur, children, fin = 6, fout = 6}) => {
  const f = useCurrentFrame();
  const o = Math.min(
    fin ? interpolate(f, [0, fin], [0, 1], clamp) : 1,
    fout ? interpolate(f, [dur - fout, dur], [1, 0], clamp) : 1,
  );
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const glowText = '0 0 18px rgba(255,190,70,0.55), 0 0 60px rgba(255,150,40,0.35)';

// ---------- scenes ----------
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 90], [1, 1.06], clamp);
  const t1 = interpolate(f, [12, 24], [0, 1], {...clamp, easing: ease});
  const t2 = interpolate(f, [20, 34], [0, 1], {...clamp, easing: ease});
  const blink = f > 58 && f < 63 ? 0.1 : 1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '62% 70%'}}>
        <AbsoluteFill style={{filter: 'blur(1.4px)'}}>
          <City lit={0} />
        </AbsoluteFill>
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <rect x={0} y={860} width={1920} height={220} fill={C.roof} />
          <rect x={0} y={858} width={1920} height={4} fill="#262447" />
          <g transform="translate(1190 868) scale(0.62)">
            <Stickman hoodie={C.orange} rim={C.rimCold} rimDx={-9} rimDy={-7} armL={[8, 4]} armR={[8, 4]} face={{look: -10, eyeOpen: blink, mouth: 'line', browY: 2}} />
          </g>
        </svg>
      </AbsoluteFill>
      {/* blurred foreground silhouette */}
      <div
        style={{
          position: 'absolute',
          left: -140,
          top: 760,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: '#030308',
          filter: 'blur(22px)',
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 120, fontFamily: FONT}}>
        <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 34, letterSpacing: 8, opacity: t1, transform: `translateY(${(1 - t1) * 18}px)`}}>
          ЧТО, ЕСЛИ БЫ
        </div>
        <div
          style={{
            color: C.gold,
            fontWeight: 800,
            fontSize: 84,
            marginTop: 10,
            letterSpacing: 1,
            textShadow: glowText,
            opacity: t2,
            transform: `translateY(${(1 - t2) * 24}px) scale(${0.96 + 0.04 * t2})`,
          }}
        >
          ГОРОД СЛУШАЛСЯ ТЕБЯ?
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 90], [1, 1.05], clamp);
  const blink = f >= 22 && f < 28 ? 0.08 : 1;
  const snap = interpolate(f, [44, 48], [0, 1], clamp); // on beat (frame 135 global)
  const pop = 1 + 0.04 * Math.sin(interpolate(f, [44, 54], [0, Math.PI], clamp));
  const warm = interpolate(f, [30, 90], [0.15, 0.6], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: 'blur(14px)', transform: 'scale(1.9)', transformOrigin: '40% 55%'}}>
        <City lit={0.18} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{background: `radial-gradient(circle at 85% 70%, rgba(255,170,80,${warm}) 0%, rgba(255,140,60,0) 45%)`}}
      />
      <AbsoluteFill style={{transform: `scale(${z * pop})`, transformOrigin: '50% 55%'}}>
        <svg width={1920} height={1080}>
          <g transform="translate(960 3180) scale(5.1)">
            <Stickman
              hoodie={C.orange}
              rim={C.rimWarm}
              rimDx={6}
              rimDy={-4}
              face={{
                eyeOpen: blink * (1 - 0.32 * snap),
                brow: 16 * snap,
                browY: 6 * snap,
                mouth: snap > 0.5 ? 'smirk' : 'line',
                look: 4 * snap,
              }}
            />
          </g>
        </svg>
      </AbsoluteFill>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

const VALUES = ['1', '24', '580', '9 400', '120 000', '1 000 000'];
const LIT = [0.004, 0.03, 0.12, 0.32, 0.62, 1.0];

const Scene3: React.FC = () => {
  const f = useCurrentFrame(); // global 180..315
  const raise = interpolate(f, [4, 16], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
  const beats = VALUES.map((_, i) => 15 + i * BEAT); // global 195, 210, ...
  let idx = -1;
  beats.forEach((b, i) => {
    if (f >= b) idx = i;
  });
  const since = idx >= 0 ? f - beats[idx] : 0;
  const prevLit = idx > 0 ? LIT[idx - 1] : 0;
  const lit = idx >= 0 ? interpolate(since, [0, 12], [prevLit, LIT[idx]], {...clamp, easing: ease}) : 0;
  const pop = idx >= 0 ? interpolate(since, [0, 3, 9], [1.16, 1.04, 1], clamp) : 1;
  const z = interpolate(f, [0, 135], [1.02, 1.1], clamp);
  const rim = mixHex(C.rimCold, C.rimWarm, Math.min(1, lit * 1.6));
  const labelO = interpolate(f, [10, 18], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '60% 72%'}}>
        <AbsoluteFill style={{filter: 'blur(1.2px)'}}>
          <City lit={lit} />
        </AbsoluteFill>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 45% at 45% 85%, rgba(255,160,70,${0.28 * lit}) 0%, rgba(0,0,0,0) 70%)`}} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <rect x={0} y={860} width={1920} height={220} fill={mixHex(C.roof, '#1E1420', lit * 0.6)} />
          <rect x={0} y={858} width={1920} height={4} fill={mixHex('#262447', '#7A5A3A', lit)} />
          <g transform="translate(1190 868) scale(0.62)">
            <Stickman
              hoodie={C.orange}
              rim={rim}
              rimDx={-9}
              rimDy={-7}
              armL={[8 + 132 * raise, 4 + 8 * raise]}
              armR={[8 + 14 * raise, 4]}
              face={{look: -12, eyes: 'oval', eyeOpen: 0.75, brow: 14, browY: 6, mouth: lit > 0.5 ? 'smile' : 'smirk'}}
            />
          </g>
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 150, fontFamily: FONT}}>
        <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 30, letterSpacing: 8, opacity: labelO}}>ОКОН ЗАЖГЛОСЬ</div>
        <div
          style={{
            color: C.gold,
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 1.1,
            marginTop: 6,
            fontVariantNumeric: 'tabular-nums',
            textShadow: glowText,
            transform: `scale(${pop})`,
            opacity: idx >= 0 ? 1 : 0,
          }}
        >
          {idx >= 0 ? VALUES[idx] : ''}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

const Sparkle: React.FC<{x: number; y: number; s: number; phase: number}> = ({x, y, s, phase}) => {
  const f = useCurrentFrame();
  const k = 0.55 + 0.45 * Math.sin(f / 4 + phase);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k * 2.4}) rotate(${f * 2 + phase * 30})`}>
      <path d="M 0 -20 Q 3 -3 20 0 Q 3 3 0 20 Q -3 3 -20 0 Q -3 -3 0 -20 Z" fill="#FFE59A" style={{filter: 'drop-shadow(0 0 8px rgba(255,200,90,0.9))'}} />
    </g>
  );
};

const Scene4: React.FC = () => {
  const f = useCurrentFrame(); // 0..105
  const jump = Math.abs(Math.sin((f / BEAT) * Math.PI)) * 14;
  const up = interpolate(f, [0, 8], [0.7, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const z = interpolate(f, [0, 105], [1, 1.05], clamp);
  const shake = interpolate(f, [0, 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: 'blur(11px)', transform: 'scale(1.5)', transformOrigin: '50% 60%'}}>
        <City lit={1} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 50% at 55% 100%, rgba(255,160,70,0.35) 0%, rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '50% 60%'}}>
        <svg width={1920} height={1080}>
          {/* friend, shocked */}
          <g transform={`translate(${620 + Math.sin(f * 1.3) * 2 * shake} 1500) scale(1.9)`}>
            <Stickman
              hoodie={C.blue}
              rim={C.rimCold}
              rimDx={-7}
              rimDy={-6}
              armL={[150, 85]}
              armR={[150, 85]}
              face={{eyes: 'round', mouth: 'o', browY: -6, brow: -10, look: 6}}
            />
          </g>
          {/* hero, triumph */}
          <g transform={`translate(1240 ${1560 - jump}) scale(2.15)`}>
            <Stickman
              hoodie={C.orange}
              rim={C.rimWarm}
              rimDx={8}
              rimDy={-6}
              armL={[150 * up, 18]}
              armR={[150 * up, 18]}
              face={{eyes: 'happy', mouth: 'smile', browY: -4, look: -4}}
            />
          </g>
          <Sparkle x={840} y={190} s={1.3} phase={0} />
          <Sparkle x={1690} y={300} s={1.1} phase={2} />
          <Sparkle x={1660} y={600} s={0.8} phase={4} />
          <Sparkle x={905} y={560} s={0.7} phase={1} />
        </svg>
      </AbsoluteFill>
      {/* blurred foreground silhouette */}
      <div style={{position: 'absolute', right: -180, top: 700, width: 560, height: 560, borderRadius: '50%', background: '#030308', filter: 'blur(24px)'}} />
      <Vignette />
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence from={0} durationInFrames={90}>
      <Dip dur={90} fin={0}>
        <Scene1 />
      </Dip>
    </Sequence>
    <Sequence from={90} durationInFrames={90}>
      <Dip dur={90}>
        <Scene2 />
      </Dip>
    </Sequence>
    <Sequence from={180} durationInFrames={135}>
      <Dip dur={135}>
        <Scene3 />
      </Dip>
    </Sequence>
    <Sequence from={315} durationInFrames={105}>
      <Dip dur={105} fout={18}>
        <Scene4 />
      </Dip>
    </Sequence>
    <Grain />
  </AbsoluteFill>
);
