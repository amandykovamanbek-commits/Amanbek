import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {At, SceneDef} from '../lib/shot';
import {C, FONT, backOut, clamp, glowText, ramp} from '../lib/theme';
import {Corridor, SchoolExt, Street} from '../lib/Sets';
import {Cam, Light, Sparkle, Vignette} from '../lib/FX';
import {Chars, Pos} from '../lib/Frame';
import {ARMS, FACES} from '../lib/Stickman';
import {Cleaner, Coach, Crowd, Hero, Lera} from '../lib/Cast';
import {CatOnBranch} from '../lib/Props';
import {Gain, Quest, Toast} from '../lib/UI';

const Cat: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 50], [1500, 760], clamp);
  const walking = f < 50;
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.06} ox="35%" oy="50%">
        <Street />
        <Light x="80%" y="15%" color="rgba(255,240,200,0.3)" size="45%" />
        <Chars>
          <CatOnBranch x={300} y={418} />
          <Pos x={x} y={900} s={0.95}>
            <Hero rim={C.rimDay} rimDx={8} legs={walking ? 'walk' : 'stand'} dir={-1} phase={f / 24} armL={walking ? ARMS.walk(f / 24)[0] : [10, 6]} armR={walking ? ARMS.walk(f / 24)[1] : [10, 6]} face={walking ? FACES.neutral : {...FACES.shock, lx: -12, ly: -6}} headTilt={walking ? 0 : -8} />
          </Pos>
        </Chars>
        <Quest x={560} y={420} title="Снять кота с дерева" reward="+$5" start={at('Над ним')} />
      </Cam>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const GotCat: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.05} to={1.1} ox="30%" oy="60%">
        <Street />
        <Chars>
          <Pos x={520} y={900} s={1}>
            <Hero rim={C.rimDay} rimDx={8} armL={ARMS.hold[0]} armR={ARMS.hold[1]} hold="cat" face={FACES.grin} />
          </Pos>
        </Chars>
        <Quest x={560} y={420} title="Снять кота с дерева" reward="+$5" start={-20} done={2} />
        <Gain x={620} y={300} text="+$5" start={8} />
      </Cam>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const RealFive: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const real = at('Настоящая');
  return (
    <AbsoluteFill>
      <Street blur={12} />
      <AbsoluteFill style={{background: 'rgba(10,10,30,0.25)'}} />
      <Cam dur={d} from={1.0} to={1.08}>
        <Chars>
          <Pos x={820} y={2300} s={3.6}>
            <Hero rim={C.rimDay} rimDx={8} armR={[60, -95]} hold="money" face={f < real ? {...FACES.shock, lx: 12} : {...FACES.grin, lx: 12}} />
          </Pos>
        </Chars>
        <Light x="62%" y="45%" color="rgba(120,255,160,0.25)" size="30%" />
        {f >= real && <div style={{position: 'absolute', right: 160, top: 200, fontFamily: FONT, fontWeight: 900, fontSize: 96, color: C.green, textShadow: '0 0 24px rgba(91,227,138,0.6)', transform: `rotate(-6deg) scale(${ramp(f, real, 8, backOut)})`}}>НАСТОЯЩАЯ.</div>}
      </Cam>
      <Vignette s={0.7} />
    </AbsoluteFill>
  );
};

