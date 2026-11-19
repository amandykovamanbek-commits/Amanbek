import React from "react";
import type { Shot } from "./types";
import { Stage, Act, push, pan, camLerp, Caption, Dark, withShake, hit, Bars } from "../kit";
import { SnowMountains, Interior, Forest, Paper, Void, Garden, Estate, Moon, Par, Sky, Butterflies, Webs, Mist } from "../scenes/BG";
import { Snow, Kanji, WaterArc, FireArc, PinkFire, Lightning, Slash, Flash, SpeedLines, BloodSplat, Box, Gourd, Coin, Threads, DemonSil, Embers, Petals } from "../scenes/FX";
import { walk, run, seg, easeOut, easeInOut, talk, lerp, rnd } from "../lib";
import { Char } from "../rig/Char";

// ======================================================================= CH6 FRIENDS
const DrumRoom = (c: any, t: number) => <Interior cam={c} t={t} fire={0} dark warm={false} />;
export const CH6: Shot[] = [
  {
    at: "^", music: "comedy",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -60, 60, 1)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
        <Act id="tanjiro" t={t} p={{ x: 760, y: 980, s: 0.9, box: true, expr: "smile", ...walk(t, 0.8, 0.7) }} />
        <Act id="zenitsu" t={t} p={{ x: 1250, y: 980, s: 0.85, face: -1, expr: "cry", op: seg(t, 0.4, 1) }} />
        <Char id="inosuke" p={{ x: 1600, y: 980, s: 0.85, face: -1, op: seg(t, 0.8, 1.4) }} t={t} />
      </Stage>
    ),
  },
  {
    at: "Зеницу — трус", cut: "cut", sfx: [[0.5, "scream", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1.3, 1.4, 0, -140), t, 0.25)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
        <Act id="tanjiro" t={t} p={{ x: 760, y: 1060, s: 1.05, box: true, expr: "sad" }} />
        <Act id="zenitsu" t={t} p={{ x: 1060, y: 1080 + Math.sin(t * 30) * 4, s: 1.02, face: -1, expr: "cry", tears: true, talk: talk(t), lean: 30, aR: [120, 40], aL: [100, 40] }} />
        <Kanji ch="涙" x={1600} y={380} t={t} size={160} c="#7fc0ff" dur={2.6} />
      </Stage>
    ),
  },
  {
    at: "Но стоит ему потерять сознание", cut: "fade", music: "epic", sfx: [[1.4, "thunder", 1]],
    r: ({ t, d }) => {
      const strike = seg(t, 1.3, 1.6);
      return (
        <Stage cam={withShake(push(t, d, 1.05, 1.15), t, hit(t, 1.4, 0.7))} bg={(c) => <Void t={t} c="#0a0800" c2="#3a2a00" />}>
          {strike > 0 ? <Lightning x1={200} y1={600} x2={1800} y2={560} t={t} w={14} /> : null}
          <Act id="zenitsu" t={t} p={{ x: lerp(560, 1400, easeOut(strike)), y: 1000, s: 1.15, expr: "closed", blink: 1, sword: "R", aR: [lerp(-40, 100, easeOut(strike)), 10], sw: lerp(-60, 90, easeOut(strike)), lean: 34, lR: [60, -80], lL: [-40, -10], aL: [-40, 40] }} />
          <Flash k={seg(t, 1.35, 1.7)} c="#fff4c0" />
          <Kanji ch="雷" x={1600} y={380} t={t - 1.4} size={220} c="#ffd23a" dur={d} />
        </Stage>
      );
    },
  },
  {
    at: "И Иноске", cut: "flash", music: "comedy", sfx: [[0.3, "whoosh", 0.8]],
    r: ({ t, d }) => {
      const k = seg(t, 0, 1.2);
      return (
        <Stage cam={push(t, d, 1, 1.08)} bg={(c) => (<><Par cam={c} d={0}><Sky tod="night" /></Par><Par cam={c} d={0.05}><Moon x={960} y={520} r={330} /></Par></>)}>
          <Char id="inosuke" p={{ x: lerp(500, 1300, k), y: lerp(1100, 860, Math.sin(k * Math.PI)) + 200 * (1 - Math.sin(k * Math.PI)), s: 1, sword: "R", sw: 120, aR: [150, 20], aL: [-120, -20], lR: [40, -90], lL: [-30, -70], rot: lerp(-10, 10, k) }} t={t} />
          <Kanji ch="猪" x={1600} y={300} t={t} size={180} c="#9fb6c8" dur={d} />
        </Stage>
      );
    },
  },
  {
    at: "Он хочет драться со всеми", cut: "cut", sfx: [[0.3, "clang", 0.8], [1.1, "clang", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={withShake(pan(t, d, -60, 60, 1.15), t, 0.2)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
        <Act id="tanjiro" t={t} p={{ x: 760, y: 1000, s: 1, expr: "shock", sword: "R", sw: 140, aR: [70, 50] }} />
        <Char id="inosuke" p={{ x: 1180 + Math.sin(t * 8) * 20, y: 1000, s: 1, face: -1, sword: "R", sw: 120 + Math.sin(t * 8) * 30, aR: [100 + Math.sin(t * 8) * 30, 10], aL: [-60, -40], lean: 20, lR: [30, -20], lL: [-30, 10] }} t={t} />
      </Stage>
    ),
  },
  {
    at: "В доме с барабанами", cut: "fade", music: "battle", sfx: [[0.3, "drum", 1], [1.2, "drum", 1], [2.1, "drum", 1]],
    r: ({ t, d }) => {
      const r = Math.floor(t / 0.9) * 90 + easeInOut(seg(t % 0.9, 0, 0.3)) * 90 - 90;
      return (
        <Stage cam={{ x: 0, y: 0, z: 1.05, rot: r }} bg={(c) => DrumRoom(c, t)}>
          <Act id="tanjiro" t={t} p={{ x: 960, y: 760, s: 0.62, expr: "pain", rot: -r * 0.85, lean: 20, aR: [140, 10], aL: [-140, -10] }} />
          {[0, 1, 2].map((i) => <g key={i} transform={`translate(${500 + i * 450} 300)`}><ellipse rx={60} ry={40} fill="#c84a2a" stroke="#15100e" strokeWidth={6} /><rect x={-60} y={0} width={120} height={60} fill="#8a3a1a" stroke="#15100e" strokeWidth={5} /></g>)}
        </Stage>
      );
    },
  },
  {
    at: "У тебя сломаны рёбра", cut: "cut", sfx: [[0.8, "water", 1], [1.0, "slash", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={withShake(camLerp(t, d, { z: 1.1, rot: 20 }, { z: 1.2, rot: 0 }), t, hit(t, 1, 0.5))} bg={(c) => DrumRoom(c, t)}>
        <WaterArc x={960} y={540} r={360} t={t} k={seg(t, 0.7, 1.2)} a0={-180} sweep={300} />
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1000, s: 1.05, expr: "fierce", blood: true, sword: "R", aR: [lerp(-30, 130, easeOut(seg(t, 0.7, 1.1))), 10], sw: lerp(210, 70, easeOut(seg(t, 0.7, 1.1))), lean: 12, lR: [20, -10], lL: [-24, 10] }} />
      </Stage>
    ),
  },
  {
    at: "А потом говоришь демону", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.15, 1.25, 0, -40)} bg={(c) => DrumRoom(c, t)}>
        <g opacity={1 - seg(t, 2.5, d) * 0.6}><DemonSil x={1250} y={1060} s={1.05} t={t} c="#2a1a14" eyes="#ffcf9a" claws={false} /></g>
        {[0, 1].map((i) => <path key={i} d={`M ${1225 + i * 50} 560 q ${i ? 6 : -6} 30 0 60`} stroke="#bfe6ff" strokeWidth={6} fill="none" opacity={seg(t, 2, 2.6)} />)}
        <Act id="tanjiro" t={t} p={{ x: 760, y: 1040, s: 1.05, expr: "soft", talk: talk(t, t > 0.6 && t < 2.4) }} />
        <Embers t={t} n={24} c="#ffd8a8" />
      </Stage>
    ),
  },
  {
    at: "Иноске пытается разбить твой ящик", cut: "fade", music: "tense", sfx: [[0.8, "hit", 0.8], [1.8, "hit", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => <Forest cam={c} t={t} tod="night" />}>
        <Box x={860} y={1000} s={1} />
        <Char id="inosuke" p={{ x: 1300, y: 1000, s: 1, face: -1, sword: "R", sw: 80 + Math.sin(t * 6) * 40, aR: [120 + Math.sin(t * 6) * 30, 10], lean: 16 }} t={t} />
      </Stage>
    ),
  },
  {
    at: "Зеницу, тот самый трус", cut: "cut", sfx: [[0.6, "hit", 0.9], [1.6, "hit", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1.15, 1.25, -40, 0), t, hit(t % 1, 0.6, 0.3, 0.6))} bg={(c) => <Forest cam={c} t={t} tod="night" />}>
        <Box x={860} y={1000} s={1} />
        <Act id="zenitsu" t={t} p={{ x: 900, y: 1000, s: 0.95, expr: "pain", lean: -22, aR: [-120, -40], aL: [-140, -30], blood: t > 1 }} />
        <Char id="inosuke" p={{ x: 1340, y: 1000, s: 1, face: -1, sword: "R", sw: 60, aR: [lerp(150, 60, (t * 1) % 1), 10], lean: 16 }} t={t} />
      </Stage>
    ),
  },
  {
    at: "Он слышал, как ты", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.07)} bg={(c) => <Forest cam={c} t={t} tod="night" />}>
        <Act id="zenitsu" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "fierce", tears: true, blood: true }} />
      </Stage>
    ),
  },
  {
    at: "Так у тебя появляются друзья", cut: "fade", music: "warm", sfx: [[0.2, "chime", 0.7]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.15)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring />}>
        <Act id="zenitsu" t={t} p={{ x: 640, y: 1000, s: 0.95, expr: "happy" }} />
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1000, s: 1, box: true, expr: "happy", aR: [140, 20] }} />
        <Char id="inosuke" p={{ x: 1280, y: 1000, s: 0.95, face: -1, sword: "R", sw: 160, aR: [150, 20], aL: [-150, -20] }} t={t} />
        <Kanji ch="友" x={1650} y={360} t={t} size={200} c="#ffcf5a" dur={d} />
      </Stage>
    ),
  },
  {
    at: "А на следующей горе", cut: "fade", music: "dread",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.12)} bg={(c) => <Forest cam={c} t={t} webs />}>
        <Dark op={0.15} c="#200010" />
      </Stage>
    ),
  },
];

