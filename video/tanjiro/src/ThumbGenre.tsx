import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { Defs } from "./rig/Defs";
import { Char, Pose } from "./rig/Char";

// Covers in the style of the «Ты — X (И ЭТО ВСЯ ТВОЯ ЖИЗНЬ)» genre: white background, one big hero on the left,
// a 2–3 word nickname in huge 3D letters on the right, a fat 3D arrow pointing at the hero.
const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    fetch(staticFile("fonts/fonts.css")).then((r) => r.text()).then(async (txt) => {
      const css = document.createElement("style");
      css.innerHTML = txt.replace(/url\(([^)]+)\)/g, (_, f) => `url(${staticFile("fonts/" + f)})`);
      document.head.appendChild(css);
      await document.fonts.load("700 40px Oswald", "БРАТ ГОДА"); await document.fonts.load("900 40px Rubik", "А");
      continueRender(h);
    });
  }, [h]);
};

const Text3D: React.FC<{ lines: string[]; x: number; y: number; w: number; grad: [string, string, string]; side: string; id: string; gap?: number; max?: number }> = ({ lines, x, y, w, grad, side, id, gap = 0.08, max = 300 }) => {
  const sizes = lines.map((l) => Math.min(max, w / (l.length * 0.6)));
  const ys: number[] = [];
  let top = y;
  sizes.forEach((sz) => { ys.push(top + sz * 0.78); top += sz * (1.0 + gap); });
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={grad[0]} /><stop offset="0.55" stopColor={grad[1]} /><stop offset="1" stopColor={grad[2]} />
        </linearGradient>
      </defs>
      {lines.map((l, i) => {
        const sz = sizes[i], by = ys[i];
        const t = (key: string, props: any, tr?: string) => (
          <text key={key} transform={tr} x={x} y={by} textAnchor="middle" fontFamily="Oswald, Rubik, sans-serif" fontWeight={700} fontSize={sz} {...props}>{l.toUpperCase()}</text>
        );
        const depth = Math.round(sz * 0.07);
        return (
          <g key={i}>
            {t("sh", { fill: "#000", stroke: "#000", strokeWidth: sz * 0.16, strokeLinejoin: "round", opacity: 0.22 }, "translate(14 18)")}
            {Array.from({ length: depth }, (_, k) => t("d" + k, { fill: side, stroke: side, strokeWidth: sz * 0.15, strokeLinejoin: "round" }, `translate(${(depth - k) * 0.55} ${(depth - k) * 0.9})`))}
            {t("o", { fill: "#140a08", stroke: "#140a08", strokeWidth: sz * 0.15, strokeLinejoin: "round" })}
            {t("f", { fill: `url(#${id})`, stroke: "#fff", strokeOpacity: 0.35, strokeWidth: 2 })}
          </g>
        );
      })}
    </g>
  );
};

