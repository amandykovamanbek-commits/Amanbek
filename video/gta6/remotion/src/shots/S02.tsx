import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, ramp} from '../lib/theme';
import {Bedroom, Landing, Street, TV} from '../lib/Sets';
import {Cam, Light, Vignette} from '../lib/FX';
import {Chars, Pos, Screen} from '../lib/Frame';
import {ARMS, FACES, Stickman} from '../lib/Stickman';
import {HUD} from '../lib/UI';

const GameTag: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', right: 40, top: 30, fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#F6EEE3', background: 'rgba(0,0,0,0.55)', padding: '8px 16px', borderRadius: 10, letterSpacing: 3}}>{text}</div>
);

const Loading: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, Math.min(d, 60)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: '#05050C'}}>
      <Cam dur={d} from={1} to={1.04}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
          <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 44, letterSpacing: 12}}>ЗАГРУЗКА{'.'.repeat(1 + (Math.floor(f / 10) % 3))}</div>
          <div style={{marginTop: 30, width: 900, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
            <div style={{width: `${p * 100}%`, height: '100%', background: 'linear-gradient(90deg, #FF9A5A, #FFD240)', boxShadow: '0 0 20px rgba(255,190,70,0.7)'}} />
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const InGame: React.FC<{d: number; which: 'room' | 'yard' | 'landing'}> = ({d, which}) => {
  const f = useCurrentFrame();
  const inner =
    which === 'room' ? (
      <>
        <Bedroom tv="#1B2A55" />
        <Chars>
          <Pos x={1400} y={900} s={0.8}>
            <Stickman color={C.hero} rim={C.rimCold} legs="sit" armL={ARMS.hold[0]} armR={ARMS.hold[1]} hold="gamepad" face={FACES.neutral} />
          </Pos>
        </Chars>
      </>
    ) : which === 'yard' ? (
      <Street />
    ) : (
      <Landing />
    );
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08}>
        <Screen label={which === 'room' ? 'ТВОЯ КОМНАТА' : which === 'yard' ? 'ТВОЙ ДВОР' : 'ТВОЙ ПОДЪЕЗД'}>
          {inner}
          <GameTag text="РЕЖИМ: ИСТОРИЯ" />
          {which === 'landing' && <div style={{position: 'absolute', left: 600, top: 600, width: 360, height: 160, border: `6px solid ${C.gold}`, borderRadius: 16, opacity: ramp(f, 20, 8) * (0.6 + 0.4 * Math.sin(f / 4)), boxShadow: '0 0 24px rgba(255,200,70,0.7)'}} />}
        </Screen>
      </Cam>
      <Vignette s={0.7} />
    </AbsoluteFill>
  );
};

