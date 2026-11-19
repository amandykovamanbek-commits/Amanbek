import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./data/timeline.json";
import { Defs } from "./rig/Defs";
import { SHOTS, Shot } from "./shots";
import { HUD_EVENTS } from "./shots/hud";
import { InkWipe } from "./scenes/FX";
import { clamp, easeOut, seg } from "./lib";

export const GAP = 1.6;
export const INTRO = 2.4;
export const OUTRO = 4.0;
type Word = { w: string; p: number; s: number; e: number };
type Chapter = { i: number; head: string; start: number; dur: number; words: Word[] };
const CH = (timeline as any).chapters as Chapter[];
export const TOTAL = (timeline as any).end + OUTRO;

const norm = (w: string) => w.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]/g, "");

// resolve cue phrases to absolute times --------------------------------------
export type Resolved = { shot: Shot; start: number; end: number; ch: number; k: number };
function cueTime(ch: Chapter, cue: string, from: number): [number, number] {
  const cw = cue.split(/\s+/).map(norm).filter(Boolean);
  for (let i = from; i < ch.words.length; i++) {
    let ok = true;
    for (let j = 0; j < cw.length; j++) if (norm(ch.words[i + j]?.w || "") !== cw[j]) { ok = false; break; }
    if (ok) return [ch.start + ch.words[i].s, i];
  }
  throw new Error(`cue not found in ch${ch.i}: "${cue}" after word ${from}`);
}
export const chapterVisualStart = (c: Chapter) => (c.i === 0 ? 0 : c.start - GAP + 0.55);
export function resolveCue(chi: number, cue: string) {
  return cueTime(CH[chi], cue, 0)[0];
}
const RESOLVED: Resolved[] = (() => {
  const out: Resolved[] = [];
  CH.forEach((c, ci) => {
    const shots = SHOTS[c.i] || [];
    let from = 0;
    const starts: number[] = [];
    shots.forEach((s, k) => {
      if (k === 0 || s.at === "^") { starts.push(chapterVisualStart(c)); return; }
      const [tm, idx] = cueTime(c, s.at, from);
      from = idx;
      starts.push(tm - (s.lead ?? 0.2) + (s.delay ?? 0));
    });
    const chEnd = ci + 1 < CH.length ? chapterVisualStart(CH[ci + 1]) : TOTAL;
    shots.forEach((s, k) => out.push({ shot: s, start: starts[k], end: k + 1 < shots.length ? starts[k + 1] : chEnd, ch: c.i, k }));
  });
  return out;
})();
export const ALL_SHOTS = RESOLVED;

// fonts ------------------------------------------------------------------------
const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const css = document.createElement("style");
    fetch(staticFile("fonts/fonts.css")).then((r) => r.text()).then(async (txt) => {
      css.innerHTML = txt.replace(/url\(([^)]+)\)/g, (_, f) => `url(${staticFile("fonts/" + f)})`);
      document.head.appendChild(css);
      await Promise.all([
        document.fonts.load("900 40px Rubik", "Тест"), document.fonts.load("700 40px Rubik", "Тест"),
        document.fonts.load("40px 'Rubik Dirt'", "Тест"), document.fonts.load("40px 'Yuji Boku'", "炭鬼"),
      ]);
      continueRender(handle);
    });
  }, [handle]);
};

// subtitles --------------------------------------------------------------------
type Chunk = { words: Word[]; s: number; e: number; off: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  for (const c of CH) {
    let cur: Word[] = [];
    const flush = () => { if (cur.length) out.push({ words: cur, s: c.start + cur[0].s, e: c.start + cur[cur.length - 1].e, off: c.start }); cur = []; };
    c.words.forEach((w, i) => {
      cur.push(w);
      const len = cur.map((x) => x.w).join(" ").length;
      const end = /[.!?…:»]$/.test(w.w) || (/[,—]$/.test(w.w) && len > 26) || len > 40 || (c.words[i + 1] && c.words[i + 1].p !== w.p);
      if (end) flush();
    });
    flush();
  }
  return out;
})();

