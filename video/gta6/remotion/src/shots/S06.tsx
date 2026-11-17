import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, ramp, rnd} from '../lib/theme';
import {Classroom, Desks, Fence, Void, Yard} from '../lib/Sets';
import {Bolt, Cam, Light, MoneyRain, Sparkle, Storm, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {ARMS, FACES} from '../lib/Stickman';
import {Crowd, Director, Hero, Lera} from '../lib/Cast';
import {CodeInput, Counter, Menu, Stamp} from '../lib/UI';

const CodesMenu: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const active = Math.min(2, Math.floor(f / 10));
  return (
    <AbsoluteFill>
      <Void />
      <Menu title="ПАУЗА" items={['Карта', 'Задания', 'Коды', 'Настройки']} active={active} />
    </AbsoluteFill>
  );
};

const TypeCode: React.FC<{d: number}> = () => (
  <AbsoluteFill>
    <Void glow="rgba(91,227,138,0.12)" />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: 'scale(1.5)'}}><CodeInput code="ДОЖДЬ$$$" start={2} /></div>
    </AbsoluteFill>
    <Vignette />
  </AbsoluteFill>
);

const Rain: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const phones = at('снимают');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06} oy="70%">
        <Yard />
        <Chars>
          <Crowd n={8} x0={60} x1={1860} y={1020} s={0.8} seed={31} face={f > 10 ? 'scream' : 'shock'} f={f} jitter={6}
            arms={(i) => (f >= phones && i % 2 ? [[10, 6], [150, 20]] : [[150, 20 + 10 * Math.sin(f / 4 + i)], [150, 20 - 10 * Math.sin(f / 4 + i)]])} hold={f >= phones ? 'phoneUp' : 'none'} />
          <Pos x={960} y={1060} s={1.0}>
            <Hero rim={C.rimDay} rimDx={8} armL={ARMS.up[0]} armR={ARMS.up[1]} face={FACES.happy} />
          </Pos>
        </Chars>
        <MoneyRain n={90} start={0} />
      </Cam>
      <Vignette s={0.5} />
    </AbsoluteFill>
  );
};

const FirstStar: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Yard blur={10} />
      <MoneyRain n={40} />
      <Cam dur={d} from={1.0} to={1.1} ox="30%" oy="30%">
        <Chars>
          <Pos x={1200} y={2300} s={3.4}>
            <Hero rim={C.rimDay} rimDx={8} face={{...FACES.worried, lx: -18, ly: -10}} headTilt={-6} />
          </Pos>
        </Chars>
      </Cam>
      <Light x="10%" y="10%" color="rgba(255,210,64,0.35)" size="30%" />
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const Weather: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const storm = ramp(f, 6, 18);
  const cancel = at('Контрольную отменяют');
  const flashes = [14, 46, 90, 140].filter((x) => x < d);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05}>
        <Classroom storm={storm} board={['КОНТРОЛЬНАЯ', '1) x² − 7x + 12 = 0', '2) log₂ 64 = ?']} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          {flashes.map((a) => (f >= a && f < a + 6 ? <Bolt key={a} x={1500 + (a % 3) * 120} y={150} s={1.2} /> : null))}
        </svg>
        <Chars>
          <Crowd n={6} x0={60} x1={1500} y={1010} s={0.8} seed={41} face={f >= cancel ? 'happy' : 'scared'} f={f} arms={(i) => (f >= cancel ? [[150, 12], [150, 12]] : [[10, 6], [10, 6]])} />
          <Pos x={1660} y={1010} s={0.85}>
            <Hero rim={C.rimCold} rimDx={-8} face={FACES.sly} armL={ARMS.hold[0]} armR={ARMS.hold[1]} hold="gamepad" />
          </Pos>
        </Chars>
        <Desks y={900} dark={storm * 0.6} />
        <Storm flashes={flashes} />
      </Cam>
      <Stamp text="ОТМЕНЕНО" start={cancel} x={740} y={380} />
      <Vignette />
    </AbsoluteFill>
  );
};

const Carried: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 5) * 14;
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06}>
        <Classroom storm={0.3} board={['КОНТРОЛЬНАЯ', 'ОТМЕНЕНА :)']} />
        <Chars>
          <Crowd n={6} x0={420} x1={1500} y={1060} s={0.85} seed={51} face="happy" f={f} jitter={4} arms={() => [[160, 8], [160, 8]]} />
          <g transform={`translate(${960} ${560 + bob}) rotate(-84) scale(0.9)`}>
            <Hero rim={C.rimWarm} rimDx={6} armL={[120, 10]} armR={[160, 10]} face={FACES.happy} />
          </g>
          <Sparkle x={700} y={260} s={0.8} />
          <Sparkle x={1260} y={230} s={0.6} phase={2} />
        </Chars>
      </Cam>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const SuperJump: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const t0 = at('перелетаешь') - 4;
  const k = interpolate(f, [t0, t0 + 30], [0, 1], clamp);
  const x = 300 + k * 1100;
  const y = 1000 - Math.sin(k * Math.PI) * 620;
  const air = k > 0 && k < 1;
  const trail = [0.08, 0.16, 0.24].map((dk) => Math.max(0, k - dk));
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.04}>
        <Yard />
        <Fence y={720} x0={700} x1={1100} />
        <Chars>
          {air && trail.map((tk, i) => (
            <circle key={i} cx={300 + tk * 1100} cy={1000 - Math.sin(tk * Math.PI) * 620 - 300} r={60 - i * 14} fill="#FFD27A" opacity={0.25 - i * 0.06} />
          ))}
          <Pos x={x} y={y} s={0.8}>
            <Hero rim={C.rimDay} rimDx={8} legs={air ? 'jump' : 'stand'} armL={air ? ARMS.up[0] : [10, 6]} armR={air ? ARMS.up[1] : [10, 6]} face={air ? FACES.happy : FACES.smirk} />
          </Pos>
          <Pos x={1680} y={1040} s={1.0}>
            <Director face={k > 0.3 ? {...FACES.scream, lx: -14} : FACES.neutral} armL={k > 0.3 ? ARMS.headGrab[0] : [10, 6]} armR={k > 0.3 ? ARMS.headGrab[1] : [10, 6]} />
          </Pos>
        </Chars>
        <div style={{position: 'absolute', left: 1680, top: 330, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#EDE7DA', letterSpacing: 4, opacity: ramp(f, 14, 8)}}>ДИРЕКТОР</div>
      </Cam>
      <Vignette s={0.5} />
    </AbsoluteFill>
  );
};

