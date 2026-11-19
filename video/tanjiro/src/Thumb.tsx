import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { Defs } from "./rig/Defs";
import { Char } from "./rig/Char";
import { SnowMountains, Void } from "./scenes/BG";
import { Snow, Embers, PinkFire, FireArc } from "./scenes/FX";

// YouTube covers (1280x720 after --scale). Rules: big face, ≤4 words, high contrast,
// bottom-right corner left clear for the duration badge.
const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    fetch(staticFile("fonts/fonts.css")).then((r) => r.text()).then(async (txt) => {
      const css = document.createElement("style");
      css.innerHTML = txt.replace(/url\(([^)]+)\)/g, (_, f) => `url(${staticFile("fonts/" + f)})`);
      document.head.appendChild(css);
      await document.fonts.load("40px 'Rubik Dirt'", "ВСЯ"); await document.fonts.load("900 40px Rubik", "ВСЯ");
      continueRender(h);
    });
  }, [h]);
};
const Title: React.FC<{ x: number; y: number; size: number; text: string; c?: string; anchor?: "start" | "middle" }> = ({ x, y, size, text, c = "#fff", anchor = "middle" }) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily="'Rubik Dirt', Rubik" fontSize={size} fill={c} stroke="#000" strokeWidth={size * 0.09} paintOrder="stroke" letterSpacing={4}>{text}</text>
);
const Badge: React.FC<{ x: number; y: number; label: string; value: string; c?: string; s?: number }> = ({ x, y, label, value, c = "#fff", s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={0} y={0} width={420} height={110} rx={22} fill="rgba(10,8,8,.85)" stroke="rgba(255,255,255,.35)" strokeWidth={4} />
    <text x={30} y={76} fontFamily="Rubik" fontWeight={900} fontSize={42} fill="#fff" opacity={0.8}>{label}</text>
    <text x={390} y={80} textAnchor="end" fontFamily="Rubik" fontWeight={900} fontSize={68} fill={c}>{value}</text>
  </g>
);

export const Thumb: React.FC<{ v?: number }> = ({ v = 1 }) => {
  useFonts();
  if (v === 2) {
    // two ages of one life: 13 in the snow -> 16 with the mark and the patch
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
          <Defs />
          <defs><linearGradient id="t2" x1="0" y1="0" x2="1" y2="0"><stop offset="0.35" stopColor="#1d4f86" /><stop offset="0.65" stopColor="#8a1a08" /></linearGradient></defs>
          <rect width={1920} height={1080} fill="url(#t2)" />
          <circle cx={1450} cy={560} r={700} fill="url(#g_glowO)" opacity={0.7} />
          <FireArc x={1420} y={560} r={430} t={1.3} k={1} a0={-210} sweep={260} />
          <Char id="tanjiro_kid" p={{ x: 520, y: 2050, s: 2.9, expr: "smile", blink: 0 }} t={0} />
          <Snow t={3} n={60} big />
          <Char id="tanjiro_mark" p={{ x: 1420, y: 2120, s: 3.0, expr: "fierce", patch: true, blink: 0, rim: "#ff7a1a" }} t={0} />
          <Embers t={2} n={40} />
          <Title x={300} y={300} size={260} text="13" c="#cfe8ff" />
          <Title x={960} y={300} size={160} text="→" c="#fff" />
          <Title x={1640} y={300} size={260} text="16" c="#ffcf5a" />
          <Title x={60} y={1015} size={118} text="ВСЯ ТВОЯ ЖИЗНЬ" anchor="start" />
        </svg>
      </AbsoluteFill>
    );
  }
  if (v === 3) {
    // the family counter drops: crying close-up, demon sister glowing behind
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
          <Defs />
          <Void t={2} c="#0a0208" c2="#5a0a30" />
          <PinkFire x={1460} y={520} s={1.6} t={1} />
          <Char id="nezuko" p={{ x: 1460, y: 2250, s: 3.2, demon: true, expr: "angry", blink: 0, muzzle: false }} t={0} />
          <Char id="tanjiro_kid" p={{ x: 640, y: 2150, s: 3.3, expr: "cry", tears: true, blink: 0 }} t={0} />
          <Snow t={4} n={60} big />
          <Badge x={70} y={60} label="СЕМЬЯ" value="1/6" c="#ff4a5a" s={1.25} />
          <Title x={60} y={1015} size={120} text="ТЫ — ТАНДЖИРО" anchor="start" />
        </svg>
      </AbsoluteFill>
    );
  }
  // v1: snow half / demon half, split by a crack
  const crack = "M 980 -20 L 930 160 L 1010 300 L 940 470 L 1020 640 L 950 820 L 1010 1100";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Defs />
        <defs>
          <clipPath id="L"><path d={`${crack} L -10 1100 L -10 -20 Z`} /></clipPath>
          <clipPath id="R"><path d={`${crack} L 1930 1100 L 1930 -20 Z`} /></clipPath>
          <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0.85" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
        </defs>
        <g clipPath="url(#L)">
          <SnowMountains cam={{ x: 0, y: 0, z: 1 }} tod="day" t={3} trees={false} />
          <rect width={1920} height={1080} fill="#2a6aa8" opacity={0.28} />
          <Char id="tanjiro_kid" p={{ x: 560, y: 2330, s: 3.2, expr: "sad", tears: true, blink: 0 }} t={0} />
          <Snow t={4} n={70} big />
        </g>
        <g clipPath="url(#R)">
          <Void t={2} c="#120004" c2="#7a0a10" />
          <Char id="tanjiro_demon" p={{ x: 1400, y: 2330, s: 3.2, expr: "angry", blink: 0, rim: "#ff3a1a" }} t={0} />
          <Embers t={3} n={50} c="#ff6a2a" />
        </g>
        <path d={crack} stroke="#fff6e0" strokeWidth={14} fill="none" />
        <path d={crack} stroke="#ffb04a" strokeWidth={34} fill="none" opacity={0.35} filter="url(#f_blur10)" />
        <rect x={0} y={0} width={1920} height={300} fill="url(#topFade)" />
        <Title x={960} y={200} size={170} text="ВСЯ ТВОЯ ЖИЗНЬ" />
      </svg>
    </AbsoluteFill>
  );
};
