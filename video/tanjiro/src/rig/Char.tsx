import React, { useId } from "react";
import { CHARS, CharDef } from "./chars";
import { HairLayer, HairBehind } from "./hair";

// ---------------------------------------------------------------------------
// 2D cut-out rig, anime proportions (~6 heads). Local units: feet at (0,0),
// figure ≈ 640 tall. Angles in degrees: 0 = pointing down, +90 = pointing to
// the facing side. Cel shading: one hard shadow tone, key light from top-left.
// ---------------------------------------------------------------------------
export type Expr =
  | "neutral" | "angry" | "sad" | "shock" | "smile" | "happy" | "closed"
  | "cry" | "shout" | "pain" | "soft" | "fierce";

export type Pose = {
  x?: number; y?: number; s?: number; face?: 1 | -1; rot?: number;
  lean?: number; head?: number; turn?: number; gaze?: number;
  aR?: [number, number]; aL?: [number, number];
  lR?: [number, number]; lL?: [number, number];
  expr?: Expr; blink?: number; talk?: number;
  sword?: "R" | "L" | "none"; sw?: number; swordLen?: number; glow?: string;
  op?: number; box?: boolean; demon?: boolean; mark?: boolean; patch?: boolean;
  mask?: boolean; sil?: string; breath?: number; tears?: boolean; blood?: boolean;
  rim?: string; basket?: boolean; bob?: number; muzzle?: boolean; silEye?: string;
};

export const OUT = "#15100e";
const SH = "rgba(40,14,40,0.24)";
type P = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const dir = (a: number, l: number): P => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
const add = (p: P, q: P): P => [p[0] + q[0], p[1] + q[1]];
const lerp = (p: P, q: P, k: number): P => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
const rotP = (p: P, a: number): P => {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
const f2 = (p: P) => p[0].toFixed(1) + " " + p[1].toFixed(1);

function capsule(p1: P, p2: P, w1: number, w2: number) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const L = Math.hypot(dx, dy) || 0.001;
  const nx = -dy / L, ny = dx / L;
  const r1 = w1 / 2, r2 = w2 / 2;
  const a: P = [p1[0] + nx * r1, p1[1] + ny * r1];
  const b: P = [p2[0] + nx * r2, p2[1] + ny * r2];
  const c: P = [p2[0] - nx * r2, p2[1] - ny * r2];
  const d: P = [p1[0] - nx * r1, p1[1] - ny * r1];
  return `M ${f2(a)} L ${f2(b)} A ${r2} ${r2} 0 0 0 ${f2(c)} L ${f2(d)} A ${r1} ${r1} 0 0 0 ${f2(a)} Z`;
}

const Seg: React.FC<{ a: P; b: P; w1: number; w2: number; fill: string; sil?: string; shadow?: boolean; ow?: number }> = ({ a, b, w1, w2, fill, sil, shadow = true, ow = 5 }) => {
  const d = capsule(a, b, w1, w2);
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L;
  if (nx < 0) { nx = -nx; ny = -ny; }
  const off = (w: number): P => [nx * w * 0.27, ny * w * 0.27];
  return (
    <>
      <path d={d} fill={sil || fill} stroke={sil || OUT} strokeWidth={ow} strokeLinejoin="round" />
      {shadow && !sil ? <path d={capsule(add(a, off(w1)), add(b, off(w2)), w1 * 0.42, w2 * 0.42)} fill={SH} /> : null}
    </>
  );
};

