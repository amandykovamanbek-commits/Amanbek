import React from "react";
import { rnd, noise } from "../lib";

// Ink-wash ("тушь") backgrounds. Canvas 1920x1080; layers get a parallax depth d (0 far .. 1 stage).
export type Cam = { x: number; y: number; z: number; rot?: number };
export type Tod = "day" | "dusk" | "night" | "dawn" | "red";
const OUT = "#15100e";

export const Par: React.FC<{ cam: Cam; d: number; children: React.ReactNode }> = ({ cam, d, children }) => {
  // undo part of the camera motion for far layers
  const k = 1 - d;
  const zs = Math.pow(cam.z, -k);
  return <g transform={`translate(${cam.x * k} ${cam.y * k}) translate(960 540) scale(${zs}) translate(-960 -540)`}>{children}</g>;
};

const SKY: Record<Tod, [string, string, string]> = {
  day: ["#cfdbe3", "#e8ebe6", "#f5f1e8"],
  dusk: ["#4a3a5e", "#c9786a", "#f2b67a"],
  night: ["#070b16", "#121a2e", "#26304a"],
  dawn: ["#2a2c50", "#d9745a", "#ffd79a"],
  red: ["#14040a", "#3a0a14", "#7a1420"],
};
export const Sky: React.FC<{ tod: Tod; id?: string }> = ({ tod, id = "sky" }) => {
  const [a, b, c] = SKY[tod];
  return (
    <>
      <defs>
        <linearGradient id={`${id}_${tod}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} /><stop offset=".55" stopColor={b} /><stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x={-1200} y={-800} width={4320} height={2700} fill={`url(#${id}_${tod})`} />
    </>
  );
};

export const Moon: React.FC<{ x: number; y: number; r: number; c?: string }> = ({ x, y, r, c = "#f4f0dc" }) => (
  <g>
    <circle cx={x} cy={y} r={r * 2.4} fill={c} opacity={0.08} />
    <circle cx={x} cy={y} r={r * 1.5} fill={c} opacity={0.12} />
    <circle cx={x} cy={y} r={r} fill={c} />
    <circle cx={x - r * 0.3} cy={y - r * 0.2} r={r * 0.22} fill="#000" opacity={0.05} />
    <circle cx={x + r * 0.35} cy={y + r * 0.3} r={r * 0.15} fill="#000" opacity={0.05} />
  </g>
);

export const Sun: React.FC<{ x: number; y: number; r: number; k?: number }> = ({ x, y, r, k = 1 }) => (
  <g opacity={k}>
    <circle cx={x} cy={y} r={r * 6} fill="url(#g_glowO)" />
    <circle cx={x} cy={y} r={r} fill="#fff2c8" />
  </g>
);

// ridge line generated from smooth noise
export function ridgePath(seed: number, y: number, amp: number, rough = 1, x0 = -1400, x1 = 3300, bottom = 1600) {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 40) {
    const n = noise(x / 520 * rough, seed) * 0.65 + noise(x / 180 * rough, seed + 3) * 0.25 + noise(x / 60, seed + 7) * 0.1;
    pts.push(`${x} ${(y - Math.abs(n) * amp - n * amp * 0.3).toFixed(1)}`);
  }
  return `M ${x0} ${bottom} L ${pts.join(" L ")} L ${x1} ${bottom} Z`;
}

export const Ridge: React.FC<{ seed: number; y: number; amp: number; c: string; c2?: string; rough?: number; id: string; snow?: boolean }> = ({ seed, y, amp, c, c2, rough, id, snow }) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c} /><stop offset="0.6" stopColor={c2 || c} stopOpacity={c2 ? 1 : 0.85} /><stop offset="1" stopColor={c2 || c} stopOpacity={0.6} />
      </linearGradient>
    </defs>
    <path d={ridgePath(seed, y, amp, rough)} fill={`url(#${id})`} />
    {snow ? <path d={ridgePath(seed, y, amp, rough, -1400, 3300, y + 60)} fill="#fff" opacity={0.18} transform="translate(0 6)" /> : null}
  </g>
);

export const Mist: React.FC<{ y: number; h?: number; op?: number; c?: string; t?: number }> = ({ y, h = 160, op = 0.5, c = "#fff", t = 0 }) => (
  <g opacity={op}>
    <ellipse cx={600 + Math.sin(t * 0.1) * 80} cy={y} rx={1400} ry={h * 0.5} fill={c} filter="url(#f_blur24)" />
    <ellipse cx={1500 - Math.sin(t * 0.08) * 80} cy={y + h * 0.3} rx={1200} ry={h * 0.4} fill={c} filter="url(#f_blur24)" />
  </g>
);