// ======================================================================= CH7 WEB
const Spider = (c: any, t: number) => <Forest cam={c} t={t} webs />;
export const CH7: Shot[] = [
  {
    at: "^", music: "dread",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -80, 80, 1.02)} bg={(c) => Spider(c, t)}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path d={`M ${400 + i * 360} -50 L ${400 + i * 360} ${300 + i * 60 + Math.sin(t * 2 + i) * 30}`} stroke="#e8eef8" strokeWidth={2} />
            <DemonSil x={400 + i * 360} y={500 + i * 60 + Math.sin(t * 2 + i) * 30} s={0.35} t={t + i} c="#120a14" eyes="#ff2a3a" />
          </g>
        ))}
        <Caption text="СЕМЬЯ?" t={t} t0={1} dur={d - 1} y={900} size={80} c="#e8eef8" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Их «младший брат» Руй", cut: "fade", sfx: [[0.2, "chime", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.25, 0, -160)} bg={(c) => Spider(c, t)}>
        <path d="M 600 300 L 1320 340" stroke="#e8eef8" strokeWidth={3} />
        <Act id="rui" t={t} p={{ x: 960, y: 960, s: 1.1, expr: "neutral", aR: [70, 60], aL: [-70, -60] }} />
        <Kanji ch="下弦" x={1600} y={380} t={t} size={160} c="#e8eef8" dur={d} />
      </Stage>
    ),
  },
  {
    at: "Руй видит, как Незуко", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => Spider(c, t)}>
        <Act id="tanjiro" t={t} p={{ x: 600, y: 1020, s: 0.95, expr: "pain", lean: -10, blood: true }} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 840, y: 1020, s: 0.95, demon: true, expr: "angry", aR: [100, 0], aL: [-100, 0] }} />
        <Act id="rui" t={t} p={{ x: 1420, y: 1020, s: 0.95, face: -1, expr: "soft", gaze: 0.5 }} />
      </Stage>
    ),
  },
  {
    at: "Отдай мне сестру", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.07)} bg={(c) => Spider(c, t)}>
        <Act id="rui" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "smile", talk: talk(t, t < 3.2) }} />
        <Threads x={960} y={1300} t={t} k={seg(t, 0, 2)} />
      </Stage>
    ),
  },
  {
    at: "Ты отвечаешь", cut: "cut", sfx: [[0.6, "hit", 0.5]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={withShake(push(t, d, 1, 1.12), t, hit(t, 0.6, 0.5, 0.5))} bg={(c) => Spider(c, t)}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "shout", blood: true }} />
        <Caption text="«СЕМЬЮ НЕ СВЯЗЫВАЮТ СТРАХОМ»" t={t} t0={0.6} dur={d - 0.6} y={250} size={60} c="#ffcf8a" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Его нити режут твой меч", cut: "flash", sfx: [[0.3, "crack", 1]],
    r: ({ t, d }) => {
      const br = seg(t, 0.3, 0.9);
      return (
        <Stage cam={withShake(push(t, d, 1.05, 1.15), t, hit(t, 0.3, 0.5))} bg={(c) => Spider(c, t)}>
          <Threads x={1500} y={300} t={t} k={1} c="#ffd0d8" n={14} />
          <Act id="tanjiro" t={t} p={{ x: 880, y: 1000, s: 1.05, expr: "shock", sword: "R", sw: 120, aR: [70, 40], swordLen: lerp(260, 120, br) }} />
          {br > 0 ? <rect x={lerp(1060, 1300, br)} y={lerp(420, 900, br)} width={12} height={120} fill="#1a1c22" transform={`rotate(${br * 200} ${lerp(1060, 1300, br)} ${lerp(420, 900, br)})`} /> : null}
        </Stage>
      );
    },
  },
  {
    at: "Ты падаешь", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.3)} bg={() => <Void t={t} c="#000" c2="#14141e" />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 700 + t * 140, s: 1, expr: "closed", rot: -20 - t * 30, aR: [160, 10], aL: [-160, -10] }} />
      </Stage>
    ),
  },
  {
    at: "И вспоминаешь отца", cut: "fade", music: "kagura", sfx: [[0.2, "bell", 0.8], [0.4, "fire", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} house houseX={1600} />}>
        <circle cx={960} cy={560} r={520} fill="url(#g_glowO)" opacity={0.35} />
        <Act id="father" t={t} p={{ x: 960, y: 980, s: 1.05, expr: "soft", sword: "R", swordLen: 200, sw: 150 + Math.sin(t * 1.6) * 60, aR: [100 + Math.sin(t * 1.6) * 50, 30], aL: [-90 + Math.cos(t * 1.6) * 30, -30], lean: Math.sin(t * 1.6) * 8, lR: [14, -6], lL: [-14, 6] }} />
        <FireArc x={960} y={560} r={330} t={t} k={1} a0={-200 + t * 50} sweep={160} />
        <Snow t={t} n={80} />
        <Kanji ch="神楽" x={1650} y={330} t={t} size={150} c="#ffb04a" dur={d} />
      </Stage>
    ),
  },
  {
    at: "И ни разу не устал", cut: "fade",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.06)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} trees={false} />}>
        <circle cx={960} cy={500} r={500} fill="url(#g_glowO)" opacity={0.3} />
        <Act id="father" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "smile" }} />
        <Snow t={t} n={60} big />
      </Stage>
    ),
  },
  {
    at: "Ты вдыхаешь так, как дышал он", cut: "cut", music: "epic", sfx: [[0.3, "breath", 1]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.15)} bg={() => <Void t={t} c="#0a0400" c2="#4a1a04" />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: t > 1 ? "fierce" : "closed", rim: "#ff7a1a" }} />
        <Embers t={t} n={60} />
      </Stage>
    ),
  },
  {
    at: "Твой клинок вспыхивает", cut: "flash", sfx: [[0, "fire", 1], [0.4, "slash", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1.05, 1.18), t, hit(t, 0.4, 0.6))} bg={(c) => Spider(c, t)}>
        <FireArc x={960} y={560} r={380} t={t} k={seg(t, 0.1, 0.8)} />
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1020, s: 1.15, expr: "fierce", sword: "R", aR: [lerp(-30, 140, easeOut(seg(t, 0.1, 0.6))), 10], sw: lerp(220, 70, easeOut(seg(t, 0.1, 0.6))), glow: "#ff7a1a", lean: 14, lR: [30, -20], lL: [-30, 10] }} />
        <Embers t={t} n={50} />
      </Stage>
    ),
  },
  {
    at: "А Незуко впервые поджигает", cut: "cut", sfx: [[0.3, "fire", 1]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.15)} bg={(c) => Spider(c, t)}>
        <Threads x={960} y={300} t={t} k={1 - seg(t, 1, 2.4)} c="#ff8ac4" n={14} />
        <PinkFire x={960} y={620} s={1.2 * seg(t, 0.2, 0.8)} t={t} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 960, y: 1020, s: 1.1, demon: true, expr: "fierce", aR: [120, 30], aL: [-120, -30], rim: "#ff3d9a" }} />
      </Stage>
    ),
  },
  {
    at: "Вы бьёте вместе", cut: "flash", sfx: [[0.2, "slash", 1], [0.25, "boom", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.12), t, hit(t, 0.25, 0.7))} bg={(c) => Spider(c, t)}>
        <FireArc x={960} y={560} r={420} t={t} k={seg(t, 0, 0.4)} c1="#ff3d9a" c2="#ffb04a" />
        <Act id="tanjiro" t={t} p={{ x: 760, y: 1000, s: 1, expr: "fierce", sword: "R", aR: [120, 10], sw: 70, glow: "#ff7a1a", lean: 16 }} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 1160, y: 1000, s: 1, demon: true, expr: "fierce", face: -1, lR: [100, -10], lean: -10 }} />
        <Act id="rui" t={t} p={{ x: 1500, y: 1000, s: 0.9, face: -1, expr: "shock", op: 1 - seg(t, 0.6, 2) * 0.5 }} />
      </Stage>
    ),
  },
  {
    at: "Руя добивает Гию", cut: "cut", sfx: [[0.3, "water", 1]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.12)} bg={(c) => Spider(c, t)}>
        <WaterArc x={960} y={560} r={360} t={t} k={seg(t, 0.2, 0.9)} a0={-90} sweep={360} />
        <Act id="giyu" t={t} p={{ x: 960, y: 1000, s: 1.05, expr: "neutral", sword: "R", aR: [lerp(0, 120, easeOut(seg(t, 0.2, 0.7))), 10], sw: lerp(200, 80, easeOut(seg(t, 0.2, 0.7))), glow: "#3cc6ff" }} />
        <g opacity={1 - seg(t, 0.6, 1.6)}><Act id="rui" t={t} p={{ x: 1500, y: 1000, s: 0.9, face: -1, expr: "pain" }} /></g>
      </Stage>
    ),
  },
  {
    at: "А тебя с сестрой хватают", cut: "fade", music: "tense",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -60, 60, 1.05)} bg={(c) => <Forest cam={c} t={t} tod="night" />}>
        <Char id="demon" p={{ x: 560, y: 1000, s: 0.95, sil: "#1a1a24", aR: [80, 20] }} t={t} />
        <Act id="tanjiro" t={t} p={{ x: 760, y: 980, s: 0.95, expr: "pain", rot: -10, aR: [-40, 60], aL: [40, -60] }} />
        <Box x={1250} y={1000} s={0.8} />
        <Char id="demon" p={{ x: 1420, y: 1000, s: 0.95, sil: "#1a1a24", face: -1, aR: [80, 20] }} t={t} />
      </Stage>
    ),
  },
  {
    at: "Суд Столпов", cut: "fade", music: "dread", sfx: [[0.2, "boom", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={() => <Void t={t} c="#05050a" c2="#1a1a2a" />}>
        {["rengoku", "giyu", "shinobu", "sanemi", "tengen", "muichiro", "demon", "demon", "demon"].map((id, i) => (
          <Char key={i} id={id} p={{ x: 200 + i * 190, y: 1000, s: 0.75, sil: "#0e0e16", silEye: ["#ffb04a", "#3c8fd8", "#b48ad8", "#7ac77a", "#e8d27a", "#46d1c6", "#e88ab4", "#9a9a9a", "#d84a4a"][i], op: seg(t, i * 0.12, i * 0.12 + 0.4) }} t={t} />
        ))}
        <Kanji ch="柱" x={960} y={330} t={t} size={220} c="#e8e2d4" dur={d} vertical={false} />
      </Stage>
    ),
  },
];