// --------------------------------------------------------------- face ----
const Eye: React.FC<{ x: number; side: -1 | 1; c: CharDef; p: Pose; sq: number; demon: boolean; uid: string }> = ({ x, side, c, p, sq, demon, uid }) => {
  const e = p.expr || "neutral";
  const bl = p.blink || 0;
  const y = 10;
  const w = 13 * sq;
  if (e === "happy" || e === "closed" || bl > 0.6) {
    const up = e === "happy";
    return (
      <path d={up ? `M ${x - w} ${y + 5} Q ${x} ${y - 9} ${x + w} ${y + 5}` : `M ${x - w} ${y + 1} Q ${x} ${y + 9} ${x + w} ${y + 1}`}
        stroke={OUT} strokeWidth={4.5} fill="none" strokeLinecap="round" />
    );
  }
  const narrow = e === "angry" || e === "fierce" || e === "shout" ? 6 : e === "pain" ? 8 : e === "soft" ? 4 : 0;
  const top = y - 13 + narrow;
  const bot = y + 13;
  const innerDrop = e === "angry" || e === "fierce" || e === "shout" ? 4 : e === "sad" || e === "cry" ? -3 : 0;
  const xi = x - side * w, xo = x + side * w;
  const shape = `M ${xi} ${y + 2 + innerDrop * 0.5} C ${xi} ${top - 1 + innerDrop} ${xo} ${top - 3} ${xo} ${y - 1} C ${xo} ${bot} ${xi} ${bot + 1} ${xi} ${y + 2 + innerDrop * 0.5} Z`;
  const ir = e === "shock" ? 6.5 : 9.2;
  const gz = (p.gaze || 0) * 4;
  const col = demon ? c.demonEye || "#e3122b" : c.eye;
  const id = `${uid}e${side}`;
  return (
    <g>
      <defs>
        <clipPath id={id + "c"}><path d={shape} /></clipPath>
        <linearGradient id={id + "g"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120808" />
          <stop offset="0.38" stopColor={col} />
          <stop offset="1" stopColor={col} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path d={shape} fill="#fffaf6" />
      <g clipPath={`url(#${id}c)`}>
        <path d={`M ${xi} ${top - 4} L ${xo} ${top - 4} L ${xo} ${top + 5} Q ${x} ${top + 2} ${xi} ${top + 6} Z`} fill="#c9b8c8" opacity={0.6} />
        <ellipse cx={x + gz} cy={y + 3} rx={ir * sq} ry={ir * 1.32} fill={`url(#${id}g)`} />
        <ellipse cx={x + gz} cy={y + 3} rx={ir * sq} ry={ir * 1.32} fill="none" stroke="#120808" strokeWidth={1.5} opacity={0.6} />
        {demon ? (
          <ellipse cx={x + gz} cy={y + 3} rx={1.9} ry={ir * 1.05} fill="#100006" />
        ) : (
          <ellipse cx={x + gz} cy={y + 4} rx={3.8 * sq} ry={5.6} fill="#140808" />
        )}
        <path d={`M ${x + gz - ir * sq * 0.7} ${y + 9} Q ${x + gz} ${y + 15} ${x + gz + ir * sq * 0.7} ${y + 9}`} stroke="#fff" strokeWidth={2} opacity={0.35} fill="none" />
        <ellipse cx={x + gz - 3.4 * sq} cy={y - 2} rx={3.4} ry={4.4} fill="#fff" />
        <circle cx={x + gz + 3.4 * sq} cy={y + 8} r={1.7} fill="#fff" opacity={0.9} />
      </g>
      <path d={`M ${xi - side * 1} ${y + 3 + innerDrop * 0.5} C ${xi} ${top - 2 + innerDrop} ${xo} ${top - 4} ${xo + side * 3} ${y - 1}`} stroke={OUT} strokeWidth={4.2} fill="none" strokeLinecap="round" />
      <path d={`M ${x} ${top - 2} C ${x + side * w * 0.6} ${top - 3} ${xo + side * 2} ${top} ${xo + side * 5} ${y + 3} L ${xo + side * 1} ${y - 2} Z`} fill={OUT} />
      {c.lashes ? <path d={`M ${xo + side * 1} ${y - 4} l ${side * 6} -5 M ${xo + side * 2} ${y + 1} l ${side * 6} -2`} stroke={OUT} strokeWidth={2.4} strokeLinecap="round" /> : null}
      <path d={`M ${x + side * w * 0.1} ${bot + 1} Q ${x + side * w * 0.7} ${bot} ${xo} ${y + 5}`} stroke={OUT} strokeWidth={1.8} fill="none" opacity={0.75} />
      <path d={`M ${x - side * w * 0.3} ${top - 7} Q ${x + side * w * 0.5} ${top - 9} ${xo + side * 2} ${top - 2}`} stroke={OUT} strokeWidth={1.4} fill="none" opacity={0.5} />
      {bl > 0.15 ? <rect x={x - w - 3} y={top - 8} width={w * 2 + 6} height={(bot - top + 10) * bl} fill={c.skin} /> : null}
    </g>
  );
};

const Face: React.FC<{ c: CharDef; p: Pose; uid: string }> = ({ c, p, uid }) => {
  const e = p.expr || "neutral";
  const turn = p.turn || 0;
  const demon = !!(p.demon || c.alwaysDemon);
  const fx = turn * 8;
  const sqL = 1 - Math.max(0, turn) * 0.28, sqR = 1 + Math.min(0, turn) * 0.28;
  const talk = p.talk || 0;
  const my = 36;
  let mouth: React.ReactNode;
  if (e === "shout" || e === "shock" || talk > 0.08) {
    const o = e === "shout" ? 14 : e === "shock" ? 8 : 3 + talk * 7;
    const w = e === "shout" ? 10 : 7;
    mouth = (
      <g>
        <path d={`M ${fx - w} ${my - 1} Q ${fx} ${my - 4} ${fx + w} ${my - 1} Q ${fx + w * 0.8} ${my + o} ${fx} ${my + o} Q ${fx - w * 0.8} ${my + o} ${fx - w} ${my - 1} Z`} fill="#6a1a1e" stroke={OUT} strokeWidth={2.6} strokeLinejoin="round" />
        <path d={`M ${fx - w * 0.6} ${my + o - 3} Q ${fx} ${my + o - 7} ${fx + w * 0.6} ${my + o - 3}`} fill="#d86a6a" />
        {demon || c.fangs ? <path d={`M ${fx - w + 2} ${my - 1} l 2.5 6 l 2.5 -6 M ${fx + w - 7} ${my - 1} l 2.5 6 l 2.5 -6`} fill="#fff" /> : null}
      </g>
    );
  } else if (e === "happy") {
    mouth = (
      <g>
        <path d={`M ${fx - 10} ${my - 3} Q ${fx} ${my - 1} ${fx + 10} ${my - 3} Q ${fx + 6} ${my + 10} ${fx} ${my + 10} Q ${fx - 6} ${my + 10} ${fx - 10} ${my - 3} Z`} fill="#6a1a1e" stroke={OUT} strokeWidth={2.6} strokeLinejoin="round" />
        <path d={`M ${fx - 5} ${my + 7} Q ${fx} ${my + 3} ${fx + 5} ${my + 7}`} fill="#d86a6a" />
      </g>
    );
  } else if (e === "smile" || e === "soft") {
    mouth = <path d={`M ${fx - 8} ${my} Q ${fx} ${my + 6} ${fx + 8} ${my}`} stroke={OUT} strokeWidth={3} fill="none" strokeLinecap="round" />;
  } else if (e === "sad" || e === "cry" || e === "pain") {
    mouth = <path d={`M ${fx - 7} ${my + 4} Q ${fx} ${my - 2} ${fx + 7} ${my + 4}`} stroke={OUT} strokeWidth={3} fill="none" strokeLinecap="round" />;
  } else if (e === "angry" || e === "fierce") {
    mouth = (
      <g>
        <path d={`M ${fx - 9} ${my + 1} Q ${fx} ${my - 1} ${fx + 9} ${my + 1} L ${fx + 7} ${my + 5} Q ${fx} ${my + 4} ${fx - 7} ${my + 5} Z`} fill="#fff" stroke={OUT} strokeWidth={2.4} strokeLinejoin="round" />
        <path d={`M ${fx - 7} ${my + 3} H ${fx + 7}`} stroke={OUT} strokeWidth={1} opacity={0.6} />
      </g>
    );
  } else {
    mouth = <path d={`M ${fx - 5} ${my} Q ${fx} ${my + 1.5} ${fx + 5} ${my}`} stroke={OUT} strokeWidth={2.8} fill="none" strokeLinecap="round" />;
  }
  return (
    <g>
      {c.blush ? (
        <g opacity={0.55}>
          <ellipse cx={fx - 28} cy={26} rx={9} ry={4.5} fill="#ff9a9a" opacity={0.5} />
          <ellipse cx={fx + 28} cy={26} rx={9} ry={4.5} fill="#ff9a9a" opacity={0.5} />
          <path d={`M ${fx - 33} 28 l 3 -5 M ${fx - 27} 28 l 3 -5 M ${fx + 25} 28 l 3 -5 M ${fx + 31} 28 l 3 -5`} stroke="#e07a7a" strokeWidth={1.4} />
        </g>
      ) : null}
      {p.patch ? (
        <g>
          <path d={`M ${fx - 36} -4 L ${fx - 3} -2 L ${fx - 5} 24 L ${fx - 34} 22 Z`} fill="#f4efe6" stroke={OUT} strokeWidth={3} />
          <path d={`M -44 -8 L ${fx - 36} -4 M ${fx - 3} -1 L 44 -10`} stroke="#f4efe6" strokeWidth={5} />
        </g>
      ) : (
        <Eye x={fx - 19} side={-1} c={c} p={p} sq={sqL} demon={demon} uid={uid} />
      )}
      <Eye x={fx + 19} side={1} c={c} p={p} sq={sqR} demon={demon} uid={uid} />
      <path d={`M ${fx + 3} 20 L ${fx + 1} 27 L ${fx + 4} 27`} stroke="#c08070" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {mouth}
      {p.tears || e === "cry" ? (
        <g opacity={0.9}>
          <path d={`M ${fx - 20} 24 q -4 12 -2 26`} stroke="#bfe6ff" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={`M ${fx + 20} 24 q 4 12 2 26`} stroke="#bfe6ff" strokeWidth={4} fill="none" strokeLinecap="round" />
          <circle cx={fx - 22} cy={52} r={3} fill="#bfe6ff" /><circle cx={fx + 22} cy={52} r={3} fill="#bfe6ff" />
        </g>
      ) : null}
      {demon && c.veins ? (
        <g stroke="#b81f55" strokeWidth={2.2} fill="none" opacity={0.9} strokeLinecap="round">
          <path d="M -42 0 l 7 5 l -1 8 l 6 5 M -42 0 l -1 9 M -38 -18 l 6 6" />
          <path d="M 42 0 l -7 5 l 1 8 l -6 5 M 38 -18 l -6 6" />
        </g>
      ) : null}
    </g>
  );
};

const Brows: React.FC<{ c: CharDef; p: Pose }> = ({ c, p }) => {
  const e = p.expr || "neutral";
  const fx = (p.turn || 0) * 8;
  const inner = e === "angry" || e === "shout" || e === "fierce" ? 7 : e === "sad" || e === "cry" || e === "pain" ? -6 : e === "shock" ? -4 : 0;
  const lift = e === "shock" ? -5 : e === "soft" ? -1 : 0;
  const b = (side: -1 | 1) => {
    const bx = fx + side * 19;
    return <path d={`M ${bx - side * 11} ${-10 + lift + inner} Q ${bx} ${-15 + lift} ${bx + side * 12} ${-11 + lift}`} stroke={c.brow || OUT} strokeWidth={c.thickBrow ? 5.5 : 3.6} fill="none" strokeLinecap="round" />;
  };
  return <g>{b(-1)}{b(1)}</g>;
};

// --------------------------------------------------------------- head ----
const FACE_D = "M -44 -12 C -45 -50 -24 -62 0 -62 C 24 -62 45 -50 44 -12 C 43 10 34 28 19 40 C 11 47 4 51 0 51 C -4 51 -11 47 -19 40 C -34 28 -43 10 -44 -12 Z";

const Head: React.FC<{ c: CharDef; p: Pose; t: number; uid: string }> = ({ c, p, t, uid }) => {
  const gid = `${uid}hg`;
  const sil = p.sil;
  const h = c.hair;
  const masked = !!(p.mask && c.mask);
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={h.c1} />
          <stop offset={h.mid ?? 0.55} stopColor={h.c1} />
          <stop offset="1" stopColor={h.c2} />
        </linearGradient>
        <clipPath id={`${uid}fc`}><path d={FACE_D} /></clipPath>
      </defs>
      {c.special === "boar" ? (
        <BoarHead sil={sil} />
      ) : (
        <>
          <HairLayer h={h} layer="back" gid={gid} sil={sil} t={t} />
          <ellipse cx={-43} cy={8} rx={7} ry={11} fill={sil || c.skin} stroke={sil || OUT} strokeWidth={3.5} />
          <ellipse cx={43} cy={8} rx={7} ry={11} fill={sil || c.skin} stroke={sil || OUT} strokeWidth={3.5} />
          <path d={FACE_D} fill={sil || c.skin} stroke={sil || OUT} strokeWidth={4.5} />
          {!sil ? (
            <g clipPath={`url(#${uid}fc)`}>
              <path d="M 30 -40 C 44 -10 40 20 10 52 L 60 52 L 60 -40 Z" fill={SH} />
              {(h.bangLen ?? 0) >= 40 ? <path d="M -50 -40 Q -30 -20 -16 -30 Q 0 -14 14 -28 Q 30 -16 50 -38 L 50 -70 L -50 -70 Z" fill="#b8604a" opacity={0.28} /> : null}
            </g>
          ) : null}
          {!sil && !masked ? <Face c={c} p={p} uid={uid} /> : null}
          {sil && p.silEye ? (
            <g>
              <path d="M -30 6 L -8 12 L -30 14 Z" fill={p.silEye} />
              <path d="M 30 6 L 8 12 L 30 14 Z" fill={p.silEye} />
            </g>
          ) : null}
          {!sil && c.scar ? <path d="M -30 -40 q 8 -9 17 -3 q 6 7 15 0" stroke="#9e2b26" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.9} /> : null}
          {!sil && (p.mark || c.mark) ? (
            <g fill="#c4261a" opacity={0.95}>
              <path d="M -38 -34 C -36 -48 -24 -54 -14 -50 C -22 -46 -22 -40 -14 -38 C -6 -46 6 -46 8 -36 C 0 -38 -4 -32 2 -28 C -8 -24 -16 -30 -18 -26 C -26 -22 -34 -26 -38 -34 Z" />
              <path d="M -44 -14 C -40 -22 -34 -22 -30 -18 C -34 -16 -36 -10 -40 -6 Z" />
            </g>
          ) : null}
          {!sil ? <Markings c={c} /> : null}
          <HairLayer h={h} layer="front" gid={gid} sil={sil} t={t} />
          {!sil && !masked ? <Brows c={c} p={p} /> : null}
          {!sil && c.horn && (p.demon || c.alwaysDemon) ? (
            <path d="M 18 -66 q 14 -22 6 -44 q 18 18 8 46 Z" fill="#f4e7d7" stroke={OUT} strokeWidth={3.5} />
          ) : null}
          {!sil ? <Accessories c={c} p={p} /> : null}
        </>
      )}
    </g>
  );
};

