import React from "react";
import type { Shot } from "./types";
import { Stage, Act, push, pan, camLerp, Caption, Dark, withShake, hit, Scent, Bars } from "../kit";
import { SnowMountains, Interior, Town, Forest, Par, House, Paper, Void, Sky, Moon, Ridge, Mist } from "../scenes/BG";
import { Snow, Kanji, WaterArc, FireArc, PinkFire, DemonSil, Flash, SpeedLines, BloodSplat, Embers, Slash } from "../scenes/FX";
import { walk, run, track, seg, easeOut, easeInOut, talk, lerp, clamp } from "../lib";
import { Char } from "../rig/Char";

// ======================================================================= HOOK
export const CH0: Shot[] = [
  {
    at: "^", music: "calm", sfx: [[0, "wind", 0.6]],
    r: ({ t, d }) => (
      <>
        <Stage cam={push(t, d, 1.0, 1.12, 120, -20)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1350} />}>
          <Act id="tanjiro_kid" t={t} p={{ x: 1060 - t * 40, y: 900, s: 0.62, face: -1, basket: true, ...walk(t, 0.9, 0.8), expr: "smile" }} />
          <Snow t={t} n={70} />
        </Stage>
        <Caption text="ТЕБЕ 13" t={t} t0={2.6} dur={3.3} y={330} size={130} />
      </>
    ),
  },
  {
    at: "и мама просит", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.35, 1.45, 300, -120)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1350} door="open" />}>
        <Act id="mother" t={t} p={{ x: 1210, y: 856, s: 0.68, expr: "soft", aR: [120, 40], talk: talk(t, t < 2.2) }} />
        <Snow t={t} n={60} />
      </Stage>
    ),
  },
  {
    at: "Ты не вернёшься до темноты", cut: "fade",
    r: ({ t, d }) => (
      <>
        <Stage cam={camLerp(t, d, { z: 1, x: 0 }, { z: 1.05, x: -60 })} bg={(c) => <SnowMountains cam={c} tod="dusk" t={t} house houseX={1500} houseLit={1} />}>
          <Act id="tanjiro_kid" t={t} p={{ x: 900 - t * 70, y: 940 + t * 10, s: 0.42 - t * 0.02, face: -1, basket: true, ...walk(t, 1, 0.8) }} />
          <Snow t={t} n={60} />
        </Stage>
        <Caption text="ДО ТЕМНОТЫ" t={t} t0={0.2} dur={2.4} y={300} size={110} c="#ffcf8a" />
      </>
    ),
  },
  {
    at: "твоя семья будет мертва", cut: "cut", sfx: [[0, "boom", 0.9]],
    r: ({ t }) => (
      <>
        <rect width={1920} height={1080} fill="#050404" />
        <g opacity={seg(t, 0.2, 1.2)}>
          <path d="M 0 760 Q 960 700 1920 760 L 1920 1080 L 0 1080 Z" fill="#d8dde6" opacity={0.15} />
          <BloodSplat x={960} y={820} s={1.4} k={0.45} c="#7a0610" />
        </g>
        <Kanji ch="死" x={960} y={560} t={t} size={300} c="#c1121f" dur={3} vertical={false} />
      </>
    ),
  },
  {
    at: "Все, кроме одной сестры", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.15)} bg={() => <Void t={t} c="#050208" c2="#2a0820" />}>
        <Act id="nezuko" t={t} p={{ muzzle: false, x: 960, y: 1900, s: 2.7, demon: seg(t, 1.6, 1.7) > 0, expr: seg(t, 1.6, 1.7) > 0 ? "angry" : "closed", blink: 0 }} />
        <Dark op={0.55 - seg(t, 1.5, 2.2) * 0.35} />
      </Stage>
    ),
  },
  {
    at: "Это только начало", cut: "flash", music: "tense",
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.2), t, 0.25)} bg={(c) => <Forest cam={c} t={t} />}>
        <DemonSil x={960} y={980} s={1.2} t={t} kanji="鬼" />
        <SpeedLines t={t} c="#000" op={0.35} />
      </Stage>
    ),
  },
  {
    at: "меч", cut: "flash", sfx: [[0.05, "water", 0.9], [0.7, "chime", 0.5]],
    r: ({ t, d }) => t < 0.7 ? (
      <Stage cam={push(t, d, 1.05, 1.2)} bg={(c) => <Forest cam={c} t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1010, s: 1.25, expr: "fierce", sword: "R", aR: [lerp(-30, 110, easeOut(seg(t, 0, 0.4))), 20], aL: [40, 70], sw: lerp(200, 100, easeOut(seg(t, 0, 0.4))), lR: [20, -10], lL: [-20, 6] }} />
        <WaterArc x={960} y={560} r={330} t={t} k={seg(t, 0.0, 0.5)} />
      </Stage>
    ) : (
      <Stage cam={pan(t, d, -60, 60, 1.05)} bg={() => <Paper c="#1a1418" />}>
        {[["zenitsu", 560], ["rengoku", 960], ["inosuke", 1360]].map(([id, x], i) => (
          <Act key={id as string} id={id as string} t={t + i} p={{ x: x as number, y: 1060, s: 0.95, expr: i === 1 ? "smile" : "neutral", op: 1 - seg(t, 1.4 + i * 0.2, 2.4 + i * 0.2) * 0.85 }} />
        ))}
        <Dark op={0.25} />
      </Stage>
    ),
  },
  {
    at: "и ночь, после которой", cut: "flash", sfx: [[0.2, "heart", 1]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.18)} bg={() => <Void t={t} />}>
        <Act id="tanjiro_demon" t={t} p={{ x: 960, y: 1880, s: 2.7, expr: "fierce", demon: true }} />
        <Dark op={0.3 - seg(t, 0, 1) * 0.3} c="#5a0010" />
      </Stage>
    ),
  },
  {
    at: "Ты — Танджиро Камадо", cut: "fade", music: "theme", sfx: [[0.1, "bell", 0.8]],
    r: ({ t, d }) => (
      <>
        <Stage cam={push(t, d, 1, 1.08, 0, -40)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} trees={false} />}>
          <Act id="tanjiro_kid" t={t} p={{ x: 960, y: 1300, s: 1.45, expr: "soft", gaze: 0 }} />
          <Snow t={t} n={50} />
        </Stage>
        <Caption text="ТЫ — ТАНДЖИРО" t={t} t0={0.2} dur={d - 0.1} y={250} size={120} c="#fff" />
        <Caption text="ЭТО ВСЯ ТВОЯ ЖИЗНЬ" t={t} t0={1.6} dur={d - 1.5} y={380} size={70} c="#ffcf8a" font="Rubik, sans-serif" />
      </>
    ),
  },
];

