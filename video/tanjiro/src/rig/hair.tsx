import React from "react";

// Anime hair built from tapered, curved clumps. Head space: skull centre (0,-12),
// face spans y -60 (hairline) .. 51 (chin), x ±44.
export type HairSpec = {
  style: "spiky" | "straight" | "wavy" | "none";
  c1: string; c2: string; mid?: number; seed?: number;
  crown?: number; spikes?: number; sweep?: number; spread?: number;
  bangs?: number; bangLen?: number; bangW?: number; centerBang?: number; part?: boolean;
  locks?: number; lockW?: number; lowSpikes?: number; flame?: boolean;
  long?: number; pony?: [number, number, number, number]; bun?: boolean; topKnot?: boolean;
};

type P = [number, number];
export type Clump = { r: P; t: P; w: number; b: number; dark?: boolean };

const OUT = "#14110f";
const rad = (d: number) => (d * Math.PI) / 180;
const rnd = (i: number, s = 1) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function clumpPath({ r, t, w, b }: Clump) {
  const dx = t[0] - r[0], dy = t[1] - r[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const a: P = [r[0] + nx * w, r[1] + ny * w];
  const c: P = [r[0] - nx * w, r[1] - ny * w];
  const c1: P = [r[0] + dx * 0.55 + nx * (w * 0.95 + b), r[1] + dy * 0.55 + ny * (w * 0.95 + b)];
  const c2: P = [r[0] + dx * 0.6 - nx * (w * 0.45 - b), r[1] + dy * 0.6 - ny * (w * 0.45 - b)];
  const f = (p: P) => p[0].toFixed(1) + " " + p[1].toFixed(1);
  return `M ${f(a)} Q ${f(c1)} ${f(t)} Q ${f(c2)} ${f(c)} Z`;
}

// root on skull ellipse at angle th (0 = up, +90 = right)
const onSkull = (th: number, k = 1): P => [Math.sin(rad(th)) * 44 * k, -12 - Math.cos(rad(th)) * 50 * k];
const fromAngle = (p: P, th: number, l: number): P => [p[0] + Math.sin(rad(th)) * l, p[1] - Math.cos(rad(th)) * l];

export function buildHair(h: HairSpec) {
  const s = h.seed ?? 1;
  const back: Clump[] = [];
  const front: Clump[] = [];
  let mass = "M -50 0 C -56 -50 -34 -72 0 -72 C 34 -72 56 -50 50 0 C 46 20 -46 20 -50 0 Z";
  if (h.style === "spiky" || h.style === "wavy") {
    const n = h.spikes ?? 11;
    const spread = h.spread ?? 128;
    for (let i = 0; i < n; i++) {
      const th = -spread + (i / (n - 1)) * spread * 2 + (rnd(i, s) - 0.5) * 10;
      const len = (h.crown ?? 30) * (0.75 + rnd(i + 7, s) * 0.55) * (h.flame ? 1 + Math.max(0, 1 - Math.abs(th) / 90) * 0.6 : 1);
      const sweep = h.flame ? -th * 0.25 : Math.sign(th) * (h.sweep ?? 22) + (rnd(i + 3, s) - 0.5) * 16;
      const root = onSkull(th, 0.9);
      back.push({ r: root, t: fromAngle(root, th + sweep, len + 20), w: 15 + rnd(i + 11, s) * 5, b: (rnd(i + 5, s) - 0.5) * (h.style === "wavy" ? 26 : 10) });
    }
    if (h.lowSpikes) {
      for (const sd of [-1, 1]) {
        for (let k = 0; k < 3; k++) {
          const th = sd * (118 + k * 14);
          const root = onSkull(th, 0.85);
          back.push({ r: root, t: fromAngle(root, sd * (150 + k * 10), h.lowSpikes * (0.8 + k * 0.2)), w: 14, b: sd * 6 });
        }
      }
    }
  } else if (h.style === "straight") {
    mass = "M -52 6 C -58 -52 -34 -74 0 -74 C 34 -74 58 -52 52 6 C 48 24 -48 24 -52 6 Z";
  }
  // bangs
  const nb = h.bangs ?? 0;
  const bl = h.bangLen ?? 0;
  for (let i = 0; i < nb; i++) {
    const u = nb === 1 ? 0 : i / (nb - 1) - 0.5; // -0.5..0.5
    let rx = u * 76;
    if (h.part && Math.abs(u) < 0.12) continue;
    const ry = -54 - Math.cos(u * Math.PI) * 8;
    const len = bl * (h.style === "straight" ? 0.94 + rnd(i, s) * 0.12 : 0.8 + rnd(i + 2, s) * 0.4);
    let tx = rx * (h.style === "straight" ? 1.04 : 0.9) + (h.style === "straight" ? 0 : (rnd(i + 9, s) - 0.5) * 18);
    let ty = ry + len;
    if (h.centerBang && Math.abs(u) < 0.1) ty += h.centerBang;
    if (h.part) tx += Math.sign(u) * 6;
    front.push({ r: [rx, ry], t: [tx, ty], w: h.bangW ?? 13, b: (rnd(i + 4, s) - 0.5) * (h.style === "straight" ? 4 : 14) + u * -10 });
  }
  if (h.locks) {
    for (const sd of [-1, 1]) {
      front.push({ r: [sd * 40, -40], t: [sd * 47, h.locks], w: h.lockW ?? 10, b: sd * -4 });
      if (h.style !== "straight") front.push({ r: [sd * 44, -30], t: [sd * 54, h.locks * 0.6 - 4], w: 9, b: sd * 6 });
    }
  }
  return { back, front, mass };
}

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
};