// ======================================================================= CH8 TRIAL
export const CH8: Shot[] = [
  {
    at: "^", music: "dread",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -100, 100, 1.02)} bg={(c) => <Garden cam={c} t={t} />}>
        {["rengoku", "giyu", "shinobu", "sanemi", "tengen", "muichiro"].map((id, i) => (
          <Act key={id} id={id} t={t + i} p={{ x: 1180 + i * 130, y: 640, s: 0.55, expr: id === "rengoku" ? "smile" : "neutral", face: -1 }} />
        ))}
        <Act id="tanjiro" t={t} p={{ x: 600, y: 1000, s: 0.9, expr: "fierce", aR: [-30, 50], aL: [30, -50] }} />
        <Box x={800} y={1000} s={0.75} />
        <Caption text="9 СТОЛПОВ" t={t} t0={0.2} dur={2.4} y={260} size={90} c="#e8e2d4" />
      </Stage>
    ),
  },
  {
    at: "Самый злой режет себе руку", cut: "cut", sfx: [[0.8, "slash", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.32, 0, -40)} bg={(c) => <Garden cam={c} t={t} />}>
        <Box x={860} y={1000} s={0.9} />
        <Act id="sanemi" t={t} p={{ x: 1150, y: 1000, s: 1.05, face: -1, expr: "shout", aR: [110, 20], talk: talk(t, t > 1.8), sword: "L", aL: [40, 40], sw: 120 }} />
        {[0, 1, 2, 3].map((i) => <circle key={i} cx={940} cy={lerp(560, 780, ((t * 1.5 + i * 0.25) % 1))} r={7} fill="#b0101c" opacity={seg(t, 0.8, 1.2)} />)}
        <Caption text="«НУ, ДЕМОН, ЕШЬ»" t={t} t0={2} dur={d - 2} y={250} size={70} c="#ff6a6a" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Незуко дрожит", cut: "cut", music: "sad", sfx: [[0.2, "heart", 0.8]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={() => <Void t={t} c="#08040a" c2="#3a1028" />}>
        <Act id="nezuko" t={t} seed={2} p={{ x: 960 + Math.sin(t * 40) * (t < 1.4 ? 4 : 0), y: 1860, s: 2.6, demon: true, expr: t > 1.4 ? "closed" : "pain", turn: t > 1.4 ? -lerp(0, 1, easeOut(seg(t, 1.4, 2))) : 0, head: t > 1.4 ? -10 : 0, tears: t > 1.6 }} />
      </Stage>
    ),
  },
  {
    at: "Глава корпуса читает письмо", cut: "fade", music: "warm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, 0, -120)} bg={(c) => <Garden cam={c} t={t} />}>
        <Act id="oyakata" t={t} p={{ x: 960, y: 1080, s: 1.1, expr: "soft", aR: [80, 70], aL: [-80, -70], talk: talk(t, t > 0.8) }} />
        <rect x={880} y={560} width={160} height={110} fill="#f4ecd8" stroke="#15100e" strokeWidth={4} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${900 + i * 36} 575 v 80`} stroke="#3a2a1a" strokeWidth={3} />)}
      </Stage>
    ),
  },
  {
    at: "Урокодаки и Гию пишут", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.06)} bg={() => <Paper c="#efe6d4" />}>
        <Act id="urokodaki" t={t} p={{ x: 620, y: 1100, s: 1.2, aR: [60, 70] }} />
        <Act id="giyu" t={t} p={{ x: 1300, y: 1100, s: 1.2, expr: "neutral", face: -1 }} />
        <Kanji ch="約束" x={960} y={330} t={t} size={140} c="#c1121f" dur={d} vertical={false} />
      </Stage>
    ),
  },
  {
    at: "Тебе разрешают оставить сестру", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.4, 0, -150)} bg={(c) => <Garden cam={c} t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 900, y: 1080, s: 1.1, expr: "cry", tears: true, aR: [40, 60] }} />
        <Box x={1150} y={1080} s={0.9} glow />
      </Stage>
    ),
  },
  {
    at: "Ты кричишь Столпам", cut: "cut", sfx: [[0.5, "hit", 0.4]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={withShake(push(t, d, 1, 1.15), t, hit(t, 0.5, 0.5, 0.4))} bg={(c) => <Garden cam={c} t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "shout" }} />
        <Caption text="«Я И НЕЗУКО ПОБЕДИМ МУДЗАНА!»" t={t} t0={0.5} dur={d - 0.5} y={250} size={66} c="#ffcf5a" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "И впервые на тебя смотрят иначе", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -80, 80, 1.1)} bg={(c) => <Garden cam={c} t={t} />}>
        {["rengoku", "giyu", "shinobu", "tengen"].map((id, i) => <Act key={id} id={id} t={t} p={{ x: 460 + i * 340, y: 1060, s: 1, expr: i === 0 ? "smile" : i === 2 ? "soft" : "shock", gaze: -0.5 }} />)}
      </Stage>
    ),
  },
  {
    at: "Но чтобы победить Мудзана", cut: "fade", music: "tense",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.12)} bg={() => <Void t={t} c="#04040a" c2="#14243a" />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "closed" }} />
        {[0, 1, 2].map((i) => {
          const k = ((t * 0.5 + i / 3) % 1);
          return <circle key={i} cx={960} cy={620} r={80 + k * 600} fill="none" stroke="#ffb04a" strokeWidth={6 * (1 - k)} opacity={1 - k} />;
        })}
      </Stage>
    ),
  },
];

// ======================================================================= CH9 BUTTERFLY
export const CH9: Shot[] = [
  {
    at: "^", music: "warm",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -80, 80, 1.02)} bg={(c) => <Estate cam={c} t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 860, y: 1000, s: 0.95, expr: "smile", blood: false }} />
        <rect x={810} y={520} width={100} height={12} fill="#fff" opacity={0.9} />
        <Kanji ch="蝶" x={1650} y={360} t={t} size={200} c="#b48ad8" dur={d} />
      </Stage>
    ),
  },
  {
    at: "Едва встав на ноги", cut: "fade", music: "training",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -200, 200, 1.05)} bg={(c) => <Estate cam={c} t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 500 + t * 260, y: 1000, s: 0.95, ...run(t, 1.6), expr: "fierce" }} />
      </Stage>
    ),
  },
  {
    at: "Там живёт тихая девочка Канао", cut: "fade", music: "warm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.4, 0, -150)} bg={(c) => <Estate cam={c} t={t} />}>
        <Act id="kanao" t={t} p={{ x: 960, y: 1100, s: 1.1, expr: "soft", aL: [-6, 50], aR: [6, -50] }} />
      </Stage>
    ),
  },
  {
    at: "Она ничего не решает сама", cut: "cut", sfx: [[0.4, "coin", 1]],
    r: ({ t, d }) => {
      const k = seg(t, 0.4, 2.2);
      return (
        <Stage cam={push(t, d, 1.15, 1.22, 0, -80)} bg={(c) => <Estate cam={c} t={t} />}>
          <Act id="kanao" t={t} p={{ x: 900, y: 1080, s: 1.05, expr: "neutral", aR: [lerp(40, 100, 1 - Math.abs(k - 0.5) * 2), -60], gaze: 0.6 }} />
          <Coin x={1100} y={680 - Math.sin(k * Math.PI) * 460} s={0.9} t={t} />
          <Caption text="ДА / НЕТ" t={t} t0={2.4} dur={d - 2.4} x={1450} y={380} size={70} c="#e7a8d0" font="Rubik, sans-serif" />
        </Stage>
      );
    },
  },
  {
    at: "Тебе говорят", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => <Estate cam={c} t={t} />}>
        <Act id="shinobu" t={t} p={{ x: 1200, y: 1000, s: 1, face: -1, expr: "smile", talk: talk(t), aR: [100, 40] }} />
        <Act id="tanjiro" t={t} p={{ x: 760, y: 1000, s: 1, expr: "neutral" }} />
      </Stage>
    ),
  },
  {
    at: "Ты дуешь в тыкву", cut: "cut", sfx: [[2.2, "pop", 1]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1.3, 1.4, 0, -100), t, hit(t, 2.2, 0.4, 0.5))} bg={(c) => <Estate cam={c} t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 860, y: 1080, s: 1.05, expr: "pain", aR: [140, 30], aL: [-140, -30] }} />
        <Gourd x={1010} y={600} s={0.5} burst={seg(t, 2.1, 3)} />
      </Stage>
    ),
  },
  {
    at: "Потом огромную", cut: "cut", sfx: [[0.9, "boom", 1]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.05), t, hit(t, 0.9, 0.7))} bg={(c) => <Estate cam={c} t={t} />}>
        <Gourd x={1150} y={1000} s={2.6} burst={seg(t, 0.8, 1.8)} />
        <Act id="tanjiro" t={t} p={{ x: 700, y: 1000, s: 0.9, expr: "fierce", lean: 10 }} />
        <Flash k={seg(t, 0.85, 1.2)} />
      </Stage>
    ),
  },
  {
    at: "Ты дышишь так днём и ночью", cut: "fade", music: "calm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.12)} bg={(c) => <Estate cam={c} t={t} night />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 900, s: 0.95, rot: -90, expr: "closed" }} />
        {[0, 1, 2].map((i) => {
          const k = ((t * 0.5 + i / 3) % 1);
          return <circle key={i} cx={760} cy={830} r={40 + k * 220} fill="none" stroke="#9ad8ff" strokeWidth={4 * (1 - k)} opacity={1 - k} />;
        })}
      </Stage>
    ),
  },
  {
    at: "Перед отъездом", cut: "fade", music: "warm", sfx: [[1.2, "coin", 1]],
    r: ({ t, d }) => {
      const k = seg(t, 1.2, 3.2);
      return (
        <Stage cam={push(t, d, 1.15, 1.22, 0, -60)} bg={(c) => <Estate cam={c} t={t} />}>
          <Act id="tanjiro" t={t} p={{ x: 700, y: 1060, s: 1.05, expr: "happy", aR: [lerp(40, 150, 1 - Math.abs(k - 0.5) * 2), 0], talk: talk(t, t > 3.4) }} />
          <Act id="kanao" t={t} p={{ x: 1240, y: 1060, s: 1.02, face: -1, expr: "shock" }} />
          {k > 0 && k < 1 ? <Coin x={960} y={640 - Math.sin(k * Math.PI) * 420} s={0.85} t={t} /> : null}
        </Stage>
      );
    },
  },
  {
    at: "Выпадает орёл", cut: "cut", sfx: [[0.1, "chime", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={() => <Paper c="#efe6d4" />}>
        <circle cx={960} cy={540} r={300} fill="url(#g_glowO)" opacity={0.4} />
        <Coin x={960} y={540} s={5} t={t} spin={false} />
      </Stage>
    ),
  },
  {
    at: "Ты не знаешь, что однажды", cut: "fade",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.07)} bg={(c) => <Estate cam={c} t={t} />}>
        <Act id="kanao" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "soft", aR: [150, 40] }} />
        <Kanji ch="心" x={1600} y={380} t={t} size={220} c="#e7a8d0" dur={d} />
      </Stage>
    ),
  },
  {
    at: "Один из Столпов улыбнётся", cut: "fade", music: "tense",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.15, 1.25, 0, -80)} bg={() => <Void t={t} c="#100804" c2="#4a2010" />}>
        <Act id="rengoku" t={t} p={{ x: 960, y: 1300, s: 1.5, expr: "smile", rim: "#ff7a1a" }} />
        <Embers t={t} n={40} />
      </Stage>
    ),
  },
];
