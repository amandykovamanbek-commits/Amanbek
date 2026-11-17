import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, glowText, ramp, rnd} from '../lib/theme';
import {Classroom, Corridor, Desks, Kitchen, Void} from '../lib/Sets';
import {Cam, Light, Sparkle, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {ARMS, FACES} from '../lib/Stickman';
import {Crowd, Hero, Mom, Timur} from '../lib/Cast';
import {Bubble, Counter, Dialog, Mission, Quest} from '../lib/UI';

const Money: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const fri = at('К пятнице');
  return (
    <AbsoluteFill>
      <Void glow="rgba(91,227,138,0.16)" />
      <Cam dur={d} from={1} to={1.06}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
          <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 44, letterSpacing: 12, height: 60}}>{f < fri ? 'К ОБЕДУ' : 'К ПЯТНИЦЕ'}</div>
          <Counter from={f < fri ? 5 : 1200} to={f < fri ? 1200 : 48000} start={f < fri ? 6 : fri + 4} dur={22} prefix="$" size={210} color={C.green} />
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const QUESTS = ['Донести ведро', 'Найти свисток', 'Полить цветы в кабинете', 'Починить проектор', 'Выгулять собаку завуча', 'Найти журнал 9 «Б»'];

const Grind: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const x = ((f * 22) % 2600) - 340;
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.03}>
        <Corridor />
        <Chars>
          <Crowd n={5} x0={100} x1={1800} y={1000} s={0.85} seed={11} />
          <Pos x={x} y={1000} s={0.95}>
            <Hero rim={C.rimDay} rimDx={-8} legs="run" phase={f / 12} armL={ARMS.run(f / 12)[0]} armR={ARMS.run(f / 12)[1]} face={FACES.determined} lean={8} />
          </Pos>
        </Chars>
      </Cam>
      <div style={{position: 'absolute', right: 60, top: 120, width: 560, fontFamily: FONT, background: 'rgba(10,10,22,0.85)', borderRadius: 18, padding: '24px 28px', border: '2px solid rgba(255,255,255,0.12)'}}>
        <div style={{color: C.gold, fontWeight: 900, fontSize: 32, letterSpacing: 4, marginBottom: 10}}>ЗАДАНИЯ</div>
        {QUESTS.map((q, i) => {
          const done = f > 10 + i * 9;
          return (
            <div key={i} style={{display: 'flex', gap: 14, alignItems: 'center', marginTop: 8, fontWeight: 800, fontSize: 30, color: done ? '#7E7A90' : '#F4EEE2', textDecoration: done ? 'line-through' : 'none'}}>
              <span style={{width: 34, height: 34, borderRadius: 8, background: done ? C.green : 'transparent', border: `3px solid ${done ? C.green : '#7E7A90'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0B0A0F', fontSize: 24, transform: `scale(${done ? interpolate(f, [10 + i * 9, 14 + i * 9], [1.6, 1], clamp) : 1})`}}>{done ? '✓' : ''}</span>
              {q}
            </div>
          );
        })}
      </div>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const MomMoney: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const silent = at('и очень');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08} ox="50%" oy="55%">
        <Kitchen />
        <Light x="50%" y="18%" color="rgba(255,200,120,0.4)" size="45%" />
        <Chars>
          <Pos x={720} y={1000} s={1.05}>
            <Mom rimDx={8} rimDy={-8} armR={[60, -95]} hold="money" face={f < silent ? {...FACES.shock, lx: 10} : {eyes: 'dot', mouth: 'line', lx: 10}} />
          </Pos>
          <Pos x={1260} y={1000} s={0.95}>
            <Hero rim={C.rimWarm} rimDx={-8} face={{...FACES.worried, lx: -12}} />
          </Pos>
        </Chars>
        {f >= silent && <Bubble x={640} y={330} text={'.'.repeat(1 + Math.min(2, Math.floor((f - silent) / 14)))} start={silent} w={170} size={60} />}
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Sneakers: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const sum = at('На сорок');
  const last = at('Кроссовки');
  void 0;
  return (
    <AbsoluteFill>
      <Kitchen blur={12} />
      <AbsoluteFill style={{background: 'rgba(20,10,10,0.35)'}} />
      <Cam dur={d} from={1.0} to={1.06} punch={[sum, last]} punchK={0.07}>
        <Chars>
          <Pos x={1300} y={2550} s={3.8}>
            <Hero rim={C.rimWarm} rimDx={-8} face={{...FACES.grin, lx: -14, brow: -6}} armL={[10, 6]} armR={[60, -70]} />
          </Pos>
        </Chars>
        <Bubble x={250} y={430} text="Продал старые кроссовки." start={4} w={620} size={46} />
        {f >= sum && (
          <div style={{position: 'absolute', left: 220, top: 560, fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.gold, textShadow: glowText, transform: `rotate(-4deg) scale(${ramp(f, sum, 8, backOut)})`}}>НА $48 000.</div>
        )}
        {f >= last && (
          <div style={{position: 'absolute', left: 260, top: 690, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#EDE7DA', transform: `rotate(-4deg)`, opacity: ramp(f, last, 6)}}>КРОССОВКИ.</div>
        )}
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const TimurEnters: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const same = at('Тот самый');
  const x = interpolate(f, [0, 30], [2100, 1300], {...clamp, easing: (t) => 1 - (1 - t) * (1 - t)});
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08} ox="60%" oy="60%">
        <Corridor dim={0.4} />
        <Light x="70%" y="60%" color="rgba(255,60,60,0.35)" size="45%" />
        <Chars>
          <Pos x={x} y={1000} s={1.18}>
            <Timur legs={f < 30 ? 'walk' : 'stand'} dir={-1} phase={f / 26} armL={[30, -20]} armR={[30, -20]} face={{...FACES.angry, lx: -10, mouth: 'smirk'}} />
          </Pos>
          <Pos x={600} y={1000} s={0.9}>
            <Hero rim={C.rimCold} rimDx={-8} face={{...FACES.scared, lx: 12}} lean={-4} />
          </Pos>
        </Chars>
        <div style={{position: 'absolute', left: x, top: 150, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 70, color: C.red, letterSpacing: 8, textShadow: '0 0 24px rgba(255,77,94,0.6)', opacity: ramp(f, 12, 8)}}>ТИМУР</div>
        <div style={{position: 'absolute', left: 120, top: 300, fontFamily: FONT, background: 'rgba(10,10,22,0.85)', borderRadius: 14, padding: '16px 24px', border: '2px solid rgba(255,77,94,0.5)', opacity: ramp(f, same, 8)}}>
          <div style={{color: '#B9B3C9', fontWeight: 800, fontSize: 26, letterSpacing: 2}}>ДОСЬЕ</div>
          <div style={{color: '#F4EEE2', fontWeight: 800, fontSize: 34, marginTop: 8}}>Забрал твоих обедов: <span style={{color: C.red}}>540</span></div>
        </div>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const RedQuest: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const opts = at('Ты просто');
  const pick = at('одну фразу');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05} ox="50%" oy="40%">
        <Corridor dim={0.4} />
        <Light x="65%" y="55%" color="rgba(255,60,60,0.25)" size="40%" />
        <Chars>
          <Pos x={1250} y={1000} s={1.18}>
            <Timur armL={[30, -20]} armR={[30, -20]} face={{...FACES.angry, lx: -10, mouth: 'smirk'}} />
          </Pos>
          <Pos x={680} y={1000} s={0.95}>
            <Hero rim={C.rimCold} rimDx={-8} face={f >= opts ? {...FACES.determined, lx: 12} : {...FACES.worried, lx: 12}} />
          </Pos>
        </Chars>
        <Quest x={1250} y={280} title="Поставить задиру на место" reward="+уважение" start={4} red scale={1.1} />
      </Cam>
      <Dialog who="ТЫ → ТИМУР" options={['[Ударить] — недоступно', 'Сказать ту самую фразу', 'Убежать']} pick={1} start={opts} pickAt={pick} />
      <Vignette s={0.7} />
    </AbsoluteFill>
  );
};

const ClassLaughs: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const laugh = at('А потом');
  const notYou = at('Не над тобой');
  const l = f >= laugh;
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06} shake={l && f < laugh + 20 ? 3 : 0}>
        <Classroom />
        <Chars>
          <Crowd n={6} x0={380} x1={1540} y={980} s={0.7} seed={21} face={l ? 'happy' : 'dots'} arms={(i) => (l && i % 2 ? [[10, 6], [95, -5]] : [[10, 6], [10, 6]])} jitter={l ? 4 : 0} f={f} />
        </Chars>
        <Desks y={880} dark={0.2} />
        <Chars>
          <Pos x={1650} y={1100} s={1.15}>
            <Timur face={f >= notYou ? {...FACES.sad, blush: true, tear: true} : FACES.shock} armL={[10, 6]} armR={[10, 6]} />
          </Pos>
          <Pos x={250} y={1100} s={1.05}>
            <Hero rim={C.rimDay} rimDx={8} face={f >= notYou ? {...FACES.smirk, lx: 10} : {...FACES.neutral, lx: 10}} />
          </Pos>
        </Chars>
        {l &&
          ['ХА-ХА-ХА', 'АХАХАХ', 'ХА-ХА', 'ПХАХА'].map((t, i) => (
            <div key={i} style={{position: 'absolute', left: 420 + i * 300, top: 640 + rnd(i) * 80 - (f - laugh) * 0.8, fontFamily: FONT, fontWeight: 900, fontSize: 56 + i * 6, color: '#EDE7DA', transform: `rotate(${(rnd(i + 3) - 0.5) * 20}deg) scale(${ramp(f, laugh + i * 4, 6, backOut)})`, opacity: 0.85}}>{t}</div>
          ))}
        {!l && <div style={{position: 'absolute', left: 960, top: 200, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#B9B3C9', letterSpacing: 10, opacity: ramp(f, 6, 10)}}>ТИШИНА</div>}
      </Cam>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const FirstTime: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Classroom blur={14} />
      <AbsoluteFill style={{background: 'rgba(40,20,0,0.25)'}} />
      <Light x="50%" y="50%" color="rgba(255,190,90,0.35)" size="45%" />
      <Cam dur={d} from={1.0} to={1.08}>
        <Chars>
          <Pos x={960} y={3160} s={5}>
            <Hero rim={C.rimWarm} rimDx={8} face={{...FACES.smile, eyeOpen: 0.85}} />
          </Pos>
          <Sparkle x={560} y={300} s={0.8} />
          <Sparkle x={1400} y={260} s={0.6} phase={2} />
        </Chars>
      </Cam>
      <AbsoluteFill style={{transform: 'translateY(300px)'}}><Mission title="ЗАДАНИЕ ВЫПОЛНЕНО" sub="Уважение класса +100" start={4} dur={Math.max(50, d - 6)} /></AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

const Foreshadow: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const pad = at('А на твой');
  const seen = at('Так');
  return (
    <AbsoluteFill>
      <Corridor blur={14} dim={0.5} />
      <AbsoluteFill style={{background: 'rgba(20,4,8,0.45)'}} />
      <Light x="30%" y="45%" color="rgba(255,60,60,0.25)" size="40%" />
      <Cam dur={d} from={1.0} to={1.1} ox="30%" punch={[pad, seen]} punchK={0.06}>
        <Chars>
          <Pos x={560} y={3200} s={5}>
            <Timur face={{eyes: 'oval', eyeOpen: f >= pad ? 0.45 : 0.8, mouth: 'line', brow: f >= seen ? -6 : 14, browY: 4, lx: 22, ly: 8}} />
          </Pos>
        </Chars>
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <g transform="translate(1420 760) scale(4)" opacity={ramp(f, pad - 4, 8)}>
            <path d="M -46 -16 Q -50 -22 -38 -22 L 38 -22 Q 50 -22 46 -16 L 52 14 Q 54 26 40 22 L 22 8 L -22 8 L -40 22 Q -54 26 -52 14 Z" fill="#1C1B26" stroke={C.head} strokeWidth={2} />
            <circle cx={-24} cy={-6} r={7} fill="#3A394A" />
            <circle cx={26} cy={-10} r={5} fill="#5BE38A" style={{filter: 'drop-shadow(0 0 4px #5BE38A)'}} />
            <circle cx={36} cy={-2} r={5} fill="#FF4D5E" />
            <circle cx={16} cy={-2} r={5} fill="#4DA3FF" />
          </g>
        </svg>
        {f >= seen && <div style={{position: 'absolute', left: 1000, top: 260, fontFamily: FONT, fontWeight: 900, fontSize: 150, color: C.red, textShadow: '0 0 24px rgba(255,77,94,0.6)', transform: `scale(${ramp(f, seen, 8, backOut)})`}}>?</div>}
      </Cam>
      <Vignette s={0.95} />
    </AbsoluteFill>
  );
};

export const S05: SceneDef = {
  id: 'S05',
  shots: [
    {cue: 'К', C: Money, hud: false},
    {cue: 'Ты закрываешь', C: Grind},
    {cue: 'Мама', C: MomMoney},
    {cue: 'Ты говоришь', C: Sneakers, hud: false},
    {cue: 'И тут', C: TimurEnters},
    {cue: 'Над ним', C: RedQuest},
    {cue: 'Весь класс', C: ClassLaughs},
    {cue: 'Впервые', C: FirstTime, hud: false},
    {cue: 'Странно', C: Foreshadow, hud: false},
  ],
};