export const Pine: React.FC<{ x: number; y: number; s: number; c: string; snow?: boolean }> = ({ x, y, s, c, snow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-6} y={-40} width={12} height={46} fill={c} />
    {[0, 1, 2, 3].map((i) => {
      const w = 90 - i * 18, yy = -40 - i * 52;
      return (
        <g key={i}>
          <path d={`M ${-w} ${yy} Q 0 ${yy - 30} ${w} ${yy} L 0 ${yy - 90} Z`} fill={c} />
          {snow ? <path d={`M ${-w * 0.7} ${yy - 22} Q 0 ${yy - 46} ${w * 0.7} ${yy - 22} L 0 ${yy - 84} Z`} fill="#f4f6f8" opacity={0.85} /> : null}
        </g>
      );
    })}
  </g>
);

export const BareTree: React.FC<{ x: number; y: number; s: number; c: string; seed?: number }> = ({ x, y, s, c, seed = 1 }) => {
  const br = (x0: number, y0: number, a: number, l: number, w: number, depth: number, k: number): React.ReactNode[] => {
    if (depth === 0) return [];
    const x1 = x0 + Math.sin(a) * l, y1 = y0 - Math.cos(a) * l;
    const out: React.ReactNode[] = [<path key={`${k}`} d={`M ${x0} ${y0} L ${x1} ${y1}`} stroke={c} strokeWidth={w} strokeLinecap="round" />];
    const sp = 0.5 + rnd(k, seed) * 0.3;
    out.push(...br(x1, y1, a - sp, l * 0.72, w * 0.65, depth - 1, k * 2 + 1));
    out.push(...br(x1, y1, a + sp * 0.8, l * 0.68, w * 0.62, depth - 1, k * 2 + 2));
    return out;
  };
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{br(0, 0, (rnd(seed) - 0.5) * 0.2, 160, 22, 6, 1)}</g>;
};

// ---------------------------------------------------------------- house ---
export const House: React.FC<{ x: number; y: number; s: number; lit?: number; door?: "open" | "closed"; snow?: boolean; dark?: boolean; spring?: boolean }> = ({ x, y, s, lit = 1, door = "closed", snow = true, dark, spring }) => {
  const wall = dark ? "#3a2a24" : "#8a6446";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={300} ry={26} fill="#000" opacity={0.15} />
      <rect x={-220} y={-200} width={440} height={200} fill={wall} stroke={OUT} strokeWidth={5} />
      {[-160, -80, 0, 80, 160].map((xx) => <path key={xx} d={`M ${xx} -200 V 0`} stroke="#5a3e2a" strokeWidth={4} />)}
      <path d="M -270 -190 L 0 -330 L 270 -190 Z" fill={dark ? "#2a2020" : "#5a4636"} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -270 -190 L 0 -330 L 270 -190" stroke="#3a2a20" strokeWidth={14} fill="none" opacity={0.5} />
      {snow ? <path d="M -280 -186 L 0 -336 L 280 -186 L 250 -176 Q 140 -230 0 -300 Q -140 -230 -250 -176 Z" fill="#f6f8fa" stroke={OUT} strokeWidth={3} /> : null}
      {spring ? <path d="M -280 -186 L 0 -336 L 280 -186" stroke="#6a8a4a" strokeWidth={10} fill="none" opacity={0.6} /> : null}
      {/* window */}
      <rect x={60} y={-150} width={110} height={80} fill={lit ? "#ffc66a" : "#2a2420"} stroke={OUT} strokeWidth={5} />
      <path d="M 115 -150 V -70 M 60 -110 H 170" stroke={OUT} strokeWidth={4} />
      {lit ? <rect x={20} y={-190} width={190} height={160} fill="url(#g_glowO)" opacity={0.6 * lit} /> : null}
      {/* door */}
      {door === "open" ? (
        <g>
          <rect x={-150} y={-160} width={100} height={160} fill="#0d0908" stroke={OUT} strokeWidth={5} />
          <rect x={-60} y={-160} width={60} height={160} fill="#7a5a40" stroke={OUT} strokeWidth={4} transform="skewY(-8)" />
        </g>
      ) : (
        <rect x={-150} y={-160} width={100} height={160} fill="#6a4a34" stroke={OUT} strokeWidth={5} />
      )}
      {/* chimney smoke */}
      <rect x={130} y={-300} width={30} height={60} fill="#5a4636" stroke={OUT} strokeWidth={4} />
    </g>
  );
};