const Markings: React.FC<{ c: CharDef }> = ({ c }) => (
  <>
    {c.scars ? <path d="M -36 -26 L -8 10 M 28 -18 L 40 22 M -18 28 L 8 40" stroke="#b5665a" strokeWidth={3.5} strokeLinecap="round" /> : null}
    {c.diseased ? <path d="M -42 -6 C -36 -54 36 -54 42 -6 C 28 -16 18 -2 0 -14 C -18 -2 -28 -16 -42 -6 Z" fill="#5b3a6e" opacity={0.75} /> : null}
    {c.tattoo ? (
      <g stroke="#2c3fa0" strokeWidth={3.5} fill="none" strokeLinecap="round">
        <path d="M -42 -14 h 22 M -42 -4 h 15 M 42 -14 h -22 M 42 -4 h -15 M -12 -46 v 16 M 12 -46 v 16 M -40 20 h 12 M 40 20 h -12" />
      </g>
    ) : null}
  </>
);

const Earring: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <line x1={x} y1={16} x2={x} y2={23} stroke={OUT} strokeWidth={2} />
    <rect x={x - 6} y={23} width={12} height={27} rx={2} fill="#fbf6ea" stroke={OUT} strokeWidth={2.2} />
    <circle cx={x} cy={33} r={4.4} fill="#d6262c" />
    <path d={`M ${x - 5} 39 L ${x} 33 L ${x + 5} 39 M ${x} 33 L ${x} 49 M ${x - 5} 47 L ${x} 33 L ${x + 5} 47`} stroke="#bfb39a" strokeWidth={1.3} />
  </g>
);

