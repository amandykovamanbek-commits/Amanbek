import React from "react";
import { rnd, noise, seg, easeOut, clamp } from "../lib";

const OUT = "#15100e";

// big out-of-focus particles right at the lens: the nearest depth plane
export const LensBits: React.FC<{ t: number; c: string; n?: number; seed?: number; speed?: number; up?: boolean }> = ({ t, c, n = 5, seed = 11, speed = 90, up }) => (
  <g filter="url(#f_blur10)" opacity={0.55}>
    {Array.from({ length: n }, (_, i) => {
      const x = ((rnd(i, seed) * 2400 + t * speed * (0.6 + rnd(i, seed + 1))) % 2400) - 240;
      const y0 = ((rnd(i, seed + 2) * 1400 + t * speed * 1.4 * (0.7 + rnd(i, seed + 3))) % 1400) - 160;
      return <circle key={i} cx={x} cy={up ? 1080 - y0 : y0} r={26 + rnd(i, seed + 4) * 34} fill={c} />;
    })}
  </g>
);

export const Snow: React.FC<{ t: number; n?: number; wind?: number; c?: string; big?: boolean; seed?: number }> = ({ t, n = 90, wind = 30, c = "#fff", big, seed = 1 }) => (
  <g>
    <LensBits t={t} c={c} n={4} seed={seed + 20} speed={wind * 2.5 + 40} />
    {Array.from({ length: n }, (_, i) => {
      const sp = 40 + rnd(i, seed) * 70;
      const x = ((rnd(i, seed + 1) * 2200 + t * wind + Math.sin(t * 0.8 + i) * 30) % 2200 + 2200) % 2200 - 140;
      const y = ((rnd(i, seed + 2) * 1300 + t * sp) % 1300) - 110;
      const r = (big ? 4 : 2) + rnd(i, seed + 3) * (big ? 7 : 3.5);
      return <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={0.5 + rnd(i, seed + 4) * 0.5} />;
    })}
  </g>
);

export const Embers: React.FC<{ t: number; n?: number; c?: string; seed?: number; y0?: number }> = ({ t, n = 40, c = "#ffb04a", seed = 3, y0 = 1100 }) => (
  <g>
    {n > 0 ? <LensBits t={t} c={c} n={3} seed={seed + 30} speed={70} up /> : null}
    {Array.from({ length: n }, (_, i) => {
      const sp = 60 + rnd(i, seed) * 120;
      const y = y0 - ((rnd(i, seed + 2) * 1200 + t * sp) % 1200);
      const x = rnd(i, seed + 1) * 1920 + Math.sin(t * 2 + i) * 30;
      return <circle key={i} cx={x} cy={y} r={2 + rnd(i, seed + 3) * 3} fill={c} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))} />;
    })}
  </g>
);

export const Petals: React.FC<{ t: number; n?: number; c?: string; seed?: number }> = ({ t, n = 40, c = "#f6c2d6", seed = 5 }) => (
  <g>
    <LensBits t={t} c={c} n={3} seed={seed + 40} speed={110} />
    {Array.from({ length: n }, (_, i) => {
      const x = ((rnd(i, seed) * 2200 + t * 80) % 2200) - 140;
      const y = ((rnd(i, seed + 1) * 1300 + t * (50 + rnd(i, seed + 2) * 40)) % 1300) - 100;
      return <ellipse key={i} cx={x} cy={y} rx={7} ry={4} fill={c} transform={`rotate(${t * 90 + i * 40} ${x} ${y})`} opacity={0.85} />;
    })}
  </g>
);

// big brush kanji stamped on screen
export const Kanji: React.FC<{ ch: string; x: number; y: number; t: number; size?: number; c?: string; dur?: number; vertical?: boolean }> = ({ ch, x, y, t, size = 260, c = "#c1121f", dur = 2.4, vertical = true }) => {
  const k = seg(t, 0, 0.25);
  const out = seg(t, dur - 0.4, dur);
  const sc = 1.6 - easeOut(k) * 0.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={k * (1 - out)}>
      <text x={0} y={0} textAnchor="middle" fontFamily="'Yuji Boku', serif" fontSize={size} fill={c} style={{ writingMode: vertical ? ("vertical-rl" as any) : undefined }} stroke="#000" strokeOpacity={0.25} strokeWidth={4} paintOrder="stroke">
        {ch}
      </text>
    </g>
  );
};