// snowy mountains with optional house: the Kamado home
export const SnowMountains: React.FC<{ cam: Cam; tod: Tod; t: number; house?: boolean; houseX?: number; houseLit?: number; door?: "open" | "closed"; ground?: number; trees?: boolean; spring?: boolean }> = ({ cam, tod, t, house, houseX = 1250, houseLit = 1, door, ground = 880, trees = true, spring }) => {
  const night = tod === "night";
  const far = night ? "#1c2740" : tod === "dusk" ? "#7a5a7a" : tod === "dawn" ? "#6a4a6a" : "#9cb0c2";
  const mid = night ? "#141c30" : tod === "dusk" ? "#5a3a5a" : tod === "dawn" ? "#4a3050" : "#6f8599";
  const near = night ? "#0c1220" : tod === "dusk" ? "#3a2440" : tod === "dawn" ? "#2e2038" : "#4a5e72";
  const gnd = spring ? "#a9c68a" : night ? "#c8d2e4" : "#f1f4f6";
  return (
    <g>
      <Par cam={cam} d={0}><Sky tod={tod} /></Par>
      {night ? <Par cam={cam} d={0.02}><Moon x={1500} y={220} r={70} /></Par> : null}
      {tod === "dawn" ? <Par cam={cam} d={0.02}><Sun x={960} y={760} r={70} /></Par> : null}
      <Par cam={cam} d={0.1}><Ridge id={`r1${tod}`} seed={3} y={560} amp={260} c={far} snow={!spring} /></Par>
      <Par cam={cam} d={0.2}><Mist y={640} op={night ? 0.15 : 0.45} t={t} c={night ? "#8aa0c8" : "#fff"} /></Par>
      <Par cam={cam} d={0.3}><Ridge id={`r2${tod}`} seed={8} y={700} amp={200} c={mid} snow={!spring} /></Par>
      {trees ? (
        <Par cam={cam} d={0.5}>
          {[-300, -120, 80, 300, 520, 1500, 1700, 1900, 2150].map((x, i) => <Pine key={x} x={x} y={ground - 40 - (i % 3) * 20} s={0.7 + (i % 3) * 0.15} c={near} snow={!spring} />)}
        </Par>
      ) : null}
      <Par cam={cam} d={0.8}>
        <path d={`M -1400 ${ground} Q 400 ${ground - 60} 960 ${ground - 20} T 3300 ${ground - 10} L 3300 2000 L -1400 2000 Z`} fill={gnd} />
        <path d={`M -1400 ${ground + 40} Q 400 ${ground - 20} 960 ${ground + 20} T 3300 ${ground + 30}`} stroke="#b9c6d6" strokeWidth={6} fill="none" opacity={0.6} />
        {house ? <House x={houseX} y={ground - 24} s={0.85} lit={houseLit} door={door} snow={!spring} spring={spring} /> : null}
      </Par>
    </g>
  );
};

// ---------------------------------------------------------------- forest ---
export const Forest: React.FC<{ cam: Cam; t: number; tod?: Tod; fog?: boolean; webs?: boolean; ground?: number }> = ({ cam, t, tod = "night", fog = true, webs, ground = 900 }) => {
  const night = tod === "night";
  const c1 = night ? "#16203a" : "#7d8c84", c2 = night ? "#0c1222" : "#4e5e56", c3 = night ? "#06080f" : "#2c3a32";
  return (
    <g>
      <Par cam={cam} d={0}><Sky tod={tod} /></Par>
      {night ? <Par cam={cam} d={0.02}><Moon x={webs ? 960 : 1460} y={webs ? 300 : 200} r={webs ? 150 : 60} /></Par> : null}
      <Par cam={cam} d={0.2}>
        {Array.from({ length: 16 }, (_, i) => <rect key={i} x={-300 + i * 170 + rnd(i) * 60} y={-200} width={34 + rnd(i + 3) * 20} height={1500} fill={c1} />)}
      </Par>
      {fog ? <Par cam={cam} d={0.3}><Mist y={700} op={night ? 0.25 : 0.6} t={t} c={night ? "#6a80a8" : "#eef2ee"} /></Par> : null}
      <Par cam={cam} d={0.5}>
        {Array.from({ length: 11 }, (_, i) => <rect key={i} x={-400 + i * 260 + rnd(i, 4) * 80} y={-200} width={60 + rnd(i, 5) * 30} height={1500} fill={c2} />)}
      </Par>
      {webs ? <Par cam={cam} d={0.55}><Webs t={t} /></Par> : null}
      <Par cam={cam} d={0.85}>
        <path d={`M -1400 ${ground} Q 960 ${ground - 30} 3300 ${ground} L 3300 2000 L -1400 2000 Z`} fill={night ? "#0a0e18" : "#3a4636"} />
        {Array.from({ length: 5 }, (_, i) => <rect key={i} x={-600 + i * 760 + rnd(i, 7) * 100} y={-300} width={110} height={1600} fill={c3} />)}
      </Par>
    </g>
  );
};