const Accessories: React.FC<{ c: CharDef; p: Pose }> = ({ c, p }) => {
  const els: React.ReactNode[] = [];
  if (c.earrings) els.push(<Earring key="e1" x={-45} />, <Earring key="e2" x={45} />);
  if (c.muzzle && p.muzzle !== false) {
    els.push(
      <g key="mz">
        <path d="M -46 24 L -32 30 M 32 30 L 46 24" stroke="#6a3a22" strokeWidth={3} />
        <rect x={-33} y={25} width={66} height={18} rx={8} fill={c.muzzle} stroke={OUT} strokeWidth={3} />
        <path d="M -17 26 v 16 M 17 26 v 16" stroke="#000" strokeWidth={2} opacity={0.3} />
        <path d="M -29 29 H 29" stroke="#fff" strokeWidth={2.5} opacity={0.45} />
      </g>
    );
  }
  if (c.ribbon) {
    els.push(
      <g key="rb" transform="translate(36 -56) rotate(18)">
        <path d="M 0 0 C -10 -14 -24 -14 -22 0 C -24 12 -10 12 0 0 Z M 0 0 C 10 -14 24 -14 22 0 C 24 12 10 12 0 0 Z" fill={c.ribbon} stroke={OUT} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M 0 0 L -8 18 M 0 0 L 8 18" stroke={c.ribbon} strokeWidth={5} strokeLinecap="round" />
        <circle r={4.5} fill={c.ribbon} stroke={OUT} strokeWidth={2.2} />
      </g>
    );
  }
  if (c.butterfly) {
    els.push(
      <g key="bf" transform="translate(-40 -48) rotate(-20)">
        <path d="M 0 0 C -16 -20 -28 -6 -13 4 C -26 13 -9 20 0 6 C 9 20 26 13 13 4 C 28 -6 16 -20 0 0 Z" fill="#cbb0f0" stroke={OUT} strokeWidth={2.2} />
        <path d="M -16 -8 Q -8 -2 -3 0 M 16 -8 Q 8 -2 3 0" stroke="#7a5aa8" strokeWidth={1.5} fill="none" />
      </g>
    );
  }
  if (c.headband) {
    els.push(
      <g key="hb">
        <path d="M -48 -30 Q 0 -50 48 -30" stroke={c.headband} strokeWidth={8} fill="none" />
        <circle cx={-26} cy={-38} r={4} fill="#e84a8a" /><circle cx={0} cy={-41} r={4.5} fill="#4ac0e8" /><circle cx={26} cy={-38} r={4} fill="#e8d24a" />
      </g>
    );
  }
  if (c.hat) {
    els.push(
      <g key="hat">
        <path d="M -42 -56 C -44 -108 44 -108 42 -56 Z" fill={c.hat} stroke={OUT} strokeWidth={4} />
        <path d="M -42 -66 C -20 -60 20 -60 42 -66 L 42 -57 C 20 -52 -20 -52 -42 -57 Z" fill="#20161a" />
        <path d="M -78 -54 C -60 -66 60 -66 78 -54 C 60 -44 -60 -44 -78 -54 Z" fill={c.hat} stroke={OUT} strokeWidth={4} />
        <path d="M 10 -100 Q 30 -92 34 -70" stroke={OUT} strokeWidth={2} opacity={0.3} fill="none" />
      </g>
    );
  }
  if (c.mask === "fox") {
    els.push(p.mask ? <FoxMask key="fm" x={0} y={4} s={1} crack={c.id === "sabito"} /> : <FoxMask key="fm" x={-36} y={-52} s={0.55} rot={-28} />);
  }
  if (c.mask === "tengu" && p.mask !== false) {
    els.push(
      <g key="tg">
        <path d="M -46 -36 C -46 -66 46 -66 46 -36 L 44 16 C 36 46 -36 46 -44 16 Z" fill="#c8312c" stroke={OUT} strokeWidth={4} />
        <path d="M -38 -16 q 16 -16 30 -2 M 38 -16 q -16 -16 -30 -2" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" />
        <ellipse cx={-20} cy={-4} rx={5} ry={3} fill="#120808" /><ellipse cx={20} cy={-4} rx={5} ry={3} fill="#120808" />
        <path d="M -7 -2 C -6 16 4 28 26 36 C 12 22 9 10 7 -2 Z" fill="#a8221e" stroke={OUT} strokeWidth={3} />
        <path d="M -26 32 q 26 -9 52 0" stroke={OUT} strokeWidth={3} fill="none" />
        <path d="M 20 -50 C 40 -30 44 0 38 24 C 30 38 20 42 14 42 C 30 10 34 -20 20 -50 Z" fill={SH} />
      </g>
    );
  }
  if (c.mask === "hyottoko" && p.mask !== false) {
    els.push(
      <g key="hy">
        <ellipse cx={0} cy={0} rx={46} ry={56} fill="#f2e6d0" stroke={OUT} strokeWidth={4} />
        <path d="M -30 -12 q 10 -10 20 0 M 10 -16 q 10 -12 22 -2" stroke={OUT} strokeWidth={4} fill="none" />
        <circle cx={-20} cy={-6} r={4} fill={OUT} /><circle cx={20} cy={-10} r={6} fill={OUT} />
        <path d="M 4 24 q 16 -8 24 4 q -4 12 -18 8 Z" fill="#e9a8a0" stroke={OUT} strokeWidth={3} />
        <circle cx={-26} cy={18} r={8} fill="#ff9a9a" opacity={0.5} />
        <path d="M -40 -40 q 10 -16 26 -10" stroke={OUT} strokeWidth={3} fill="none" />
      </g>
    );
  }
  return <>{els}</>;
};