// ======================================================================= CH1 SNOW
const kids = (t: number, x0: number, y: number, s: number, happy = true) => (
  <>
    <Act id="nezuko_human" t={t} seed={2} p={{ x: x0, y, s: s * 0.92, expr: happy ? "smile" : "neutral" }} />
    <Act id="sib_boy" t={t} seed={3} p={{ x: x0 + 150 * s, y, s, expr: happy ? "happy" : "neutral", aR: [60 + Math.sin(t * 6) * 20, 30] }} />
    <Act id="sib_girl" t={t} seed={4} p={{ x: x0 + 270 * s, y, s, expr: "smile" }} />
    <Act id="sib_boy" t={t} seed={5} p={{ x: x0 + 380 * s, y, s: s * 0.85, expr: "smile", face: -1 }} />
  </>
);

export const CH1: Shot[] = [
  {
    at: "^", music: "calm", sfx: [[0.6, "fire", 0.5]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.0, 1.08, 40, 0)} bg={(c) => <Interior cam={c} t={t} />}>
        <Act id="mother" t={t} seed={7} p={{ x: 760, y: 930, s: 0.95, expr: "soft", aL: [-20, 60], aR: [20, -60] }} />
        {kids(t, 940, 930, 0.95)}
        <Act id="tanjiro_kid" t={t} p={{ x: 440, y: 950, s: 1.02, expr: "smile", aR: [20, -30] }} />
        <Kanji ch="炭" x={1700} y={330} t={t} size={200} dur={3.2} />
      </Stage>
    ),
  },
  {
    at: "Отец умер от болезни", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1, 0, -30)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} trees={false} />}>
        <g opacity={0.55}>
          <Char id="tanjiro" p={{ x: 960, y: 960, s: 1.15, sil: "#d6dceb", sword: "R", sw: 120 + Math.sin(t * 2) * 40, aR: [90 + Math.sin(t * 2) * 40, 30], aL: [-60, -40], lean: Math.sin(t * 2) * 6 }} t={t} />
        </g>
        <FireArc x={960} y={560} r={280} t={t} k={seg(t, 0.3, 2.2)} a0={-200} sweep={260} />
        <Snow t={t} n={80} />
      </Stage>
    ),
  },
  {
    at: "и теперь ты кормишь", cut: "fade", music: "calm",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -40, 40, 1.02)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1500} />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 760, y: 900, s: 0.9, basket: true, expr: "smile", aR: [150 + Math.sin(t * 8) * 15, 10] }} />
        {kids(t, 1080, 900, 0.85)}
        <Snow t={t} n={50} />
      </Stage>
    ),
  },
  {
    at: "У тебя удивительный нюх",
    r: ({ t, d }) => (
      <>
        <Stage dof={5} cam={push(t, d, 1, 1.06)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees={false} />}>
          <Act id="tanjiro_kid" t={t} p={{ x: 620, y: 1860, s: 2.6, expr: "closed", head: -6 }} />
          <Scent x={760} y={480} t={t} c="#6fb6ff" len={360 * seg(t, 1.2, 1.8)} label={t > 1.8 ? "СТРАХ" : undefined} ang={-14} />
          <Scent x={760} y={600} t={t + 1} c="#b083ff" len={420 * seg(t, 1.6, 2.2)} label={t > 2.2 ? "ЛОЖЬ" : undefined} ang={0} />
          <Scent x={760} y={720} t={t + 2} c="#ffcf5a" len={380 * seg(t, 2.1, 2.7)} label={t > 2.7 ? "ДОБРОТА" : undefined} ang={14} />
        </Stage>
      </>
    ),
  },
  {
    at: "Утром младшие висят", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.18, 0, 40)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1500} />}>
        <Act id="sib_boy" t={t} seed={3} p={{ x: 760, y: 880 + Math.sin(t * 7) * 6, s: 0.8, expr: "happy", aR: [140, 10], lean: 12 }} />
        <Act id="tanjiro_kid" t={t} p={{ x: 960, y: 900, s: 1, basket: true, expr: "happy", aL: [-60, 10], aR: [60, -10] }} />
        <Act id="sib_girl" t={t} seed={4} p={{ x: 1160, y: 880 + Math.sin(t * 7 + 1) * 6, s: 0.78, expr: "happy", aL: [-140, -10], lean: -12, face: -1 }} />
        <Snow t={t} n={40} />
      </Stage>
    ),
  },
  {
    at: "Незуко, старшая из сестёр",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.6, 1.75, 0, -180)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1600} />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 760, y: 1000, s: 1, basket: true, expr: "soft", turn: 0.4 }} />
        <Act id="nezuko_human" t={t} seed={2} p={{ x: 1150, y: 1000, s: 0.95, face: -1, expr: "smile", turn: 0.4, aR: [lerp(10, 150, easeInOut(seg(t, 0.4, 1.2))), lerp(-14, 30, easeInOut(seg(t, 0.4, 1.2)))], talk: talk(t, t > 2.4 && t < 4) }} />
        <Snow t={t} n={30} />
      </Stage>
    ),
  },
  {
    at: "Ты обещаешь принести", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.5, 1.55, 0, -160)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees={false} />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 960, y: 1100, s: 1.15, basket: true, expr: "happy", aR: [150 + Math.sin(t * 9) * 18, 20], talk: talk(t, t < 1.6) }} />
        <Snow t={t} n={40} />
      </Stage>
    ),
  },
  {
    at: "Ты даже не оборачиваешься", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={camLerp(t, d, { z: 1.25, x: 200, y: 20 }, { z: 1, x: 0, y: 0 })} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1400} />}>
        <Act id="mother" t={t} seed={7} p={{ x: 1250, y: 860, s: 0.5, expr: "soft", aR: [130 + Math.sin(t * 5) * 15, 10] }} />
        <Act id="nezuko_human" t={t} seed={2} p={{ x: 1320, y: 866, s: 0.46, expr: "smile", aR: [140 + Math.sin(t * 6) * 15, 10] }} />
        <Act id="tanjiro_kid" t={t} p={{ x: 1000 - t * 60, y: 920 + t * 8, s: 0.62, face: -1, basket: true, ...walk(t, 1, 0.9) }} />
        <Snow t={t} n={60} />
      </Stage>
    ),
  },
  {
    at: "В городе все тебе рады", cut: "fade", music: "calm", sfx: [[0, "crowd", 0.4]],
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -80, 80, 1)} bg={(c) => <Town cam={c} t={t} tod="day" />}>
        <Act id="oldman" t={t} seed={9} p={{ x: 560, y: 960, s: 0.95, face: 1, expr: "smile", aR: [70, 30] }} />
        <Act id="tanjiro_kid" t={t} p={{ x: 900, y: 960, s: 1, basket: true, expr: "happy", face: -1, aL: [-80, -20], talk: talk(t, t > 0.5 && t < 2) }} />
        <Act id="sib_girl" t={t} seed={11} p={{ x: 1300, y: 960, s: 0.6, expr: "happy", face: -1 }} />
        <Act id="mother" t={t} seed={12} p={{ x: 1450, y: 960, s: 0.9, expr: "smile", face: -1 }} />
      </Stage>
    ),
  },
  {
    at: "и не замечаешь, как темнеет", cut: "fade",
    r: ({ t, d }) => {
      const k = seg(t, 0.2, d - 0.3);
      return (
        <Stage cam={push(t, d, 1, 1.05)} bg={(c) => (
          <>
            <Town cam={c} t={t} tod="day" />
            <g opacity={clamp(k * 2)}><Town cam={c} t={t} tod="dusk" /></g>
            <g opacity={clamp(k * 2 - 1)}><Town cam={c} t={t} tod="night" lanterns /></g>
          </>
        )}>
          <Act id="tanjiro_kid" t={t} p={{ x: 960, y: 960, s: 1, basket: true, expr: "smile", aR: [100, 50] }} />
        </Stage>
      );
    },
  },
  {
    at: "На обратном пути", cut: "fade", music: "tense",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.15, 1.25, 0, -40)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} house houseX={1450} houseLit={1} />}>
        <Act id="oldman" t={t} seed={9} p={{ x: 1180, y: 900, s: 0.9, face: -1, expr: "angry", aR: [100, 20], talk: talk(t, t > 1.2 && t < 3.6) }} />
        <Act id="tanjiro_kid" t={t} p={{ x: 760, y: 920, s: 0.95, basket: true, expr: t < 3.6 ? "neutral" : "happy" }} />
        <Snow t={t} n={70} />
      </Stage>
    ),
  },
  {
    at: "Ты смеёшься", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.12)} bg={(c) => <Interior cam={c} t={t} fire={0.6} />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 900, y: 860, s: 0.95, rot: -90, expr: "closed", aR: [40, 40], aL: [-30, 30] }} />
        <Dark op={0.35} c="#0a0e20" />
      </Stage>
    ),
  },
  {
    at: "Утром ты чувствуешь запах крови", cut: "black", music: "dread", sfx: [[0.3, "heart", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.45, 0, -100)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 960, y: 1300, s: 1.5, basket: true, expr: t < 1.2 ? "neutral" : "shock" }} />
        <Scent x={-100} y={420} t={t} c="#c1121f" len={900 * seg(t, 0.3, 1.4)} ang={8} />
        <Dark op={0.12} c="#3a0000" />
      </Stage>
    ),
  },
  {
    at: "Дверь открыта", cut: "cut", sfx: [[0, "boom", 0.5]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.4, 260, -20)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1250} houseLit={0} door="open" />}>
        <BloodSplat x={1120} y={895} s={0.6} k={0.45} c="#8a0a14" seed={3} />
        <BloodSplat x={1350} y={905} s={0.35} k={0.45} c="#8a0a14" seed={5} />
        <Dark op={0.25} c="#1a0000" />
      </Stage>
    ),
  },
  {
    at: "Мама", cut: "cut", noHud: false,
    r: ({ t }) => (
      <>
        <rect width={1920} height={1080} fill="#0b0909" />
        <g opacity={0.4 + 0.2 * Math.sin(t * 3)}><Char id="mother" p={{ x: 960, y: 1300, s: 1.6, sil: "#3a1a1c" }} t={t} /></g>
        <Kanji ch="母" x={1500} y={420} t={t} size={220} c="#c1121f" dur={1.4} vertical={false} />
      </>
    ),
  },
  {
    at: "Братья", cut: "cut",
    r: ({ t }) => (
      <>
        <rect width={1920} height={1080} fill="#0b0909" />
        <g opacity={0.4}><Char id="sib_boy" p={{ x: 760, y: 1100, s: 1.6, sil: "#3a1a1c" }} t={t} /><Char id="sib_boy" p={{ x: 1160, y: 1100, s: 1.4, sil: "#3a1a1c" }} t={t} /></g>
        <Kanji ch="兄" x={1600} y={420} t={t} size={200} c="#c1121f" dur={1.2} vertical={false} />
      </>
    ),
  },
  {
    at: "Сёстры", cut: "cut",
    r: ({ t }) => (
      <>
        <rect width={1920} height={1080} fill="#0b0909" />
        <g opacity={0.4}><Char id="sib_girl" p={{ x: 960, y: 1100, s: 1.7, sil: "#3a1a1c" }} t={t} /></g>
        <Kanji ch="妹" x={1500} y={420} t={t} size={200} c="#c1121f" dur={1.2} vertical={false} />
      </>
    ),
  },
  {
    at: "Только Незуко ещё тёплая", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.08, 0, 0)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees={false} />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 960, y: 1850, s: 2.5, expr: "cry", head: 6, aR: [40, 60], aL: [-40, -60] }} />
        <Act id="nezuko_human" t={t} seed={2} p={{ x: 1000, y: 2300, s: 2.2, rot: -70, expr: "closed", blink: 1 }} />
        <Snow t={t} n={70} big />
      </Stage>
    ),
  },
  {
    at: "Ты несёшь её на спине", cut: "fade",
    r: ({ t, d }) => {
      const w = walk(t, 0.8, 0.8);
      const x = 1300 - t * 70, y = 960 + t * 18;
      return (
        <Stage cam={camLerp(t, d, { z: 1.25, x: 260, y: -60 }, { z: 1.25, x: 60, y: -40 })} bg={(c) => <SnowMountains cam={c} tod="day" t={t} />}>
          <Act id="nezuko_human" t={t} seed={2} p={{ x: x + 26, y: y - 110 + (w.bob || 0), s: 0.84, face: -1, expr: "closed", blink: 1, lean: 8, head: 14, aR: [60, 50], aL: [40, 70], lR: [20, -40], lL: [10, -50] }} />
          <Act id="tanjiro_kid" t={t} p={{ x, y, s: 0.9, face: -1, ...w, aR: [-30, 80], aL: [-20, 70], expr: "fierce", lean: 12 }} />
          <Snow t={t} n={90} wind={60} />
        </Stage>
      );
    },
  },
  {
    at: "И вдруг она встаёт", cut: "cut", music: "dread", sfx: [[0.1, "whoosh", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1.1, 1.25, 0, -60), t, hit(t, 0.1, 0.6, 0.5))} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 800, y: 980, s: 1, expr: "shock", face: 1, turn: 0.4 }} />
        <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: 1180, y: 940 - easeOut(seg(t, 0, 0.6)) * 40, s: 1.05, face: -1, demon: true, expr: "angry", lean: -6, aR: [40, 40], aL: [-40, -40] }} />
        <Dark op={0.2} c="#2a0010" />
      </Stage>
    ),
  },
  {
    at: "Глаза другие", cut: "cut", sfx: [[0, "hit", 0.5]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.12, 0, 0)} bg={() => <Void t={t} c="#0a0408" c2="#3a0a20" />}>
        <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: 960, y: 4380, s: 7.2, demon: true, expr: "angry", blink: 0 }} />
      </Stage>
    ),
  },
  {
    at: "Зубы другие", cut: "cut", sfx: [[0, "hit", 0.5]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={() => <Void t={t} c="#0a0408" c2="#3a0a20" />}>
        <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: 960, y: 4180, s: 7.2, demon: true, expr: "shout", blink: 0 }} />
      </Stage>
    ),
  },
  {
    at: "Она бросается на тебя", cut: "cut", sfx: [[0.15, "thud", 1]],
    r: ({ t, d }) => {
      const k = easeOut(seg(t, 0, 0.35));
      return (
        <Stage cam={withShake(push(t, d, 1.3, 1.45, -40, 80), t, hit(t, 0.3, 0.6, 0.9))} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees={false} />}>
          <Act id="tanjiro_kid" t={t} p={{ x: 760, y: 1000, s: 1, rot: -86 * k, expr: t > 1.6 ? "sad" : "pain", aR: [150, 20], aL: [170, -10] }} />
          <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: lerp(1500, 1180, k), y: 980, s: 1, face: -1, demon: true, lean: 38 * k, head: 10, expr: t > 1.6 ? "cry" : "shout", tears: t > 1.6, aR: [40, 30], aL: [30, 40], lR: [-30, 40], lL: [-20, 30] }} />
          <Snow t={t} n={50} />
        </Stage>
      );
    },
  },
  {
    at: "Твоя сестра стала демоном", cut: "cut", sfx: [[0, "bell", 0.7]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.08)} bg={() => <Void t={t} c="#0a0408" c2="#4a0a2a" />}>
        <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: 960, y: 1840, s: 2.6, demon: true, expr: "cry", tears: true }} />
        <Kanji ch="鬼" x={1560} y={520} t={t} size={300} c="#ff3d6a" dur={d} vertical={false} />
      </Stage>
    ),
  },
  {
    at: "И в эту секунду из леса", cut: "fade", music: "tense", sfx: [[0.8, "wind", 0.5]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.12, 0, 0)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
        <Act id="giyu" t={t} p={{ x: 960, y: 980, s: lerp(0.55, 0.85, seg(t, 0, d)), op: seg(t, 0, 0.8), ...walk(t, 0.6, 0.5), aR: [6, -6], sword: "R", sw: 10, expr: "neutral", rim: "#6fb6ff" }} />
        <Snow t={t} n={60} />
      </Stage>
    ),
  },
];

