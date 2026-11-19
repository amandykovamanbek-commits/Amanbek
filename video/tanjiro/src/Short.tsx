import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Defs } from "./rig/Defs";
import { ALL_SHOTS, CH, Resolved, camLife, hudAt, useFonts } from "./Main";
import { clamp, easeInOut, easeOut, lerp, seg } from "./lib";

// YouTube Short #5 «Ты победил главного демона. И стал им.» — 1080x1920, built from the
// long video's own shots (ch13 tail + ch14), re-framed vertically per shot.
// Safe zones: text kept below y≈200 (player top bar), above y≈1540 (title/channel)
// and left of x≈950 in the lower half (like/comment rail).

const W = 1080, H = 1920;
const HOOK_VO = 0.12; // hook.mp3 starts here; «И стал им» at +2.45 s
const OUTRO_VO = 46.0; // outro.mp3
type Seg = { t0: number; t1: number; T0: number };
const S1: Seg = { t0: 3.8, t1: 9.8, T0: 853.62 }; // «Мудзан горит… делает последнее.»
const S2: Seg = { t0: 9.8, t1: 45.77, T0: 861.28 }; // ch14 «Мудзан вливает…» → «Ты возвращаешься.»
export const SHORT_DUR = 49.9;
const mainT = (s: Seg, tau: number) => s.T0 + (tau - s.t0);

// ---- vertical framing per shot: focus x (or a pan) and crop width in source px ----
type Focus = { fx: number | [number, number, number, number]; w?: number };
const FOCUS: Record<string, Focus> = {
  "13.14": { fx: [930, 1010, 0, 6] },
  "13.15": { fx: 960 },
  "14.0": { fx: 960 },
  "14.1": { fx: [470, 960, 0.15, 1.5] },
  "14.2": { fx: 960, w: 780 },
  "14.3": { fx: 960 },
  "14.4": { fx: 950 },
  "14.5": { fx: 1000 },
  "14.6": { fx: 910, w: 800 },
  "14.7": { fx: 960, w: 880 },
  "14.8": { fx: 960 },
  "14.9": { fx: 960, w: 820 },
  "14.10": { fx: [430, 1490, 0.1, -1] },
  "14.11": { fx: 960, w: 760 },
};
const cropOf = (key: string, t: number, d: number) => {
  const f = FOCUS[key] || { fx: 960 };
  const w = f.w ?? 720;
  let fx: number;
  if (typeof f.fx === "number") fx = f.fx;
  else {
    const [a, b, t0, t1] = f.fx;
    fx = lerp(a, b, easeInOut(seg(t, t0, t1 < 0 ? d - 0.2 : t1)));
  }
  const h = (w * H) / W;
  const x = clamp(fx - w / 2, 0, 1920 - w);
  return { x, y: 540 - h / 2, w, h, fx: x + w / 2 };
};

const ShotSvg: React.FC<{ r: Resolved; t: number; d: number; T: number; opacity?: number; zoom?: number }> = ({ r, t, d, T, opacity = 1, zoom = 1 }) => {
  const c = cropOf(`${r.ch}.${r.k}`, t, d);
  const band = (-c.y * W) / c.w; // output px of the strip above/below the 1080-tall source
  const mask = `linear-gradient(to bottom, transparent ${band * 0.45}px, #000 ${band + 40}px, #000 ${H - band - 40}px, transparent ${H - band * 0.45}px)`;
  const shot = <g transform={camLife(T)}>{r.shot.r({ t, d, T })}</g>;
  return (
    <div style={{ position: "absolute", inset: 0, opacity, transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: "50% 48%" }}>
      {/* blurred fill behind the strips */}
      <div style={{ position: "absolute", left: -70, top: -70, width: W + 140, height: H + 140, filter: "blur(28px) brightness(0.5) saturate(1.15)" }}>
        <svg viewBox={`${c.fx - 303.75} 0 607.5 1080`} width={W + 140} height={H + 140} preserveAspectRatio="xMidYMid slice">{shot}</svg>
      </div>
      <svg viewBox={`${c.x} ${c.y} ${c.w} ${c.h}`} width={W} height={H} style={{ position: "absolute", inset: 0, WebkitMaskImage: mask, maskImage: mask }}>{shot}</svg>
    </div>
  );
};

