import React from "react";
import type { Shot } from "./types";
import { Stage, Act, push, pan, camLerp, Caption, Dark, withShake, hit, Bars } from "../kit";
import { SnowMountains, Interior, Forest, Paper, Void, TrainExt, TrainInt, District, Village, Castle, CityNight, Par, Sky, Sun, Estate, Mist, Butterflies } from "../scenes/BG";
import { Snow, Kanji, WaterArc, FireArc, PinkFire, Lightning, Slash, Flash, SpeedLines, BloodSplat, Embers, Petals, SunRays, DemonSil, Whips } from "../scenes/FX";
import { walk, run, seg, easeOut, easeInOut, talk, lerp, rnd, clamp } from "../lib";
import { Char } from "../rig/Char";

// ======================================================================= CH10 TRAIN
export const CH10: Shot[] = [
  {
    at: "^", music: "tense", sfx: [[0, "train", 0.8]],
    r: ({ t, d }) => (
      <>
        <Stage cam={pan(t, d, -100, 100, 1)} bg={(c) => <TrainExt cam={c} t={t} />} />
        <Caption text="«БЕСКОНЕЧНЫЙ»" t={t} t0={0.3} dur={d} y={240} size={100} c="#ffcf8a" />
      </>
    ),
  },
  {
    at: "С тобой Столп пламени", cut: "fade", music: "warm", sfx: [[0, "train", 0.4]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.15, 1.25, 0, -100)} bg={(c) => <TrainInt cam={c} t={t} />}>
        <Act id="rengoku" t={t} p={{ x: 960, y: 1080, s: 1.12, expr: t % 2 < 1 ? "happy" : "smile", talk: talk(t), aR: [140, 10] }} />
        <Kanji ch="炎" x={1620} y={360} t={t} size={220} c="#ff7a1a" dur={d} />
      </Stage>
    ),
  },
  {
    at: "Демон усыпляет всех", cut: "fade", music: "dream", sfx: [[0.2, "chime", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.12)} bg={(c) => <TrainInt cam={c} t={t} />}>
        {[["zenitsu", 520], ["tanjiro", 860], ["inosuke", 1180], ["rengoku", 1480]].map(([id, x], i) => (
          <Act key={id as string} id={id as string} t={t} p={{ x: x as number, y: 1040, s: 0.9, expr: "closed", blink: 1, head: 16 - i * 4, lean: 6 }} />
        ))}
        <Dark op={0.25 * seg(t, 0, 1.5)} c="#5a2a8a" />
        <Caption text="Zzz" t={t} t0={0.6} dur={d} x={1500} y={380} size={70} c="#e6c8ff" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Во сне ты дома", cut: "fade", music: "warm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08, 40, 0)} bg={(c) => <Interior cam={c} t={t} />}>
        <Act id="mother" t={t} seed={7} p={{ x: 760, y: 930, s: 0.95, expr: "smile", talk: talk(t, t > 1.6), aR: [120, 40] }} />
        <Act id="nezuko_human" t={t} seed={2} p={{ x: 1000, y: 930, s: 0.9, expr: "happy" }} />
        <Act id="sib_boy" t={t} seed={3} p={{ x: 1180, y: 930, s: 0.95, expr: "happy", aR: [140, 10] }} />
        <Act id="sib_girl" t={t} seed={4} p={{ x: 1320, y: 930, s: 0.95, expr: "smile" }} />
        <Act id="tanjiro" t={t} p={{ x: 460, y: 950, s: 1, expr: "cry", tears: true }} />
        <rect x={-100} y={-100} width={2200} height={1300} fill="#fff4e0" opacity={0.12} />
      </Stage>
    ),
  },
  {
    at: "Ты понимаешь, что это сон", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.08)} bg={(c) => <Interior cam={c} t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "cry", tears: true }} />
        <rect x={-100} y={-100} width={2200} height={1300} fill="#fff4e0" opacity={0.15} />
      </Stage>
    ),
  },
  {
    at: "И чтобы проснуться", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={camLerp(t, d, { z: 1.1, x: -100 }, { z: 1, x: 100 })} bg={(c) => <Interior cam={c} t={t} />}>
        <Act id="mother" t={t} seed={7} p={{ x: 560, y: 930, s: 0.9, expr: "sad", aR: [110, 20] }} />
        <Act id="nezuko_human" t={t} seed={2} p={{ x: 760, y: 930, s: 0.86, expr: "cry" }} />
        <Act id="sib_boy" t={t} seed={3} p={{ x: 920, y: 930, s: 0.9, expr: "cry", aR: [110, 10] }} />
        <Act id="tanjiro" t={t} p={{ x: 1200 + t * 70, y: 950, s: 1, face: 1, expr: "cry", tears: true, ...walk(t, 0.7, 0.6) }} />
        <rect x={1500} y={-200} width={900} height={1500} fill="#fff" opacity={0.25 + seg(t, 0, d) * 0.6} />
      </Stage>
    ),
  },
  {
    at: "Ты побеждаешь демона", cut: "flash", music: "battle", sfx: [[0.3, "fire", 1], [0.6, "slash", 1], [0.8, "boom", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.1), t, hit(t, 0.6, 0.8))} bg={(c) => <TrainExt cam={c} t={t} />}>
        <g opacity={0.9}>{Array.from({ length: 7 }, (_, i) => <path key={i} d={`M ${200 + i * 260} 860 q ${40 + Math.sin(t * 3 + i) * 40} -200 ${-20} -${300 + i * 20}`} stroke="#c88aa0" strokeWidth={44} fill="none" strokeLinecap="round" opacity={1 - seg(t, 0.8, 2)} />)}</g>
        <FireArc x={960} y={480} r={400} t={t} k={seg(t, 0.2, 0.8)} />
        <Act id="tanjiro" t={t} p={{ x: 960, y: 820, s: 0.9, expr: "fierce", sword: "R", glow: "#ff7a1a", aR: [lerp(-30, 140, easeOut(seg(t, 0.2, 0.6))), 10], sw: lerp(220, 60, easeOut(seg(t, 0.2, 0.6))), lean: 16, lR: [40, -60], lL: [-20, -30] }} />
      </Stage>
    ),
  },
  {
    at: "Но перед рассветом прилетает Аказа", cut: "cut", music: "dread", sfx: [[0.4, "boom", 1]],
    r: ({ t, d }) => {
      const land = easeOut(seg(t, 0, 0.45));
      return (
        <Stage cam={withShake(push(t, d, 1.05, 1.15), t, hit(t, 0.45, 0.9))} bg={(c) => <SnowMountains cam={c} tod="night" t={t} trees />}>
          {t > 0.45 ? <ellipse cx={960} cy={910} rx={320 * seg(t, 0.45, 0.8)} ry={50} fill="#000" opacity={0.5} /> : null}
          <Act id="akaza" t={t} p={{ x: 960, y: lerp(-200, 920, land), s: 1.15, expr: "smile", aR: [70, 80], aL: [-70, -80], lR: [24, -30], lL: [-24, 30] }} />
          <Kanji ch="上弦参" x={1650} y={300} t={t - 0.6} size={130} c="#f6d43c" dur={d} />
        </Stage>
      );
    },
  },
  {
    at: "Ренгоку дерётся за всех", cut: "flash", music: "battle", sfx: [[0.2, "fire", 1], [0.5, "hit", 1], [1.0, "hit", 1], [1.5, "slash", 1], [2.0, "hit", 1]],
    r: ({ t, d }) => {
      const k = (t * 1.4) % 1;
      return (
        <Stage cam={withShake(pan(t, d, -60, 60, 1.1), t, 0.35 + hit(k, 0.3, 0.3, 0.5))} bg={(c) => <SnowMountains cam={c} tod="night" t={t} trees />}>
          <FireArc x={760} y={520} r={320} t={t} k={1} a0={-200 + t * 300} sweep={180} />
          <Act id="rengoku" t={t} p={{ x: 760, y: 980, s: 1.05, expr: "fierce", sword: "R", glow: "#ff7a1a", aR: [lerp(-20, 140, Math.sin(k * Math.PI)), 10], sw: lerp(210, 80, Math.sin(k * Math.PI)), lean: 12, lR: [24, -14], lL: [-24, 10] }} />
          <Act id="akaza" t={t} p={{ x: 1200, y: 980, s: 1.05, face: -1, expr: "smile", aR: [lerp(40, 100, 1 - k), 60], aL: [60, 40], lean: 14 }} />
          {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={980 + rnd(i + Math.floor(t * 6)) * 120} cy={420 + rnd(i, 3) * 300} r={14} fill="#ff4a6a" opacity={0.8} />)}
        </Stage>
      );
    },
  },
  {
    at: "Ты лежишь раненый", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, 0, 120)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} trees />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 960, s: 1, rot: -80, expr: "pain", blood: true, aR: [150, 20] }} />
        <Embers t={t} n={30} />
      </Stage>
    ),
  },
  {
    at: "Ренгоку не пускает Аказу", cut: "fade", music: "epic", sfx: [[0.3, "fire", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} trees />}>
        <SunRays x={1700} y={900} t={t} k={seg(t, 0, d)} />
        <Act id="rengoku" t={t} p={{ x: 860, y: 980, s: 1.05, expr: "fierce", blood: true, sword: "R", sw: 110, aR: [100, 20], aL: [90, 10], lean: 10, rim: "#ff7a1a" }} />
        <Act id="akaza" t={t} p={{ x: 1150, y: 980, s: 1.05, face: -1, expr: "angry", lean: -18, aR: [80, 20], aL: [60, 30] }} />
      </Stage>
    ),
  },
  {
    at: "Демон убегает", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, 0, 300, 1)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
        <Act id="akaza" t={t} p={{ x: 800 + t * 500, y: 980, s: 0.9, ...run(t, 2), expr: "angry" }} />
      </Stage>
    ),
  },
  {
    at: "а Ренгоку стоит с раной насквозь", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.25, 0, -80)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} trees={false} />}>
        <SunRays x={960} y={760} t={t} k={0.8} />
        <Act id="rengoku" t={t} p={{ x: 960, y: 1160, s: 1.3, expr: t > 2 ? "smile" : "soft", blood: true, talk: talk(t, t > 2.4), rim: "#ffb04a" }} />
        <Caption text="«ЗАЖГИ СВОЁ СЕРДЦЕ»" t={t} t0={2.6} dur={d - 2.6} y={250} size={80} c="#ffcf5a" font="Rubik, sans-serif" />
        <Embers t={t} n={30} c="#ffd38a" />
      </Stage>
    ),
  },
  {
    at: "Ты бросаешь меч вслед", cut: "cut", sfx: [[0.3, "whoosh", 1]],
    r: ({ t, d }) => {
      const k = seg(t, 0.3, 1.2);
      return (
        <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
          <Act id="tanjiro" t={t} p={{ x: 700, y: 1000, s: 1.05, expr: "shout", aR: [lerp(170, 90, easeOut(seg(t, 0.2, 0.4))), 0], lean: 14, blood: true, talk: talk(t, t > 1) }} />
          {k > 0 && k < 1 ? <g transform={`translate(${lerp(820, 2000, k)} ${560 - Math.sin(k * Math.PI) * 60}) rotate(90)`}><rect x={-6} y={-200} width={12} height={240} fill="#1a1c22" /></g> : null}
        </Stage>
      );
    },
  },
  {
    at: "А потом плачешь", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.18)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} trees />}>
        <Act id="zenitsu" t={t} p={{ x: 620, y: 1000, s: 0.95, expr: "cry", tears: true }} />
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1010, s: 1, expr: "cry", tears: true, head: 10, lean: 14 }} />
        <Char id="inosuke" p={{ x: 1300, y: 1000, s: 0.95, face: -1, head: 14 }} t={t} />
      </Stage>
    ),
  },
  {
    at: "Через несколько месяцев", cut: "fade", music: "tense", sfx: [[0.8, "fire", 0.6]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.12, 0, -80)} bg={() => <Void t={t} c="#0a0400" c2="#3a0e04" />}>
        <Act id={t > 1 ? "tanjiro_mark" : "tanjiro"} t={t} p={{ x: 960, y: 2100, s: 3, expr: "fierce", rim: t > 1 ? "#ff5a1a" : undefined }} />
        <Embers t={t} n={30} />
      </Stage>
    ),
  },
];

