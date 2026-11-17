import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, glowText, ramp} from '../lib/theme';
import {CityNight, Rooftops, Street, Void, Yard} from '../lib/Sets';
import {Cam, Light, Siren, Spotlight, Sparkle, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {ARMS, FACES} from '../lib/Stickman';
import {Crowd, Director, Hero, Lera} from '../lib/Cast';
import {Heli} from '../lib/Props';
import {Bubble, Mission, Quest, Star} from '../lib/UI';

const Finger: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const two = at('Две');
  const n = f >= two ? '2' : '3';
  const pulse = 0.5 + 0.5 * Math.sin(f / 4);
  return (
    <AbsoluteFill>
      <Void tint="#0A0712" glow="rgba(255,77,94,0.18)" />
      <Cam dur={d} from={1.0} to={1.15} punch={[two]}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
          <div style={{padding: '34px 80px', borderRadius: 24, background: `rgba(255,77,94,${0.55 + 0.3 * pulse})`, boxShadow: `0 0 ${40 + 40 * pulse}px rgba(255,77,94,0.7)`, color: '#FFF', fontWeight: 900, fontSize: 76, letterSpacing: 4}}>НАЧАТЬ ЗАНОВО</div>
        </AbsoluteFill>
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <g transform={`translate(1010 ${interpolate(f, [0, d], [300, 420], clamp)})`}>
            <rect x={-48} y={-260} width={96} height={240} rx={48} fill={C.head} />
            <ellipse cx={0} cy={-30} rx={52} ry={40} fill={C.head} />
          </g>
        </svg>
        <div style={{position: 'absolute', left: 1500, top: 300, fontFamily: FONT, fontWeight: 900, fontSize: 240, color: C.gold, textShadow: glowText, transform: `scale(${interpolate(f - (f >= two ? two : 0), [0, 6], [1.4, 1], clamp)})`}}>{n}</div>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const OwnQuest: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const q = at('Главная миссия');
  const first = at('Впервые');
  const beam = ramp(f, 4, 12);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.12} oy="40%" punch={[first]}>
        <Rooftops offset={0} />
        <Spotlight x0={1500} y0={110} sweep={40} o={0.6} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <Heli x={1500} y={110} f={f} s={1.0} />
        </svg>
        <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(255,210,64,${0.0}) 0%, rgba(255,210,64,${0.22 * beam}) 60%, rgba(255,210,64,0) 100%)`, clipPath: 'polygon(46% 0, 54% 0, 56% 92%, 44% 92%)', mixBlendMode: 'screen'}} />
        <Chars>
          <rect x={-20} y={1000} width={1960} height={100} fill="#06061A" />
          <rect x={-20} y={996} width={1960} height={5} fill="#2A2850" />
          <rect x={1560} y={900} width={8} height={100} fill="#06061A" />
          <path d="M 1530 900 L 1600 900 M 1540 920 L 1590 920" stroke="#06061A" strokeWidth={6} />
          <Pos x={960} y={1000} s={0.95}>
            <Hero rim="#FFE59A" rimDx={0} rimDy={-10} armL={ARMS.hold[0]} armR={ARMS.hold[1]} hold="gamepad" face={f >= q ? {...FACES.determined, ly: -6} : {...FACES.shock, ly: -10}} headTilt={-4} />
          </Pos>
          {f >= q && <Sparkle x={1160} y={180} s={0.8} />}
        </Chars>
        <Quest x={960} y={390} title={f >= q ? 'Стать собой' : '???'} reward="Награда: ???" start={4} scale={1.3} />
        {f >= q && <div style={{position: 'absolute', left: 960, top: 30, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 40, letterSpacing: 10, color: C.gold, textShadow: glowText, opacity: ramp(f, q, 8), whiteSpace: 'nowrap'}}>ГЛАВНАЯ МИССИЯ</div>}
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const PadDown: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const bend = interpolate(f, [4, 20], [0, 1], clamp);
  const leave = at('И спускаешься');
  const x = interpolate(f, [leave, leave + 40], [960, 1500], clamp);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.05} to={1.12} ox="50%" oy="75%">
        <Rooftops offset={0} />
        <Siren o={0.35} />
        <Chars>
          <rect x={-20} y={1000} width={1960} height={100} fill="#06061A" />
          <rect x={-20} y={996} width={1960} height={5} fill="#2A2850" />
          <rect x={1560} y={900} width={8} height={100} fill="#06061A" />
          <path d="M 1530 900 L 1600 900 M 1540 920 L 1590 920" stroke="#06061A" strokeWidth={6} />
          {bend >= 0.6 && (
            <g transform="translate(1040 990) scale(1.3)">
              <path d="M -46 -16 Q -50 -22 -38 -22 L 38 -22 Q 50 -22 46 -16 L 52 14 Q 54 26 40 22 L 22 8 L -22 8 L -40 22 Q -54 26 -52 14 Z" fill="#1C1B26" stroke={C.head} strokeWidth={4} />
              <circle cx={26} cy={-10} r={5} fill="#5BE38A" />
            </g>
          )}
          <Pos x={x} y={1000} s={0.95}>
            <Hero rim={C.rimCold} rimDx={-8} lean={f < leave ? 18 * bend * (1 - ramp(f, leave - 10, 10)) : 0} legs={f >= leave ? 'walk' : bend > 0.5 && f < leave - 10 ? 'sit' : 'stand'} phase={f / 18}
              armL={f >= leave ? ARMS.walk(f / 18)[0] : [10 + 20 * bend, 6]} armR={f >= leave ? ARMS.walk(f / 18)[1] : [10 + 20 * bend, 6]} hold={bend < 0.6 ? 'gamepad' : 'none'} face={FACES.determined} />
          </Pos>
        </Chars>
      </Cam>
      <div style={{position: 'absolute', left: 960, top: 110, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 60, color: '#EDE7DA', letterSpacing: 6, opacity: ramp(f, at('Просто сам'), 8), whiteSpace: 'nowrap', textShadow: '0 4px 0 rgba(0,0,0,0.5)'}}>БЕЗ ЧИТОВ. ПРОСТО САМ.</div>
      <Vignette s={0.9} />
    </AbsoluteFill>
  );
};

const PushThrough: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const pull = at('вытаскиваешь');
  const x = interpolate(f, [0, pull], [200, 900], clamp);
  const lx = interpolate(f, [pull, pull + 20], [960, 700], clamp);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05} punch={[pull]} punchK={0.06}>
        <Street />
        <AbsoluteFill style={{background: 'rgba(8,8,40,0.58)'}} />
        <Siren o={0.45} />
        <Chars>
          <Crowd n={8} x0={100} x1={1820} y={1010} s={0.9} seed={101} face="angry" f={f} jitter={8} arms={() => [[60, -40], [60, -40]]} />
          {f >= pull - 4 && (
            <Pos x={f >= pull ? lx + 120 : 1000} y={1000} s={0.95}>
              <Lera face={f >= pull + 10 ? FACES.shock : FACES.scared} armL={[70, -10]} armR={[10, 6]} />
            </Pos>
          )}
          <Pos x={f >= pull ? lx - 80 : x} y={1000} s={1.0}>
            <Hero rim={C.rimCold} rimDx={-8} legs={f < pull + 20 ? 'walk' : 'stand'} phase={f / 16} armL={[95, -10]} armR={[95, -10]} face={FACES.determined} lean={8} />
          </Pos>
        </Chars>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Confess: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const say = at('Это всё');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08} ox="50%" oy="40%" punch={[say]} punchK={0.05}>
        <Street />
        <AbsoluteFill style={{background: 'rgba(8,8,40,0.55)'}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 16% 45% at 50% 55%, rgba(255,250,220,0.35) 0%, rgba(0,0,0,0) 100%)'}} />
        <Chars>
          <Pos x={960} y={930} s={1.15}>
            <Hero rim={C.rimWarm} rimDx={8} face={f >= say ? FACES.determined : FACES.worried} />
          </Pos>
          <Pos x={1250} y={940} s={0.95}>
            <Lera face={{...FACES.shock, lx: -12}} />
          </Pos>
        </Chars>
        <Chars blur={5}>
          <Crowd n={7} x0={0} x1={1920} y={1350} s={1.35} seed={111} face="dots" />
        </Chars>
        <Bubble x={760} y={360} text="Это всё я. Деньги верну." start={say} w={560} size={48} />
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const PayBack: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05}>
        <Yard />
        <Chars>
          <Pos x={760} y={1020} s={1.0}>
            <Hero rim={C.rimDay} rimDx={8} lean={f > 24 ? 14 : 0} armR={f < 24 ? [70, -60] : [10, 6]} hold={f < 24 ? 'money' : 'none'} face={f > 24 ? {...FACES.sad, eyes: 'closed'} : FACES.neutral} />
          </Pos>
          <Pos x={1180} y={1020} s={1.0}>
            <Director face={f >= 30 ? {...FACES.smile, lx: -10} : {...FACES.worried, lx: -10}} armL={[60, -70]} armR={[10, 6]} />
          </Pos>
        </Chars>
        <div style={{position: 'absolute', left: 1080, top: 150, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.green, background: 'rgba(10,10,22,0.8)', padding: '10px 28px', borderRadius: 14, opacity: ramp(f, 4, 8), whiteSpace: 'nowrap'}}>ВОЗВРАТ: $1 048 000 → $0</div>
      </Cam>
      <Vignette s={0.5} />
    </AbsoluteFill>
  );
};

const StarsOut: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const off = (i: number) => f >= 8 + (4 - i) * 12;
  const n = [0, 1, 2, 3, 4].filter(off).length;
  return (
    <AbsoluteFill>
      <Void tint="#0B0A1A" glow={`rgba(255,200,70,${0.2 - 0.03 * n})`} />
      <Cam dur={d} from={1.05} to={1.0}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{display: 'flex', gap: 24}}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{opacity: off(i) ? 0.35 : 1, transform: `scale(${off(i) ? 0.9 : 1})`}}>
                <Star on={off(i) ? 0 : 1} size={190} />
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const Passed: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const reward = at('Награда');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08}>
        <CityNight lit={0.5} blur={6} />
        <Light x="50%" y="70%" color="rgba(255,190,110,0.35)" size="50%" />
        <Chars>
          <Pos x={830} y={1040} s={1.0}>
            <Hero rim={C.rimWarm} rimDx={8} face={{...FACES.smile, lx: 10}} />
          </Pos>
          <Pos x={1100} y={1040} s={0.95}>
            <Lera rimDx={-8} face={{...FACES.love, lx: -10}} />
          </Pos>
          <Sparkle x={960} y={260} s={0.8} />
        </Chars>
      </Cam>
      <AbsoluteFill style={{transform: 'translateY(-250px)'}}><Mission title="МИССИЯ ВЫПОЛНЕНА" sub={f >= reward ? 'Награда: не деньги' : ' '} start={2} dur={Math.max(60, d - 2)} /></AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const S08: SceneDef = {
  id: 'S08',
  shots: [
    {cue: 'Палец', C: Finger, hud: false},
    {cue: 'И вдруг', C: OwnQuest},
    {cue: 'Ты кладёшь', C: PadDown},
    {cue: 'Пробиваешься', C: PushThrough},
    {cue: 'Встаёшь', C: Confess},
    {cue: 'И возвращаешь', C: PayBack},
    {cue: 'Звёзды гаснут', C: StarsOut, hud: false},
    {cue: 'А на экране', C: Passed, hud: false},
  ],
};