const LooksLikeYou: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.1} ox="55%" oy="55%">
        <Bedroom tv="#2A3C78" />
        <Light x="50%" y="50%" color="rgba(110,160,255,0.35)" size="40%" />
        {/* mini hero inside the TV */}
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <defs>
            <clipPath id="tvclip"><rect x={TV.x} y={TV.y} width={TV.w} height={TV.h} /></clipPath>
          </defs>
          <g clipPath="url(#tvclip)">
            <rect x={TV.x} y={TV.y} width={TV.w} height={TV.h} fill="#3A4E8E" />
            <rect x={TV.x} y={TV.y + 150} width={TV.w} height={50} fill="#262E58" />
            <g transform={`translate(${TV.x + 170} ${TV.y + 190}) scale(0.28)`}>
              <Stickman color={C.hero} rim={C.rimCold} armL={[10, 6]} armR={[10, 6]} face={FACES.neutral} />
            </g>
          </g>
        </svg>
        <Chars>
          <Pos x={1420} y={900} s={0.95}>
            <Stickman color={C.hero} rim={C.rimCold} rimDx={-9} legs="sit" armL={ARMS.hold[0]} armR={ARMS.hold[1]} hold="gamepad" face={{...FACES.worried, lx: -14}} glowScreen={1} />
          </Pos>
        </Chars>
        <div style={{position: 'absolute', left: 1010, top: 330, fontFamily: FONT, fontWeight: 900, fontSize: 90, color: C.gold, opacity: ramp(f, 30, 8), transform: `scale(${ramp(f, 30, 8, backOut)})`}}>?!</div>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const PadPress: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const press = f > 18 && f < 26;
  return (
    <AbsoluteFill style={{background: '#0A0A16'}}>
      <Light x="50%" y="55%" color="rgba(90,140,255,0.25)" size="50%" />
      <Cam dur={d} from={1.0} to={1.1}>
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <g transform="translate(960 600) scale(6)">
            <path d="M -46 -16 Q -50 -22 -38 -22 L 38 -22 Q 50 -22 46 -16 L 52 14 Q 54 26 40 22 L 22 8 L -22 8 L -40 22 Q -54 26 -52 14 Z" fill="#1C1B26" stroke={C.head} strokeWidth={2} />
            <circle cx={-24} cy={-6} r={7} fill="#3A394A" />
            <circle cx={26} cy={-10} r={5} fill="#5BE38A" />
            <circle cx={36} cy={-2} r={5} fill="#FF4D5E" />
            <circle cx={16} cy={-2} r={press ? 4 : 5} fill={press ? '#B9DCFF' : '#4DA3FF'} style={{filter: press ? 'drop-shadow(0 0 4px #9FD0FF)' : undefined}} />
          </g>
          {/* thumb */}
          <g transform={`translate(${1060} ${interpolate(f, [0, 18, 22, 30], [470, 560, 600, 560], clamp)})`}>
            <ellipse rx={70} ry={50} fill={C.head} />
          </g>
        </svg>
        <div style={{position: 'absolute', left: 1180, top: 420, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#9FD0FF', opacity: ramp(f, 18, 6), textShadow: '0 0 20px rgba(120,180,255,0.8)'}}>«ПРЫЖОК»</div>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Jump: React.FC<{d: number; at: (p: string) => number}> = ({d, at}) => {
  const f = useCurrentFrame();
  const jt = 4;
  const y = interpolate(f, [jt, jt + 8, jt + 16], [0, -260, 0], {...clamp, easing: (x) => x});
  const air = f > jt && f < jt + 16;
  const land = at('Прямо');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06} shake={f > jt + 15 && f < jt + 22 ? 6 : 0}>
        <Bedroom tv="#2A3C78" />
        <Light x="50%" y="50%" color="rgba(110,160,255,0.3)" size="40%" />
        <Chars>
          <rect x={1310} y={760} width={220} height={22} fill="#2A2032" />
          <rect x={1320} y={782} width={16} height={120} fill="#1E1824" />
          <rect x={1504} y={782} width={16} height={120} fill="#1E1824" />
          <Pos x={1420} y={900 + y} s={0.95}>
            <Stickman color={C.hero} rim={C.rimCold} legs={air ? 'jump' : 'sit'} armL={air ? ARMS.up[0] : ARMS.hold[0]} armR={air ? ARMS.up[1] : ARMS.hold[1]} hold={air ? 'none' : 'gamepad'} face={f > jt ? FACES.scream : FACES.neutral} />
          </Pos>
        </Chars>
        {f > land && (
          <div style={{position: 'absolute', left: 960, top: 160, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#EDE7DA', letterSpacing: 6, opacity: ramp(f, land, 8)}}>В РЕАЛЬНОСТИ.</div>
        )}
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const HeadTurn: React.FC<{d: number; at: (p: string) => number}> = ({d, at}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [at('сама'), at('Медленно') + 20], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Bedroom blur={14} tv="#2A3C78" />
      <AbsoluteFill style={{background: 'rgba(4,4,14,0.4)'}} />
      <Light x="30%" y="60%" color="rgba(110,160,255,0.35)" size="45%" />
      <Cam dur={d} from={1.0} to={1.08} ox="50%" oy="40%">
        <Chars>
          <Pos x={960} y={3150} s={5}>
            <Stickman color={C.hero} rim={C.rimCold} rimDx={-7} headTilt={-12 * k} face={{...FACES.scared, lx: -20 * k, eyeOpen: 1}} glowScreen={0.8} />
          </Pos>
        </Chars>
      </Cam>
      <Vignette s={0.95} />
    </AbsoluteFill>
  );
};

const HudReveal: React.FC<{d: number; at: (p: string) => number}> = ({d, at}) => {
  const f = useCurrentFrame();
  const blink = f > 4 && f < 9;
  const show = at('загорается');
  const z = at('Ноль');
  const st = at('пять');
  const o = ramp(f, show, 6);
  const glitch = f >= show && f < show + 10 ? (Math.floor(f / 2) % 2 ? 8 : -6) : 0;
  const starAnim = [0, 1, 2, 3, 4].map((i) => (f > st + i * 4 ? 0.3 : -1));
  return (
    <AbsoluteFill>
      <Bedroom blur={8} tv="#2A3C78" />
      <AbsoluteFill style={{background: 'rgba(4,4,14,0.35)'}} />
      <Cam dur={d} from={1.0} to={1.06} oy="70%">
        <Chars>
          <Pos x={960} y={1720} s={2.2}>
            <Stickman color={C.hero} rim={C.rimCold} face={blink ? FACES.blink : f > show ? FACES.shock : FACES.neutral} glowScreen={0.6} />
          </Pos>
        </Chars>
      </Cam>
      <div style={{position: 'absolute', left: 960, top: 210, transform: `translate(-50%,-50%) translateX(${glitch}px) scale(1.6)`, opacity: o}}>
        <div style={{position: 'relative', width: 390, height: 170}}>
          <div style={{position: 'absolute', left: -56, top: -48}}>
            <HUD money={0} stars={0} o={f >= z ? 1 : 0.5} starAnim={starAnim.map((v) => (v < 0 ? 0 : 0.2))} />
          </div>
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const S02: SceneDef = {
  id: 'S02',
  shots: [
    {cue: 'Загрузка', C: Loading},
    {cue: 'Это же', C: (p) => <InGame {...p} which="room" />},
    {cue: 'Твой двор', C: (p) => <InGame {...p} which="yard" />},
    {cue: 'Твой подъезд', C: (p) => <InGame {...p} which="landing" />},
    {cue: 'А персонаж', C: LooksLikeYou},
    {cue: 'Ты жмёшь', C: PadPress},
    {cue: 'И подпрыгиваешь', C: Jump},
    {cue: 'Ты ведёшь', C: HeadTurn},
    {cue: 'Ты моргаешь', C: HudReveal},
  ],
};
