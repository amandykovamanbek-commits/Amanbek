import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";

// Minimal covers built around the user's own reference art of Tanjiro.
// Kanji used: 竈門炭治郎
const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    fetch(staticFile("fonts/fonts.css")).then((r) => r.text()).then(async (txt) => {
      const css = document.createElement("style");
      css.innerHTML = txt.replace(/url\(([^)]+)\)/g, (_, f) => `url(${staticFile("fonts/" + f)})`);
      document.head.appendChild(css);
      await Promise.all([
        document.fonts.load("900 40px 'Playfair Display'", "ТАНДЖИРО"), document.fonts.load("italic 700 40px 'Playfair Display'", "демоном"),
        document.fonts.load("600 40px Montserrat", "ЖИЗНЬ"), document.fonts.load("40px 'Yuji Boku'", "竈門炭治郎"),
      ]);
      continueRender(h);
    });
  }, [h]);
};

const serif = "'Playfair Display', serif";
const sans = "Montserrat, sans-serif";
const Kanji: React.FC<{ c: string; x: number; y: number; size?: number }> = ({ c, x, y, size = 64 }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: "'Yuji Boku', serif", fontSize: size, color: c, writingMode: "vertical-rl", lineHeight: 1, letterSpacing: 6 }}>竈門炭治郎</div>
);

export const ThumbReal: React.FC<{ v?: number }> = ({ v = 1 }) => {
  useFonts();
  const art = staticFile("ref/tanjiro_demon.png");
  if (v === 2) {
    return (
      <AbsoluteFill style={{ background: "#efe8dc" }}>
        <Img src={staticFile("tex/paper.png")} style={{ position: "absolute", inset: 0, width: 1920, height: 1080, mixBlendMode: "multiply", opacity: 0.7 }} />
        <div style={{ position: "absolute", left: 1070, top: 130, width: 820, height: 820, borderRadius: "50%", background: "#c1121f" }} />
        <div style={{ position: "absolute", left: 1096, top: 156, width: 768, height: 768, borderRadius: "50%", overflow: "hidden", boxShadow: "0 0 0 6px #efe8dc" }}>
          <Img src={art} style={{ position: "absolute", left: -330, top: -40, width: 1080, height: 1080 }} />
        </div>
        <div style={{ position: "absolute", left: 150, top: 330, color: "#16100e" }}>
          <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 92, lineHeight: 1 }}>Ты —</div>
          <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 142, lineHeight: 1.05, letterSpacing: 2 }}>ТАНДЖИРО</div>
          <div style={{ width: 150, height: 8, background: "#c1121f", margin: "34px 0 30px" }} />
          <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 40, letterSpacing: 10, color: "#5a4a40" }}>И ЭТО ВСЯ ТВОЯ ЖИЗНЬ</div>
        </div>
        <Kanji c="#c1121f" x={48} y={70} size={54} />
      </AbsoluteFill>
    );
  }
  const fade = "linear-gradient(to right, transparent 0%, rgba(0,0,0,.35) 14%, rgba(0,0,0,.8) 28%, #000 40%)";
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 75% 40%, #3a2416 0%, #120c0a 45%, #070505 100%)" }}>
      <div style={{ position: "absolute", left: 860, top: 0, width: 1060, height: 1080, WebkitMaskImage: fade, maskImage: fade } as any}>
        <Img src={art} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080 }} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,5,5,.55), transparent 30%)" }} />
      {v === 3 ? (
        <div style={{ position: "absolute", left: 150, top: 360, color: "#f3ece2" }}>
          <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 142, lineHeight: 1, letterSpacing: 2, textShadow: "0 8px 30px rgba(0,0,0,.6)" }}>ТАНДЖИРО</div>
          <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 700, fontSize: 112, lineHeight: 1.2, color: "#e0262f", textShadow: "0 0 40px rgba(224,38,47,.35)" }}>стал демоном</div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 150, top: 300, color: "#f3ece2" }}>
          <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 92, lineHeight: 1, opacity: 0.92 }}>Ты —</div>
          <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 142, lineHeight: 1.05, letterSpacing: 2, textShadow: "0 8px 30px rgba(0,0,0,.6)" }}>ТАНДЖИРО</div>
          <div style={{ width: 150, height: 8, background: "#e0262f", margin: "34px 0 30px" }} />
          <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 40, letterSpacing: 10, color: "#d8b07a" }}>И ЭТО ВСЯ ТВОЯ ЖИЗНЬ</div>
        </div>
      )}
      <Kanji c="#e0262f" x={48} y={70} size={54} />
    </AbsoluteFill>
  );
};
