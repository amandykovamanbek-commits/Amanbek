import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";

// «КОРОЛЬ ДЕМОНОВ» covers: same white layout as the genre, four display fonts with good Cyrillic.
type F = { family: string; weight: number; c1: string; c2: string; shadow?: string; gap?: number; tracking?: number };
const FONTS: Record<number, F> = {
  1: { family: "'Reggae One'", weight: 400, c1: "#e01c1c", c2: "#111", gap: 0.04, tracking: -0.2 },
  2: { family: "'Rubik Wet Paint'", weight: 400, c1: "#111", c2: "#c8101a", gap: 0.02 },
  3: { family: "'Yeseva One'", weight: 400, c1: "#d6161c", c2: "#111", gap: 0.0, tracking: 0.01 },
  4: { family: "'Rampart One'", weight: 400, c1: "#e01c1c", c2: "#111", gap: 0.04, tracking: -0.22 },
};
const useFonts = (f: F) => {
  const [h] = useState(() => delayRender("fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fetch(staticFile("fonts/fonts.css")).then((r) => r.text()).then(async (txt) => {
      const css = document.createElement("style");
      css.innerHTML = txt.replace(/url\(([^)]+)\)/g, (_, x) => `url(${staticFile("fonts/" + x)})`);
      document.head.appendChild(css);
      await document.fonts.load(`${f.weight} 40px ${f.family}`, "КОРОЛЬ ДЕМОНОВ");
      setReady(true);
      requestAnimationFrame(() => continueRender(h));
    });
  }, [h]);
  return ready;
};

export const ThumbKing: React.FC<{ v?: number; words?: [string, string] }> = ({ v = 1, words = ["КОРОЛЬ", "ДЕМОНОВ"] }) => {
  const f = FONTS[v];
  const ready = useFonts(f);
  const W = 690;
  const measure = (s: string) => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${f.weight} 100px ${f.family}`;
    return ctx.measureText(s).width + (f.tracking || 0) * 100 * (s.length - 1);
  };
  const fit = (s: string, max: number) => (ready ? Math.min(max, (W / measure(s)) * 100) : max);
  const [a, b] = words;
  const sa = fit(a, 230), sb = fit(b, 230);
  return (
    <AbsoluteFill style={{ background: "#ffffff" }}>
      <Img src={staticFile("ref/tanjiro_demon_cut.png")} style={{ position: "absolute", left: -150, top: -60, width: 1330, height: 1330 }} />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d="M 985 400 L 1083 340 L 1075 380 L 1158 377 L 1160 425 L 1077 428 L 1087 468 Z" fill="#111" stroke="#111" strokeWidth={10} strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: 1190, top: 540 - (sa + sb) * 0.6, width: W, textAlign: "center", fontFamily: f.family, fontWeight: f.weight, lineHeight: 1.0 + (f.gap || 0), whiteSpace: "nowrap" }}>
        <div style={{ fontSize: sa, color: f.c1, letterSpacing: `${f.tracking || 0}em`, marginRight: `${f.tracking || 0}em` }}>{a}</div>
        <div style={{ fontSize: sb, color: f.c2, letterSpacing: `${f.tracking || 0}em`, marginRight: `${f.tracking || 0}em` }}>{b}</div>
      </div>
    </AbsoluteFill>
  );
};