// water breathing: swirling blue wave ribbons
export const WaterArc: React.FC<{ x: number; y: number; r: number; t: number; a0?: number; sweep?: number; k?: number; flip?: boolean }> = ({ x, y, r, t, a0 = -150, sweep = 300, k = 1, flip }) => {
  const prog = clamp(k);
  const a1 = a0 + sweep * prog;
  const arc = (rr: number, off: number) => {
    const pts: string[] = [];
    for (let a = a0 + off; a <= a1; a += 6) {
      const wob = Math.sin(a / 18 + t * 6) * 10;
      pts.push(`${(Math.cos((a * Math.PI) / 180) * (rr + wob)).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * (rr + wob)).toFixed(1)}`);
    }
    return pts.length > 1 ? "M " + pts.join(" L ") : "";
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d={arc(r, 0)} stroke="#1e5fb8" strokeWidth={60} fill="none" strokeLinecap="round" opacity={0.75} />
      <path d={arc(r, 6)} stroke="#4ab0f0" strokeWidth={36} fill="none" strokeLinecap="round" />
      <path d={arc(r - 8, 14)} stroke="#e6f8ff" strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d={arc(r + 26, 24)} stroke="#bfe8ff" strokeWidth={4} fill="none" strokeDasharray="30 22" opacity={0.8} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((a0 + (sweep * prog * i) / 12) * Math.PI) / 180;
        const rr = r + 40 + rnd(i) * 40;
        return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={4 + rnd(i, 3) * 6} fill="#dff4ff" opacity={prog < 1 ? 0.9 : 0.5} />;
      })}
    </g>
  );
};

// sun breathing / hinokami kagura: fire arc
export const FireArc: React.FC<{ x: number; y: number; r: number; t: number; a0?: number; sweep?: number; k?: number; flip?: boolean; c1?: string; c2?: string }> = ({ x, y, r, t, a0 = -160, sweep = 320, k = 1, flip, c1 = "#ff5a14", c2 = "#ffd36a" }) => {
  const a1 = a0 + sweep * clamp(k);
  const arc = (rr: number, off: number, wob = 14) => {
    const pts: string[] = [];
    for (let a = a0 + off; a <= a1; a += 5) {
      const w = noise(a / 20 + t * 4, 7) * wob;
      pts.push(`${(Math.cos((a * Math.PI) / 180) * (rr + w)).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * (rr + w)).toFixed(1)}`);
    }
    return pts.length > 1 ? "M " + pts.join(" L ") : "";
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d={arc(r, 0, 20)} stroke="#b21a08" strokeWidth={80} fill="none" strokeLinecap="round" opacity={0.6} filter="url(#f_blur10)" />
      <path d={arc(r, 4)} stroke={c1} strokeWidth={52} fill="none" strokeLinecap="round" />
      <path d={arc(r - 6, 10, 8)} stroke={c2} strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d={arc(r - 10, 18, 4)} stroke="#fff8e0" strokeWidth={6} fill="none" strokeLinecap="round" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = ((a0 + (sweep * clamp(k) * i) / 16) * Math.PI) / 180;
        const rr = r + 30 + rnd(i, 9) * 60 + ((t * 80) % 60);
        return <path key={i} d={`M ${Math.cos(a) * rr} ${Math.sin(a) * rr} l ${Math.cos(a) * 18} ${Math.sin(a) * 18 - 10}`} stroke="#ffb04a" strokeWidth={4} strokeLinecap="round" />;
      })}
    </g>
  );
};

// Nezuko's exploding blood: pink flames
export const PinkFire: React.FC<{ x: number; y: number; s: number; t: number }> = ({ x, y, s, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={260} fill="url(#g_glowP)" opacity={0.8} />
    {Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + t;
      const h = 120 + noise(t * 4, i) * 40;
      return (
        <path key={i} transform={`rotate(${(a * 180) / Math.PI})`} d={`M -26 0 C -30 ${-h * 0.5} 0 ${-h * 0.8} 6 ${-h} C 10 ${-h * 0.6} 30 ${-h * 0.4} 26 0 Z`} fill={i % 2 ? "#ff3d9a" : "#ff8ac4"} opacity={0.85} />
      );
    })}
  </g>
);

