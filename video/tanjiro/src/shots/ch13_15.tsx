import React from "react";
import type { Shot } from "./types";
import { Stage, Act, push, pan, camLerp, Caption, Dark, withShake, hit, Bars } from "../kit";
import { SnowMountains, Interior, Forest, Paper, Void, CityNight, Modern, Par, Sky, Mist, Castle } from "../scenes/BG";
import { Snow, Kanji, WaterArc, FireArc, PinkFire, Lightning, Slash, Flash, SpeedLines, Embers, Petals, SunRays, DemonSil, Whips, Hands, Coin } from "../scenes/FX";
import { walk, run, seg, easeOut, easeInOut, talk, lerp, rnd, clamp } from "../lib";
import { Char } from "../rig/Char";

// ======================================================================= CH13 LAST DAWN
export const CH13: Shot[] = [
  {
    at: "^", music: "battle", sfx: [[0.3, "whoosh", 1], [0.8, "hit", 0.9], [1.4, "whoosh", 0.9], [2.0, "hit", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.12), t, 0.35)} bg={(c) => <CityNight cam={c} t={t} ruined />}>
        <Whips x={1250} y={520} t={t} n={11} len={1200} k={1} />
        <Act id="muzan_battle" t={t} p={{ x: 1250, y: 1040, s: 1.15, face: -1, expr: "angry", aR: [120, 30], aL: [-120, -30] }} />
        <Act id="tanjiro_mark" t={t} p={{ x: 560, y: 1020, s: 1, expr: "fierce", blood: true, sword: "R", sw: 140, aR: [70, 50], lean: 10 }} />
      </Stage>
    ),
  },
  {
    at: "Ты почти ослеп на один глаз", cut: "cut", sfx: [[0, "heart", 1]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={(c) => <CityNight cam={c} t={t} ruined />}>
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "pain", blood: true, patch: true }} />
        <Dark op={0.2 + 0.15 * Math.sin(t * 4)} c="#3a0000" />
      </Stage>
    ),
  },
  {
    at: "Столпы падают один за другим", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -100, 100, 1.05)} bg={(c) => <CityNight cam={c} t={t} ruined />}>
        {["giyu", "sanemi", "demon", "demon"].map((id, i) => (
          <Act key={i} id={id} t={t + i} p={{ x: 400 + i * 380, y: 1000, s: 0.95, sil: id === "demon" ? "#141018" : undefined, expr: "pain", blood: true, rot: -80 * easeOut(seg(t, 0.4 + i * 0.6, 0.9 + i * 0.6)) }} />
        ))}
      </Stage>
    ),
  },
  {
    at: "Держись до рассвета", cut: "cut",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={(c) => <CityNight cam={c} t={t} ruined dawn={0.15} />}>
        <Act id="giyu" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "pain", blood: true, talk: talk(t, t < 1.6) }} />
        <Caption text="«ДЕРЖИСЬ ДО РАССВЕТА»" t={t} t0={0.1} dur={d} y={250} size={84} c="#ffcf5a" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "Ты теряешь сознание", cut: "black", music: "mystic",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1.1, 1.2)} bg={() => <Void t={t} c="#000" c2="#0a0a10" />}>
        <g opacity={1 - seg(t, 0.2, 1.6)}><Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "closed", blood: true }} /></g>
      </Stage>
    ),
  },
  {
    at: "И во сне видишь мечника прошлого", cut: "fade", sfx: [[0.3, "chime", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.15, 0, -40)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees />}>
        <rect x={-100} y={-100} width={2200} height={1300} fill="#fff6e0" opacity={0.2} />
        <Act id="yoriichi" t={t} p={{ x: 960, y: 1100, s: 1.2, expr: "soft", sword: "R", sw: 20, aR: [10, -6] }} />
        <Petals t={t} n={40} c="#f6c2d6" />
      </Stage>
    ),
  },
  {
    at: "Он был первым, кто дышал солнцем", cut: "fade", music: "kagura", sfx: [[0.3, "fire", 1], [0.5, "slash", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.18)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring trees={false} />}>
        <SunRays x={960} y={600} t={t} k={0.8} />
        <FireArc x={960} y={540} r={400} t={t} k={seg(t, 0.2, 1.4)} a0={-220} sweep={360} />
        <Act id="yoriichi" t={t} p={{ x: 960, y: 1020, s: 1.15, expr: "soft", sword: "R", glow: "#ff7a1a", aR: [lerp(-30, 140, easeInOut(seg(t, 0.2, 1.2))), 10], sw: lerp(220, 80, easeInOut(seg(t, 0.2, 1.2))) }} />
        <Kanji ch="日" x={1650} y={360} t={t} size={220} c="#ffb04a" dur={d} />
      </Stage>
    ),
  },
  {
    at: "Он почти победил Мудзана", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.12)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} trees={false} />}>
        <Act id="yoriichi" t={t} p={{ x: 660, y: 1000, s: 1, expr: "fierce", sword: "R", glow: "#ff7a1a", sw: 60, aR: [130, 10], lean: 14 }} />
        <Act id="muzan" t={t} p={{ x: 1300, y: 1000, s: 1, face: -1, expr: "shock", demon: true, blood: true, op: 1 - seg(t, 1.2, 2.6) * 0.7 }} />
        <rect x={-100} y={-100} width={2200} height={1300} fill="#c8a878" opacity={0.25} />
      </Stage>
    ),
  },
  {
    at: "и рассказал свой танец твоему предку", cut: "fade", music: "warm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.18)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1500} spring />}>
        <Act id="yoriichi" t={t} p={{ x: 700, y: 1000, s: 1, expr: "soft", talk: talk(t), aR: [80, 40] }} />
        <Act id="father" t={t} p={{ x: 1100, y: 1000, s: 1, face: -1, expr: "smile" }} />
        <rect x={-100} y={-100} width={2200} height={1300} fill="#c8a878" opacity={0.28} />
      </Stage>
    ),
  },
  {
    at: "Так танец дошёл до твоего отца", cut: "fade", sfx: [[0.2, "bell", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1)} bg={(c) => <SnowMountains cam={c} tod="night" t={t} house houseX={1600} />}>
        <circle cx={960} cy={560} r={520} fill="url(#g_glowO)" opacity={0.35} />
        <Act id="father" t={t} p={{ x: 960, y: 980, s: 1.05, expr: "soft", sword: "R", swordLen: 200, sw: 150 + Math.sin(t * 1.6) * 60, aR: [100 + Math.sin(t * 1.6) * 50, 30], aL: [-90, -30], lean: Math.sin(t * 1.6) * 8 }} />
        <FireArc x={960} y={560} r={330} t={t} k={1} a0={-200 + t * 50} sweep={160} />
        <Snow t={t} n={80} />
      </Stage>
    ),
  },
  {
    at: "А ты понимаешь", cut: "cut", music: "epic", sfx: [[0.2, "breath", 1]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.15)} bg={() => <Void t={t} c="#0a0400" c2="#4a1a04" />}>
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: t > 0.8 ? "fierce" : "closed", patch: true, rim: "#ff7a1a" }} />
        <Embers t={t} n={60} />
      </Stage>
    ),
  },
  {
    at: "Двенадцать форм", cut: "fade", sfx: [[0, "riser", 1]],
    r: ({ t, d }) => {
      const n = Math.min(12, Math.floor(seg(t, 0, d - 1.2) * 12.99));
      return (
        <Stage cam={camLerp(t, d, { z: 1, rot: 0 }, { z: 1.15, rot: 30 })} bg={() => <Void t={t} c="#0a0400" c2="#3a1004" />}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return (
              <g key={i} opacity={i < n ? 1 : 0.15}>
                <circle cx={960 + Math.cos(a) * 340} cy={540 + Math.sin(a) * 340} r={56} fill="none" stroke="#ff7a1a" strokeWidth={10} />
                <text x={960 + Math.cos(a) * 340} y={556 + Math.sin(a) * 340} textAnchor="middle" fontFamily="Rubik" fontWeight={900} fontSize={44} fill="#ffcf8a">{i + 1}</text>
              </g>
            );
          })}
          <circle cx={960} cy={540} r={340} fill="none" stroke="#ffb04a" strokeWidth={14} strokeDasharray={`${seg(t, 0.5, d - 0.6) * 2140} 3000`} transform="rotate(-90 960 540)" />
          <Caption text="13" t={t} t0={d - 1.4} dur={1.4} y={600} size={220} c="#fff2c0" />
        </Stage>
      );
    },
  },
  {
    at: "Ты танцуешь, как отец в снегу", cut: "flash", sfx: [[0, "fire", 1], [0.6, "slash", 0.9], [1.4, "slash", 0.9], [2.2, "slash", 0.9]],
    r: ({ t, d }) => (
      <Stage cam={withShake(camLerp(t, d, { z: 1.05, rot: -6 }, { z: 1.2, rot: 6 }), t, 0.2)} bg={(c) => <CityNight cam={c} t={t} ruined dawn={seg(t, 0, d) * 0.5} />}>
        {[0, 1, 2].map((i) => <FireArc key={i} x={960} y={560} r={300 + i * 90} t={t + i} k={1} a0={-200 + t * (120 + i * 40) + i * 120} sweep={200} />)}
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1020, s: 1.1, expr: "fierce", patch: true, sword: "R", glow: "#ff7a1a", sw: 150 + Math.sin(t * 3) * 80, aR: [90 + Math.sin(t * 3) * 60, 20], aL: [-80, -30], lean: Math.sin(t * 3) * 10, rot: Math.sin(t * 1.5) * 4 }} />
        <Snow t={t} n={50} c="#ffd8a8" />
      </Stage>
    ),
  },
  {
    at: "А все, кто ещё жив, держат Мудзана", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -80, 80, 1.05)} bg={(c) => <CityNight cam={c} t={t} ruined dawn={0.5 + seg(t, 0, d) * 0.4} />}>
        <Act id="muzan_battle" t={t} p={{ x: 960, y: 1020, s: 1.2, expr: "shout", aR: [130, 40], aL: [-130, -40] }} />
        <Act id="zenitsu" t={t} p={{ x: 520, y: 1000, s: 0.95, expr: "fierce", sword: "R", sw: 80, aR: [110, 10], lean: 20 }} />
        <Char id="inosuke" p={{ x: 1420, y: 1000, s: 0.95, face: -1, sword: "R", sw: 80, aR: [110, 10], aL: [-110, -10], lean: 20 }} t={t} />
        <Act id="giyu" t={t} p={{ x: 260, y: 1000, s: 0.95, expr: "pain", sword: "R", sw: 80, aR: [110, 10], lean: 20, blood: true }} />
        <Act id="kanao" t={t} p={{ x: 1700, y: 1000, s: 0.92, face: -1, expr: "fierce", sword: "R", sw: 80, aR: [110, 10], lean: 18 }} />
      </Stage>
    ),
  },
  {
    at: "Мудзан горит", cut: "flash", music: "theme", sfx: [[0.1, "fire", 1], [0.4, "boom", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={withShake(push(t, d, 1, 1.12), t, hit(t, 0.3, 1))} bg={(c) => <CityNight cam={c} t={t} ruined dawn={1} />}>
        <SunRays x={1700} y={700} t={t} k={1} />
        <g opacity={1 - seg(t, 1.2, d)}><Act id="muzan_battle" t={t} p={{ x: 960, y: 1020, s: 1.2, expr: "shout", sil: t > 0.8 ? "#2a0a04" : undefined }} /></g>
        <Embers t={t} n={80} c="#ffb04a" />
      </Stage>
    ),
  },
  {
    at: "Но перед смертью", cut: "black", music: "dread", sfx: [[0.6, "heart", 1]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.15)} bg={() => <Void t={t} c="#000" c2="#200008" />}>
        <g opacity={seg(t, 0.6, 1.4)}>
          <path d="M 760 520 L 880 540 L 760 556 Z M 1160 520 L 1040 540 L 1160 556 Z" fill="#ff1e30" />
          <circle cx={820} cy={540} r={80} fill="#ff1e30" opacity={0.25} filter="url(#f_blur10)" />
          <circle cx={1100} cy={540} r={80} fill="#ff1e30" opacity={0.25} filter="url(#f_blur10)" />
        </g>
      </Stage>
    ),
  },
];