export const Webs: React.FC<{ t: number }> = ({ t }) => (
  <g stroke="#e8eef8" strokeWidth={2} fill="none" opacity={0.6}>
    {[[300, 260, 220], [1600, 340, 260], [1000, 120, 180], [-100, 500, 200], [2100, 520, 220]].map(([x, y, r], k) => (
      <g key={k} transform={`translate(${x} ${y}) rotate(${Math.sin(t * 0.4 + k) * 3})`}>
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M 0 0 L ${Math.cos((i / 10) * Math.PI * 2) * r} ${Math.sin((i / 10) * Math.PI * 2) * r}`} />)}
        {[0.3, 0.55, 0.8, 1].map((q) => (
          <path key={q} d={Array.from({ length: 11 }, (_, i) => `${i ? "L" : "M"} ${Math.cos((i / 10) * Math.PI * 2) * r * q} ${Math.sin((i / 10) * Math.PI * 2) * r * q}`).join(" ")} />
        ))}
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------- interior ---
export const Interior: React.FC<{ cam: Cam; t: number; fire?: number; warm?: boolean; dark?: boolean }> = ({ cam, t, fire = 1, warm = true, dark }) => {
  const f = 0.85 + noise(t * 6, 2) * 0.15;
  return (
    <g>
      <Par cam={cam} d={0.4}>
        <rect x={-800} y={-400} width={3500} height={1900} fill={dark ? "#1a1210" : "#6a4a34"} />
        {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M ${-800 + i * 120} -400 V 1500`} stroke="#4a3222" strokeWidth={5} opacity={0.7} />)}
        <rect x={300} y={140} width={520} height={360} fill={dark ? "#2a2420" : "#efe2c4"} stroke={OUT} strokeWidth={8} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${300 + i * 130} 140 V 500`} stroke={OUT} strokeWidth={4} />)}
        {[0, 1, 2].map((i) => <path key={i} d={`M 300 ${140 + i * 120} H 820`} stroke={OUT} strokeWidth={4} />)}
        <rect x={-800} y={-400} width={3500} height={140} fill="#3a2618" />
      </Par>
      <Par cam={cam} d={0.8}>
        <rect x={-800} y={760} width={3500} height={900} fill={dark ? "#2a2018" : "#c9b07a"} />
        {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M ${-800 + i * 260} 760 L ${-1100 + i * 320} 1500`} stroke="#8a7244" strokeWidth={4} opacity={0.6} />)}
        {fire ? (
          <g transform="translate(1180 860)">
            <rect x={-170} y={-30} width={340} height={70} fill="#3a2a20" stroke={OUT} strokeWidth={6} />
            <circle cx={0} cy={-120} r={420 * f} fill="url(#g_glowO)" opacity={0.55 * fire} />
            <Flame x={0} y={-20} s={1.2 * fire} t={t} />
          </g>
        ) : null}
      </Par>
      {warm ? <rect x={-1000} y={-600} width={4000} height={2400} fill="#ff9a4a" opacity={0.08 * f} /> : null}
    </g>
  );
};

export const Flame: React.FC<{ x: number; y: number; s: number; t: number; c1?: string; c2?: string }> = ({ x, y, s, t, c1 = "#ff7a1a", c2 = "#ffd36a" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2].map((i) => {
      const w = 40 - i * 10, h = 110 - i * 26 + noise(t * 8, i + 3) * 18;
      const sx = noise(t * 5, i) * 8;
      return <path key={i} d={`M ${-w} 0 C ${-w} ${-h * 0.5} ${sx - 6} ${-h * 0.7} ${sx} ${-h} C ${sx + 6} ${-h * 0.7} ${w} ${-h * 0.5} ${w} 0 Z`} fill={i === 0 ? "#d2401a" : i === 1 ? c1 : c2} />;
    })}
  </g>
);