export const FoxMask: React.FC<{ x: number; y: number; s: number; rot?: number; crack?: boolean }> = ({ x, y, s, rot = 0, crack }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -40 -28 L -36 -60 L -14 -42 C -5 -45 5 -45 14 -42 L 36 -60 L 40 -28 C 46 0 31 28 0 44 C -31 28 -46 0 -40 -28 Z" fill="#fbf7ee" stroke={OUT} strokeWidth={4} />
    <path d="M -33 -50 L -22 -42 L -31 -34 Z M 33 -50 L 22 -42 L 31 -34 Z" fill="#d23a3a" />
    <path d="M -28 -6 q 9 -9 18 0 M 28 -6 q -9 -9 -18 0" stroke="#d23a3a" strokeWidth={3.6} fill="none" />
    <circle cx={-17} cy={-4} r={2.8} fill="#2a1a1a" /><circle cx={17} cy={-4} r={2.8} fill="#2a1a1a" />
    <path d="M -13 -24 a 4.5 4.5 0 1 0 9 0 a 4.5 4.5 0 1 0 -9 0 M 4 -24 a 4.5 4.5 0 1 0 9 0 a 4.5 4.5 0 1 0 -9 0" fill="#d23a3a" />
    <path d="M -36 10 C -18 28 18 28 36 10 C 31 25 16 38 0 44 C -16 38 -31 25 -36 10 Z" fill="#5aa6d6" opacity={0.85} />
    <path d="M -4 20 L 0 27 L 4 20" stroke="#d23a3a" strokeWidth={2.6} fill="none" />
    {crack ? <path d="M -5 -42 L 4 -22 L -5 -7 L 7 11 L 0 42" stroke={OUT} strokeWidth={3.5} fill="none" /> : null}
  </g>
);

const BoarHead: React.FC<{ sil?: string }> = ({ sil }) => {
  const f = sil || "#dcd8d2";
  const fur = (x: number, y: number, a: number, l: number, k: number) => {
    const tip: P = [x + Math.sin(rad(a)) * l, y - Math.cos(rad(a)) * l];
    return <path key={k} d={`M ${x - 9} ${y} Q ${(x + tip[0]) / 2 - 6} ${(y + tip[1]) / 2} ${tip[0]} ${tip[1]} Q ${(x + tip[0]) / 2 + 6} ${(y + tip[1]) / 2} ${x + 9} ${y} Z`} fill={sil || "#8f8b86"} stroke={sil || OUT} strokeWidth={3} />;
  };
  return (
    <g>
      {[-120, -95, -70, 70, 95, 120, 140, -140].map((a, i) => fur(Math.sin(rad(a)) * 52, -10 - Math.cos(rad(a)) * 56, a, 26, i))}
      <path d="M -62 26 C -72 -40 -46 -88 0 -88 C 46 -88 72 -40 62 26 C 46 50 -46 50 -62 26 Z" fill={f} stroke={sil || OUT} strokeWidth={5} />
      {!sil ? (
        <>
          <path d="M -54 -54 L -46 -100 L -22 -70 Z M 54 -54 L 46 -100 L 22 -70 Z" fill="#dcd8d2" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
          <path d="M -45 -68 L -42 -90 L -31 -73 Z M 45 -68 L 42 -90 L 31 -73 Z" fill="#f1a1b5" />
          <path d="M -56 -30 C -36 -54 36 -54 56 -30 C 40 -40 -40 -40 -56 -30 Z" fill="#7a7671" />
          <path d="M 20 -80 C 50 -60 66 -20 60 24 C 50 40 40 44 30 46 C 50 10 46 -40 20 -80 Z" fill={SH} />
          <circle cx={-24} cy={-14} r={13} fill="#8fe0f4" stroke={OUT} strokeWidth={3.5} />
          <circle cx={24} cy={-14} r={13} fill="#8fe0f4" stroke={OUT} strokeWidth={3.5} />
          <circle cx={-24} cy={-14} r={5} fill="#13304a" /><circle cx={24} cy={-14} r={5} fill="#13304a" />
          <circle cx={-28} cy={-18} r={3} fill="#fff" /><circle cx={20} cy={-18} r={3} fill="#fff" />
          <ellipse cx={0} cy={22} rx={27} ry={18} fill="#cdaea6" stroke={OUT} strokeWidth={4} />
          <ellipse cx={-9} cy={22} rx={4} ry={6} fill="#4a2a2a" /><ellipse cx={9} cy={22} rx={4} ry={6} fill="#4a2a2a" />
          <path d="M -30 38 q -6 10 -2 18 M 30 38 q 6 10 2 18" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      ) : null}
    </g>
  );
};

// --------------------------------------------------------------- sword ---
export const Sword: React.FC<{ len?: number; blade: string; guard?: string; glow?: string; sil?: string; jag?: boolean }> = ({ len = 260, blade, guard = "#2b2b2b", glow, sil, jag }) => {
  const L = len;
  const edge = jag
    ? `M -5 -40 ${Array.from({ length: 12 }, (_, i) => `L ${i % 2 ? -10 : -5} ${-40 - (i + 1) * (L / 12)}`).join(" ")} L 2 ${-L - 10} L 6 -40 Z`
    : `M -5 -40 Q -7 ${-L * 0.6} -4 ${-L + 18} Q -2 ${-L - 4} 5 ${-L - 12} Q 8 ${-L * 0.5} 6 -40 Z`;
  return (
    <g>
      {glow ? <path d={`M 0 -40 L 0 ${-L}`} stroke={glow} strokeWidth={36} strokeLinecap="round" opacity={0.4} filter="url(#f_blur10)" /> : null}
      <path d={edge} fill={sil || blade} stroke={sil || OUT} strokeWidth={3.2} strokeLinejoin="round" />
      {!sil ? <path d={`M 3 -46 Q 4 ${-L * 0.6} 2 ${-L + 6}`} stroke="#fff" strokeWidth={2} opacity={0.55} fill="none" /> : null}
      <ellipse cx={0} cy={-38} rx={17} ry={6} fill={sil || guard} stroke={sil || OUT} strokeWidth={3} />
      <rect x={-6} y={-34} width={12} height={50} rx={4} fill={sil || "#2a2f3a"} stroke={sil || OUT} strokeWidth={3} />
      {!sil ? <path d="M -6 -28 L 6 -20 M -6 -16 L 6 -8 M -6 -4 L 6 4 M -6 8 L 6 14" stroke="#e8e2d0" strokeWidth={2} /> : null}
    </g>
  );
};