export const Lightning: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; seed?: number; w?: number }> = ({ x1, y1, x2, y2, t, seed = 1, w = 10 }) => {
  const n = 10;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const k = i / n;
    const j = i === 0 || i === n ? 0 : (rnd(i + Math.floor(t * 20) * 13, seed) - 0.5) * 80;
    return `${x1 + (x2 - x1) * k + j * 0.5} ${y1 + (y2 - y1) * k + j}`;
  });
  const d = "M " + pts.join(" L ");
  return (
    <g>
      <path d={d} stroke="#ffe066" strokeWidth={w * 3} fill="none" opacity={0.35} filter="url(#f_blur10)" />
      <path d={d} stroke="#ffd23a" strokeWidth={w} fill="none" strokeLinejoin="round" />
      <path d={d} stroke="#fffbe0" strokeWidth={w * 0.35} fill="none" strokeLinejoin="round" />
    </g>
  );
};

// quick white slash
export const Slash: React.FC<{ x: number; y: number; len: number; ang: number; k: number; c?: string; w?: number }> = ({ x, y, len, ang, k, c = "#fff", w = 26 }) => {
  if (k <= 0 || k >= 1) return null;
  const a = easeOut(clamp(k * 1.6));
  const fade = 1 - seg(k, 0.5, 1);
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`} opacity={fade}>
      <path d={`M ${-len / 2} 0 Q 0 ${-w * 2} ${-len / 2 + len * a} 0 Q 0 ${-w * 0.6} ${-len / 2} 0 Z`} fill={c} />
      <path d={`M ${-len / 2} 6 Q 0 ${-w * 1.2} ${-len / 2 + len * a} 6`} stroke={c} strokeWidth={3} fill="none" opacity={0.6} />
    </g>
  );
};

export const Flash: React.FC<{ k: number; c?: string }> = ({ k, c = "#fff" }) => (k > 0 && k < 1 ? <rect x={-1000} y={-600} width={4000} height={2400} fill={c} opacity={(1 - k) * 0.9} /> : null);

export const SpeedLines: React.FC<{ t: number; c?: string; op?: number; cx?: number; cy?: number }> = ({ t, c = "#fff", op = 0.6, cx = 960, cy = 540 }) => (
  <g opacity={op}>
    {Array.from({ length: 48 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2 + rnd(i) * 0.1;
      const r0 = 420 + rnd(i + Math.floor(t * 12), 3) * 300;
      return <path key={i} d={`M ${cx + Math.cos(a) * r0} ${cy + Math.sin(a) * r0} L ${cx + Math.cos(a) * 1600} ${cy + Math.sin(a) * 1600}`} stroke={c} strokeWidth={2 + rnd(i, 4) * 8} />;
    })}
  </g>
);

export const SunRays: React.FC<{ x: number; y: number; t: number; k?: number }> = ({ x, y, t, k = 1 }) => (
  <g opacity={k}>
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + t * 0.05;
      return <path key={i} d={`M ${x} ${y} L ${x + Math.cos(a - 0.06) * 2400} ${y + Math.sin(a - 0.06) * 2400} L ${x + Math.cos(a + 0.06) * 2400} ${y + Math.sin(a + 0.06) * 2400} Z`} fill="#fff2c0" opacity={0.18} />;
    })}
    <circle cx={x} cy={y} r={500} fill="url(#g_glowO)" />
  </g>
);

export const BloodSplat: React.FC<{ x: number; y: number; s: number; k: number; c?: string; seed?: number }> = ({ x, y, s, k, c = "#9a0a14", seed = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * easeOut(clamp(k * 2))})`} opacity={clamp(2 - k * 2)}>
    <circle r={60} fill={c} />
    {Array.from({ length: 12 }, (_, i) => {
      const a = rnd(i, seed) * Math.PI * 2, r = 70 + rnd(i, seed + 1) * 120;
      return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={6 + rnd(i, seed + 2) * 18} fill={c} />;
    })}
  </g>
);