const Arrow3D: React.FC<{ x1: number; x2: number; y: number; c: [string, string]; side: string; rot?: number }> = ({ x1, x2, y, c, side, rot = -5 }) => {
  // points from x1 (tail, right) to x2 (tip, left)
  const d = `M ${x2} ${y} L ${x2 + 170} ${y - 120} L ${x2 + 170} ${y - 52} L ${x1} ${y - 52} L ${x1} ${y + 52} L ${x2 + 170} ${y + 52} L ${x2 + 170} ${y + 120} Z`;
  return (
    <g transform={`rotate(${rot} ${(x1 + x2) / 2} ${y})`}>
      <defs><linearGradient id="arrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor={c[1]} /></linearGradient></defs>
      <path d={d} transform="translate(16 20)" fill="#000" opacity={0.22} />
      {Array.from({ length: 12 }, (_, k) => <path key={k} d={d} transform={`translate(${(12 - k) * 0.8} ${(12 - k) * 1.2})`} fill={side} stroke={side} strokeWidth={14} strokeLinejoin="round" />)}
      <path d={d} fill={`url(#arrg)`} stroke="#140a08" strokeWidth={14} strokeLinejoin="round" />
      <path d={`M ${x2 + 40} ${y - 6} L ${x2 + 170} ${y - 100} M ${x2 + 190} ${y - 36} L ${x1 - 20} ${y - 36}`} stroke="#fff" strokeOpacity={0.45} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

const WhiteBg: React.FC<{ tint: string }> = ({ tint }) => (
  <>
    <defs>
      <radialGradient id="wbg" cx="0.3" cy="0.45" r="0.9"><stop offset="0" stopColor="#ffffff" /><stop offset="0.7" stopColor="#f4f1ec" /><stop offset="1" stopColor="#dcd6cc" /></radialGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#wbg)" />
    <rect width={1920} height={1080} fill={tint} opacity={0.05} />
  </>
);

type V = { text: string[]; grad: [string, string, string]; side: string; arrow: [string, string]; arrowSide: string; hero: string; pose: Pose; back: React.ReactNode; tint: string };
const VARIANTS: Record<number, V> = {
  1: {
    text: ["БРАТ", "ГОДА"], grad: ["#ff6a4a", "#e0201a", "#8a0a0a"], side: "#5a0606", arrow: ["#ff5a3a", "#b8100c"], arrowSide: "#5a0606", tint: "#ff2a1a",
    hero: "tanjiro", pose: { x: 540, y: 1760, s: 2.6, expr: "smile", sword: "R", sw: 212, swordLen: 300, aR: [26, 104], aL: [14, 112], turn: 0.2, blink: 0 },
    back: (
      <g>
        <circle cx={540} cy={430} r={410} fill="#d6262c" />
        <circle cx={540} cy={430} r={410} fill="none" stroke="#140a08" strokeWidth={10} />
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <path key={i} d={`M ${540 + Math.cos(a) * 430} ${430 + Math.sin(a) * 430} L ${540 + Math.cos(a) * 530} ${430 + Math.sin(a) * 530}`} stroke="#d6262c" strokeWidth={16} strokeLinecap="round" />; })}
      </g>
    ),
  },
  2: {
    text: ["СТАЛ", "ДЕМОНОМ"], grad: ["#ff5a5a", "#b0101a", "#3a0006"], side: "#1a0004", arrow: ["#2a2a30", "#050508"], arrowSide: "#000", tint: "#8a0010",
    hero: "tanjiro_demon", pose: { x: 540, y: 1760, s: 2.6, expr: "shout", demon: true, aR: [70, 75], aL: [-70, -75], lean: 6, blink: 0, rim: "#ff2a1a" },
    back: (
      <g>
        <circle cx={560} cy={480} r={430} fill="#140a0c" />
        {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <circle key={i} cx={560 + Math.cos(a) * (440 + (i % 3) * 40)} cy={480 + Math.sin(a) * (440 + (i % 3) * 40)} r={18 + (i % 4) * 10} fill="#8a0010" />; })}
        <circle cx={560} cy={480} r={430} fill="none" stroke="#8a0010" strokeWidth={12} />
      </g>
    ),
  },
  3: {
    text: ["ПОТЕРЯЛ", "ВСЕХ"], grad: ["#bfe6ff", "#3a8ad8", "#123a7a"], side: "#08204a", arrow: ["#6ab8ff", "#1a5aa8"], arrowSide: "#08204a", tint: "#3a8ad8",
    hero: "tanjiro_kid", pose: { x: 540, y: 1760, s: 2.6, expr: "cry", tears: true, basket: true, aR: [8, -6], aL: [-8, 6], head: 4, blink: 0 },
    back: (
      <g>
        <circle cx={560} cy={480} r={420} fill="#dbe9f6" stroke="#140a08" strokeWidth={10} />
        <path d="M 180 640 Q 360 560 560 600 T 940 620 L 940 900 L 180 900 Z" fill="#f4f8fc" />
        {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={200 + ((i * 137) % 720)} cy={140 + ((i * 89) % 640)} r={4 + (i % 4) * 2} fill="#8ab0d8" opacity={0.7} />)}
      </g>
    ),
  },
};

export const ThumbGenre: React.FC<{ v?: number }> = ({ v = 1 }) => {
  useFonts();
  const V = VARIANTS[v];
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Defs />
        <filter id="heroShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="14" dy="18" stdDeviation="10" floodColor="#000" floodOpacity="0.3" /></filter>
        <WhiteBg tint={V.tint} />
        {V.back}
        <g filter="url(#heroShadow)"><Char id={V.hero} p={V.pose} t={0} /></g>
        <Text3D lines={V.text} x={1440} y={90} w={880} grad={V.grad} side={V.side} id={`tg${v}`} max={300} />
        <Arrow3D x1={1780} x2={1010} y={860} c={V.arrow} side={V.arrowSide} />
      </svg>
    </AbsoluteFill>
  );
};
