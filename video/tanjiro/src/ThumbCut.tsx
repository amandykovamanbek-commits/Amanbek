import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";

// Cover in the exact style of the genre: pure white, the cut-out hero big on the left,
// two words on the right (coloured + black, condensed bold), a black arrow at the face.
const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fetch(staticFile("fonts/fonts.css")).then((r) => r.text()).then(async (txt) => {
      const css = document.createElement("style");
      css.innerHTML = txt.replace(/url\(([^)]+)\)/g, (_, f) => `url(${staticFile("fonts/" + f)})`);
      document.head.appendChild(css);
      await document.fonts.load("700 40px Oswald", "ДОБРЫЙ ДЕМОН ПОТЕРЯЛ ВСЕХ СТАЛ");
      setReady(true);
      requestAnimationFrame(() => continueRender(h));
    });
  }, [h]);
  return ready;
};
// exact text width from the real font
const measure = (s: string, size: number) => {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = `700 ${size}px Oswald`;
  return ctx.measureText(s).width;
};
const TEXT: Record<number, [string, string]> = { 1: ["ДОБРЫЙ", "ДЕМОН"], 2: ["СТАЛ", "ДЕМОНОМ"], 3: ["ПОТЕРЯЛ", "ВСЕХ"] };

export const ThumbCut: React.FC<{ v?: number }> = ({ v = 1 }) => {
  const ready = useFonts();
  const [a, b] = TEXT[v];
  const W = 680; // text column width
  const fit = (s: string, max: number) => (ready ? Math.min(max, (W / measure(s, 100)) * 100) : max);
  return (
    <AbsoluteFill style={{ background: "#ffffff" }}>
      <Img src={staticFile("ref/tanjiro_demon_cut.png")} style={{ position: "absolute", left: -150, top: -60, width: 1330, height: 1330 }} />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* black arrow pointing at the face */}
        <path d="M 1000 400 L 1098 340 L 1090 380 L 1178 377 L 1180 425 L 1092 428 L 1102 468 Z" fill="#111" stroke="#111" strokeWidth={10} strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: 1200, top: 260, width: W, textAlign: "center", fontFamily: "Oswald, sans-serif", fontWeight: 700, lineHeight: 0.98, letterSpacing: -1 }}>
        <div style={{ fontSize: fit(a, 230), color: "#e8371c" }}>{a}</div>
        <div style={{ fontSize: fit(b, 210), color: "#111" }}>{b}</div>
      </div>
    </AbsoluteFill>
  );
};
