import React from "react";
import type { Shot } from "./types";
import { Stage, Act, push, pan, camLerp, Caption, Dark, withShake, hit, Scent } from "../kit";
import { SnowMountains, Interior, Town, Forest, Wisteria, Paper, Void, Mist, Crowd, Par, Sky, Moon } from "../scenes/BG";
import { Snow, Kanji, WaterArc, Flash, SpeedLines, BloodSplat, Slash, Boulder, Box, Crow, HandDemon, DemonSil, Embers, PinkFire, Petals } from "../scenes/FX";
import { walk, run, seg, easeOut, easeInOut, talk, lerp, clamp, rnd } from "../lib";
import { Char, FoxMask, Sword } from "../rig/Char";

const Sagiri = (c: any, t: number, tod: "day" | "dusk" | "night" = "day") => (
  <>
    <Forest cam={c} t={t} tod={tod === "dusk" ? "day" : tod} />
    <Par cam={c} d={0.7}><Mist y={760} h={320} op={tod === "night" ? 0.3 : 0.75} t={t} c={tod === "night" ? "#5a6a90" : "#f4f6f4"} /></Par>
    {tod === "dusk" ? <rect x={-1000} y={-600} width={4000} height={2400} fill="#ff8a4a" opacity={0.18} /> : null}
  </>
);
const Clearing = (c: any, t: number) => (
  <>
    <Forest cam={c} t={t} tod="day" fog />
    <Par cam={c} d={0.75}><Mist y={820} h={260} op={0.85} t={t} /></Par>
  </>
);