const OpenWorld: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const ow = at('Это открытый');
  const x = interpolate(f, [0, 60], [400, 820], clamp);
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08} oy="70%">
        <SchoolExt />
        <Chars>
          <Pos x={x} y={980} s={0.75}>
            <Hero rim={C.rimDay} rimDx={8} legs={f < 60 ? 'walk' : 'stand'} phase={f / 24} armL={ARMS.walk(f / 24)[0]} armR={ARMS.walk(f / 24)[1]} face={f >= ow ? {...FACES.shock, ly: -6} : FACES.neutral} />
          </Pos>
        </Chars>
        {[[300, 330], [520, 480], [1180, 330], [1400, 480], [1620, 330], [740, 330]].map(([x0, y0], i) => (
          <div key={i} style={{position: 'absolute', left: x0, top: y0, transform: `translate(-50%,-50%) scale(${ramp(f, ow + 4 + i * 3, 8, backOut)}) rotate(45deg)`, width: 40, height: 40, background: C.gold, borderRadius: 6, boxShadow: '0 0 18px rgba(255,210,64,0.9)'}} />
        ))}
      </Cam>
      {f >= ow && (
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 70, fontFamily: FONT}}>
          <div style={{background: 'rgba(10,10,22,0.75)', padding: '14px 40px', borderRadius: 14, opacity: ramp(f, ow, 8), transform: `scale(${ramp(f, ow, 10, backOut)})`}}>
            <div style={{color: C.gold, fontWeight: 900, fontSize: 80, letterSpacing: 6, textShadow: glowText}}>ОТКРЫТЫЙ МИР</div>
          </div>
        </AbsoluteFill>
      )}
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const QuestsAbove: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const xs = [260, 560, 860, 1160, 1460, 1720];
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.05} dx={-40}>
        <Corridor />
        <Chars>
          <Crowd n={6} x0={140} x1={1840} y={960} s={0.75} seed={3} f={f} />
        </Chars>
        {xs.map((x, i) => (
          <div key={i} style={{position: 'absolute', left: x, top: 470 + Math.sin(f / 8 + i) * 8, transform: `translate(-50%,-50%) scale(${ramp(f, 4 + i * 4, 8, backOut)}) rotate(45deg)`, width: 40, height: 40, background: C.gold, borderRadius: 6, boxShadow: '0 0 18px rgba(255,210,64,0.9)'}} />
        ))}
      </Cam>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const CleanerCoach: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const coach = at('Над физруком');
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.04} dx={interpolate(f, [coach - 10, coach + 10], [0, -120], clamp)}>
        <Corridor />
        <Chars>
          <Pos x={640} y={1000} s={0.95}>
            <Cleaner face={{...FACES.sad, lx: 6}} />
          </Pos>
          <Pos x={1420} y={1000} s={1}>
            <Coach armL={[60, -70]} armR={[60, -70]} face={FACES.worried} />
          </Pos>
        </Chars>
        <Quest x={640} y={380} title="Донести ведро" reward="+$10" start={4} />
        <Quest x={1420} y={320} title="Найти свисток" reward="+$25" start={coach} />
      </Cam>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const LeraIntro: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const fifth = at('с пятого');
  const never = at('ни разу');
  return (
    <AbsoluteFill>
      <Corridor blur={12} />
      <AbsoluteFill style={{background: 'rgba(30,10,40,0.35)'}} />
      <Light x="45%" y="45%" color="rgba(255,150,220,0.35)" size="40%" />
      <Cam dur={d} from={1.0} to={1.08} ox="45%">
        <Chars>
          <Pos x={860} y={1700} s={2.3}>
            <Lera face={{...FACES.smile, lx: 6}} />
          </Pos>
          <Pos x={1640} y={1300} s={1.4}>
            <Hero rim={C.rimWarm} rimDx={-8} face={{...FACES.love, lx: -14}} />
          </Pos>
          <Sparkle x={620} y={260} s={0.8} phase={1} color="#FFB3E6" />
          <Sparkle x={1120} y={220} s={0.6} phase={3} color="#FFB3E6" />
        </Chars>
        <div style={{position: 'absolute', left: 860, top: 140, transform: 'translateX(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 72, color: '#FFB3E6', letterSpacing: 8, textShadow: '0 0 24px rgba(255,150,220,0.6)', opacity: ramp(f, 0, 10)}}>ЛЕРА</div>
        <div style={{position: 'absolute', left: 1260, top: 160, fontFamily: FONT, background: 'rgba(10,10,22,0.82)', borderRadius: 14, padding: '16px 24px', border: '2px solid rgba(255,255,255,0.15)', opacity: ramp(f, fifth, 8)}}>
          <div style={{color: '#B9B3C9', fontWeight: 800, fontSize: 26, letterSpacing: 2}}>СТАТИСТИКА</div>
          <div style={{color: '#F4EEE2', fontWeight: 800, fontSize: 34, marginTop: 8}}>Смотришь на неё: <span style={{color: C.gold}}>6 лет</span></div>
          <div style={{color: '#F4EEE2', fontWeight: 800, fontSize: 34, marginTop: 4, opacity: ramp(f, never, 8)}}>Разговоров: <span style={{color: C.red}}>0</span></div>
        </div>
      </Cam>
      <Vignette s={0.8} />
    </AbsoluteFill>
  );
};

const LeraQuest: React.FC<{d: number}> = ({d}) => {
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.0} to={1.08} ox="45%" oy="60%">
        <Corridor />
        <Light x="45%" y="55%" color="rgba(255,150,220,0.25)" size="35%" />
        <Chars>
          <Pos x={860} y={1000} s={1.05}>
            <Lera armL={ARMS.hold[0]} armR={ARMS.hold[1]} hold="books" face={{...FACES.worried, lx: 8}} lean={-3} />
          </Pos>
          <Pos x={1400} y={1000} s={1.0}>
            <Hero rim={C.rimDay} rimDx={-8} face={{...FACES.shock, lx: -12}} />
          </Pos>
        </Chars>
        <Quest x={860} y={300} title="Помочь донести книги" reward="+$50  +репутация" start={6} scale={1.15} />
      </Cam>
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

const CarryBooks: React.FC<{d: number; at: At}> = ({d, at}) => {
  const f = useCurrentFrame();
  const smile = at('Она улыбается');
  const corner = at('В углу');
  const drop = at('Ты чуть');
  const wob = f >= drop ? Math.sin((f - drop) / 2.2) * 9 * Math.max(0, 1 - (f - drop) / 40) : 0;
  return (
    <AbsoluteFill>
      <Cam dur={d} from={1.02} to={1.08} ox="50%" oy="60%">
        <Corridor />
        <Light x="40%" y="55%" color="rgba(255,150,220,0.2)" size="35%" />
        <Chars>
          <Pos x={720} y={1000} s={1.0}>
            <Lera face={f >= smile ? {...FACES.love, lx: 12} : {...FACES.smile, lx: 12}} />
          </Pos>
          <Pos x={1180} y={1000} s={1.0}>
            <Hero rim={C.rimDay} rimDx={-8} armL={ARMS.hold[0]} armR={ARMS.hold[1]} hold="books" lean={wob} face={f >= drop ? FACES.scared : f >= smile ? {...FACES.love, lx: -12} : FACES.grin} />
          </Pos>
          {f >= smile && <Sparkle x={720} y={300} s={0.7} phase={2} color="#FFB3E6" />}
        </Chars>
        <Gain x={1180} y={330} text="+$50" start={8} />
      </Cam>
      <Toast text="РЕПУТАЦИЯ ПОВЫШЕНА" sub="Лера: ♥ +1" start={corner} dur={Math.max(40, d - corner - 4)} color="#FF9AD5" icon="▲" />
      <Vignette s={0.6} />
    </AbsoluteFill>
  );
};

export const S04: SceneDef = {
  id: 'S04',
  shots: [
    {cue: 'По', C: Cat},
    {cue: 'Снимаешь', C: GotCat},
    {cue: 'В кармане', C: RealFive},
    {cue: 'А в школе', C: OpenWorld},
    {cue: 'Над головами', C: QuestsAbove},
    {cue: 'Над уборщицей', C: CleanerCoach},
    {cue: 'А над Лерой', C: LeraIntro},
    {cue: 'Над ней', C: LeraQuest},
    {cue: 'Ты берёшь', C: CarryBooks},
  ],
};