// ======================================================================= CH14 DEMON
export const CH14: Shot[] = [
  {
    at: "^", music: "dread", sfx: [[0.3, "growl", 1]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.18)} bg={() => <Void t={t} c="#050003" c2="#4a0010" />}>
        <Whips x={960} y={-100} t={t} n={9} len={900} k={seg(t, 0, 1.6)} c="#2a0008" />
        <Act id="tanjiro_mark" t={t} p={{ x: 960, y: 1000, s: 1.1, expr: "pain", patch: true, lean: -10, aR: [150, 20], aL: [-150, -20] }} />
      </Stage>
    ),
  },
  {
    at: "Твоё сердце останавливается", cut: "cut", sfx: [[0, "heart", 1], [0.8, "heart", 0.6]],
    r: ({ t, d }) => {
      const pts = Array.from({ length: 120 }, (_, i) => {
        const x = i * 16;
        const beat = x > 400 && x < 520 ? Math.sin((x - 400) / 120 * Math.PI * 3) * 200 * (1 - seg(t, 0, 1.4)) : x > 900 && x < 980 ? Math.sin((x - 900) / 80 * Math.PI * 2) * 80 * (1 - seg(t, 0.6, 1.6)) : 0;
        return `${x} ${540 - beat}`;
      });
      return (
        <Stage cam={push(t, d, 1, 1.05)} bg={() => <Paper c="#050505" />}>
          <path d={"M " + pts.slice(0, Math.floor(seg(t, 0, 1.2) * 120) + 1).join(" L ")} stroke="#ff2a3a" strokeWidth={8} fill="none" />
          <Kanji ch="心" x={960} y={330} t={t - 1} size={180} c="#5a0010" dur={d} vertical={false} />
        </Stage>
      );
    },
  },
  {
    at: "Ты открываешь глаза", cut: "cut", sfx: [[0.6, "boom", 1]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={withShake(push(t, d, 1, 1.15), t, hit(t, 0.6, 0.8))} bg={() => <Void t={t} />}>
        <Act id="tanjiro_demon" t={t} p={{ x: 960, y: 4380, s: 7.2, expr: "angry", blink: t < 0.5 ? 1 : 0 }} />
      </Stage>
    ),
  },
  {
    at: "Новый король демонов", cut: "cut",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.12, 0, -40)} bg={(c) => <CityNight cam={c} t={t} ruined dawn={1} />}>
        <Whips x={960} y={500} t={t} n={10} len={1000} k={seg(t, 0, 1.2)} c="#2a0008" />
        <Act id="tanjiro_demon" t={t} p={{ x: 960, y: 1080, s: 1.25, expr: "shout", demon: true, aR: [120, 30], aL: [-120, -30] }} />
        <Kanji ch="鬼王" x={1650} y={330} t={t} size={150} c="#ff1e30" dur={d} />
      </Stage>
    ),
  },
  {
    at: "Иноске не может ударить тебя", cut: "fade", music: "sad",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.15, 1.25, 0, -80)} bg={(c) => <CityNight cam={c} t={t} ruined dawn={1} />}>
        <Char id="inosuke" p={{ x: 960 + Math.sin(t * 30) * 3, y: 1100, s: 1.15, sword: "R", sw: 140 + Math.sin(t * 25) * 4, aR: [150, 10], aL: [-150, -10] }} t={t} />
        {[0, 1].map((i) => <path key={i} d={`M ${930 + i * 60} 560 q ${i ? 6 : -6} 40 0 80`} stroke="#bfe6ff" strokeWidth={8} fill="none" opacity={seg(t, 0.6, 1.2)} />)}
      </Stage>
    ),
  },
  {
    at: "Незуко, уже человек, обнимает тебя", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.3, 1.4, 0, -150)} bg={(c) => <CityNight cam={c} t={t} ruined dawn={1} />}>
        <Act id="tanjiro_demon" t={t} p={{ x: 1040, y: 1080, s: 1.1, face: -1, expr: "angry", demon: true }} />
        <Act id="nezuko_human" t={t} seed={2} p={{ x: 860, y: 1080, s: 1.02, expr: "cry", tears: true, aR: [100, 50], aL: [80, 60], lean: 10 }} />
      </Stage>
    ),
  },
  {
    at: "Канао вкалывает тебе последнее лекарство", cut: "cut", sfx: [[0.6, "chime", 0.8]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, 0, -100)} bg={(c) => <CityNight cam={c} t={t} ruined dawn={1} />}>
        <Act id="tanjiro_demon" t={t} p={{ x: 1100, y: 1080, s: 1.1, face: -1, expr: "pain", demon: true }} />
        <Act id="kanao" t={t} p={{ x: 760, y: 1080, s: 1.05, expr: "fierce", aR: [lerp(40, 100, easeOut(seg(t, 0.2, 0.6))), 0], lean: 14 }} />
        <rect x={lerp(900, 980, easeOut(seg(t, 0.2, 0.6)))} y={580} width={80} height={16} rx={6} fill="#cfe8ff" stroke="#15100e" strokeWidth={3} />
        <Petals t={t} n={20} c="#f6c2e6" />
      </Stage>
    ),
  },
  {
    at: "Во тьме Мудзан шепчет", cut: "black", music: "dread", sfx: [[0.4, "growl", 0.5]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.12)} bg={() => <Void t={t} c="#000" c2="#2a0008" />}>
        <g opacity={0.8 * seg(t, 0.2, 1)}><Act id="muzan_battle" t={t} p={{ x: 960, y: 2400, s: 3.4, expr: "smile", talk: talk(t, t > 0.8) }} /></g>
        <Caption text="«ОСТАНЬСЯ»" t={t} t0={1} dur={d - 1} y={250} size={90} c="#ff3a4a" font="Rubik, sans-serif" />
      </Stage>
    ),
  },
  {
    at: "А сзади тебя тянут руки", cut: "fade", music: "theme",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08)} bg={() => <Void t={t} c="#050208" c2="#4a3020" />}>
        <rect x={0} y={700} width={1920} height={500} fill="url(#g_glowO)" opacity={0.5 * seg(t, 0, 1.5)} />
        <Act id="tanjiro_demon" t={t} p={{ x: 960, y: 1060, s: 1.05, expr: "sad", demon: true, rot: 4 }} />
        <Hands t={t} k={seg(t, 0.2, 2)} />
      </Stage>
    ),
  },
  {
    at: "Мама", cut: "fade", sfx: [[0.1, "chime", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.06)} bg={() => <Void t={t} c="#0a0806" c2="#5a4020" />}>
        <g opacity={0.75}>
          <Act id="mother" t={t} seed={7} p={{ x: 720, y: 1040, s: 1.05, expr: "soft", aR: [100, 30] }} />
          <Act id="father" t={t} p={{ x: 1200, y: 1040, s: 1.08, face: -1, expr: "smile", aR: [100, 30] }} />
        </g>
        <Hands t={t} k={1} />
      </Stage>
    ),
  },
  {
    at: "И все, кто погиб", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.08)} bg={() => <Void t={t} c="#0a0806" c2="#6a5030" />}>
        <g opacity={0.7}>
          {["sabito", "makomo", "rengoku", "shinobu", "muichiro"].map((id, i) => <Act key={id} id={id} t={t + i} p={{ x: 340 + i * 310, y: 1040, s: 0.9, expr: "smile", op: seg(t, i * 0.2, i * 0.2 + 0.6) }} />)}
        </g>
        <Hands t={t} k={1} />
      </Stage>
    ),
  },
  {
    at: "Ты возвращаешься", cut: "flash", music: "warm", sfx: [[0, "chime", 1], [0.1, "riser", 0.4]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.1)} bg={(c) => <SnowMountains cam={c} tod="dawn" t={t} spring trees={false} />}>
        <SunRays x={960} y={600} t={t} k={1} />
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: t > 0.8 ? "soft" : "closed", patch: true }} />
      </Stage>
    ),
  },
];