// ink blot transition mask (k 0..1 covering, then 1..2 uncovering)
export const InkWipe: React.FC<{ k: number; c?: string; seed?: number }> = ({ k, c = "#0b0908", seed = 4 }) => {
  if (k <= 0 || k >= 2) return null;
  const cov = k < 1 ? easeOut(k) : 1 - easeOut(k - 1);
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const cx = 200 + rnd(i, seed) * 1520, cy = 120 + rnd(i, seed + 1) * 840;
        const r = cov * (500 + rnd(i, seed + 2) * 500);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={c} />
            {Array.from({ length: 6 }, (_, j) => {
              const a = rnd(j, seed + i) * Math.PI * 2;
              return <circle key={j} cx={cx + Math.cos(a) * r * 1.05} cy={cy + Math.sin(a) * r * 1.05} r={r * 0.18 * rnd(j, i + 9)} fill={c} />;
            })}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- props ---
export const Boulder: React.FC<{ x: number; y: number; s: number; cut?: number }> = ({ x, y, s, cut = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={300} ry={36} fill="#000" opacity={0.2} />
    {cut === 0 ? (
      <g>
        <path d="M -260 0 C -280 -160 -180 -330 -10 -340 C 140 -340 290 -200 260 0 Z" fill="#666b6f" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
        <path d="M -200 -120 C -160 -220 -100 -270 -40 -290" stroke="#9aa0a4" strokeWidth={10} fill="none" opacity={0.6} />
        <path d="M 40 -300 C 140 -280 220 -180 230 -60 C 180 -40 120 -20 60 0 L 260 0 C 290 -200 140 -340 40 -300 Z" fill="#000" opacity={0.18} />
        <path d="M -120 -200 l 30 20 M 80 -120 l 40 -10 M -60 -60 l 20 30" stroke="#4a4e52" strokeWidth={5} />
      </g>
    ) : null}
    <g opacity={cut === 0 ? 0 : 1} transform={`translate(${-cut * 30} ${cut * 4}) rotate(${-cut * 3})`}>
      <path d="M -260 0 C -280 -160 -180 -330 -10 -340 L 0 0 Z" fill="#6f7478" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
      <path d="M -200 -120 C -160 -220 -100 -270 -40 -290" stroke="#9aa0a4" strokeWidth={10} fill="none" opacity={0.6} />
    </g>
    <g opacity={cut === 0 ? 0 : 1} transform={`translate(${cut * 30} ${cut * 4}) rotate(${cut * 3})`}>
      <path d="M 0 0 L -10 -340 C 140 -340 290 -200 260 0 Z" fill="#5d6266" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
      <path d="M 40 -300 C 140 -280 220 -180 230 -60" stroke="#3e4246" strokeWidth={14} fill="none" opacity={0.5} />
    </g>
    {cut > 0 ? <path d="M -10 -380 L 0 30" stroke="#fff" strokeWidth={6 * (1 - cut)} opacity={1 - cut} /> : null}
  </g>
);

export const Box: React.FC<{ x: number; y: number; s: number; open?: number; glow?: boolean }> = ({ x, y, s, open = 0, glow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow ? <circle cx={0} cy={-110} r={220} fill="url(#g_glowP)" opacity={0.6} /> : null}
    <rect x={-80} y={-220} width={160} height={220} rx={8} fill="#b27a45" stroke={OUT} strokeWidth={6} />
    <rect x={-80} y={-220} width={160} height={28} fill="#8a5a30" stroke={OUT} strokeWidth={4} />
    <path d="M -64 -190 V -10 M 64 -190 V -10" stroke="#8a5a30" strokeWidth={5} />
    <path d="M 30 -190 L 80 -190 L 80 0 L 30 0 Z" fill="rgba(40,14,40,0.22)" />
    {open > 0 ? <rect x={-60} y={-200 + 0} width={120} height={60 * open} fill="#0a0606" /> : null}
  </g>
);

export const Crow: React.FC<{ x: number; y: number; s: number; t: number; flap?: boolean }> = ({ x, y, s, t, flap = true }) => {
  const w = flap ? Math.sin(t * 14) * 30 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M 0 0 L -70 ${-20 - w} L -30 6 Z`} fill="#121218" stroke={OUT} strokeWidth={3} />
      <path d={`M 0 0 L 70 ${-20 - w} L 30 6 Z`} fill="#121218" stroke={OUT} strokeWidth={3} />
      <ellipse cx={0} cy={4} rx={26} ry={16} fill="#1a1a22" stroke={OUT} strokeWidth={3} />
      <circle cx={22} cy={-6} r={12} fill="#1a1a22" stroke={OUT} strokeWidth={3} />
      <path d="M 32 -6 L 48 -2 L 32 0 Z" fill="#d8b04a" />
      <circle cx={25} cy={-9} r={2.5} fill="#fff" />
    </g>
  );
};

export const Gourd: React.FC<{ x: number; y: number; s: number; burst?: number }> = ({ x, y, s, burst = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {burst < 0.5 ? (
      <g transform={`scale(${1 + burst * 0.4})`}>
        <circle cx={0} cy={-60} r={60} fill="#d8a24a" stroke={OUT} strokeWidth={6} />
        <circle cx={0} cy={-150} r={40} fill="#d8a24a" stroke={OUT} strokeWidth={6} />
        <rect x={-10} y={-200} width={20} height={24} fill="#8a5a30" stroke={OUT} strokeWidth={4} />
        <path d="M 20 -90 Q 40 -60 24 -30" stroke="#fff" strokeWidth={6} opacity={0.5} fill="none" />
      </g>
    ) : (
      <g opacity={2 - burst * 2}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2, r = 60 + (burst - 0.5) * 400;
          return <path key={i} d={`M ${Math.cos(a) * r} ${-80 + Math.sin(a) * r} l 30 10 l -10 30 Z`} fill="#d8a24a" stroke={OUT} strokeWidth={3} />;
        })}
      </g>
    )}
  </g>
);

export const Coin: React.FC<{ x: number; y: number; s: number; t: number; spin?: boolean }> = ({ x, y, s, t, spin = true }) => {
  const sx = spin ? Math.abs(Math.cos(t * 14)) : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * Math.max(0.08, sx)} ${s})`}>
      <circle r={40} fill="#e8c25a" stroke={OUT} strokeWidth={5} />
      <circle r={28} fill="none" stroke="#b8902a" strokeWidth={4} />
      <rect x={-8} y={-8} width={16} height={16} fill="#5a3a10" />
    </g>
  );
};