// ----------------------------------------------------------------- hand ---
const Hand: React.FC<{ at: P; ang: number; skin: string; sil?: string; grip: boolean }> = ({ at, ang, skin, sil, grip }) => (
  <g transform={`translate(${at[0]} ${at[1]}) rotate(${-ang})`}>
    {grip ? (
      <rect x={-12} y={-4} width={24} height={26} rx={10} fill={sil || skin} stroke={sil || OUT} strokeWidth={3.5} />
    ) : (
      <>
        <path d="M -10 -2 C -13 10 -11 24 -2 28 C 6 30 12 22 11 10 C 11 4 9 -2 6 -4 Z" fill={sil || skin} stroke={sil || OUT} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M 8 2 C 16 6 17 14 12 16" fill={sil || skin} stroke={sil || OUT} strokeWidth={3} strokeLinecap="round" />
        {!sil ? <path d="M -4 18 L -3 26 M 2 18 L 3 26" stroke={OUT} strokeWidth={1.3} opacity={0.4} /> : null}
      </>
    )}
  </g>
);

// ----------------------------------------------------------------- body ---
export const Char: React.FC<{ id: string; p: Pose; t?: number }> = ({ id, p, t = 0 }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = CHARS[id];
  if (!c) return null;
  const sil = p.sil;
  const face = p.face ?? 1;
  const s = (p.s ?? 1) * (c.scale ?? 1);
  const br = Math.sin((p.breath ?? t) * 2.1) * 1.4;
  const lean = p.lean ?? 0;
  const hip: P = [0, -300];
  const kL = c.legLen ?? 1;
  const leg = (side: -1 | 1, a: [number, number]) => {
    const h0 = add(hip, [side * 22, 0]);
    const k = add(h0, dir(a[0], 150 * kL));
    const f = add(k, dir(a[0] + a[1], 146 * kL));
    return { h0, k, f };
  };
  const LL = leg(-1, p.lL ?? [-5, 2]);
  const LR = leg(1, p.lR ?? [5, -2]);
  const T = (q: P) => add(hip, rotP(q, lean));
  const shL = T([-47, -168 + br * 0.5]), shR = T([47, -168 + br * 0.5]);
  const headC = add(T([0, -192 + br * 0.4]), rotP([0, -50], lean + (p.head ?? 0) * 0.4));
  const arm = (sh: P, a: [number, number]) => {
    const e = add(sh, dir(a[0], 116));
    const w = add(e, dir(a[0] + a[1], 100));
    return { sh, e, w, fa: a[0] + a[1] };
  };
  const AL = arm(shL, p.aL ?? [-10, 14]);
  const AR = arm(shR, p.aR ?? [10, -14]);
  const o = c.outfit;
  const skin = sil || c.skin;
  const topFill = sil || o.top;
  const sleeve = sil || o.sleeve || o.haori || o.top;
  const swordHand = p.sword === "L" ? AL : p.sword === "R" ? AR : null;
  const st = (w = 5) => ({ stroke: sil || OUT, strokeWidth: w, strokeLinejoin: "round" as const });

  const legEls = (L: typeof LL) => {
    const longSkirt = o.skirt && o.skirt > 240;
    return (
      <g>
        {longSkirt ? null : o.bareLegs ? (
          <>
            <Seg a={L.h0} b={L.k} w1={34} w2={26} fill={skin} sil={sil} />
            <Seg a={L.k} b={L.f} w1={26} w2={18} fill={skin} sil={sil} />
          </>
        ) : (
          <>
            <Seg a={L.h0} b={L.k} w1={58} w2={46} fill={sil || o.pants} sil={sil} />
            <Seg a={L.k} b={L.f} w1={46} w2={o.wraps ? 30 : 36} fill={sil || o.pants} sil={sil} />
            {o.wraps && !sil ? (
              <g>
                <Seg a={lerp(L.k, L.f, 0.32)} b={L.f} w1={34} w2={27} fill="#f1ede4" />
                {[0.45, 0.6, 0.75, 0.9].map((k) => {
                  const q = lerp(L.k, L.f, k);
                  return <path key={k} d={`M ${q[0] - 14} ${q[1] - 4} L ${q[0] + 14} ${q[1] + 4}`} stroke="#b9b2a2" strokeWidth={1.6} />;
                })}
              </g>
            ) : null}
          </>
        )}
        <g transform={`translate(${L.f[0]} ${L.f[1]})`}>
          <path d="M -12 -6 C -12 -14 10 -14 22 -6 C 28 -2 26 6 18 6 L -12 6 Z" fill={sil || "#f4f0e6"} stroke={sil || OUT} strokeWidth={3.5} strokeLinejoin="round" />
          <rect x={-16} y={4} width={44} height={7} rx={3} fill={sil || "#5a3a24"} stroke={sil || OUT} strokeWidth={3} />
        </g>
      </g>
    );
  };

  const armEls = (A: typeof AL, which: "L" | "R") => {
    const wide = o.haori || o.wideSleeve;
    const grip = swordHand === A || (c.dual && which === "L" && !!p.sword && p.sword !== "none");
    let hang: React.ReactNode = null;
    if (wide) {
      const fd = dir(A.fa, 1);
      let nx = -fd[1], ny = fd[0];
      if (ny < 0 || (Math.abs(ny) < 0.25 && nx * (which === "L" ? -1 : 1) < 0)) { nx = -nx; ny = -ny; }
      const H = 46;
      const w0 = lerp(A.e, A.w, 0.72);
      const pts: P[] = [A.sh, A.e, w0, add(w0, [nx * H, ny * H + 6]), add(A.e, [nx * H * 0.95, ny * H * 0.95 + 10]), add(A.sh, [nx * 18, ny * 18 + 8])];
      hang = (
        <>
          <path d={"M" + pts.map(f2).join(" L") + " Z"} fill={sleeve} {...st(5)} />
          {!sil ? <path d={`M ${f2(lerp(A.sh, pts[5], 0.6))} L ${f2(lerp(A.e, pts[4], 0.6))} L ${f2(lerp(w0, pts[3], 0.6))}`} stroke={OUT} strokeWidth={1.5} opacity={0.3} fill="none" /> : null}
          {!sil ? <path d={"M" + [pts[4], pts[3], lerp(w0, pts[3], 0.5), lerp(A.e, pts[4], 0.5)].map(f2).join(" L") + " Z"} fill={SH} /> : null}
        </>
      );
    }
    return (
      <g>
        {hang}
        <Seg a={A.sh} b={A.e} w1={wide ? 44 : 34} w2={wide ? 38 : 28} fill={o.bareArms ? skin : sleeve} sil={sil} />
        <Seg a={A.e} b={lerp(A.e, A.w, wide ? 0.78 : 0.86)} w1={wide ? 38 : 28} w2={wide ? 34 : 24} fill={o.bareArms ? skin : sleeve} sil={sil} />
        {!o.bareArms ? <Seg a={lerp(A.e, A.w, 0.7)} b={A.w} w1={18} w2={16} fill={skin} sil={sil} shadow={false} ow={4} /> : null}
        {!o.bareArms && !sil && !wide ? <path d={`M ${f2(add(lerp(A.e, A.w, 0.86), dir(A.fa + 90, 13)))} L ${f2(add(lerp(A.e, A.w, 0.86), dir(A.fa - 90, 13)))}`} stroke={OUT} strokeWidth={3} /> : null}
        <Hand at={A.w} ang={A.fa} skin={skin} sil={sil} grip={grip} />
        {swordHand === A ? (
          <g transform={`translate(${A.w[0]} ${A.w[1]}) rotate(${180 - (p.sw ?? 150)})`}>
            <g transform="translate(0 -6)">
              <Sword len={p.swordLen ?? (c.swordLen || 260)} blade={c.blade || "#cfd6dd"} guard={c.guard} glow={p.glow} sil={sil} jag={c.jagged} />
            </g>
          </g>
        ) : null}
        {c.dual && which === "L" && p.sword && p.sword !== "none" ? (
          <g transform={`translate(${A.w[0]} ${A.w[1]}) rotate(${180 - (p.sw ?? 150) + 34})`}>
            <Sword len={220} blade={c.blade || "#cfd6dd"} sil={sil} jag />
          </g>
        ) : null}
      </g>
    );
  };

  const TORSO = "M -34 0 L -38 -60 C -44 -110 -50 -146 -50 -164 Q -49 -180 -30 -184 L 30 -184 Q 49 -180 50 -164 C 50 -146 44 -110 38 -60 L 34 0 Z";
  const capeW = o.capeW ?? 104, capeLen = o.capeLen ?? 190;
  const torso = (
    <g transform={`translate(${hip[0]} ${hip[1]}) rotate(${lean})`}>
      <defs><clipPath id={`${uid}tc`}><path d={TORSO} /></clipPath></defs>
      {o.skirt ? (
        <g>
          <path d={`M -42 -8 C -50 ${o.skirt * 0.4} ${-58 - o.skirt * 0.06} ${o.skirt * 0.8} ${-60 - o.skirt * 0.08} ${o.skirt} L ${60 + o.skirt * 0.08} ${o.skirt} C ${58 + o.skirt * 0.06} ${o.skirt * 0.8} 50 ${o.skirt * 0.4} 42 -8 Z`} fill={sil || o.skirtFill || o.top} {...st(5)} />
          {!sil ? (
            <>
              <path d={`M 6 -8 L ${20 + o.skirt * 0.05} ${o.skirt}`} stroke={OUT} strokeWidth={2.5} opacity={0.6} />
              <path d={`M 6 -8 L ${20 + o.skirt * 0.05} ${o.skirt} L ${60 + o.skirt * 0.08} ${o.skirt} C ${58 + o.skirt * 0.06} ${o.skirt * 0.8} 50 ${o.skirt * 0.4} 42 -8 Z`} fill={SH} />
            </>
          ) : null}
        </g>
      ) : null}
      {o.furSkirt && !sil ? (
        <path d="M -44 -14 L -58 44 L -42 30 L -34 56 L -18 34 L -6 60 L 8 34 L 20 58 L 32 32 L 44 52 L 50 28 L 60 44 L 44 -14 Z" fill="#8a6440" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
      ) : null}
      <path d={TORSO} fill={o.bareTorso ? skin : topFill} {...st(5)} />
      {!sil ? (
        <g clipPath={`url(#${uid}tc)`}>
          <path d="M 14 -190 C 30 -150 28 -80 16 10 L 60 10 L 60 -190 Z" fill={SH} />
          <path d="M -40 -184 L 40 -184 L 30 -170 Q 0 -160 -30 -170 Z" fill={SH} />
        </g>
      ) : null}
      {o.bareTorso && !sil ? (
        <g stroke="#b88a74" strokeWidth={2.6} fill="none" opacity={0.85} strokeLinecap="round">
          <path d="M -30 -140 q 14 10 27 0 M 3 -140 q 14 10 27 0 M 0 -120 v 76 M -18 -96 h 36 M -16 -72 h 32 M -14 -48 h 28" />
        </g>
      ) : null}
      {o.kimono && !sil ? (
        <g>
          <path d="M -26 -184 L 2 -104 L 26 -184" stroke={o.collar || "#fff6ea"} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M -26 -184 L 2 -104 L 26 -184" stroke={OUT} strokeWidth={2} fill="none" opacity={0.5} />
          <path d="M -42 -66 L 42 -66 L 40 -26 L -40 -26 Z" fill={o.obi || "url(#p_obi)"} stroke={OUT} strokeWidth={3.5} />
          {o.obiCord ? <path d="M -41 -46 H 41" stroke={o.obiCord} strokeWidth={5} /> : null}
          <path d="M 14 -66 L 40 -66 L 40 -26 L 10 -26 Z" fill={SH} />
        </g>
      ) : null}
      {o.uniform && !sil ? (
        <g>
          <path d="M -24 -186 L -22 -168 Q 0 -160 22 -168 L 24 -186" fill="#11131a" stroke={OUT} strokeWidth={3} />
          <path d="M 0 -164 V -8" stroke="#3a3f4c" strokeWidth={2.5} />
          {[-140, -112, -84, -56].map((y) => <circle key={y} cx={0} cy={y} r={3.2} fill="#d8c27a" />)}
          <rect x={-40} y={-20} width={80} height={13} rx={3} fill="#f4f1ea" stroke={OUT} strokeWidth={3} />
          <path d="M 8 -20 L 40 -20 L 40 -7 L 6 -7 Z" fill={SH} />
        </g>
      ) : null}
      {o.suit && !sil ? (
        <g>
          <path d="M -22 -184 L 0 -116 L 22 -184 Z" fill="#f4f1ea" stroke={OUT} strokeWidth={3} />
          <path d="M -4 -170 L 0 -120 L 4 -170 Z" fill="#8a1020" />
          <path d="M -26 -182 L -4 -96 M 26 -182 L 4 -96" stroke="#000" strokeWidth={4} />
        </g>
      ) : null}
      {o.haori ? (
        <g>
          <path d="M -52 -168 C -62 -120 -66 -10 -76 136 L -16 136 L -12 -176 Z" fill={sil || o.haori} {...st(5)} />
          <path d="M 52 -168 C 62 -120 66 -10 76 136 L 16 136 L 12 -176 Z" fill={sil || o.haoriR || o.haori} {...st(5)} />
          {!sil ? (
            <>
              <path d="M 30 -170 C 44 -100 50 0 54 136 L 76 136 C 66 -10 62 -120 52 -168 Z" fill={SH} />
              <path d="M -16 136 L -12 -176 L -20 -176 L -24 136 Z" fill={SH} />
              <path d="M -40 -60 Q -44 30 -50 130 M 34 -40 Q 40 40 44 130" stroke={OUT} strokeWidth={1.6} opacity={0.35} fill="none" />
            </>
          ) : null}
        </g>
      ) : null}
      <path d="M -12 -204 L -11 -180 Q 0 -174 11 -180 L 12 -204 Z" fill={skin} {...st(3.5)} />
      {!sil ? <path d="M -12 -204 L 12 -204 L 11 -190 Q 0 -184 -11 -190 Z" fill={SH} /> : null}
    </g>
  );

  const basket = p.basket ? (
    <g transform={`translate(${hip[0] - 10} ${hip[1] - 80}) rotate(${lean})`}>
      <path d="M -78 -150 L 58 -150 L 48 30 L -68 30 Z" fill={sil || "#a8844a"} {...st(5)} />
      {!sil ? <>
        {[-120, -90, -60, -30, 0].map((y) => <path key={y} d={`M -76 ${y} L 56 ${y}`} stroke="#7a5a2a" strokeWidth={4} />)}
        {[-50, -20, 10, 40].map((x) => <path key={x} d={`M ${x} -150 L ${x * 0.9} 30`} stroke="#7a5a2a" strokeWidth={3} />)}
        <path d="M -76 -150 Q -60 -196 -30 -176 Q -10 -210 14 -180 Q 40 -200 56 -150 Z" fill="#1a1a1e" stroke={OUT} strokeWidth={4} />
        <path d="M -40 -170 l 14 -8 M 6 -182 l 12 6" stroke="#4a4a52" strokeWidth={4} />
      </> : null}
    </g>
  ) : null;
  const box = p.box ? (
    <g transform={`translate(${hip[0] - 14} ${hip[1] - 70}) rotate(${lean})`}>
      <rect x={-72} y={-170} width={124} height={190} rx={6} fill={sil || "#b27a45"} {...st(5)} />
      {!sil ? <>
        <rect x={-72} y={-170} width={124} height={24} fill="#8a5a30" stroke={OUT} strokeWidth={3} />
        <path d="M -62 -140 V 14 M 42 -140 V 14" stroke="#8a5a30" strokeWidth={4} />
        <path d="M 20 -146 L 52 -146 L 52 20 L 20 20 Z" fill={SH} />
      </> : null}
    </g>
  ) : null;

  const headRot = lean + (p.head ?? 0);
  const hairBehind = (c.hair.long && c.hair.long > 0) || c.hair.pony;
  return (
    <g transform={`translate(${p.x ?? 0} ${(p.y ?? 0) + (p.bob ?? 0) * (p.s ?? 1)}) rotate(${p.rot ?? 0}) scale(${s * face} ${s})`} opacity={p.op ?? 1}>
      {p.rim ? (
        <g filter="url(#f_blur10)" opacity={0.75}>
          <ellipse cx={headC[0]} cy={headC[1]} rx={70} ry={80} fill={p.rim} />
          <path d={`M ${f2(shL)} L ${f2(shR)} L ${f2(LR.f)} L ${f2(LL.f)} Z`} fill={p.rim} />
        </g>
      ) : null}
      {box}
      {basket}
      {o.cape ? (
        <g transform={`translate(${hip[0]} ${hip[1]}) rotate(${lean})`}>
          <path d={`M -54 -172 C -84 -60 -92 30 ${-capeW} ${capeLen} L ${capeW} ${capeLen} C 92 30 84 -60 54 -172 Z`} fill={sil || o.cape} {...st(5)} />
          {!sil ? <path d={`M 30 -170 C 60 -60 70 30 ${capeW * 0.6} ${capeLen} L ${capeW} ${capeLen} C 92 30 84 -60 54 -172 Z`} fill={SH} /> : null}
        </g>
      ) : null}
      {hairBehind ? (
        <g transform={`translate(${headC[0]} ${headC[1]}) rotate(${headRot})`}>
          <defs>
            <linearGradient id={`${uid}hb`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c.hair.c1} />
              <stop offset={c.hair.mid ?? 0.55} stopColor={c.hair.c1} />
              <stop offset="1" stopColor={c.hair.c2} />
            </linearGradient>
          </defs>
          <HairBehind h={c.hair} gid={`${uid}hb`} sil={sil} t={t} />
        </g>
      ) : null}
      {legEls(LL)}
      {legEls(LR)}
      {torso}
      {armEls(AL, "L")}
      <g transform={`translate(${headC[0]} ${headC[1]}) rotate(${headRot})`}>
        <Head c={c} p={p} t={t} uid={uid} />
      </g>
      {armEls(AR, "R")}
      {p.blood && !sil ? <path d={`M ${headC[0] - 12} ${headC[1] - 26} q 4 20 -2 40`} stroke="#b0101c" strokeWidth={5} fill="none" /> : null}
    </g>
  );
};