// ======================================================================= CH15 HOME
export const CH15: Shot[] = [
  {
    at: "^", music: "warm",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.14, 0, -40)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1300, s: 1.5, expr: "smile", patch: true, aL: [-6, 10] }} />
        <Petals t={t} n={30} />
      </Stage>
    ),
  },
  {
    at: "Ты возвращаешься в дом на горе", cut: "fade", sfx: [[0, "wind", 0.3]],
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, 120, -60, 1.02)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring house houseX={1500} />}>
        {[["zenitsu", 540], ["tanjiro", 760], ["nezuko_human", 960]].map(([id, x], i) => (
          <Act key={id as string} id={id as string} t={t + i} seed={i + 1} p={{ x: (x as number) + t * 50, y: 930, s: 0.72, expr: "smile", ...walk(t + i * 0.3, 0.8, 0.6), patch: id === "tanjiro" }} />
        ))}
        <Char id="inosuke" p={{ x: 1150 + t * 50, y: 930, s: 0.72, ...walk(t + 1, 0.8, 0.6) }} t={t} />
        <Petals t={t} n={30} />
      </Stage>
    ),
  },
  {
    at: "Вы хороните тех", cut: "fade", music: "sad", sfx: [[0.4, "bell", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.05, 1.12)} bg={(c) => <SnowMountains cam={c} tod="dusk" t={t} spring trees />}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`translate(${520 + i * 180} 900)`}>
            <path d="M -40 0 L -40 -150 Q 0 -180 40 -150 L 40 0 Z" fill="#8a8a90" stroke="#15100e" strokeWidth={5} />
            <circle cx={-20} cy={-10} r={10} fill="#f6c2d6" /><circle cx={16} cy={-8} r={9} fill="#ffe08a" />
          </g>
        ))}
        <Act id="tanjiro" t={t} p={{ x: 760, y: 1060, s: 1, expr: "closed", patch: true, head: 12, lean: 8, aR: [-20, 100], aL: [20, -100] }} />
        <Act id="nezuko_human" t={t} seed={2} p={{ x: 1160, y: 1060, s: 0.95, expr: "closed", head: 12, lean: 8, aR: [-20, 100], aL: [20, -100] }} />
      </Stage>
    ),
  },
  {
    at: "Незуко снова смеётся", cut: "cut", music: "comedy",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.07)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees={false} />}>
        <Act id="nezuko_human" t={t} seed={2} p={{ x: 960, y: 1860 + Math.sin(t * 12) * 6, s: 2.6, expr: "happy" }} />
        <Petals t={t} n={20} />
      </Stage>
    ),
  },
  {
    at: "Зеницу снова кричит", cut: "cut", sfx: [[0.1, "pop", 0.8]],
    r: ({ t, d }) => (
      <Stage dof={5} cam={withShake(push(t, d, 1, 1.07), t, 0.2)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees={false} />}>
        <Act id="zenitsu" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "shout", tears: true }} />
      </Stage>
    ),
  },
  {
    at: "Иноске снова ищет", cut: "cut", sfx: [[0.2, "clang", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.1, 1.18)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees />}>
        <Char id="inosuke" p={{ x: 960, y: 1060, s: 1.15, sword: "R", sw: 140 + Math.sin(t * 8) * 30, aR: [140, 10], aL: [-140, -10], lR: [24, -20], lL: [-24, 20], bob: Math.abs(Math.sin(t * 8)) * -20 }} t={t} />
      </Stage>
    ),
  },
  {
    at: "А Канао, девочка с монеткой", cut: "fade", music: "warm", sfx: [[0.6, "coin", 0.6]],
    r: ({ t, d }) => (
      <Stage cam={pan(t, d, -60, 60, 1.08)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} spring trees />}>
        <Act id="tanjiro" t={t} p={{ x: 860 + t * 30, y: 1000, s: 1, expr: "smile", patch: true, ...walk(t, 0.7, 0.5) }} />
        <Act id="kanao" t={t} p={{ x: 1100 + t * 30, y: 1000, s: 0.96, expr: "smile", ...walk(t + 0.4, 0.7, 0.5) }} />
        <Coin x={1240 + t * 30} y={500 - Math.abs(Math.sin(t * 2)) * 100} s={0.5} t={t} />
        <Petals t={t} n={30} />
      </Stage>
    ),
  },
  {
    at: "Через сто лет", cut: "fade", music: "calm", sfx: [[0, "crowd", 0.5]],
    r: ({ t, d }) => (
      <>
        <Stage cam={pan(t, d, -80, 80, 1.02)} bg={(c) => <Modern cam={c} t={t} />}>
          <Act id="modern_boy" t={t} p={{ x: 860 + t * 40, y: 1000, s: 0.95, expr: "happy", ...walk(t, 0.9, 0.6) }} />
          <Act id="modern_girl" t={t} p={{ x: 1080 + t * 40, y: 1000, s: 0.92, expr: "smile", ...walk(t + 0.3, 0.9, 0.6) }} />
        </Stage>
        <Caption text="+100 ЛЕТ" t={t} t0={0.3} dur={2.6} y={240} size={110} c="#fff" />
      </>
    ),
  },
  {
    at: "Потому что ты сделал так", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1.2, 1.3, 0, -80)} bg={(c) => <Modern cam={c} t={t} />}>
        <Act id="modern_boy" t={t} p={{ x: 860, y: 1080, s: 1.05, expr: "happy", aR: [140, 10] }} />
        <Act id="modern_girl" t={t} p={{ x: 1080, y: 1080, s: 1, expr: "smile", face: -1 }} />
      </Stage>
    ),
  },
  {
    at: "Тебе шестнадцать", cut: "fade", music: "theme",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.08)} bg={(c) => <SnowMountains cam={c} tod="dusk" t={t} spring trees={false} />}>
        <Act id="tanjiro" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "soft", patch: true }} />
        <Petals t={t} n={30} />
      </Stage>
    ),
  },
  {
    at: "Но тот мальчик", cut: "fade",
    r: ({ t, d }) => (
      <Stage cam={push(t, d, 1, 1.1, 120, -20)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1350} />}>
        <g opacity={0.85}><Act id="tanjiro_kid" t={t} p={{ x: 1060 - t * 40, y: 900, s: 0.62, face: -1, basket: true, ...walk(t, 0.9, 0.8), expr: "smile" }} /></g>
        <Snow t={t} n={70} />
      </Stage>
    ),
  },
  {
    at: "Добрым", cut: "fade",
    r: ({ t, d }) => (
      <Stage dof={5} cam={push(t, d, 1, 1.06)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} trees={false} />}>
        <Act id="tanjiro_kid" t={t} p={{ x: 960, y: 1860, s: 2.6, expr: "happy", basket: true }} />
        <Snow t={t} n={40} big />
      </Stage>
    ),
  },
  {
    at: "Ты — Танджиро Камадо", cut: "fade", sfx: [[0.1, "bell", 1]],
    r: ({ t, d }) => (
      <>
        <Stage cam={push(t, d, 1.0, 1.1, 120, -20)} bg={(c) => <SnowMountains cam={c} tod="day" t={t} house houseX={1350} spring />}>
          <Petals t={t} n={40} />
        </Stage>
        <Caption text="ТЫ — ТАНДЖИРО КАМАДО" t={t} t0={0.2} dur={d} y={330} size={110} c="#fff" />
        <Caption text="И ЭТО БЫЛА ВСЯ ТВОЯ ЖИЗНЬ" t={t} t0={1.8} dur={d - 1.8} y={450} size={64} c="#ffcf8a" font="Rubik, sans-serif" />
      </>
    ),
  },
  {
    at: "А теперь напиши", cut: "fade", noHud: true,
    r: ({ t, d }) => (
      <>
        <Stage cam={pan(t, d, -40, 40, 1)} bg={() => <Paper c="#16121a" />}>
          {[["tanjiro", 420], ["nezuko_human", 640], ["zenitsu", 860], ["inosuke", 1080], ["kanao", 1300], ["giyu", 1520]].map(([id, x], i) => (
            <Act key={id as string} id={id as string} t={t + i} seed={i} p={{ x: x as number, y: 1160, s: 0.85, expr: "smile", patch: id === "tanjiro", op: seg(t, i * 0.15, i * 0.15 + 0.5) }} />
          ))}
        </Stage>
        <Caption text="НА КАКОМ МОМЕНТЕ БЫЛО БОЛЬНЕЕ ВСЕГО?" t={t} t0={0.2} dur={d} y={190} size={64} c="#fff" font="Rubik, sans-serif" />
        <Caption text="КОГО ДЕЛАТЬ СЛЕДУЮЩИМ? ↓" t={t} t0={2.5} dur={d - 2.5} y={310} size={56} c="#ff9a2a" font="Rubik, sans-serif" />
      </>
    ),
  },
];