// ======================================================================= CH3 STONE
export const CH3: Shot[] = [
  {
    at: "^", music: "calm", sfx: [[0.2, "wind", 0.5]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.45, 0, -200)} bg={(c) => Sagiri(c, t)}>
        <Act id="urokodaki" t={t} p={{ x: 960, y: 1140, s: 1.3, aR: [20, -40], aL: [-20, 40] }} />
        <Kanji ch="鬼" x={1600} y={400} t={t} size={180} c="#c8312c" dur={2.6} />
      </Stage>
    ),
  },
  {
    at: "Он сразу проверяет тебя",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -60, 60, 1.15, -40)} bg={(c) => Sagiri(c, t)}>
        <Act id="urokodaki" t={t} p={{ x: 1250, y: 940, s: 1.05, face: -1, aR: [60, 30], talk: talk(t, t > 0.8) }} />
        <Act id="tanjiro_kid" t={t} p={{ x: 700, y: 950, s: 0.95, expr: "neutral" }} />
        <Box x={480} y={950} s={0.6} />
      </Stage>
    ),
  },
  {
    at: "Ты молчишь",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={(c) => Sagiri(c, t)}>
        <Act id="tanjiro_kid" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "sad", gaze: Math.sin(t * 3) * 0.7 }} />
        <path d="M 1120 500 q -6 24 0 40" stroke="#bfe6ff" strokeWidth={8} fill="none" opacity={seg(t, 0.3, 0.6)} />
      </Stage>
    ),
  },
  {
    at: "И получаешь пощёчину", cut: "flash", sfx: [[0.15, "slap", 1]],
    r: ({ t, d }) => {
      const k = easeOut(seg(t, 0.05, 0.25));
      return (
        <Stage cam={withShake(push(t, d, 1.3, 1.36, 0, -150), t, hit(t, 0.15, 0.4))} bg={(c) => Sagiri(c, t)}>
          <Act id="tanjiro_kid" t={t} p={{ x: 860, y: 1100, s: 1.15, expr: k > 0.5 ? "pain" : "sad", head: -18 * k, turn: -0.8 * k, lean: -6 * k }} />
          <Act id="urokodaki" t={t} p={{ x: 1240, y: 1090, s: 1.15, face: -1, aR: [lerp(150, 60, k), lerp(0, -20, k)] }} />
          <Slash x={980} y={430} len={260} ang={20} k={seg(t, 0.05, 0.4)} />
        </Stage>
      );
    },
  },
  {
    at: "Ты слишком медленно думаешь",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.08)} bg={(c) => Sagiri(c, t)}>
        <Act id="urokodaki" t={t} p={{ x: 960, y: 1860, s: 2.6, talk: talk(t, t < 1.8) }} />
      </Stage>
    ),
  },
  {
    at: "Целый год он учит тебя", music: "training", cut: "fade", sfx: [[0.6, "water", 0.8]],
    r: ({ t, d }) => {
      const k = (t * 0.7) % 1;
      return (
        <Stage cam={push(t, d, 1.05, 1.15)} bg={(c) => Sagiri(c, t)}>
          <WaterArc x={960} y={560} r={300} t={t} k={seg(k, 0.1, 0.6)} a0={-200 + Math.floor(t * 0.7) * 40} sweep={240} />
          <Act id="tanjiro_train" t={t} p={{ x: 960, y: 980, s: 1.05, expr: "fierce", sword: "R", aR: [lerp(-40, 120, easeOut(seg(k, 0.1, 0.5))), 20], sw: lerp(220, 90, easeOut(seg(k, 0.1, 0.5))), aL: [30, 60], lR: [18, -8], lL: [-18, 6] }} />
          <Kanji ch="水" x={1600} y={420} t={t} size={220} c="#3c8fd8" dur={3.4} />
        </Stage>
      );
    },
  },
  {
    at: "Ты бегаешь по горе", cut: "cut", sfx: [[1.4, "thud", 0.8], [2.6, "thud", 0.8]],
    r: ({ t, d }) => {
      const fall = seg(t, 1.3, 1.6) - seg(t, 2.0, 2.4);
      return (
        <Stage cam={pan(t, d, -200, 200, 1.05)} bg={(c) => Sagiri(c, t)}>
          <Act id="tanjiro_train" t={t} p={{ x: 500 + t * 220, y: 960, s: 0.9, expr: fall > 0.3 ? "pain" : "fierce", ...run(t, 1.7), rot: 70 * fall, mask: false }} />
          <g transform={`translate(${900 + t * 120} ${lerp(-300, 880, easeOut(seg(t, 0.8, 1.35)))})`}>
            <rect x={-30} y={-180} width={60} height={180} fill="#6a4a30" stroke="#15100e" strokeWidth={5} />
          </g>
        </Stage>
      );
    },
  },
  {
    at: "Учишься дышать так",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={(c) => Sagiri(c, t)}>
        <Act id="tanjiro_train" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "closed", mask: false }} />
        {[0, 1, 2].map((i) => {
          const k = ((t * 0.6 + i / 3) % 1);
          return <circle key={i} cx={960} cy={620} r={60 + k * 520} fill="none" stroke="#7fd0ff" strokeWidth={6 * (1 - k)} opacity={1 - k} />;
        })}
        <WaterArc x={960} y={560} r={430} t={t} k={1} a0={-90 + t * 40} sweep={140} />
      </Stage>
    ),
  },
  {
    at: "Вечером ты возвращаешься", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.18)} bg={(c) => Sagiri(c, t, "dusk")}>
        <Act id="tanjiro_train" t={t} p={{ x: 960 - t * 30, y: 960, s: 1, face: -1, expr: "pain", ...walk(t, 0.6, 0.6), lean: 10, mask: false }} />
        <BloodSplat x={930} y={480} s={0.08} k={0.4} c="#7a4a8a" seed={2} />
      </Stage>
    ),
  },
  {
    at: "А Незуко всё это время спит", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.15, 1.25, 0, 60)} bg={(c) => <Interior cam={c} t={t} fire={0.5} dark />}>
        <rect x={500} y={880} width={900} height={60} rx={10} fill="#e8e2d4" stroke="#15100e" strokeWidth={5} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 1180, y: 870, s: 0.95, rot: -90, expr: "closed", blink: 1 }} />
        <Dark op={0.25} c="#0a0e20" />
      </Stage>
    ),
  },
  {
    at: "Каждый вечер ты садишься рядом",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, -80, 40)} bg={(c) => <Interior cam={c} t={t} fire={0.6} dark />}>
        <rect x={700} y={900} width={900} height={60} rx={10} fill="#e8e2d4" stroke="#15100e" strokeWidth={5} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 1360, y: 890, s: 0.95, rot: -90, expr: "closed", blink: 1 }} />
        <Act id="tanjiro_train" t={t} p={{ x: 640, y: 1080, s: 1, expr: "smile", talk: talk(t, true), mask: false, lean: 8, lR: [80, -100], lL: [70, -110] }} />
        <Dark op={0.2} c="#0a0e20" />
      </Stage>
    ),
  },
  {
    at: "И боишься, что она",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.08)} bg={(c) => <Interior cam={c} t={t} fire={0.4} dark />}>
        <Act id="tanjiro_train" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "sad", tears: t > 1, mask: false }} />
        <Dark op={0.3} c="#0a0e20" />
      </Stage>
    ),
  },
  {
    at: "Потом Урокодаки подводит тебя", cut: "fade", music: "tense", sfx: [[0.4, "wind", 0.5]],
    r: ({ t, d }) => (
      <Stage cam={camLerp(t, d, { z: 1.2, y: 80 }, { z: 1, y: 0 })} bg={(c) => Clearing(c, t)}>
        <Boulder x={1060} y={900} s={1.3} />
        <Act id="urokodaki" t={t} p={{ x: 440, y: 920, s: 0.6, aR: [80, 10] }} />
        <Act id="tanjiro_train" t={t} p={{ x: 580, y: 930, s: 0.55, expr: "shock" }} />
      </Stage>
    ),
  },
  {
    at: "Разрубишь", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.4, 120, -140)} bg={(c) => Clearing(c, t)}>
        <Boulder x={1500} y={1000} s={1.2} />
        <Act id="urokodaki" t={t} p={{ x: 900, y: 1060, s: 1.05, aR: [100, -10], talk: talk(t, t < 1.6) }} />
      </Stage>
    ),
  },
  {
    at: "И перестаёт тебя учить", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.05)} bg={(c) => Clearing(c, t)}>
        <Boulder x={1100} y={900} s={1.3} />
        <Act id="urokodaki" t={t} p={{ x: 400 - t * 60, y: 900, s: 0.6, face: -1, ...walk(t, 0.6, 0.5), op: 1 - seg(t, 1, 2.2) }} />
        <Act id="tanjiro_train" t={t} p={{ x: 760, y: 930, s: 0.6, expr: "sad" }} />
      </Stage>
    ),
  },
  {
    at: "Полгода ты бьёшь камень", cut: "fade", sfx: [[0.5, "clang", 0.8], [1.3, "clang", 0.8], [2.1, "clang", 0.8], [2.9, "clang", 0.8]],
    r: ({ t, d }) => {
      const k = (t * 1.25) % 1;
      return (
        <Stage cam={withShake(push(t, d, 1.15, 1.25, 0, 20), t, hit(t % 0.8, 0.4, 0.2, 0.6))} bg={(c) => Clearing(c, t)}>
          <Boulder x={1200} y={940} s={1.2} />
          <Act id="tanjiro_train" t={t} p={{ x: 760, y: 960, s: 1, expr: k > 0.4 ? "pain" : "fierce", sword: "R", aR: [lerp(160, 70, easeOut(seg(k, 0.2, 0.4))), 20], sw: lerp(170, 60, easeOut(seg(k, 0.2, 0.4))), aL: [60, 60], lean: 8, mask: false }} />
          {k > 0.38 && k < 0.6 ? <g transform="translate(980 640)">{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M 0 0 l ${Math.cos(i) * 60} ${Math.sin(i * 1.3) * 60}`} stroke="#ffe08a" strokeWidth={5} />)}</g> : null}
          <Caption text="НИЧЕГО" t={t} t0={d - 1.4} dur={1.4} y={260} size={90} c="#e8e2d4" />
        </Stage>
      );
    },
  },
  {
    at: "И тогда в тумане появляется", cut: "fade", music: "mystic",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => Clearing(c, t)}>
        <Boulder x={1500} y={940} s={1} />
        <Act id="sabito" t={t} p={{ x: 960, y: 980, s: 1, mask: true, op: seg(t, 0.2, 1.6), sword: "R", sw: 160, aR: [20, 0], blade: undefined } as any} />
        <Par cam={{ x: 0, y: 0, z: 1 }} d={1}><Mist y={900} h={200} op={0.6} t={t} /></Par>
      </Stage>
    ),
  },
  {
    at: "И девочка", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.4, 0, -150)} bg={(c) => Clearing(c, t)}>
        <Act id="makomo" t={t} p={{ x: 960, y: 1060, s: 1.05, expr: "smile", op: seg(t, 0, 0.8) }} />
      </Stage>
    ),
  },
  {
    at: "Каждый день они бьют тебя", cut: "cut", sfx: [[0.3, "hit", 0.8], [1.2, "hit", 0.8], [2.1, "hit", 0.8]],
    r: ({ t, d }) => {
      const k = (t * 1.1) % 1;
      return (
        <Stage cam={withShake(pan(t, d, -60, 60, 1.1), t, hit(k, 0.2, 0.2, 0.7))} bg={(c) => Clearing(c, t)}>
          <Act id="tanjiro_train" t={t} p={{ x: 760 - easeOut(seg(k, 0.2, 0.4)) * 60, y: 960, s: 1, expr: "pain", lean: -10 * seg(k, 0.2, 0.4), sword: "R", sw: 120, aR: [60, 40], mask: false }} />
          <Act id="sabito" t={t} p={{ x: 1180, y: 950, s: 1, face: -1, mask: true, sword: "R", aR: [lerp(150, 80, easeOut(seg(k, 0.1, 0.25))), 10], sw: lerp(170, 70, easeOut(seg(k, 0.1, 0.25))), lean: 10 }} />
          <Act id="makomo" t={t} p={{ x: 1500, y: 930, s: 0.85, face: -1, expr: "smile" }} />
          <Slash x={950} y={520} len={260} ang={-40} k={seg(k, 0.1, 0.35)} />
        </Stage>
      );
    },
  },
  {
    at: "Однажды ты наконец", cut: "flash", music: "epic", sfx: [[0.2, "water", 1], [0.45, "slash", 1]],
    r: ({ t, d }) => {
      const k = easeOut(seg(t, 0.15, 0.45));
      return (
        <Stage cam={withShake(push(t, d, 1.05, 1.18), t, hit(t, 0.45, 0.5, 0.8))} bg={(c) => Clearing(c, t)}>
          <WaterArc x={1000} y={560} r={360} t={t} k={seg(t, 0.15, 0.5)} a0={-200} sweep={200} />
          <Act id="sabito" t={t} p={{ x: 1300, y: 950, s: 1, face: -1, mask: true, sword: "R", aR: [100, 10], sw: 100 }} />
          <Act id="tanjiro_train" t={t} p={{ x: lerp(600, 980, k), y: 960, s: 1.05, expr: "fierce", sword: "R", aR: [lerp(-20, 120, k), 10], sw: lerp(210, 80, k), lean: 16 * k, lR: [30, -20], lL: [-30, 10], mask: false }} />
          <SpeedLines t={t} op={0.4 * (1 - seg(t, 0.6, 1.2))} />
        </Stage>
      );
    },
  },
  {
    at: "Его маска раскалывается", cut: "cut", sfx: [[0.1, "crack", 1]],
    r: ({ t, d }) => {
      const k = easeOut(seg(t, 0.15, 0.9));
      return (
        <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={(c) => Clearing(c, t)}>
          <Act id="sabito" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "soft", op: 1 - seg(t, 2.0, 3.2) }} />
          <defs>
            <clipPath id="mL"><rect x={0} y={0} width={960} height={1080} /></clipPath>
            <clipPath id="mR"><rect x={960} y={0} width={960} height={1080} /></clipPath>
          </defs>
          <g opacity={1 - seg(t, 0.5, 1.1)}>
            <g clipPath="url(#mL)"><g transform={`translate(${-k * 160} ${k * 120}) rotate(${-k * 18} 960 520)`}><FoxMask x={960} y={530} s={2.75} crack /></g></g>
            <g clipPath="url(#mR)"><g transform={`translate(${k * 160} ${k * 140}) rotate(${k * 22} 960 520)`}><FoxMask x={960} y={530} s={2.75} crack /></g></g>
          </g>
          <Par cam={{ x: 0, y: 0, z: 1 }} d={1}><Mist y={700} h={400} op={0.5 * seg(t, 1.5, 3)} t={t} /></Par>
        </Stage>
      );
    },
  },
  {
    at: "А перед тобой", cut: "fade", music: "theme",
    r: ({ t, d }) => (
      <Stage cam={camLerp(t, d, { z: 1.3, y: -60 }, { z: 1.05, y: 0 })} bg={(c) => Clearing(c, t)}>
        <Boulder x={1150} y={920} s={1.3} cut={1} />
        <Act id="tanjiro_train" t={t} p={{ x: 640, y: 940, s: 0.95, expr: "shock", sword: "R", aR: [30, -10], sw: 30, mask: false }} />
      </Stage>
    ),
  },
  {
    at: "Позже ты узнаешь правду", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08)} bg={() => <Void t={t} c="#05060a" c2="#1a2236" />}>
        <g opacity={0.75}>
          <Act id="sabito" t={t} p={{ x: 760, y: 1000, s: 1, expr: "soft" }} />
          <Act id="makomo" t={t} p={{ x: 1160, y: 1000, s: 0.95, expr: "soft", face: -1 }} />
        </g>
        <Snow t={t} n={50} c="#9ab4e0" />
      </Stage>
    ),
  },
  {
    at: "Сабито и Макомо погибли", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.06)} bg={() => <Void t={t} c="#05060a" c2="#1a2236" />}>
        <g opacity={0.75 - seg(t, 0.5, 2.5) * 0.6}>
          <Act id="sabito" t={t} p={{ x: 760, y: 1000, s: 1, expr: "closed" }} />
          <Act id="makomo" t={t} p={{ x: 1160, y: 1000, s: 0.95, expr: "closed", face: -1 }} />
        </g>
        <FoxMask x={760} y={950} s={0.8} rot={-10} />
        <FoxMask x={1160} y={960} s={0.8} rot={12} />
      </Stage>
    ),
  },
  {
    at: "На том самом отборе", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.12)} bg={(c) => <Wisteria cam={c} t={t} />}>
        <Dark op={0.2} />
      </Stage>
    ),
  },
  {
    at: "И их убийца", cut: "cut", music: "dread", sfx: [[0.2, "growl", 1]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.15)} bg={() => <Void t={t} c="#020403" c2="#0e1a10" />}>
        <g opacity={seg(t, 0.2, 1.4)}><HandDemon x={960} y={1300} s={1.6} t={t} /></g>
        <Dark op={0.35} />
      </Stage>
    ),
  },
];

// ======================================================================= CH4 WISTERIA
export const CH4: Shot[] = [
  {
    at: "^", music: "mystic", sfx: [[0.2, "wind", 0.5]],
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -80, 80, 1.02)} bg={(c) => <Wisteria cam={c} t={t} />}>
        {Array.from({ length: 9 }, (_, i) => <Char key={i} id="demon" p={{ x: 260 + i * 170, y: 960, s: 0.5 + rnd(i) * 0.1, sil: "#140c1e" }} t={t} />)}
        <Act id="tanjiro_train" t={t} p={{ x: 960, y: 980, s: 0.75, expr: "fierce" }} />
        <Kanji ch="藤" x={1650} y={380} t={t} size={200} c="#b48ad8" dur={3} />
      </Stage>
    ),
  },
  {
    at: "Внутри", cut: "cut", sfx: [[0.2, "growl", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={(c) => <Forest cam={c} t={t} />}>
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} opacity={seg(t, i * 0.15, i * 0.15 + 0.3)}>
            <path d={`M ${300 + i * 220} ${400 + rnd(i) * 300} l 30 8 l -30 6 Z M ${360 + i * 220} ${400 + rnd(i) * 300} l -30 8 l 30 6 Z`} fill="#ff1e3c" />
          </g>
        ))}
      </Stage>
    ),
  },
  {
    at: "Нужно выжить семь ночей", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.05)} bg={(c) => <Wisteria cam={c} t={t} />}>
        <Caption text="7 НОЧЕЙ" t={t} t0={0.1} dur={d} y={500} size={170} c="#e9d8ff" />
      </Stage>
    ),
  },
  {
    at: "В первую же ночь", cut: "fade", music: "dread", sfx: [[0.5, "growl", 1]],
    r: ({ t, d }) => (
      <Stage cam={camLerp(t, d, { z: 1.3, y: 120 }, { z: 1, y: 0 })} bg={(c) => <Forest cam={c} t={t} />}>
        <HandDemon x={1150} y={980} s={1.25} t={t} />
        <Act id="tanjiro_train" t={t} p={{ x: 520, y: 980, s: 0.7, expr: "shock" }} />
      </Stage>
    ),
  },
  {
    at: "Он смеётся", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1, 0, -200)} bg={(c) => <Forest cam={c} t={t} />}>
        <HandDemon x={960} y={1480} s={2.2} t={t} />
        <Caption text="13" t={t} t0={2.4} dur={d - 2.4} x={1500} y={380} size={200} c="#ff3a3a" />
      </Stage>
    ),
  },
  {
    at: "И Сабито тоже", cut: "cut", sfx: [[0, "heart", 1]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.15)} bg={() => <Void t={t} c="#03060e" c2="#0a2a4a" />}>
        <Act id="tanjiro_train" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "angry" }} />
      </Stage>
    ),
  },
  {
    at: "Ты больше не боишься", cut: "cut", music: "epic", sfx: [[0.3, "unsheathe", 1]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.25, 0, -40)} bg={(c) => <Forest cam={c} t={t} />}>
        <Act id="tanjiro_train" t={t} p={{ x: 960, y: 1020, s: 1.2, expr: "fierce", sword: "R", aR: [60, 40], aL: [50, 50], sw: lerp(10, 135, easeOut(seg(t, 0.2, 0.7))), lR: [24, -10], lL: [-24, 8], glow: "#3cc6ff" }} />
        <WaterArc x={960} y={600} r={380} t={t} k={1} a0={-90 + t * 60} sweep={120} />
      </Stage>
    ),
  },
  {
    at: "Ты отрубаешь ему голову", cut: "flash", sfx: [[0.1, "water", 1], [0.35, "slash", 1]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.12), t, hit(t, 0.35, 0.6))} bg={(c) => <Forest cam={c} t={t} />}>
        <HandDemon x={1200} y={1000} s={1.15} t={t} dead={seg(t, 0.6, d)} />
        <WaterArc x={1000} y={540} r={420} t={t} k={seg(t, 0.05, 0.4)} a0={-170} sweep={170} />
        <Act id="tanjiro_train" t={t} p={{ x: lerp(500, 820, easeOut(seg(t, 0, 0.3))), y: 960 - Math.sin(seg(t, 0, 0.5) * Math.PI) * 200, s: 1, expr: "fierce", sword: "R", aR: [lerp(-30, 130, easeOut(seg(t, 0.05, 0.35))), 10], sw: lerp(220, 70, easeOut(seg(t, 0.05, 0.35))), lean: 18, lR: [50, -60], lL: [-20, -40] }} />
      </Stage>
    ),
  },
  {
    at: "И впервые чувствуешь не радость", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.2)} bg={(c) => <Forest cam={c} t={t} />}>
        <g opacity={0.6 - seg(t, 0, d) * 0.5}><HandDemon x={1220} y={1000} s={1.1} t={t} /></g>
        <Embers t={t} n={40} c="#a8c890" />
        <Act id="tanjiro_train" t={t} p={{ x: 700, y: 980, s: 1, expr: "sad", sword: "R", aR: [10, -6], sw: 20 }} />
      </Stage>
    ),
  },
  {
    at: "Ты кладёшь руку", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08)} bg={() => <Void t={t} c="#05060a" c2="#1a2a1a" />}>
        <g opacity={1 - seg(t, 0.8, d)}>
          <path d="M 1300 1200 Q 1200 700 1000 600" stroke="#15100e" strokeWidth={170} fill="none" strokeLinecap="round" />
          <path d="M 1300 1200 Q 1200 700 1000 600" stroke="#5a7a4a" strokeWidth={150} fill="none" strokeLinecap="round" />
          <circle cx={980} cy={590} r={110} fill="#6a8a5a" stroke="#15100e" strokeWidth={8} />
        </g>
        <path d="M 300 900 Q 600 700 860 600" stroke="#15100e" strokeWidth={96} fill="none" strokeLinecap="round" />
        <path d="M 300 900 Q 600 700 860 600" stroke="url(#p_cloud)" strokeWidth={84} fill="none" strokeLinecap="round" />
        <circle cx={900} cy={590} r={52} fill="#f7dfcd" stroke="#15100e" strokeWidth={6} />
        <Embers t={t} n={30} c="#cfe8b0" />
      </Stage>
    ),
  },
  {
    at: "Семь ночей ты почти не спишь", cut: "fade", music: "tense", sfx: [[0.8, "scream", 0.4], [2.4, "scream", 0.35]],
    r: ({ t, d }) => {
      const n = Math.min(6, Math.floor(t / (d / 7)));
      return (
        <Stage cam={push(t, d, 1, 1.05)} bg={(c) => <Wisteria cam={c} t={t} />}>
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i} transform={`translate(${360 + i * 200} 260)`} opacity={i <= n ? 1 : 0.25}>
              <circle r={44} fill="#f4f0dc" />
              <circle cx={(i - 3) * 9} r={44} fill="#120e1a" opacity={i <= n ? 0.85 - i * 0.12 : 0} />
            </g>
          ))}
          <Act id="tanjiro_train" t={t} p={{ x: 960, y: 1000, s: 0.95, expr: "pain", sword: "R", sw: 140, aR: [60, 50] }} />
          {Math.floor(t * 2) % 3 === 0 ? <Dark op={0.18} c="#5a0010" /> : null}
        </Stage>
      );
    },
  },
  {
    at: "Из двадцати с лишним ребят", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.06)} bg={(c) => <Wisteria cam={c} t={t} night={false} />}>
        {Array.from({ length: 21 }, (_, i) => {
          const keep = [3, 8, 10, 14, 18].includes(i);
          return <Char key={i} id="demon" p={{ x: 160 + i * 80, y: 980, s: 0.42, sil: "#2a2238", op: keep ? 1 : 1 - seg(t, 0.6 + rnd(i) * 1.5, 1 + rnd(i) * 1.5) }} t={t} />;
        })}
        <Caption text="20+ → 5" t={t} t0={2} dur={d - 2} y={300} size={110} c="#fff" />
      </Stage>
    ),
  },
  {
    at: "Ты выживаешь", cut: "fade", music: "theme",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.15)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring trees />}>
        <Act id="tanjiro_train" t={t} p={{ x: 960, y: 980, s: 1, expr: "soft", sword: "R", sw: 20, aR: [10, -6] }} />
      </Stage>
    ),
  },
  {
    at: "Тебе дают ворона-посыльного", cut: "fade", sfx: [[0.3, "wings", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, 0, -100)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees />}>
        <Act id="tanjiro_train" t={t} p={{ x: 900, y: 1060, s: 1.05, expr: "smile", aR: [110, -30] }} />
        <Crow x={lerp(1800, 1180, easeOut(seg(t, 0, 1.2)))} y={lerp(100, 330, easeOut(seg(t, 0, 1.2)))} s={1.4} t={t} flap={t < 1.2} />
      </Stage>
    ),
  },
  {
    at: "Клинок становится чёрным", cut: "cut", sfx: [[0.2, "chime", 0.8]],
    r: ({ t, d }) => {
      const k = seg(t, 0.4, 1.6);
      const c = `rgb(${Math.round(lerp(214, 24, k))},${Math.round(lerp(221, 26, k))},${Math.round(lerp(227, 32, k))})`;
      return (
        <Stage cam={push(t, d, 1, 1.06)} bg={() => <Paper c="#1a1814" />}>
          <g transform="translate(960 900) rotate(-60) scale(2.4)"><Sword len={420} blade={c} guard="#3a3a3a" /></g>
          <Kanji ch="黒" x={1550} y={420} t={t - 0.8} size={200} c="#e8e2d4" dur={d} vertical={false} />
        </Stage>
      );
    },
  },
  {
    at: "Мастер говорит", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.4, 0, -150)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees />}>
        <Act id="smith" t={t} p={{ x: 1150, y: 1060, s: 1, face: -1, aR: [80, 60], aL: [-60, -40] }} />
        <Act id="tanjiro_train" t={t} p={{ x: 700, y: 1060, s: 1, expr: "shock", sword: "R", sw: 120, aR: [60, 40] }} />
        <Caption text="?" t={t} t0={1.4} dur={d - 1.4} x={1150} y={300} size={140} c="#fff" />
      </Stage>
    ),
  },
  {
    at: "Ты возвращаешься домой", cut: "fade", music: "warm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.15, 1.25, 0, 40)} bg={(c) => <Interior cam={c} t={t} fire={0.7} />}>
        <Act id="urokodaki" t={t} p={{ x: 1350, y: 940, s: 1, face: -1, aR: [110, 40], aL: [-110, -40] }} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 1060, y: 940, s: 0.95, face: -1, expr: t > 1.4 ? "happy" : "closed", blink: t > 1.4 ? undefined : 1, rot: lerp(-90, 0, easeInOut(seg(t, 0.6, 1.4))), aR: [90, 30], aL: [-90, -30] }} />
        <Act id="tanjiro_train" t={t} p={{ x: 760, y: 940, s: 1, expr: "cry", tears: true, aR: [110, 30], aL: [60, 60] }} />
      </Stage>
    ),
  },
  {
    at: "Теперь у тебя есть меч", cut: "fade", music: "theme",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.12, 0, -40)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1080, s: 1.3, expr: "fierce", box: true, sword: "R", sw: 150, aR: [40, 50] }} />
        <Kanji ch="刀" x={1600} y={420} t={t} size={220} dur={d} />
      </Stage>
    ),
  },
];

// ======================================================================= CH5 MUZAN
const Asakusa = (c: any, t: number) => <Town cam={c} t={t} tod="night" brick />;
export const CH5: Shot[] = [
  {
    at: "^", music: "calm", sfx: [[0, "wind", 0.3]],
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -120, 120, 1)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees />}>
        <Act id="tanjiro" t={t} p={{ x: 760 + t * 60, y: 960, s: 0.9, box: true, ...walk(t, 0.9, 0.8), expr: "smile" }} />
        <Crow x={1300 + t * 60} y={260 + Math.sin(t * 2) * 30} s={0.9} t={t} />
      </Stage>
    ),
  },
  {
    at: "Вы ходите с задания на задание", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, 0, 300, 1)} bg={(c) => (t < d / 2 ? <Forest cam={c} t={t} /> : <SnowMountains cam={c} tod="dusk" t={t} spring />)}>
        <Act id="tanjiro" t={t} p={{ x: 700 + t * 160, y: 960, s: 0.85, box: true, ...run(t, 1.5), expr: "fierce" }} />
      </Stage>
    ),
  },
  {
    at: "Она не ест людей", cut: "fade", music: "warm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08)} bg={() => <Paper c="#2a1a14" />}>
        <rect x={560} y={140} width={800} height={820} rx={20} fill="#3a2414" stroke="#8a5a30" strokeWidth={24} />
        <circle cx={960} cy={560} r={320} fill="url(#g_glowP)" opacity={0.35} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 980, y: 900, s: 0.75, expr: "closed", blink: 1, rot: -14, aR: [100, 60], aL: [-100, -60], lR: [80, -150], lL: [-80, 150] }} />
        <Caption text="Zzz" t={t} t0={0.8} dur={d} x={1240} y={300} size={70} c="#ffb6d8" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "В шумном городе", cut: "fade", music: "tense", sfx: [[0, "crowd", 0.6], [1.6, "heart", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.15, 0, -40)} bg={(c) => Asakusa(c, t)}>
        <Crowd t={t} y={1000} n={18} c="#141018" />
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1020, s: 1, box: true, expr: t > 1.5 ? "shock" : "neutral" }} />
        <Scent x={1960} y={480} t={t} c="#c1121f" len={-900 * seg(t, 1.4, 2.4)} />
        <Crowd t={t + 3} y={1120} n={10} c="#0a080c" seed={7} />
      </Stage>
    ),
  },
  {
    at: "Ты бежишь сквозь толпу", cut: "cut", sfx: [[0.2, "whoosh", 0.7]],
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -200, 400, 1.1)} bg={(c) => Asakusa(c, t)}>
        <Crowd t={t} y={1000} n={20} c="#141018" walk={-120} />
        <Act id="tanjiro" t={t} p={{ x: 500 + t * 380, y: 1020, s: 1, box: true, ...run(t, 1.9), expr: "angry" }} />
        <Crowd t={t + 3} y={1140} n={10} c="#0a080c" seed={7} walk={-300} />
        <SpeedLines t={t} op={0.25} c="#000" />
      </Stage>
    ),
  },
  {
    at: "Его зовут Мудзан Кибуцуджи", cut: "cut", music: "dread", sfx: [[0, "boom", 0.8]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.12)} bg={() => <Void t={t} />}>
        <Act id="muzan" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "neutral", gaze: -0.6 }} />
        <Kanji ch="無惨" x={1660} y={300} t={t} size={150} dur={d} />
      </Stage>
    ),
  },
  {
    at: "Он — первый демон", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08)} bg={() => <Void t={t} c="#080206" c2="#3a0614" />}>
        {Array.from({ length: 8 }, (_, i) => <DemonSil key={i} x={240 + i * 210} y={1000} s={0.55 + rnd(i) * 0.25} t={t + i} c="#140a10" eyes="#ff2a3a" claws={false} />)}
        <Act id="muzan" t={t} p={{ x: 960, y: 1040, s: 1.2, expr: "smile" }} />
      </Stage>
    ),
  },
  {
    at: "И он стоит с женой", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.15, 1.25, 0, -20)} bg={(c) => Asakusa(c, t)}>
        <Act id="mother" t={t} seed={7} p={{ x: 760, y: 1000, s: 0.98, expr: "smile" }} />
        <Act id="muzan" t={t} p={{ x: 1000, y: 1000, s: 1.02, expr: "soft", aR: [40, -60] }} />
        <Act id="sib_girl" t={t} seed={4} p={{ x: 1160, y: 900, s: 0.8, expr: "happy", rot: -6 }} />
        <Act id="tanjiro" t={t} p={{ x: 1600, y: 1040, s: 1.04, face: -1, box: true, expr: "angry" }} />
      </Stage>
    ),
  },
  {
    at: "Притворяется человеком", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={() => <Void t={t} />}>
        <Act id="muzan" t={t} p={{ x: 960, y: 4200, s: 7, expr: "smile", blink: 0 }} />
      </Stage>
    ),
  },
  {
    at: "Чтобы уйти", cut: "cut", sfx: [[0.6, "slash", 0.7], [1.6, "growl", 0.9]],
    r: ({ t, d }) => {
      const turned = seg(t, 1.4, 2.2);
      return (
        <Stage cam={withShake(push(t, d, 1.1, 1.2), t, hit(t, 1.6, 0.6, 0.6))} bg={(c) => Asakusa(c, t)}>
          <Act id="muzan" t={t} p={{ x: 760, y: 1000, s: 1, expr: "smile", aR: [lerp(10, 120, easeOut(seg(t, 0.4, 0.7))), 0] }} />
          <Slash x={980} y={520} len={160} ang={30} k={seg(t, 0.5, 0.9)} c="#ff2a3a" />
          <Act id="oldman" t={t} seed={9} p={{ x: 1160, y: 1000, s: 1, face: -1, expr: turned > 0.5 ? "shout" : "shock", demon: turned > 0.5, sil: turned > 0.8 ? "#1a0a10" : undefined, silEye: "#ff2a3a", lean: -20 * turned }} />
        </Stage>
      );
    },
  },
  {
    at: "Пока ты спасаешь людей", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, 0, -120, 1.05)} bg={(c) => Asakusa(c, t)}>
        <Act id="tanjiro" t={t} p={{ x: 900, y: 1000, s: 1, expr: "fierce", aR: [100, 20], aL: [90, 30], lean: 14 }} />
        <Act id="oldman" t={t} seed={9} p={{ x: 1120, y: 1000, s: 1, face: -1, sil: "#1a0a10", silEye: "#ff2a3a", lean: -20 }} />
        <Act id="muzan" t={t} p={{ x: 1600, y: 1000, s: 0.85, face: -1, expr: "smile", op: 1 - seg(t, 0.6, 2.2) }} />
        <Crowd t={t} y={1150} n={8} c="#0a080c" seed={3} />
      </Stage>
    ),
  },
  {
    at: "Но в ту ночь ты встречаешь Тамаё", cut: "fade", music: "mystic",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, 0, -120)} bg={(c) => Asakusa(c, t)}>
        <circle cx={960} cy={500} r={500} fill="url(#g_glowP)" opacity={0.35} />
        <Act id="tamayo" t={t} p={{ x: 960, y: 1080, s: 1.1, expr: "soft", op: seg(t, 0, 0.8) }} />
        <Petals t={t} n={30} c="#d8a6e8" />
      </Stage>
    ),
  },
  {
    at: "Сотни лет она живёт", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -60, 60, 1.1)} bg={(c) => <Interior cam={c} t={t} fire={0} dark />}>
        <circle cx={1300} cy={620} r={300} fill="url(#g_glowO)" opacity={0.5} />
        <Act id="tamayo" t={t} p={{ x: 900, y: 1000, s: 1.02, expr: "neutral", aR: [70, 50] }} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={1180 + i * 60} y={760} width={40} height={90} rx={8} fill={["#b480e0", "#e080a8", "#80c0e0", "#e0c080"][i]} stroke="#15100e" strokeWidth={4} opacity={0.9} />)}
      </Stage>
    ),
  },
  {
    at: "Она говорит", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.07)} bg={(c) => <Interior cam={c} t={t} fire={0} dark />}>
        <Act id="tamayo" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "soft", talk: talk(t, t > 0.6) }} />
        <Caption text="ЛЕКАРСТВО" t={t} t0={1.4} dur={d - 1.4} x={1540} y={300} size={80} c="#e0c0ff" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Уже следующей ночью", cut: "fade", music: "battle", sfx: [[0.5, "growl", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={(c) => Asakusa(c, t)}>
        <DemonSil x={700} y={1000} s={1} t={t} c="#1a0a14" eyes="#ffcf3a" />
        <DemonSil x={1220} y={1000} s={1.05} t={t + 1} c="#0e0a1a" eyes="#ff3a3a" />
        {[0, 1, 2].map((i) => <circle key={i} cx={560 + i * 140} cy={520 + Math.sin(t * 5 + i) * 40} r={34} fill={["#e83a5a", "#3a8ae8", "#e8c23a"][i]} stroke="#15100e" strokeWidth={5} />)}
      </Stage>
    ),
  },
  {
    at: "Одна бросает мячи", cut: "cut", sfx: [[0.3, "boom", 0.7], [1.0, "boom", 0.7], [1.7, "boom", 0.7]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.05), t, 0.3)} bg={(c) => <Interior cam={c} t={t} fire={0} dark />}>
        {[0, 1, 2].map((i) => {
          const k = ((t * 1.4 + i * 0.33) % 1);
          return <circle key={i} cx={lerp(-100, 2000, k)} cy={500 + Math.abs(Math.sin(k * Math.PI * 3)) * -300 + 300} r={44} fill={["#e83a5a", "#3a8ae8", "#e8c23a"][i]} stroke="#15100e" strokeWidth={6} />;
        })}
        {[0, 1, 2].map((i) => <path key={i} d={`M ${500 + i * 400} 300 l 30 60 l -20 40 l 40 80 l -30 60`} stroke="#15100e" strokeWidth={6} fill="none" opacity={seg(t, 0.3 + i * 0.7, 0.4 + i * 0.7)} />)}
      </Stage>
    ),
  },
  {
    at: "Другой управляет стрелами", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={camLerp(t, d, { z: 1.1, rot: 0 }, { z: 1.1, rot: -12 })} bg={(c) => <Interior cam={c} t={t} fire={0} dark />}>
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} transform={`translate(${300 + i * 220} ${300 + Math.sin(i) * 140}) rotate(${i * 50 + t * 80})`}>
            <path d="M -80 0 L 60 0 M 40 -16 L 70 0 L 40 16" stroke="#ff2a4a" strokeWidth={10} fill="none" strokeLinecap="round" />
          </g>
        ))}
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1000, s: 1, expr: "pain", rot: Math.sin(t * 3) * 14, lean: Math.sin(t * 4) * 20, sword: "R", sw: 130, aR: [60, 40] }} />
      </Stage>
    ),
  },
  {
    at: "Ты еле стоишь на ногах", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.4, 1.5, 0, -100)} bg={(c) => <Interior cam={c} t={t} fire={0} dark />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1100, s: 1.1, expr: "pain", lean: 14, blood: true, sword: "R", sw: 200, aR: [20, 20], lR: [20, -30], lL: [-10, 10] }} />
      </Stage>
    ),
  },
  {
    at: "И впервые видишь, как Незуко", cut: "flash", sfx: [[0.3, "kick", 1]],
    r: ({ t, d }) => {
      const k = easeOut(seg(t, 0.15, 0.45));
      return (
        <Stage cam={withShake(push(t, d, 1.05, 1.15), t, hit(t, 0.4, 0.5))} bg={(c) => <Interior cam={c} t={t} fire={0} dark />}>
          <PinkFire x={960} y={600} s={0.9} t={t} />
          <Act id="nezuko" t={t} seed={2} p={{ x: 900, y: 980, s: 1.05, demon: true, expr: "angry", lean: -10, lR: [lerp(10, 120, k), lerp(0, -10, k)], lL: [-20, 10], aR: [-60, -40], aL: [-80, -20] }} />
          <circle cx={lerp(1150, 2100, seg(t, 0.4, 1))} cy={lerp(600, 300, seg(t, 0.4, 1))} r={44} fill="#e83a5a" stroke="#15100e" strokeWidth={6} />
        </Stage>
      );
    },
  },
  {
    at: "У тебя впервые есть надежда", cut: "fade", music: "theme",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.15)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring />}>
        <Act id="tamayo" t={t} p={{ x: 1380, y: 980, s: 0.9, face: -1, expr: "soft" }} />
        <Act id="tanjiro" t={t} p={{ x: 780, y: 1000, s: 1, expr: "smile" }} />
        <Act id="nezuko" t={t} seed={2} p={{ x: 1040, y: 1000, s: 0.95, expr: "happy" }} />
        <Kanji ch="希望" x={1650} y={330} t={t} size={140} c="#ffcf5a" dur={d} />
      </Stage>
    ),
  },
];