const Subtitles: React.FC<{ T: number }> = ({ T }) => {
  const i = CHUNKS.findIndex((c, k) => T >= c.s - 0.05 && T < (CHUNKS[k + 1] ? Math.min(CHUNKS[k + 1].s - 0.05, c.e + 0.6) : c.e + 0.8));
  if (i < 0) return null;
  const c = CHUNKS[i];
  const k = clamp((T - c.s + 0.05) / 0.12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", justifyContent: "center", opacity: k }}>
      <div style={{ maxWidth: 1500, textAlign: "center", fontFamily: "Rubik, sans-serif", fontWeight: 900, fontSize: 54, lineHeight: 1.18, letterSpacing: 0.5, color: "#fff", WebkitTextStroke: "8px #0b0807", paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,.55)" }}>
        {c.words.map((w, j) => {
          const on = T >= c.off + w.s - 0.03 && T < c.off + w.e + 0.08;
          const past = T >= c.off + w.e;
          return (
            <span key={j} style={{ color: on ? "#ff9a2a" : past ? "#fff" : "#f1ece4", display: "inline-block", transform: on ? "translateY(-4px)" : "none", margin: "0 9px" }}>
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// HUD: age, family counter, special counters -----------------------------------
type HudState = { age: number; fam: number; famLabel?: string; friends?: number; countdown?: [number, number]; heart?: boolean };
const HUD_RESOLVED = HUD_EVENTS.map((e) => {
  const T = e.at ? cueTime(CH[e.ch], e.at, 0)[0] : CH[e.ch].start - 0.4;
  const set = e.cdTo ? { ...(e.set || {}), countdown: [T, cueTime(CH[e.cdTo[0]], e.cdTo[1], 0)[0]] as [number, number] } : e.set;
  return { ...e, set, T };
}).sort((a, b) => a.T - b.T);
const hudAt = (T: number) => {
  let st: HudState = { age: 13, fam: 6 };
  let changedAge = -99, changedFam = -99;
  for (const e of HUD_RESOLVED) {
    if (e.T > T) break;
    if (e.age !== undefined && e.age !== st.age) changedAge = e.T;
    if (e.fam !== undefined && e.fam !== st.fam) changedFam = e.T;
    st = { ...st, ...e.set };
    if (e.age !== undefined) st.age = e.age;
    if (e.fam !== undefined) st.fam = e.fam;
  }
  return { st, changedAge, changedFam };
};

const HUD: React.FC<{ T: number; vis: number }> = ({ T, vis }) => {
  const { st, changedAge, changedFam } = hudAt(T);
  const pa = seg(T, changedAge, changedAge + 0.6), pf = seg(T, changedFam, changedFam + 0.8);
  const box: React.CSSProperties = { position: "absolute", top: 34, padding: "10px 24px 12px", background: "rgba(10,8,8,.72)", border: "3px solid rgba(255,255,255,.18)", borderRadius: 14, color: "#fff", fontFamily: "Rubik, sans-serif", fontWeight: 900, fontSize: 40, letterSpacing: 2, opacity: vis };
  let cd: string | null = null;
  if (st.countdown) {
    const [t0, t1] = st.countdown;
    const left = Math.max(0, 3599 * (1 - clamp((T - t0) / (t1 - t0))));
    cd = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(Math.floor(left % 60)).padStart(2, "0")}`;
  }
  return (
    <>
      <div style={{ ...box, left: 40, transform: `scale(${1 + (pa > 0 && pa < 1 ? Math.sin(pa * Math.PI) * 0.18 : 0)})`, transformOrigin: "left top" }}>
        <span style={{ fontSize: 30, opacity: 0.8, marginRight: 12 }}>ТЕБЕ</span>
        <span style={{ color: pa > 0 && pa < 1 ? "#ff9a2a" : "#fff" }}>{st.age}</span>
        <span style={{ fontSize: 30, opacity: 0.8, marginLeft: 10 }}>{st.age === 13 ? "ЛЕТ" : "ЛЕТ"}</span>
      </div>
      <div style={{ ...box, right: 40, display: "flex", alignItems: "center", gap: 14, transform: `scale(${1 + (pf > 0 && pf < 1 ? Math.sin(pf * Math.PI) * 0.15 : 0)})`, transformOrigin: "right top" }}>
        {st.friends ? (
          <>
            <span style={{ fontSize: 30, opacity: 0.8 }}>СЕМЬЯ</span><span>{st.fam}/6</span>
            <span style={{ fontSize: 30, opacity: 0.8, marginLeft: 12 }}>ДРУЗЬЯ</span><span style={{ color: "#ffcf5a" }}>{st.friends}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 30, opacity: 0.8 }}>СЕМЬЯ</span>
            <span style={{ color: pf > 0 && pf < 1 ? "#ff4a4a" : "#fff" }}>{st.fam}/6</span>
            <span style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} style={{ width: 16, height: 16, borderRadius: 8, background: i < st.fam ? (i === 0 && st.fam === 1 ? "#ff7ab4" : "#ff9a2a") : "transparent", border: "3px solid " + (i < st.fam ? "transparent" : "rgba(255,255,255,.45)") }} />
              ))}
            </span>
          </>
        )}
      </div>
      {cd ? (
        <div style={{ ...box, left: "50%", transform: "translateX(-50%)", color: "#ffcf5a" }}>
          <span style={{ fontSize: 30, opacity: 0.85, marginRight: 12 }}>ДО РАССВЕТА</span>{cd}
        </div>
      ) : null}
      {st.heart ? (
        <div style={{ ...box, left: "50%", transform: "translateX(-50%)", color: "#ff3a4a" }}>
          <span style={{ fontSize: 30, opacity: 0.85, marginRight: 12 }}>СЕРДЦЕ</span>— — —
        </div>
      ) : null}
    </>
  );
};

// chapter card -------------------------------------------------------------------
const Card: React.FC<{ T: number }> = ({ T }) => {
  for (const c of CH) {
    if (c.i === 0) continue;
    const t0 = c.start - GAP;
    const t = T - t0;
    if (t < 0 || t > GAP + 0.9) continue;
    const ink = t < 0.55 ? t / 0.55 : t < GAP ? 1 : 1 + (t - GAP) / 0.75;
    const [num, name] = c.head.replace(/\s*\(.*\)/, "").split(/\.\s*/);
    const title = seg(t, 0.35, 0.7) * (1 - seg(t, GAP + 0.1, GAP + 0.6));
    return (
      <>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="cardInk" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={c.i} />
              <feDisplacementMap in="SourceGraphic" scale="90" />
            </filter>
          </defs>
          <g filter="url(#cardInk)"><InkWipe k={ink} seed={c.i * 3 + 1} /></g>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: title }}>
          <div style={{ fontFamily: "Rubik, sans-serif", fontWeight: 700, fontSize: 40, letterSpacing: 14, color: "#c9a26a", transform: `translateY(${(1 - easeOut(seg(t, 0.35, 0.8))) * 20}px)` }}>{num}</div>
          <div style={{ fontFamily: "'Rubik Dirt', Rubik, sans-serif", fontSize: Math.min(150, 1550 / (name.length * 0.74)), whiteSpace: "nowrap", color: "#f4ede0", letterSpacing: 8, transform: `scale(${1.1 - easeOut(seg(t, 0.35, 0.9)) * 0.1})` }}>{name}</div>
          <div style={{ width: 120 * easeOut(seg(t, 0.5, 1.1)), height: 8, background: "#c1121f", marginTop: 10 }} />
        </div>
      </>
    );
  }
  return null;
};

// camera life: the frame never freezes (slow drift + tiny roll), on top of each shot's own move
const camLife = (T: number) => {
  const P = Math.PI * 2;
  const dx = 6 * Math.sin(P * 0.07 * T) + 3 * Math.sin(P * 0.13 * T + 1);
  const dy = 4 * Math.sin(P * 0.05 * T + 2) + 2 * Math.sin(P * 0.11 * T);
  const r = 0.35 * Math.sin(P * 0.06 * T + 0.5) + 0.12 * Math.sin(P * 0.12 * T);
  return `translate(960 540) scale(1.02) rotate(${r.toFixed(3)}) translate(${(-960 + dx).toFixed(2)} ${(-540 + dy).toFixed(2)})`;
};

// shot renderer ----------------------------------------------------------------------
const renderShot = (r: Resolved, T: number) => r.shot.r({ t: T - r.start, d: r.end - r.start, T });

export const Main: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const idx = RESOLVED.findIndex((r) => T >= r.start && T < r.end);
  const cur = idx >= 0 ? RESOLVED[idx] : null;
  const prev = idx > 0 ? RESOLVED[idx - 1] : null;
  const tin = cur ? T - cur.start : 0;
  const cut = cur?.shot.cut || "cut";
  const fadeK = cut === "fade" && prev && prev.ch === cur!.ch ? clamp(tin / 0.5) : 1;
  const flashK = cut === "flash" ? clamp(tin / 0.25) : 1;
  const blackK = cut === "black" ? clamp(tin / 0.5) : 1;
  // HUD hidden during intro, chapter cards and the very end
  let hudVis = clamp((T - INTRO - 1) / 0.5);
  for (const c of CH) if (c.i > 0 && T > c.start - GAP && T < c.start + 0.7) hudVis = Math.min(hudVis, 1 - clamp(Math.min(T - (c.start - GAP), c.start + 0.7 - T) / 0.3));
  hudVis = Math.min(hudVis, 1 - clamp((T - (TOTAL - OUTRO + 0.5)) / 0.5));
  if (cur?.shot.noHud) hudVis = Math.min(hudVis, 1 - clamp(tin / 0.3));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Defs />
        <g transform={camLife(T)}>
        {prev && fadeK < 1 ? renderShot(prev, T) : null}
        {cur ? <g opacity={fadeK * blackK}>{renderShot(cur, T)}</g> : null}
        </g>
        {flashK < 1 ? <rect width={1920} height={1080} fill="#fff" opacity={1 - flashK} /> : null}
      </svg>
      <Img src={staticFile("tex/paper.png")} style={{ position: "absolute", inset: 0, width: 1920, height: 1080, mixBlendMode: "multiply", opacity: 0.55 }} />
      <Img src={staticFile("tex/vignette.png")} style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} />
      <HUD T={T} vis={hudVis} />
      <Subtitles T={T} />
      <Card T={T} />
      {T < INTRO + 0.4 ? <Warning T={T} /> : null}
      {CH.map((c) => (
        <Sequence key={c.i} from={Math.round(c.start * fps)} durationInFrames={Math.ceil((c.dur + 0.5) * fps)} layout="none">
          <Audio src={staticFile(`vo/${String(c.i).padStart(2, "0")}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Warning: React.FC<{ T: number }> = ({ T }) => {
  const o = seg(T, 0.1, 0.5) * (1 - seg(T, INTRO - 0.4, INTRO + 0.2));
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.62 * (1 - seg(T, INTRO - 0.3, INTRO + 0.3))})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: o, fontFamily: "Rubik, sans-serif", fontWeight: 900, fontSize: 52, color: "#fff", border: "4px solid #ff9a2a", borderRadius: 18, padding: "26px 46px", letterSpacing: 1 }}>
        <span style={{ color: "#ff9a2a" }}>⚠ </span>Полный пересказ манги, включая финал
      </div>
    </div>
  );
};