// ---------------------------------------------------------------- town ---
export const Town: React.FC<{ cam: Cam; t: number; tod: Tod; lanterns?: boolean; brick?: boolean; ground?: number }> = ({ cam, t, tod, lanterns, brick, ground = 880 }) => {
  const night = tod === "night";
  const B = (x: number, w: number, h: number, i: number, depth: number) => {
    const col = brick ? (night ? ["#3a2420", "#2a1c1a", "#40282a"][i % 3] : ["#9a5a44", "#8a4a3a", "#a86a50"][i % 3]) : night ? ["#2a2230", "#221c28", "#30263a"][i % 3] : ["#8a6a50", "#7a5c44", "#9a7656"][i % 3];
    const roof = night ? "#120e16" : "#3a3236";
    return (
      <g key={`${depth}${i}`}>
        <rect x={x} y={ground - h} width={w} height={h} fill={col} stroke={OUT} strokeWidth={4} />
        {brick ? null : <path d={`M ${x - 30} ${ground - h} L ${x + w / 2} ${ground - h - 70} L ${x + w + 30} ${ground - h} Z`} fill={roof} stroke={OUT} strokeWidth={4} />}
        {brick ? <rect x={x - 10} y={ground - h - 20} width={w + 20} height={24} fill={roof} /> : null}
        {Array.from({ length: Math.floor(w / 70) }, (_, j) => (
          <rect key={j} x={x + 20 + j * 70} y={ground - h + 40} width={40} height={brick ? 60 : 50} fill={night ? (rnd(i * 7 + j) > 0.4 ? "#ffcf7a" : "#1a1418") : "#efe2c4"} stroke={OUT} strokeWidth={3} />
        ))}
        {!brick ? <rect x={x + w * 0.2} y={ground - 130} width={w * 0.6} height={70} fill={["#2a3a6a", "#7a2a2a", "#2a5a4a"][i % 3]} stroke={OUT} strokeWidth={3} /> : null}
      </g>
    );
  };
  return (
    <g>
      <Par cam={cam} d={0}><Sky tod={tod} /></Par>
      {night ? <Par cam={cam} d={0.02}><Moon x={1600} y={160} r={50} /></Par> : null}
      <Par cam={cam} d={0.25}>
        <g opacity={0.6}>{Array.from({ length: 14 }, (_, i) => B(-600 + i * 300, 260, 420 + rnd(i, 2) * 200, i, 0))}</g>
      </Par>
      <Par cam={cam} d={0.6}>
        {Array.from({ length: 10 }, (_, i) => B(-500 + i * 400, 340, 320 + rnd(i, 3) * 120, i + 3, 1))}
        <rect x={-1400} y={ground} width={4700} height={900} fill={night ? "#1a1820" : "#b9a888"} />
        {lanterns || night ? Array.from({ length: 10 }, (_, i) => (
          <g key={i} transform={`translate(${-400 + i * 400} ${ground - 280})`}>
            <path d="M 0 -60 V 0" stroke={OUT} strokeWidth={3} />
            <circle r={70} fill="url(#g_glowO)" opacity={night ? 0.8 : 0.2} />
            <ellipse rx={18} ry={26} fill={brick ? "#fff2c8" : "#e8502a"} stroke={OUT} strokeWidth={3} />
          </g>
        )) : null}
        {brick ? Array.from({ length: 6 }, (_, i) => (
          <g key={i} transform={`translate(${-200 + i * 600} ${ground})`}>
            <rect x={-5} y={-300} width={10} height={300} fill="#1a1a1a" />
            <circle cx={0} cy={-310} r={90} fill="url(#g_glowO)" opacity={night ? 0.7 : 0} />
            <rect x={-16} y={-334} width={32} height={40} fill="#fff2c8" stroke={OUT} strokeWidth={3} />
          </g>
        )) : null}
      </Par>
    </g>
  );
};

// crowd of silhouettes
export const Crowd: React.FC<{ t: number; y: number; n?: number; c?: string; seed?: number; walk?: number }> = ({ t, y, n = 16, c = "#1a1620", seed = 1, walk = 30 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const x = ((i * 157 + rnd(i, seed) * 120 + t * walk * (rnd(i, seed + 2) > 0.5 ? 1 : -1)) % 2400 + 2400) % 2400 - 240;
      const h = 230 + rnd(i, seed + 4) * 70;
      const bob = Math.abs(Math.sin(t * 4 + i)) * 6;
      return (
        <g key={i} transform={`translate(${x} ${y - bob})`} opacity={0.9}>
          <ellipse cx={0} cy={-h + 22} rx={22} ry={25} fill={c} />
          {rnd(i, seed + 5) > 0.6 ? <ellipse cx={0} cy={-h + 4} rx={38} ry={8} fill={c} /> : null}
          <path d={`M -34 ${-h + 50} Q 0 ${-h + 36} 34 ${-h + 50} L 40 0 L -40 0 Z`} fill={c} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- wisteria ---
export const Wisteria: React.FC<{ cam: Cam; t: number; night?: boolean }> = ({ cam, t, night = true }) => {
  const cl = (x: number, y: number, k: number, s: number) => (
    <g key={k} transform={`translate(${x} ${y}) rotate(${Math.sin(t * 1.2 + k) * 3}) scale(${s})`}>
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={Math.sin(i * 1.7) * (14 - i)} cy={i * 22} r={16 - i * 1.3} fill={i % 2 ? "#b48ad8" : "#9a6ac2"} opacity={0.95} />
      ))}
    </g>
  );
  return (
    <g>
      <Par cam={cam} d={0}><Sky tod={night ? "night" : "day"} /></Par>
      {night ? <Par cam={cam} d={0.02}><Moon x={460} y={200} r={60} /></Par> : null}
      <Par cam={cam} d={0.2}><Ridge id="wr" seed={21} y={720} amp={180} c={night ? "#1a1830" : "#8a7aa8"} /></Par>
      <Par cam={cam} d={0.5}>
        {Array.from({ length: 6 }, (_, i) => <rect key={i} x={-300 + i * 480} y={-200} width={40} height={1200} fill={night ? "#1a1424" : "#4a3a3a"} />)}
        {Array.from({ length: 40 }, (_, i) => cl(-500 + (i % 20) * 160 + rnd(i) * 60, -40 + Math.floor(i / 20) * 90 + rnd(i, 3) * 60, i, 1 + rnd(i, 5) * 0.5))}
      </Par>
      <Par cam={cam} d={0.85}><rect x={-1400} y={900} width={4700} height={900} fill={night ? "#120e1a" : "#5a4a5a"} /></Par>
      <rect x={-1000} y={-600} width={4000} height={2400} fill="#8a4ad0" opacity={0.08} />
    </g>
  );
};