const SH = (ch: number, k: number) => ALL_SHOTS.find((r) => r.ch === ch && r.k === k)!;
const FACE = SH(14, 2);

// shot layer for a main-timeline time T inside a segment, with the long video's cut styles
const SegShots: React.FC<{ s: Seg; tau: number; extendLast?: number }> = ({ s, tau, extendLast = 0 }) => {
  const T = mainT(s, tau);
  const T0 = s.T0, T1 = mainT(s, s.t1);
  const inSeg = ALL_SHOTS.filter((r) => r.end > T0 && r.start < T1);
  let idx = inSeg.findIndex((r) => T >= r.start && T < r.end);
  if (idx < 0) idx = T < inSeg[0].start ? 0 : inSeg.length - 1;
  const cur = inSeg[idx];
  const prev = idx > 0 ? inSeg[idx - 1] : null;
  const isLast = cur === inSeg[inSeg.length - 1];
  const d = isLast ? Math.max(cur.end, T1) - cur.start + extendLast : cur.end - cur.start;
  const tin = T - Math.max(cur.start, T0);
  const cut = idx === 0 ? (s === S1 ? "flash" : "cut") : cur.shot.cut || "cut";
  const fadeK = cut === "fade" && prev ? clamp(tin / 0.5) : 1;
  const blackK = cut === "black" ? clamp(tin / 0.5) : 1;
  const flashK = cut === "flash" ? clamp(tin / 0.25) : 1;
  return (
    <>
      {prev && fadeK < 1 ? <ShotSvg r={prev} t={T - prev.start} d={prev.end - prev.start} T={T} /> : null}
      <ShotSvg r={cur} t={T - cur.start} d={d} T={T} opacity={fadeK * blackK} />
      {flashK < 1 ? <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 1 - flashK }} /> : null}
    </>
  );
};