// demons ----------------------------------------------------------------------
export const HandDemon: React.FC<{ x: number; y: number; s: number; t: number; k?: number; dead?: number }> = ({ x, y, s, t, dead = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - dead}>
    {Array.from({ length: 14 }, (_, i) => {
      const a = -160 + i * 25 + Math.sin(t * 2 + i) * 6;
      const L = 220 + rnd(i) * 120;
      const ar = (a * Math.PI) / 180;
      const ex = Math.cos(ar) * L, ey = Math.sin(ar) * L * 0.8 - 200;
      return (
        <g key={i}>
          <path d={`M 0 -200 Q ${ex * 0.5 + Math.sin(t * 3 + i) * 30} ${ey * 0.5 - 40} ${ex} ${ey}`} stroke={OUT} strokeWidth={46} fill="none" strokeLinecap="round" />
          <path d={`M 0 -200 Q ${ex * 0.5 + Math.sin(t * 3 + i) * 30} ${ey * 0.5 - 40} ${ex} ${ey}`} stroke="#4a6a3a" strokeWidth={36} fill="none" strokeLinecap="round" />
          <circle cx={ex} cy={ey} r={24} fill="#6a8a5a" stroke={OUT} strokeWidth={5} />
        </g>
      );
    })}
    <ellipse cx={0} cy={-200} rx={170} ry={210} fill="#38552e" stroke={OUT} strokeWidth={8} />
    <ellipse cx={60} cy={-180} rx={90} ry={190} fill="#000" opacity={0.18} />
    <ellipse cx={0} cy={-260} rx={70} ry={64} fill="#5a7a4a" stroke={OUT} strokeWidth={6} />
    <circle cx={-26} cy={-268} r={30} fill="#ffd23a" opacity={0.25} filter="url(#f_blur10)" /><circle cx={26} cy={-268} r={30} fill="#ffd23a" opacity={0.25} filter="url(#f_blur10)" />
    <path d="M -42 -276 L -12 -268 L -40 -258 Z" fill="#ffd23a" /><path d="M 42 -276 L 12 -268 L 40 -258 Z" fill="#ffd23a" />
    <path d="M -40 -232 Q 0 -196 40 -232 Q 0 -214 -40 -232 Z" stroke={OUT} strokeWidth={4} fill="#3a0a0a" />
    <path d="M -30 -228 l 5 10 l 5 -9 M 0 -222 l 5 10 l 5 -10 M 20 -228 l 5 10 l 5 -9" fill="#fff" />
  </g>
);

