import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { Defs } from "./rig/Defs";
import { Char } from "./rig/Char";
import { SnowMountains, Void } from "./scenes/BG";
import { Snow, Embers } from "./scenes/FX";

// YouTube cover: the same boy, two halves of one life (snow / demon), split by a crack.
export const Thumb: React.FC = () => {
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
  const crack = "M 980 -20 L 930 160 L 1010 300 L 940 470 L 1020 640 L 950 820 L 1010 1100";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Defs />
        <defs>
          <clipPath id="L"><path d={`${crack} L -10 1100 L -10 -20 Z`} /></clipPath>
          <clipPath id="R"><path d={`${crack} L 1930 1100 L 1930 -20 Z`} /></clipPath>
        </defs>
        <g clipPath="url(#L)">
          <SnowMountains cam={{ x: 0, y: 0, z: 1 }} tod="day" t={3} trees={false} />
          <rect width={1920} height={1080} fill="#2a6aa8" opacity={0.28} />
          <Char id="tanjiro_kid" p={{ x: 560, y: 2200, s: 3.2, expr: "sad", tears: true, blink: 0 }} t={0} />
          <Snow t={4} n={70} big />
        </g>
        <g clipPath="url(#R)">
          <Void t={2} c="#120004" c2="#7a0a10" />
          <Char id="tanjiro_demon" p={{ x: 1400, y: 2200, s: 3.2, expr: "angry", blink: 0, rim: "#ff3a1a" }} t={0} />
          <Embers t={3} n={50} c="#ff6a2a" />
        </g>
        <path d={crack} stroke="#fff6e0" strokeWidth={14} fill="none" />
        <path d={crack} stroke="#ffb04a" strokeWidth={34} fill="none" opacity={0.35} filter="url(#f_blur10)" />
        <rect x={0} y={760} width={1920} height={320} fill="url(#thumbFade)" />
        <defs><linearGradient id="thumbFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.85" /></linearGradient></defs>
        <text x={960} y={1010} textAnchor="middle" fontFamily="'Rubik Dirt', Rubik" fontSize={168} fill="#fff" stroke="#000" strokeWidth={14} paintOrder="stroke" letterSpacing={6}>ВСЯ ТВОЯ ЖИЗНЬ</text>
      </svg>
    </AbsoluteFill>
  );
};