// ---- captions: 1–3 words, big, current word orange ----
type SW = { w: string; s: number; e: number };
const WORDS: SW[] = [
  ...CH[13].words.map((w) => ({ w: w.w, s: CH[13].start + w.s, e: CH[13].start + w.e })).filter((w) => w.e > S1.T0 + 0.2 && w.s < mainT(S1, S1.t1)).map((w) => ({ w: w.w, s: Math.max(S1.t0 + 0.3, w.s - S1.T0 + S1.t0), e: w.e - S1.T0 + S1.t0 })),
  ...CH[14].words.map((w) => ({ w: w.w, s: CH[14].start + w.s - S2.T0 + S2.t0, e: CH[14].start + w.e - S2.T0 + S2.t0 })),
];
type Chunk = { words: SW[]; s: number; e: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: SW[] = [];
  const len = (a: SW[]) => a.map((x) => x.w).join(" ").length;
  WORDS.forEach((w, i) => {
    cur.push(w);
    const n = WORDS[i + 1];
    const L = len(cur);
    const weak = /^[а-яё]{1,2}$/i.test(w.w); // never leave «в», «и», «на», «не» hanging at a chunk end
    const end = !n || /[.!?…:»]$/.test(w.w) || (/[,—]$/.test(w.w) && L > 6) || (!weak && (cur.length >= 4 || L + 1 + n.w.length > 21)) || n.s - w.e > 0.45;
    if (end) { out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e }); cur = []; }
  });
  return out;
})();
const Captions: React.FC<{ tau: number }> = ({ tau }) => {
  const i = CHUNKS.findIndex((c, k) => tau >= c.s - 0.06 && tau < (CHUNKS[k + 1] ? Math.min(CHUNKS[k + 1].s - 0.06, c.e + 0.5) : c.e + 0.6));
  if (i < 0) return null;
  const c = CHUNKS[i];
  const k = easeOut(clamp((tau - c.s + 0.06) / 0.12));
  return (
    <div style={{ position: "absolute", left: 70, width: 900, top: 1150, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", fontFamily: "Rubik, sans-serif", fontWeight: 900, fontSize: 82, lineHeight: 1.12, textTransform: "uppercase", color: "#fff", WebkitTextStroke: "12px #0b0807", paintOrder: "stroke fill", textShadow: "0 8px 22px rgba(0,0,0,.6)", opacity: k, transform: `scale(${0.9 + 0.1 * k})` }}>
        {c.words.map((w, j) => {
          const on = tau >= w.s - 0.03 && tau < w.e + 0.08;
          return (
            <span key={j} style={{ color: on ? "#ff9a2a" : "#fff", display: "inline-block", transform: on ? "translateY(-5px)" : "none", margin: "0 12px" }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};

// ---- HUD, vertical layout ----
const VHud: React.FC<{ T: number; vis: number }> = ({ T, vis }) => {
  const { st } = hudAt(T);
  const box: React.CSSProperties = { position: "absolute", top: 196, padding: "10px 22px 12px", background: "rgba(10,8,8,.74)", border: "3px solid rgba(255,255,255,.2)", borderRadius: 14, color: "#fff", fontFamily: "Rubik, sans-serif", fontWeight: 900, fontSize: 44, letterSpacing: 2, opacity: vis, display: "flex", alignItems: "center", gap: 12 };
  const small: React.CSSProperties = { fontSize: 32, opacity: 0.8 };
  return (
    <>
      <div style={{ ...box, left: 44 }}><span style={small}>ТЕБЕ</span><span>{st.age}</span><span style={small}>ЛЕТ</span></div>
      <div style={{ ...box, right: 44 }}>
        <span style={small}>СЕМЬЯ</span><span>{st.fam}/6</span>
        <span style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 6 }, (_, i) => <span key={i} style={{ width: 16, height: 16, borderRadius: 8, background: i < st.fam ? (st.fam === 1 ? "#ff7ab4" : "#ff9a2a") : "transparent", border: "3px solid " + (i < st.fam ? "transparent" : "rgba(255,255,255,.45)") }} />)}
        </span>
      </div>
      {st.heart ? <div style={{ ...box, top: 300, left: "50%", transform: "translateX(-50%)", color: "#ff3a4a" }}><span style={small}>СЕРДЦЕ</span>— — —</div> : null}
    </>
  );
};

// ---- hook: closed demon eyes snap open on «И стал им» ----
const HOOK_WORDS: [string, number][] = [["ТЫ", 0], ["ПОБЕДИЛ", 0.14], ["ГЛАВНОГО", 0.74], ["ДЕМОНА.", 1.44]];
const Hook: React.FC<{ tau: number }> = ({ tau }) => {
  const tI = HOOK_VO + 2.45;
  const t = tau - tI + 0.6; // the shot's shake/boom lands at t=0.6
  const after = tau - tI;
  const z = after < 0 ? 1 + 0.05 * easeInOut(clamp(tau / tI)) : 1.05 + 0.1 * Math.exp(-after * 5) + 0.02 * clamp(after / 1.2);
  const line = (txt: string, at: number, size: number, c = "#fff", font = "Rubik, sans-serif", weight = 900) => {
    const k = clamp((tau - HOOK_VO - at + 0.04) / 0.12);
    return (
      <span key={txt} style={{ display: "inline-block", margin: "0 14px", opacity: k, transform: `scale(${1.25 - 0.25 * easeOut(k)})`, fontFamily: font, fontWeight: weight, fontSize: size, color: c }}>{txt}</span>
    );
  };
  const stroke: React.CSSProperties = { WebkitTextStroke: "13px #0b0807", paintOrder: "stroke fill", textShadow: "0 10px 26px rgba(0,0,0,.7)", lineHeight: 1.08, textAlign: "center", whiteSpace: "nowrap" };
  return (
    <>
      <ShotSvg r={FACE} t={t} d={3.2} T={FACE.start + Math.max(0, t)} zoom={z} />
      {after > 0 && after < 0.35 ? <div style={{ position: "absolute", inset: 0, background: "#ff1e30", mixBlendMode: "screen", opacity: 0.55 * (1 - after / 0.35) }} /> : null}
      <div style={{ position: "absolute", top: 214, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: seg(tau, 0, 0.15) }}>
        <div style={{ fontFamily: "Rubik, sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: 2, color: "#fff", background: "rgba(10,8,8,.8)", border: "4px solid #ff9a2a", borderRadius: 14, padding: "8px 22px" }}>
          <span style={{ color: "#ff9a2a" }}>⚠ </span>ФИНАЛ МАНГИ
        </div>
      </div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", ...stroke }}>
        <div>{line(HOOK_WORDS[0][0], HOOK_WORDS[0][1], 112)}{line(HOOK_WORDS[1][0], HOOK_WORDS[1][1], 112)}</div>
        <div>{line(HOOK_WORDS[2][0], HOOK_WORDS[2][1], 112)}</div>
        <div>{line(HOOK_WORDS[3][0], HOOK_WORDS[3][1], 112)}</div>
      </div>
      <div style={{ position: "absolute", top: 1180, left: 40, right: 100, display: "flex", justifyContent: "center", ...stroke, WebkitTextStroke: "14px #0b0807" }}>
        <span style={{ display: "inline-block", fontFamily: "'Reggae One', Rubik, sans-serif", fontSize: 118, letterSpacing: "-0.1em", color: "#ff2a3a", opacity: clamp(after / 0.08), transform: `scale(${after < 0 ? 1.4 : 1 + 0.4 * Math.exp(-after * 9)}) rotate(-3deg)` }}>И СТАЛ ИМ.</span>
      </div>
    </>
  );
};

// ---- outro CTA over the last shot ----
const Outro: React.FC<{ tau: number }> = ({ tau }) => {
  const a = tau - (OUTRO_VO - 0.15);
  const k1 = easeOut(clamp(a / 0.3)), k2 = easeOut(clamp((a - 1.45) / 0.3));
  const stroke: React.CSSProperties = { WebkitTextStroke: "12px #0b0807", paintOrder: "stroke fill", textShadow: "0 10px 26px rgba(0,0,0,.6)", whiteSpace: "nowrap", textAlign: "center" };
  const bob = Math.sin(a * 6) * 10;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(0,0,0,.6))", opacity: k1 }} />
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", ...stroke }}>
        <div style={{ fontFamily: "'Reggae One', Rubik, sans-serif", fontSize: 128, letterSpacing: "-0.2em", color: "#fff", opacity: k1, transform: `scale(${1.2 - 0.2 * k1})` }}>ВСЯ ТВОЯ</div>
        <div style={{ fontFamily: "'Reggae One', Rubik, sans-serif", fontSize: 170, letterSpacing: "-0.2em", color: "#ff9a2a", opacity: k1, transform: `scale(${1.2 - 0.2 * k1})`, marginTop: -10 }}>ЖИЗНЬ</div>
      </div>
      <div style={{ position: "absolute", top: 1170, left: 40, right: 110, display: "flex", flexDirection: "column", alignItems: "center", opacity: k2, transform: `translateY(${(1 - k2) * 30}px)` }}>
        <div style={{ fontFamily: "Rubik, sans-serif", fontWeight: 900, fontSize: 66, color: "#fff", ...stroke }}>ПОЛНОЕ ВИДЕО</div>
        <div style={{ fontFamily: "Rubik, sans-serif", fontWeight: 900, fontSize: 66, color: "#fff", ...stroke }}>НА КАНАЛЕ</div>
        <svg width={120} height={110} viewBox="0 0 120 110" style={{ marginTop: 8, transform: `translateY(${bob}px)` }}>
          <path d="M 40 6 L 80 6 L 80 52 L 112 52 L 60 104 L 8 52 L 40 52 Z" fill="#ff9a2a" stroke="#0b0807" strokeWidth={8} strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
};

export const Short: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tau = frame / fps;
  const seg2 = tau >= S2.t0;
  const s = seg2 ? S2 : S1;
  const T = mainT(s, Math.min(tau, s.t1 - 0.001));
  const hudVis = seg(tau, S1.t0 + 0.4, S1.t0 + 0.8) * (1 - seg(tau, S2.t1 + 0.1, S2.t1 + 0.5));
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><Defs /></svg>
      {tau < S1.t0 ? (
        <Hook tau={tau} />
      ) : (
        <SegShots s={s} tau={tau} extendLast={seg2 ? SHORT_DUR - S2.t1 : 0} />
      )}
      <Img src={staticFile("tex/paper.png")} style={{ position: "absolute", inset: 0, width: W, height: H, objectFit: "cover", mixBlendMode: "multiply", opacity: 0.45 }} />
      <Img src={staticFile("tex/vignette.png")} style={{ position: "absolute", inset: 0, width: W, height: H }} />
      {tau >= S1.t0 ? <VHud T={T} vis={hudVis} /> : null}
      {tau >= S1.t0 && tau < S2.t1 + 0.2 ? <Captions tau={tau} /> : null}
      {tau >= S2.t1 - 0.2 ? <Outro tau={tau} /> : null}
    </AbsoluteFill>
  );
};