const Fame: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const friends = at('С тобой');
  const msgs = ['Го дружить!', 'Ты легенда 🔥', 'Сфоткаемся?', 'Научи коду!', 'Я с тобой за одной партой!'];
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08} oy="40%">
        <Yard />
        <Light x="50%" y="40%" color="rgba(255,210,120,0.3)" size="40%" />
        <Chars>
          <Crowd n={9} x0={60} x1={1860} y={1050} s={0.78} seed={61} face="love" f={f} jitter={3} arms={(i) => (i % 2 ? [[10, 6], [150, 20]] : [[10, 6], [10, 6]])} hold="phoneUp" />
          <Pos x={960} y={930} s={1.15}>
            <Hero rim={C.rimWarm} rimDx={8} armL={ARMS.up[0]} armR={[10, 6]} face={FACES.grin} />
          </Pos>
          <Sparkle x={760} y={180} s={0.9} />
          <Sparkle x={1180} y={150} s={0.7} phase={3} />
        </Chars>
        {msgs.map((m, i) => (
          <div key={i} style={{position: 'absolute', left: 120 + i * 360, top: 180 + rnd(i * 4) * 220, fontFamily: FONT, fontWeight: 800, fontSize: 34, background: '#F6EEE3', color: '#0B0A0F', padding: '12px 22px', borderRadius: 20, transform: `scale(${ramp(f, friends + i * 5, 8, backOut)}) rotate(${(rnd(i) - 0.5) * 8}deg)`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'}}>{m}</div>
        ))}
        <div style={{position: 'absolute', left: 960, top: 80, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 70, color: C.gold, letterSpacing: 6, textShadow: '0 0 24px rgba(255,190,70,0.6)', opacity: ramp(f, 2, 10), whiteSpace: 'nowrap'}}>НА ВЕРШИНЕ МИРА</div>
      </Cam>
      <Vignette s={0.5} />
    </AbsoluteFill>
  );
};

const Subs: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Void glow="rgba(255,77,94,0.16)" />
      <Cam dur={d} from={1.0} to={1.06}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 560, height: 900, borderRadius: 60, background: '#111019', border: '14px solid #26252F', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
            <div style={{width: 170, height: 170, borderRadius: 90, background: C.head, border: `8px solid ${C.hero}`, marginBottom: 30}} />
            <div style={{color: '#B9B3C9', fontWeight: 800, fontSize: 30, letterSpacing: 4}}>ПОДПИСЧИКИ</div>
            <Counter from={0} to={1000000} start={4} dur={Math.min(60, d - 10)} size={84} color="#F4EEE2" />
            <div style={{marginTop: 20, color: C.red, fontWeight: 800, fontSize: 30, opacity: ramp(f, 20, 8)}}>🔔 +{Math.floor(interpolate(f, [4, 60], [0, 99], clamp))} уведомлений</div>
          </div>
        </AbsoluteFill>
      </Cam>
      <Vignette />
    </AbsoluteFill>
  );
};

const LeraApart: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Yard blur={4} />
      <AbsoluteFill style={{background: 'rgba(20,20,50,0.4)'}} />
      <Cam dur={d} from={1.0} to={1.1} ox="70%" oy="45%">
        <Chars blur={8}>
          <Crowd n={5} x0={0} x1={1100} y={1300} s={1.3} seed={71} face="happy" hold="phoneUp" arms={() => [[10, 6], [150, 20]]} />
        </Chars>
        <Chars>
          <Pos x={1400} y={1050} s={1.15}>
            <Lera face={{...FACES.sad, lx: -10, eyeOpen: 0.9}} />
          </Pos>
        </Chars>
        <Light x="73%" y="45%" color="rgba(255,150,220,0.25)" size="30%" />
      </Cam>
      <Vignette s={0.85} />
    </AbsoluteFill>
  );
};

export const S06: SceneDef = {
  id: 'S06',
  shots: [
    {cue: 'А', C: CodesMenu, hud: false},
    {cue: 'Вводишь', C: TypeCode, hud: false},
    {cue: 'и над школьным', C: Rain},
    {cue: 'А в углу', C: FirstStar},
    {cue: 'Код на погоду', C: Weather},
    {cue: 'Класс носит', C: Carried},
    {cue: 'Код на суперпрыжок', C: SuperJump},
    {cue: 'Ты на вершине', C: Fame},
    {cue: 'Миллион', C: Subs, hud: false},
    {cue: 'Все кроме', C: LeraApart},
  ],
};