// ---------------------------------------------------------------- misc settings ---
export const Garden: React.FC<{ cam: Cam; t: number }> = ({ cam }) => (
  <g>
    <Par cam={cam} d={0}><Sky tod="day" /></Par>
    <Par cam={cam} d={0.3}>
      <rect x={-1200} y={300} width={4300} height={300} fill="#4a5a3a" />
      {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx={-800 + i * 340} cy={320} rx={200} ry={120} fill={i % 2 ? "#3a5a3a" : "#4a6a42"} />)}
    </Par>
    <Par cam={cam} d={0.6}>
      <rect x={-1200} y={520} width={4300} height={1200} fill="#e8e2d4" />
      {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M -1200 ${560 + i * 26} Q 960 ${540 + i * 26} 3100 ${560 + i * 26}`} stroke="#cfc6b2" strokeWidth={2} fill="none" />)}
      <rect x={1300} y={300} width={900} height={260} fill="#5a3a2a" stroke={OUT} strokeWidth={6} />
      <rect x={1260} y={260} width={980} height={50} fill="#2a2024" stroke={OUT} strokeWidth={5} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={1340 + i * 210} y={340} width={170} height={200} fill="#efe2c4" stroke={OUT} strokeWidth={4} />)}
    </Par>
  </g>
);

export const Estate: React.FC<{ cam: Cam; t: number; night?: boolean }> = ({ cam, t, night }) => (
  <g>
    <Par cam={cam} d={0}><Sky tod={night ? "night" : "day"} /></Par>
    <Par cam={cam} d={0.4}>
      <rect x={-1200} y={260} width={4300} height={460} fill={night ? "#2a2028" : "#d8cbb0"} stroke={OUT} strokeWidth={6} />
      <path d="M -1300 270 L 3200 270 L 3000 170 L -1100 170 Z" fill={night ? "#120e16" : "#3a3a4a"} stroke={OUT} strokeWidth={5} />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={-1100 + i * 270} y={330} width={220} height={330} fill={night ? "#3a2a24" : "#f4ead4"} stroke={OUT} strokeWidth={4} />)}
    </Par>
    <Par cam={cam} d={0.8}><rect x={-1400} y={720} width={4700} height={900} fill={night ? "#1e2a22" : "#8aa070"} /></Par>
    <Butterflies t={t} n={10} />
  </g>
);

export const Butterflies: React.FC<{ t: number; n?: number; c?: string; seed?: number }> = ({ t, n = 8, c = "#c7a6ec", seed = 2 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const x = ((rnd(i, seed) * 2200 + t * 60 * (0.5 + rnd(i, seed + 1))) % 2300) - 200;
      const y = 200 + rnd(i, seed + 2) * 600 + Math.sin(t * 1.5 + i) * 40;
      const fl = Math.abs(Math.sin(t * 12 + i * 3));
      return (
        <g key={i} transform={`translate(${x} ${y})`}>
          <ellipse cx={-10 * fl} cy={0} rx={12 * fl + 2} ry={9} fill={c} opacity={0.9} />
          <ellipse cx={10 * fl} cy={0} rx={12 * fl + 2} ry={9} fill={c} opacity={0.9} />
          <ellipse cx={0} cy={0} rx={2} ry={8} fill="#2a1a3a" />
        </g>
      );
    })}
  </g>
);

export const TrainExt: React.FC<{ cam: Cam; t: number; dawn?: number; stop?: boolean }> = ({ cam, t, dawn = 0, stop }) => {
  const sp = stop ? 0 : t * 900;
  return (
    <g>
      <Par cam={cam} d={0}><Sky tod="night" /></Par>
      {dawn ? <Par cam={cam} d={0}><g opacity={dawn}><Sky tod="dawn" id="tdawn" /></g></Par> : null}
      <Par cam={cam} d={0.02}><Moon x={1500} y={200} r={50} /></Par>
      <Par cam={cam} d={0.1}><g transform={`translate(${-(sp * 0.05) % 1600} 0)`}><Ridge id="tr1" seed={31} y={640} amp={160} c="#141a2c" /></g></Par>
      <Par cam={cam} d={0.4}>
        <g transform={`translate(${-(sp * 0.4) % 600} 0)`}>{Array.from({ length: 14 }, (_, i) => <Pine key={i} x={-600 + i * 300} y={760} s={0.9} c="#0a0e18" />)}</g>
      </Par>
      <Par cam={cam} d={0.85}>
        <rect x={-1400} y={880} width={4700} height={900} fill="#0e1018" />
        <g transform={`translate(${-(sp) % 120} 0)`}>{Array.from({ length: 50 }, (_, i) => <rect key={i} x={-1400 + i * 120} y={880} width={60} height={16} fill="#2a2a30" />)}</g>
        {/* the train */}
        {[0, 1, 2].map((k) => (
          <g key={k} transform={`translate(${-500 + k * 900} ${stop ? 6 : Math.sin(t * 20 + k) * 2})`}>
            <rect x={0} y={560} width={860} height={300} rx={12} fill="#2a2e36" stroke={OUT} strokeWidth={6} />
            <rect x={0} y={560} width={860} height={40} fill="#1a1d22" />
            {Array.from({ length: 7 }, (_, i) => <rect key={i} x={40 + i * 115} y={630} width={80} height={90} fill="#ffcf7a" stroke={OUT} strokeWidth={4} opacity={0.9} />)}
            <circle cx={140} cy={868} r={38} fill="#111" stroke="#444" strokeWidth={6} />
            <circle cx={720} cy={868} r={38} fill="#111" stroke="#444" strokeWidth={6} />
          </g>
        ))}
        <g transform={`translate(2200 0)`}>
          <rect x={0} y={520} width={520} height={340} rx={20} fill="#1a1c22" stroke={OUT} strokeWidth={6} />
          <rect x={360} y={440} width={70} height={90} fill="#1a1c22" stroke={OUT} strokeWidth={5} />
          <circle cx={520} cy={680} r={50} fill="#ffefb0" opacity={0.9} />
        </g>
      </Par>
    </g>
  );
};

export const TrainInt: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => (
  <g>
    <Par cam={cam} d={0.3}>
      <rect x={-1200} y={-400} width={4300} height={2000} fill="#4a3426" />
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <rect x={-600 + i * 520} y={200} width={360} height={260} fill="#141a2c" stroke={OUT} strokeWidth={8} />
          <g transform={`translate(${-(t * 600) % 360} 0)`} opacity={0.5}>
            {[0, 1, 2].map((k) => <rect key={k} x={-600 + i * 520 + k * 180} y={260} width={20} height={200} fill="#0a0e18" />)}
          </g>
        </g>
      ))}
      <rect x={-1200} y={-400} width={4300} height={160} fill="#2a1c14" />
    </Par>
    <Par cam={cam} d={0.7}>
      <rect x={-1200} y={560} width={4300} height={300} fill="#3a5a4a" stroke={OUT} strokeWidth={6} />
      <rect x={-1200} y={850} width={4300} height={600} fill="#2a1e18" />
    </Par>
    <rect x={-1000} y={-600} width={4000} height={2400} fill="#ffb05a" opacity={0.06} />
  </g>
);

export const District: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => (
  <g>
    <Par cam={cam} d={0}><Sky tod="night" /></Par>
    <Par cam={cam} d={0.35}>
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <rect x={-800 + i * 380} y={260 - rnd(i) * 80} width={340} height={700} fill={["#3a1420", "#2a1018", "#4a1a24"][i % 3]} stroke={OUT} strokeWidth={5} />
          {Array.from({ length: 3 }, (_, j) => <rect key={j} x={-770 + i * 380 + j * 105} y={340 - rnd(i) * 80} width={80} height={120} fill="#ff9a5a" opacity={0.8} stroke={OUT} strokeWidth={3} />)}
          <path d={`M ${-830 + i * 380} ${260 - rnd(i) * 80} L ${-630 + i * 380} ${180 - rnd(i) * 80} L ${-430 + i * 380} ${260 - rnd(i) * 80}`} fill="#120a10" stroke={OUT} strokeWidth={4} />
        </g>
      ))}
    </Par>
    <Par cam={cam} d={0.6}>
      {Array.from({ length: 22 }, (_, i) => (
        <g key={i} transform={`translate(${-800 + i * 220} ${320 + Math.sin(i) * 30 + Math.sin(t * 2 + i) * 4})`}>
          <circle r={60} fill="url(#g_glowR)" opacity={0.6} />
          <ellipse rx={20} ry={28} fill="#e8302a" stroke={OUT} strokeWidth={3} />
        </g>
      ))}
      <rect x={-1400} y={900} width={4700} height={900} fill="#1a0e14" />
    </Par>
    <rect x={-1000} y={-600} width={4000} height={2400} fill="#ff2a4a" opacity={0.06} />
  </g>
);

export const Village: React.FC<{ cam: Cam; t: number; tod: Tod }> = ({ cam, t, tod }) => (
  <g>
    <SnowMountains cam={cam} tod={tod} t={t} trees spring ground={900} />
    <Par cam={cam} d={0.6}>
      {[-300, 300, 900, 1500, 2100].map((x, i) => (
        <g key={x} transform={`translate(${x} 880)`}>
          <rect x={-120} y={-140} width={240} height={140} fill="#7a5a40" stroke={OUT} strokeWidth={5} />
          <path d="M -160 -130 L 0 -230 L 160 -130 Z" fill="#3a3236" stroke={OUT} strokeWidth={5} />
          <rect x={-40} y={-100} width={60} height={100} fill="#2a1a14" />
          {[0, 1].map((k) => <circle key={k} cx={40 + k * 30} cy={-260 - ((t * 40 + k * 60 + i * 30) % 160)} r={30 + ((t * 40 + k * 60) % 160) * 0.2} fill="#fff" opacity={0.35 - ((t * 40 + k * 60) % 160) / 500} filter="url(#f_blur10)" />)}
        </g>
      ))}
    </Par>
  </g>
);

export const Castle: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => (
  <g>
    <rect x={-1200} y={-800} width={4320} height={2700} fill="#1a0e0c" />
    {[0.15, 0.4, 0.7].map((d, li) => (
      <Par key={li} cam={cam} d={d}>
        <g transform={`translate(960 540) rotate(${(li - 1) * 12 + Math.sin(t * 0.2 + li) * 3}) translate(-960 -540)`} opacity={0.5 + li * 0.25}>
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i} transform={`translate(${-900 + i * 420} ${li * 260 - 200 + (i % 2) * 200})`}>
              <rect width={360} height={240} fill="#e8c890" stroke="#3a1a0a" strokeWidth={8} opacity={0.85} />
              {[1, 2, 3].map((k) => <path key={k} d={`M ${k * 90} 0 V 240`} stroke="#3a1a0a" strokeWidth={4} />)}
              <path d="M 0 120 H 360" stroke="#3a1a0a" strokeWidth={4} />
              <rect y={240} width={360} height={40} fill="#4a2414" />
            </g>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M ${-600 + i * 520} ${700 + li * 60} l 60 -40 l 60 0 l 60 -40 l 60 0 l 60 -40`} stroke="#6a3a1a" strokeWidth={14} fill="none" />
          ))}
        </g>
      </Par>
    ))}
    <rect x={-1000} y={-600} width={4000} height={2400} fill="#ff7a2a" opacity={0.07} />
  </g>
);