export const HairLayer: React.FC<{ h: HairSpec; layer: "back" | "front"; gid: string; sil?: string; t: number }> = ({ h, layer, gid, sil, t }) => {
  if (h.style === "none") return null;
  const { back, front, mass } = buildHair(h);
  const fill = sil || `url(#${gid})`;
  const sway = Math.sin(t * 1.6) * 1.5;
  const sw = (c: Clump): Clump => ({ ...c, t: [c.t[0] + sway, c.t[1]] });
  if (layer === "back") {
    const cl = back.map(sw);
    return (
      <g>
        {h.bun ? <ellipse cx={0} cy={-62} rx={36} ry={24} fill={fill} stroke={sil || OUT} strokeWidth={5} /> : null}
        {h.topKnot ? <path d="M -14 -70 C -20 -100 20 -100 14 -70 Z" fill={fill} stroke={sil || OUT} strokeWidth={5} /> : null}
        {/* outline pass, then fill pass => clean outer silhouette */}
        <path d={mass} fill="none" stroke={sil || OUT} strokeWidth={8} strokeLinejoin="round" />
        {cl.map((c, i) => <path key={i} d={clumpPath(c)} fill="none" stroke={sil || OUT} strokeWidth={7} strokeLinejoin="round" />)}
        <path d={mass} fill={sil || shade(h.c1, -0.25)} />
        {cl.map((c, i) => <path key={"f" + i} d={clumpPath(c)} fill={fill} />)}
        {!sil ? cl.filter((_, i) => i % 2 === 0).map((c, i) => (
          <path key={"l" + i} d={`M ${c.r[0] * 0.9} ${c.r[1] * 0.9 + 4} Q ${(c.r[0] + c.t[0]) / 2} ${(c.r[1] + c.t[1]) / 2} ${c.t[0] * 0.92 + c.r[0] * 0.08} ${c.t[1] * 0.92 + c.r[1] * 0.08}`}
            stroke={OUT} strokeWidth={2} opacity={0.35} fill="none" />
        )) : null}
      </g>
    );
  }
  const cl = front.map(sw);
  return (
    <g>
      {cl.map((c, i) => <path key={i} d={clumpPath(c)} fill="none" stroke={sil || OUT} strokeWidth={6} strokeLinejoin="round" />)}
      {/* cap over the forehead joins the bangs */}
      <path d="M -46 -30 C -48 -62 -24 -72 0 -72 C 24 -72 48 -62 46 -30 C 30 -48 -30 -48 -46 -30 Z" fill={sil || fill} />
      {cl.map((c, i) => <path key={"f" + i} d={clumpPath(c)} fill={fill} />)}
      {!sil ? (
        <g>
          {cl.map((c, i) => (
            <path key={"s" + i} d={`M ${c.r[0]} ${c.r[1] + 6} L ${c.r[0] * 0.6 + c.t[0] * 0.4} ${c.r[1] * 0.4 + c.t[1] * 0.6}`} stroke={OUT} strokeWidth={1.8} opacity={0.4} />
          ))}
          {/* angel-ring highlight: short broken strokes */}
          {[-30, -16, -2, 12, 26].map((x, i) => (
            <path key={"h" + i} d={`M ${x - 6} ${-50 - Math.cos(x / 40) * 6 + (i % 2) * 2} q 6 -3 12 -1`} stroke={h.c1 < "#555555" ? shade(h.c2, 0.18) : shade(h.c1, 0.55)} strokeWidth={4} strokeLinecap="round" fill="none" opacity={h.c1 < "#555555" ? 0.55 : 0.8} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

// long hair and ponytail, drawn behind the body
export const HairBehind: React.FC<{ h: HairSpec; gid: string; sil?: string; t: number }> = ({ h, gid, sil, t }) => {
  const fill = sil || `url(#${gid})`;
  const st = { stroke: sil || OUT, strokeWidth: 6, strokeLinejoin: "round" as const };
  const sw = Math.sin(t * 1.4) * 4;
  const els: React.ReactNode[] = [];
  if (h.long) {
    const L = h.long;
    const tips = [-62, -40, -18, 4, 26, 48, 64];
    const d = `M -54 -10 C -66 ${L * 0.35} ${-70 + sw} ${L * 0.7} ${-64 + sw} ${L - 10} ` +
      tips.map((x, i) => `L ${x + sw} ${L - (i % 2 ? 26 : 0) - 10 + (i % 3) * 6}`).join(" ") +
      ` C ${72 + sw} ${L * 0.7} 66 ${L * 0.35} 54 -10 Z`;
    els.push(<path key="l" d={d} fill={fill} {...st} />);
    if (!sil) els.push(<path key="ls" d={`M -20 20 Q -24 ${L * 0.5} ${-20 + sw} ${L - 30} M 18 20 Q 22 ${L * 0.5} ${16 + sw} ${L - 30}`} stroke={OUT} strokeWidth={2} opacity={0.35} fill="none" />);
  }
  if (h.pony) {
    const [px, py, len, w] = h.pony;
    els.push(
      <path key="p" {...st} fill={fill}
        d={`M ${px - w / 2} ${py} C ${px - w} ${py + len * 0.4} ${px - w * 0.5 + sw} ${py + len * 0.8} ${px + sw} ${py + len} L ${px + w * 0.15 + sw} ${py + len * 0.82} L ${px + w * 0.5 + sw} ${py + len * 0.94} C ${px + w} ${py + len * 0.5} ${px + w * 0.7} ${py + len * 0.2} ${px + w / 2} ${py} Z`} />
    );
  }
  return <>{els}</>;
};