export const DemonSil: React.FC<{ x: number; y: number; s: number; t: number; kanji?: string; eyes?: string; c?: string; claws?: boolean }> = ({ x, y, s, t, kanji, eyes = "#ff1e3c", c = "#0b0709", claws = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M -120 0 C -140 -200 -110 -360 -60 -420 C -80 -470 -50 -520 0 -524 C 50 -520 80 -470 60 -420 C 110 -360 140 -200 120 0 Z`} fill={c} />
    <path d="M -46 -500 L -70 -560 L -26 -512 Z M 46 -500 L 70 -560 L 26 -512 Z" fill={c} />
    {claws ? <path d={`M -120 -260 L -200 ${-180 + Math.sin(t * 3) * 10} L -170 -170 L -210 -150 L -110 -200 Z M 120 -260 L 200 ${-180 - Math.sin(t * 3) * 10} L 170 -170 L 210 -150 L 110 -200 Z`} fill={c} /> : null}
    <path d="M -40 -468 L -10 -456 L -40 -450 Z M 40 -468 L 10 -456 L 40 -450 Z" fill={eyes} />
    <circle cx={-26} cy={-460} r={26} fill={eyes} opacity={0.25} filter="url(#f_blur10)" />
    <circle cx={26} cy={-460} r={26} fill={eyes} opacity={0.25} filter="url(#f_blur10)" />
    {kanji ? <text x={0} y={-430} textAnchor="middle" fontFamily="'Yuji Boku', serif" fontSize={34} fill="#d8b04a">{kanji}</text> : null}
  </g>
);

export const Whips: React.FC<{ x: number; y: number; t: number; n?: number; len?: number; k?: number; c?: string }> = ({ x, y, t, n = 9, len = 1100, k = 1, c = "#1a0a12" }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const a0 = -170 + (i / (n - 1)) * 160 + Math.sin(t * 2.2 + i) * 18;
      const pts: string[] = [];
      for (let j = 0; j <= 20; j++) {
        const q = j / 20;
        const a = ((a0 + Math.sin(t * 4 + i + q * 5) * 30 * q) * Math.PI) / 180;
        const r = q * len * k;
        pts.push(`${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r * 0.7).toFixed(1)}`);
      }
      const d = "M " + pts.join(" L ");
      return (
        <g key={i}>
          <path d={d} stroke="#5a0a20" strokeWidth={40} fill="none" strokeLinecap="round" opacity={0.5} />
          <path d={d} stroke={c} strokeWidth={26} fill="none" strokeLinecap="round" />
          <path d={d} stroke="#c1123a" strokeWidth={4} fill="none" strokeDasharray="18 30" opacity={0.8} />
        </g>
      );
    })}
  </g>
);

export const Threads: React.FC<{ x: number; y: number; t: number; k?: number; c?: string; n?: number }> = ({ x, y, t, k = 1, c = "#f4f6ff", n = 12 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const a = (-170 + (i / (n - 1)) * 160) * (Math.PI / 180);
      const L = (900 + rnd(i) * 400) * k;
      return <path key={i} d={`M ${x} ${y} Q ${x + Math.cos(a) * L * 0.5} ${y + Math.sin(a) * L * 0.5 + Math.sin(t * 3 + i) * 20} ${x + Math.cos(a) * L} ${y + Math.sin(a) * L}`} stroke={c} strokeWidth={3} fill="none" opacity={0.9} />;
    })}
  </g>
);

export const Hands: React.FC<{ t: number; k: number; side?: number; c?: string }> = ({ t, k, c = "#f2d8c6" }) => (
  <g>
    {Array.from({ length: 9 }, (_, i) => {
      const x = 200 + i * 190 + Math.sin(t + i) * 10;
      const len = (260 + rnd(i) * 200) * easeOut(clamp(k * 1.3 - i * 0.05));
      return (
        <g key={i} transform={`translate(${x} 1180) rotate(${(i - 4) * 4})`} opacity={0.9}>
          <path d={`M -24 0 L -19 ${-len} L 19 ${-len} L 24 0 Z`} fill={c} stroke={OUT} strokeWidth={4} />
          <g transform={`translate(0 ${-len}) rotate(${Math.sin(t * 2 + i) * 8})`}>
            <path d="M -24 6 C -30 -20 -28 -36 -22 -40 L -20 -78 Q -14 -86 -9 -78 L -7 -50 L -5 -92 Q 2 -100 7 -92 L 8 -52 L 12 -86 Q 18 -93 23 -85 L 21 -48 L 28 -70 Q 34 -74 36 -66 L 28 -20 C 26 0 18 8 0 10 C -12 10 -20 10 -24 6 Z" fill={c} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
            <path d="M -24 -20 Q -40 -30 -42 -46 Q -36 -52 -30 -42" fill={c} stroke={OUT} strokeWidth={4} />
          </g>
        </g>
      );
    })}
  </g>
);