export const CityNight: React.FC<{ cam: Cam; t: number; dawn?: number; ruined?: boolean }> = ({ cam, t, dawn = 0, ruined }) => (
  <g>
    <Town cam={cam} t={t} tod="night" brick />
    {dawn > 0 ? <Par cam={cam} d={0}><g opacity={dawn * 0.85}><Sky tod="dawn" id="cdawn" /></g></Par> : null}
    {ruined ? (
      <Par cam={cam} d={0.7}>
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M ${-400 + i * 380} 880 l 40 -120 l 60 40 l 30 -90 l 50 170 Z`} fill="#0e0a0e" />)}
      </Par>
    ) : null}
  </g>
);

export const Void: React.FC<{ t: number; c?: string; c2?: string }> = ({ t, c = "#050208", c2 = "#5a0010" }) => (
  <g>
    <defs>
      <radialGradient id="voidg" cx=".5" cy=".55" r=".75">
        <stop offset="0" stopColor={c2} /><stop offset="1" stopColor={c} />
      </radialGradient>
    </defs>
    <rect x={-1200} y={-800} width={4320} height={2700} fill="url(#voidg)" />
    {Array.from({ length: 30 }, (_, i) => (
      <circle key={i} cx={(rnd(i) * 1920 + t * 20 * (rnd(i, 3) - 0.5)) % 1920} cy={(rnd(i, 2) * 1080 - t * 30 * rnd(i, 4) + 1080) % 1080} r={2 + rnd(i, 5) * 4} fill="#ff4a4a" opacity={0.3 + rnd(i, 6) * 0.4} />
    ))}
  </g>
);

export const Modern: React.FC<{ cam: Cam; t: number }> = ({ cam }) => (
  <g>
    <Par cam={cam} d={0}><Sky tod="day" /></Par>
    <Par cam={cam} d={0.3}>
      {Array.from({ length: 16 }, (_, i) => {
        const h = 300 + rnd(i, 8) * 420;
        return (
          <g key={i}>
            <rect x={-800 + i * 260} y={880 - h} width={220} height={h} fill={["#9aaabb", "#8a9aab", "#aab8c6"][i % 3]} stroke={OUT} strokeWidth={4} />
            {Array.from({ length: Math.floor(h / 60) }, (_, j) => <rect key={j} x={-780 + i * 260} y={900 - h + j * 60} width={180} height={20} fill="#dfe8ef" opacity={0.7} />)}
          </g>
        );
      })}
    </Par>
    <Par cam={cam} d={0.85}><rect x={-1400} y={880} width={4700} height={900} fill="#8a8a8a" /><rect x={-1400} y={880} width={4700} height={20} fill="#6a6a6a" /></Par>
  </g>
);

export const Paper: React.FC<{ c?: string }> = ({ c = "#efe6d4" }) => <rect x={-1200} y={-800} width={4320} height={2700} fill={c} />;