// ======================================================================= CH11 MARK & SUN
export const CH11: Shot[] = [
  {
    at: "^", music: "battle", sfx: [[0.3, "clang", 0.8], [1.2, "clang", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -100, 100, 1.05)} bg={(c) => <District cam={c} t={t} />}>
        <Act id="tengen" t={t} p={{ x: 760, y: 1000, s: 1, expr: "smile", sword: "R", sw: 120, aR: [120, 20], aL: [-100, -20] }} />
        <Act id="tanjiro" t={t} p={{ x: 1150, y: 1000, s: 0.95, expr: "fierce", sword: "R", sw: 140, aR: [60, 50] }} />
      </Stage>
    ),
  },
  {
    at: "Столп теряет руку и глаз", cut: "cut", sfx: [[0.3, "slash", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, 0, -120)} bg={(c) => <District cam={c} t={t} />}>
        <Act id="tengen" t={t} p={{ x: 960, y: 1100, s: 1.1, expr: "pain", patch: true, blood: true, aR: [10, -10] }} />
        <Kanji ch="上弦陸" x={1650} y={320} t={t} size={130} c="#ff4a6a" dur={d} />
      </Stage>
    ),
  },
  {
    at: "Брат и сестра-демоны умирают", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08)} bg={() => <Void t={t} c="#0a0408" c2="#3a0a1a" />}>
        <DemonSil x={760} y={1000} s={0.95} t={t} c="#1a0a10" eyes="#7ae8a0" claws={false} />
        <DemonSil x={1160} y={1000} s={0.9} t={t + 2} c="#20101a" eyes="#ffd23a" claws={false} />
        <Embers t={t} n={30} c="#ff8a8a" />
      </Stage>
    ),
  },
  {
    at: "А в последний миг брат несёт", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.1)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} trees={false} />}>
        <g opacity={1 - seg(t, d - 2, d)}>
          <Char id="sib_girl" p={{ x: 1000 - t * 40 + 20, y: 860 - 90, s: 1.2, face: -1, sil: "#2a1a24", lean: 8, aR: [60, 50], aL: [40, 60] }} t={t} />
          <Char id="sib_boy" p={{ x: 1000 - t * 40, y: 900, s: 1.3, face: -1, sil: "#140a10", ...walk(t, 0.6, 0.6), aR: [-30, 70] }} t={t} />
        </g>
        <Snow t={t} n={60} />
        <Dark op={seg(t, 0, d) * 0.5} />
      </Stage>
    ),
  },
  {
    at: "Ты смотришь им вслед", cut: "fade",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.07)} bg={(c) => <District cam={c} t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 760, y: 1860, s: 2.6, expr: "sad", gaze: 0.6 }} />
        <g opacity={0.5 * seg(t, 1, 2)}><Act id="nezuko" t={t} seed={2} p={{ x: 1450, y: 1300, s: 1.3, expr: "soft" }} /></g>
      </Stage>
    ),
  },
  {
    at: "В том бою на твоём лбу", cut: "cut", music: "epic", sfx: [[0.6, "fire", 1]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.15, 0, -100)} bg={() => <Void t={t} c="#0a0400" c2="#4a1004" />}>
        <Act id={t > 0.8 ? "tanjiro_mark" : "tanjiro"} t={t} p={{ x: 960, y: 2700, s: 3.8, expr: "fierce", rim: "#ff5a1a" }} />
        <Flash k={seg(t, 0.8, 1.2)} c="#ffb04a" />
        <Kanji ch="痣" x={1650} y={380} t={t - 0.8} size={220} c="#ff5a1a" dur={d} />
      </Stage>
    ),
  },
  {
    at: "Ты становишься сильнее", cut: "cut", sfx: [[0.1, "slash", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.1), t, hit(t, 0.2, 0.5, 0.6))} bg={(c) => <District cam={c} t={t} />}>
        <FireArc x={960} y={540} r={400} t={t} k={seg(t, 0, 0.6)} />
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1000, s: 1.1, expr: "fierce", sword: "R", glow: "#ff7a1a", aR: [120, 10], sw: 70, lean: 14 }} />
      </Stage>
    ),
  },
  {
    at: "Но позже узнаешь", cut: "fade", music: "sad",
    r: ({ t, d }) => {
      const k = seg(t, 0.5, d);
      return (
        <Stage cam={push(t, d, 1, 1.08)} bg={() => <Paper c="#120e0c" />}>
          <rect x={920} y={560 + k * 200} width={80} height={300 - k * 200} fill="#efe6d4" />
          <g transform={`translate(960 ${560 + k * 200})`}><Embers t={t} n={0} /><path d={`M -14 0 C -14 -40 0 -60 0 -80 C 0 -60 14 -40 14 0 Z`} fill="#ffb04a" /></g>
          <circle cx={960} cy={500 + k * 200} r={200} fill="url(#g_glowO)" opacity={0.5} />
          <Caption text="ДО 25" t={t} t0={1.8} dur={d - 1.8} y={300} size={140} c="#ff5a3a" />
        </Stage>
      );
    },
  },
  {
    at: "В деревне кузнецов", cut: "fade", music: "calm",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -100, 100, 1.02)} bg={(c) => <Village cam={c} t={t} tod="day" />}>
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 980, s: 0.85, expr: "smile", ...walk(t, 0.8, 0.6) }} />
        <Act id="smith" t={t} p={{ x: 1300, y: 980, s: 0.8, face: -1 }} />
      </Stage>
    ),
  },
  {
    at: "ты находишь старую деревянную куклу", cut: "fade", music: "mystic",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2, 0, -60)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
        <Char id="yoriichi" p={{ x: 1150, y: 1000, s: 1.1, face: -1, sil: "#9a7448", sword: "R", sw: 120, aR: [70, 40], aL: [-70, -40] }} t={t} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M 1150 ${560 + i * 40} l ${-140 - i * 10} ${-40 + i * 30}`} stroke="#15100e" strokeWidth={22} strokeLinecap="round" />)}
        {[0, 1, 2, 3].map((i) => <path key={"b" + i} d={`M 1150 ${560 + i * 40} l ${-140 - i * 10} ${-40 + i * 30}`} stroke="#9a7448" strokeWidth={14} strokeLinecap="round" />)}
        <Act id="tanjiro_mark" t={t} p={{ x: 660, y: 1000, s: 1, expr: "shock" }} />
      </Stage>
    ),
  },
  {
    at: "Кукла повторяет движения", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={(c) => <Forest cam={c} t={t} tod="day" />}>
        <Char id="yoriichi" p={{ x: 960, y: 1000, s: 1.15, sil: "#9a7448", sword: "R", sw: 150 + Math.sin(t * 2) * 50, aR: [100 + Math.sin(t * 2) * 40, 20], lean: Math.sin(t * 2) * 6 }} t={t} />
        <g opacity={0.45 * seg(t, 0.6, 1.6)}><Act id="yoriichi" t={t} p={{ x: 960, y: 1000, s: 1.15, expr: "soft", sword: "R", sw: 150 + Math.sin(t * 2) * 50, aR: [100 + Math.sin(t * 2) * 40, 20], lean: Math.sin(t * 2) * 6 }} /></g>
      </Stage>
    ),
  },
  {
    at: "А потом в деревню приходят", cut: "cut", music: "battle", sfx: [[0.3, "boom", 0.9], [0.5, "growl", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.1), t, hit(t, 0.3, 0.7))} bg={(c) => <Village cam={c} t={t} tod="night" />}>
        <DemonSil x={640} y={1000} s={1.1} t={t} c="#140a14" eyes="#ff3a3a" kanji="伍" />
        <DemonSil x={1280} y={1000} s={1.15} t={t + 2} c="#100a0a" eyes="#ffd23a" kanji="肆" />
        <Kanji ch="上弦" x={960} y={300} t={t} size={150} c="#ff3a3a" dur={d} vertical={false} />
      </Stage>
    ),
  },
  {
    at: "Наступает рассвет", cut: "fade", music: "tense",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring />}>
        <SunRays x={960} y={800} t={t} k={seg(t, 0, d)} />
      </Stage>
    ),
  },
  {
    at: "Демон убегает", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => <Village cam={c} t={t} tod="dawn" />}>
        <rect x={-500} y={-400} width={1500 - t * 120} height={2000} fill="#000" opacity={0.35} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 860, y: 1000, s: 1, demon: true, expr: "pain" }} />
        <DemonSil x={1550 + t * 160} y={1000} s={0.8} t={t} c="#100a0a" eyes="#ffd23a" />
      </Stage>
    ),
  },
  {
    at: "Ты должен выбрать", cut: "cut", sfx: [[0, "heart", 1], [1, "heart", 1]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.12)} bg={() => <Void t={t} c="#0a0604" c2="#5a2a08" />}>
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "pain", gaze: Math.sin(t * 5) }} />
        <Caption text="СЕСТРА" t={t} t0={0.6} dur={d - 0.6} x={420} y={300} size={70} c="#ff8ac4" font="Rubik, sans-serif" />
        <Caption text="ДЕМОН" t={t} t0={1.6} dur={d - 1.6} x={1500} y={300} size={70} c="#ffcf5a" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Незуко сама выталкивает тебя", cut: "cut", sfx: [[0.3, "kick", 1]],
    r: ({ t, d }) => {
      const k = easeOut(seg(t, 0.2, 0.5));
      return (
        <Stage cam={withShake(push(t, d, 1.15, 1.25), t, hit(t, 0.3, 0.5, 0.6))} bg={(c) => <Village cam={c} t={t} tod="dawn" />}>
          <Act id="nezuko" t={t} seed={2} p={{ x: 800, y: 1000, s: 1, demon: true, expr: "fierce", lR: [lerp(0, 110, k), -10], aR: [80, 20], lean: -10, talk: talk(t, t > 0.8 && t < 1.6) }} />
          <Act id="tanjiro_mark" t={t} p={{ x: lerp(1050, 1600, k), y: 1000 - Math.sin(k * Math.PI) * 120, s: 1, face: -1, expr: "shock", rot: -20 * k }} />
          <Caption text="«ИДИ»" t={t} t0={0.8} dur={d - 0.8} x={700} y={280} size={90} c="#ffb6d8" font="Rubik, sans-serif" />
        </Stage>
      );
    },
  },
  {
    at: "Ты бьёшь демона", cut: "flash", sfx: [[0.1, "fire", 1], [0.3, "slash", 1]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1.05, 1.15), t, hit(t, 0.3, 0.6))} bg={(c) => <Village cam={c} t={t} tod="dawn" />}>
        <FireArc x={960} y={540} r={420} t={t} k={seg(t, 0.05, 0.5)} />
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1000, s: 1.1, expr: "fierce", sword: "R", glow: "#ff7a1a", aR: [lerp(-30, 140, easeOut(seg(t, 0.05, 0.4))), 10], sw: lerp(220, 60, easeOut(seg(t, 0.05, 0.4))), lean: 16 }} />
      </Stage>
    ),
  },
  {
    at: "Оборачиваешься", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.05)} bg={(c) => <Village cam={c} t={t} tod="dawn" />}>
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "shock", turn: lerp(1, -0.3, easeOut(seg(t, 0, 0.5))) }} />
      </Stage>
    ),
  },
  {
    at: "И видишь её на солнце", cut: "fade", music: "theme", sfx: [[0.2, "chime", 1]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2, 0, -40)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring />}>
        <SunRays x={1500} y={600} t={t} k={1} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 960, y: 1060, s: 1.1, expr: "smile", rim: "#ffe0a0" }} />
        <Petals t={t} n={30} c="#ffe8b0" />
      </Stage>
    ),
  },
  {
    at: "Она улыбается и говорит", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.07)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring trees={false} />}>
        <SunRays x={1600} y={300} t={t} k={1} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 960, y: 1860, s: 2.6, expr: "happy", muzzle: false, talk: talk(t, t > 0.8 && t < 2) }} />
        <Caption text="«ДОБРОЕ УТРО»" t={t} t0={1} dur={d - 1} y={250} size={90} c="#fff4d0" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Незуко победила солнце", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.06)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring />}>
        <SunRays x={960} y={700} t={t} k={1} />
        <Kanji ch="日" x={960} y={560} t={t} size={320} c="#fff2c0" dur={d} vertical={false} />
      </Stage>
    ),
  },
  {
    at: "И теперь Мудзан хочет её", cut: "cut", music: "dread", sfx: [[0.2, "boom", 0.6]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.12)} bg={() => <Void t={t} />}>
        <Act id="muzan" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "smile" }} />
      </Stage>
    ),
  },
  {
    at: "Значит, последняя битва", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={(c) => <SnowMountains cam={c} tod="dusk" t={t} trees={false} />}>
        <Char id="tanjiro_mark" p={{ x: 960, y: 1000, s: 1.2, sil: "#140a0a", sword: "R", sw: 150, aR: [50, 50] }} t={t} />
        <rect x={-100} y={-100} width={2200} height={1300} fill="#7a0010" opacity={0.25} />
      </Stage>
    ),
  },
];

// ======================================================================= CH12 INFINITY CASTLE
export const CH12: Shot[] = [
  {
    at: "^", music: "dread",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => <Estate cam={c} t={t} night />}>
        <Act id="oyakata" t={t} p={{ x: 760, y: 1000, s: 1, expr: "soft" }} />
        <Act id="muzan" t={t} p={{ x: 1250, y: 1000, s: 1.02, face: -1, expr: "neutral", op: seg(t, 0, 1) }} />
      </Stage>
    ),
  },
  {
    at: "И глава взрывает себя", cut: "flash", sfx: [[0.1, "explosion", 1]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.1), t, hit(t, 0.05, 1.4))} bg={(c) => <Estate cam={c} t={t} night />}>
        <circle cx={960} cy={700} r={1400 * easeOut(seg(t, 0, 0.8))} fill="url(#g_glowO)" />
        <circle cx={960} cy={700} r={600 * easeOut(seg(t, 0, 0.5))} fill="#fff4d0" opacity={1 - seg(t, 0.3, 1.2)} />
        <Embers t={t} n={60} />
      </Stage>
    ),
  },
  {
    at: "Тамаё вкалывает в Мудзана", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, 0, -100)} bg={() => <Void t={t} c="#0a0408" c2="#3a0a20" />}>
        <Act id="muzan" t={t} p={{ x: 1080, y: 1100, s: 1.15, face: -1, expr: "angry", demon: true }} />
        <Act id="tamayo" t={t} p={{ x: 760, y: 1100, s: 1.1, expr: "fierce", aR: [100, 0], lean: 14 }} />
        <rect x={900} y={590} width={80} height={16} rx={6} fill="#cfe8ff" stroke="#15100e" strokeWidth={3} />
      </Stage>
    ),
  },
  {
    at: "А всех истребителей затягивает", cut: "cut", music: "battle", sfx: [[0.2, "whoosh", 1]],
    r: ({ t, d }) => (
      <Stage cam={camLerp(t, d, { z: 1, rot: -10 }, { z: 1.1, rot: 10 })} bg={(c) => <Castle cam={c} t={t} />}>
        {["tanjiro_mark", "zenitsu", "inosuke", "giyu", "kanao"].map((id, i) => (
          <Act key={id} id={id} t={t} p={{ x: 360 + i * 300, y: 300 + ((t * 300 + i * 200) % 900), s: 0.6, rot: t * 90 * (i % 2 ? 1 : -1) + i * 40, expr: "shock" }} />
        ))}
        <SpeedLines t={t} op={0.25} />
      </Stage>
    ),
  },
  {
    at: "Там ты снова встречаешь Аказу", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -80, 80, 1.05)} bg={(c) => <Castle cam={c} t={t} />}>
        <Act id="tanjiro_mark" t={t} p={{ x: 620, y: 1000, s: 0.95, expr: "angry", sword: "R", sw: 140, aR: [60, 50] }} />
        <Act id="giyu" t={t} p={{ x: 880, y: 1000, s: 0.98, expr: "neutral", sword: "R", sw: 130, aR: [60, 40] }} />
        <Act id="akaza" t={t} p={{ x: 1350, y: 1000, s: 1, face: -1, expr: "smile", aR: [80, 70], aL: [-70, -80] }} />
      </Stage>
    ),
  },
  {
    at: "В бою ты перестаёшь злиться", cut: "fade", music: "mystic", sfx: [[0.2, "chime", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={() => <Paper c="#dfe8f2" />}>
        <g opacity={0.8}>
          <Char id="akaza" p={{ x: 960, y: 1060, s: 1.25, face: -1, sil: "#a9d4ff", aR: [70, 80], aL: [-70, -80] }} t={t} />
        </g>
        <g stroke="#2a6ad8" strokeWidth={4} fill="none" opacity={0.8}>
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M ${900 + (i % 3) * 40} ${470 + i * 34} q 20 ${Math.sin(t * 4 + i) * 10} 40 0`} />)}
          <path d="M 960 400 L 960 700 M 920 520 Q 960 560 1000 520" />
        </g>
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M ${860 + rnd(i) * 200} ${380 + i * 50} q 40 ${Math.sin(t * 3 + i) * 20} 80 0`} stroke="#3cc6ff" strokeWidth={4} fill="none" opacity={0.8} />)}
        <Caption text="ПРОЗРАЧНЫЙ МИР" t={t} t0={2} dur={d - 2} y={250} size={70} c="#2a4a7a" font="Rubik, sans-serif" stroke="#fff" />
      </Stage>
    ),
  },
  {
    at: "Ты отрубаешь ему голову", cut: "flash", music: "epic", sfx: [[0.1, "fire", 1], [0.3, "slash", 1]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.12), t, hit(t, 0.3, 0.6))} bg={(c) => <Castle cam={c} t={t} />}>
        <FireArc x={960} y={520} r={420} t={t} k={seg(t, 0, 0.5)} />
        <Act id="tanjiro_mark" t={t} p={{ x: 760, y: 1000, s: 1.05, expr: "fierce", sword: "R", glow: "#ff7a1a", aR: [lerp(-30, 140, easeOut(seg(t, 0.05, 0.4))), 10], sw: lerp(220, 60, easeOut(seg(t, 0.05, 0.4))), lean: 18 }} />
        <Act id="akaza" t={t} p={{ x: 1250, y: 1000, s: 1, face: -1, expr: "shock", op: 1 - seg(t, 0.8, 2) }} />
      </Stage>
    ),
  },
  {
    at: "А он, умирая, вспоминает", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.12)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} trees={false} />}>
        <g opacity={0.85}>
          <Act id="akaza" t={t} p={{ x: 800, y: 1000, s: 1, expr: "cry", tears: true, alwaysDemon: false } as any} />
          <Act id="koyuki" t={t} p={{ x: 1150, y: 1000, s: 1, face: -1, expr: "smile", aR: [100, 30] }} />
        </g>
        <Snow t={t} n={70} c="#ffe8f0" />
        <Petals t={t} n={20} c="#ffc0d8" />
      </Stage>
    ),
  },
  {
    at: "В ту ночь гибнут многие", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.06)} bg={() => <Paper c="#efe6d4" />}>
        {["ГЛАВА КОРПУСА", "ТАМАЁ", "ШИНОБУ", "МУИЧИРО", "ГЁМЕЙ", "МИЦУРИ", "ОБАНАЙ"].map((n, i) => (
          <text key={n} x={1660 - i * 230} y={150} fontFamily="'Rubik Dirt', Rubik" fontSize={58} fill="#15100e" opacity={seg(t, 0.3 + i * 0.3, 0.7 + i * 0.3)} style={{ writingMode: "vertical-rl" as any }}>{n}</text>
        ))}
      </Stage>
    ),
  },
  {
    at: "Шинобу, хозяйка поместья", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2, 0, -80)} bg={() => <Void t={t} c="#0a0612" c2="#3a2050" />}>
        <g opacity={1 - seg(t, 2.5, d) * 0.8}><Act id="shinobu" t={t} p={{ x: 960, y: 1150, s: 1.3, expr: "smile", sword: "R", sw: 160, aR: [60, 50] }} /></g>
        <Butterflies t={t} n={24} c="#c7a6ec" />
      </Stage>
    ),
  },
  {
    at: "Канао и Иноске добивают его", cut: "flash", music: "battle", sfx: [[0.2, "slash", 1], [0.5, "slash", 1]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1.05, 1.15), t, hit(t, 0.5, 0.6))} bg={(c) => <Castle cam={c} t={t} />}>
        <DemonSil x={960} y={1000} s={1.1} t={t} c="#e8ecf4" eyes="#ff6ad8" claws={false} />
        <Act id="kanao" t={t} p={{ x: 560, y: 1000, s: 1, expr: "fierce", sword: "R", aR: [130, 10], sw: 60, lean: 16 }} />
        <Char id="inosuke" p={{ x: 1360, y: 1000, s: 1, face: -1, sword: "R", aR: [130, 10], aL: [-130, -10], sw: 60, lean: 16 }} t={t} />
        <Slash x={960} y={500} len={600} ang={-20} k={seg(t, 0.15, 0.5)} c="#ffd8f0" />
        <Slash x={960} y={600} len={600} ang={20} k={seg(t, 0.4, 0.8)} />
      </Stage>
    ),
  },
  {
    at: "Зеницу сражается", cut: "cut", sfx: [[0.6, "thunder", 1]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.1), t, hit(t, 0.6, 0.7))} bg={() => <Void t={t} c="#0a0800" c2="#2a2000" />}>
        <Lightning x1={300} y1={500} x2={1100} y2={560} t={t} w={14} />
        <Lightning x1={1700} y1={400} x2={1100} y2={600} t={t + 3} seed={4} w={8} />
        <Act id="zenitsu" t={t} p={{ x: 560, y: 1000, s: 1, expr: "fierce", sword: "R", sw: 90, aR: [110, 10], lean: 30, lR: [60, -80], lL: [-40, -10] }} />
        <DemonSil x={1450} y={1000} s={1} t={t} c="#1a1410" eyes="#b48aff" />
      </Stage>
    ),
  },
  {
    at: "А самый юный из Столпов", cut: "fade", music: "sad", sfx: [[0.2, "chime", 0.7]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.15)} bg={() => <Void t={t} c="#030a0c" c2="#0a3a40" />}>
        <g opacity={1 - seg(t, d - 1.6, d) * 0.85}><Act id="muichiro" t={t} p={{ x: 960, y: 1100, s: 1.2, expr: "soft", sword: "R", sw: 150, aR: [150, 10], glow: "#7fe9f0", blood: true }} /></g>
        <Par cam={{ x: 0, y: 0, z: 1 }} d={1}><Mist y={900} h={300} op={0.4} t={t} c="#7fe9f0" /></Par>
      </Stage>
    ),
  },
  {
    at: "Ты не успеваешь даже попрощаться", cut: "fade",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.07)} bg={(c) => <Castle cam={c} t={t} />}>
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "cry", tears: true, blood: true }} />
        <Dark op={0.3} />
      </Stage>
    ),
  },
  {
    at: "А потом Мудзан выходит", cut: "fade", music: "dread", sfx: [[0.3, "boom", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={(c) => <CityNight cam={c} t={t} ruined />}>
        <g opacity={0.95}><Char id="muzan_battle" p={{ x: 960, y: 1200, s: 2.2, sil: "#0a0306", silEye: "#ff1e30" }} t={t} /></g>
        <Whips x={960} y={560} t={t} n={9} len={900} k={seg(t, 0.4, 2)} />
        <Caption text="ДО РАССВЕТА — ЧАС" t={t} t0={2.5} dur={d - 2.5} y={250} size={80} c="#ffcf5a" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
];