// ======================================================================= CH2 GIYU
export const CH2: Shot[] = [
  {
    at: "^", music: "tense",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.5, 1.62, 0, -200)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
        <Act id="giyu" t={t} p={{ x: 960, y: 1180, s: 1.3, expr: "neutral", sword: "R", aR: [50, 40], sw: 120, glow: "#3cc6ff" }} />
        <Snow t={t} n={50} />
        <Kanji ch="水" x={1600} y={420} t={t} size={220} c="#3c8fd8" dur={3} />
      </Stage>
    ),
  },
  {
    at: "Он пришёл убить Незуко", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, 120, -60, 1.05)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} />}>
        <Act id="giyu" t={t} p={{ x: 1450, y: 920, s: 1, face: -1, expr: "neutral", sword: "R", aR: [70, 30], sw: 100 }} />
        <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: 640, y: 920, s: 0.95, demon: true, expr: "angry" }} />
        <Snow t={t} n={50} />
      </Stage>
    ),
  },
  {
    at: "Ты закрываешь её собой", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, -80, -40)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} />}>
        <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: 560, y: 930, s: 0.92, demon: true, expr: "angry" }} />
        <Act id="tanjiro_kid" t={t} p={{ x: 820, y: 940, s: 1, expr: t > 1.6 ? "cry" : "fierce", aR: [100, 10], aL: [-100, -10], talk: talk(t, t > 1.4) }} />
        <Act id="giyu" t={t} p={{ x: 1460, y: 930, s: 1, face: -1, expr: "neutral", sword: "R", aR: [70, 30], sw: 100 }} />
        <Snow t={t} n={50} />
      </Stage>
    ),
  },
  {
    at: "Он холодно говорит", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.06)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees={false} />}>
        <Act id="giyu" t={t} p={{ x: 960, y: 1850, s: 2.6, expr: "angry", talk: talk(t, t > 1 && t < 3.6) }} />
        <Snow t={t} n={50} big />
        <Caption text="«НЕ ПРОСИ»" t={t} t0={1.0} dur={2.4} x={1500} y={300} size={70} c="#bfe6ff" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Тогда ты бросаешь в него камень", cut: "cut", sfx: [[0.3, "whoosh", 0.8]],
    r: ({ t, d }) => {
      const k = seg(t, 0.2, 0.9);
      return (
        <Stage cam={pan(t, d, -100, 100, 1)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} />}>
          <Act id="tanjiro_kid" t={t} p={{ x: 640 + seg(t, 2, d) * 300, y: 940, s: 1, expr: "fierce", ...(t < 2 ? { aR: [lerp(-40, 160, easeOut(k)), 20], lean: lerp(-8, 14, k) } : run(t, 1.6)) }} />
          {k > 0 && k < 1 ? <circle cx={lerp(760, 1400, k)} cy={lerp(600, 500, k) - Math.sin(k * Math.PI) * 80} r={20} fill="#6a6a70" stroke="#15100e" strokeWidth={4} /> : null}
          <Act id="giyu" t={t} p={{ x: 1460, y: 930, s: 1, face: -1, expr: "neutral", sword: "R", aR: [70 - hit(t, 0.9, 0.3, 40), 30], sw: 100 }} />
          <Snow t={t} n={40} />
        </Stage>
      );
    },
  },
  {
    at: "Гию бьёт тебя рукоятью", cut: "flash", sfx: [[0.1, "hit", 1]],
    r: ({ t, d }) => {
      const k = easeOut(seg(t, 0.05, 0.4));
      return (
        <Stage cam={withShake(push(t, d, 1.1, 1.2), t, hit(t, 0.1, 0.5))} bg={(c) => <SnowMountains cam={c} tod="day" t={t} />}>
          <Act id="giyu" t={t} p={{ x: 1060, y: 930, s: 1, face: -1, expr: "angry", sword: "R", aR: [lerp(30, 110, k), 10], sw: lerp(60, -20, k), lean: 10 * k }} />
          <Act id="tanjiro_kid" t={t} p={{ x: 760 - k * 60, y: 960, s: 1, rot: -85 * easeOut(seg(t, 0.2, 0.8)), expr: "pain" }} />
          <Slash x={850} y={560} len={300} ang={-30} k={seg(t, 0.05, 0.4)} />
          <Snow t={t} n={40} />
        </Stage>
      );
    },
  },
  {
    at: "А Незуко, голодный демон", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.4, 1.55, -200, 100)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees={false} />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 860, y: 960, s: 1, rot: -86, expr: "closed" }} />
        <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: 640, y: 940, s: 1, demon: true, expr: t > 1.4 ? "sad" : "angry", lean: 18, head: 10, gaze: 0.6 }} />
        <Snow t={t} n={50} />
      </Stage>
    ),
  },
  {
    at: "Она встаёт между тобой и мечом", cut: "cut", sfx: [[0.2, "whoosh", 0.7]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.15, 40, 0)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 560, y: 960, s: 0.95, rot: -86, expr: "closed" }} />
        <Act id="nezuko" t={t} seed={2} p={{ muzzle: false, x: 900, y: 930, s: 1, demon: true, expr: "angry", aR: [100, 0], aL: [-100, 0], lR: [20, -10], lL: [-20, 10], rim: "#ff7ab4" }} />
        <Act id="giyu" t={t} p={{ x: 1420, y: 930, s: 1, face: -1, expr: "shock", sword: "R", aR: [90, 0], sw: 80 }} />
        <Snow t={t} n={50} />
      </Stage>
    ),
  },
  {
    at: "Гию опускает клинок", cut: "fade", music: "calm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.4, 120, -120)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} />}>
        <Act id="giyu" t={t} p={{ x: 1060, y: 1000, s: 1.1, expr: "soft", sword: "R", aR: [lerp(90, 10, easeInOut(seg(t, 0, 1.4))), -6], sw: lerp(80, 10, easeInOut(seg(t, 0, 1.4))), talk: talk(t, t > 1.6) }} />
        <Snow t={t} n={50} />
        <Caption text="ГОРА САГИРИ" t={t} t0={1.6} dur={d - 1.6} x={600} y={300} size={70} c="#e6f2ff" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Ты ещё не знаешь", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -100, 100, 1.02)} bg={(c) => <SnowMountains cam={c} tod="dusk" t={t} trees />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 1000 - t * 40, y: 930, s: 0.7, face: -1, box: true, ...walk(t, 0.9, 0.8), expr: "fierce" }} />
        <Snow t={t} n={60} />
      </Stage>
    ),
  },
];
