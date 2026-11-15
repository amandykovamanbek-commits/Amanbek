import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { FPS, BEAT } from './timeline';
import { TL, META } from './tl';

// ---------- palette & helpers
const INK = '#161412', CREAM = '#f4ede3', CORAL = '#e4704c', YELLOW = '#ffc83d', TEAL = '#25b3a2', GREY = '#8d847a';
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const eo = (k: number) => 1 - Math.pow(1 - k, 3);
const ei = (k: number) => k * k * k;
const eio = (k: number) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const back = (k: number) => { const c1 = 1.8, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const pr = (t: number, a: number, d = .4) => clamp((t - a) / d);
const decay = (t: number, a: number, r = 6) => (t < a ? 0 : Math.exp(-(t - a) * r));
const noise = (t: number, f: number, p = 0) => Math.sin(t * f + p) * .6 + Math.sin(t * f * 2.31 + p * 1.7) * .4;
const { C, scenes: SC, chunks: CH, duration: DUR, voEnd: VO_END } = TL;
const FONT = 'Inter, "Noto Color Emoji", sans-serif', MONO = '"JetBrains Mono", monospace';

// ---------- primitives
const Abs: React.FC<{ x?: number; y?: number; w?: number; h?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x = 0, y = 0, w, h, style, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}>{children}</div>
);
// word slams in: scale down from big + blur
const Slam: React.FC<{ t: number; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, at, children, style }) => {
  const k = pr(t, at, .28);
  return <span style={{ display: 'inline-block', opacity: clamp(k * 3), transform: `scale(${lerp(1.9, 1, eo(k))}) translateY(${(1 - eo(k)) * -20}px)`, filter: k < 1 ? `blur(${(1 - k) * 10}px)` : 'none', ...style }}>{children}</span>;
};
// text rises from behind a mask line
const Mask: React.FC<{ t: number; at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number }> = ({ t, at, out = 1e9, children, style, dur = .45 }) => {
  const k = eo(pr(t, at, dur)), o = ei(pr(t, out, .3));
  return <div style={{ overflow: 'hidden', ...style }}><div style={{ transform: `translateY(${(1 - k) * 110 - o * 110}%)` }}>{children}</div></div>;
};
const Pop: React.FC<{ t: number; at: number; children: React.ReactNode; style?: React.CSSProperties; rot?: number }> = ({ t, at, children, style, rot = 0 }) => {
  const k = pr(t, at, .45);
  if (t < at) return null;
  return <div style={{ position: 'absolute', transform: `scale(${Math.max(0, back(k))}) rotate(${rot * (1 - eo(k))}deg)`, opacity: clamp(k * 4), ...style }}>{children}</div>;
};
// outlined big step number
const StepNum: React.FC<{ t: number; at: number; n: string; color: string; fill: string }> = ({ t, at, n, color, fill }) => {
  const k = pr(t, at, .55);
  return (
    <div style={{ position: 'absolute', left: 60, top: 230, fontFamily: FONT, fontWeight: 900, fontSize: 300, lineHeight: 1, letterSpacing: -14, color: 'transparent', WebkitTextStroke: `6px ${color}`, transform: `translateX(${(1 - eo(k)) * -260}px) rotate(${(1 - eo(k)) * -12}deg)`, opacity: clamp(k * 3) }}>
      {n}
      <div style={{ position: 'absolute', inset: 0, color: fill, WebkitTextStroke: '0px', clipPath: `inset(${100 - 100 * eo(pr(t, at + .25, .5))}% 0 0 0)` }}>{n}</div>
    </div>
  );
};
// radial burst of lines
const Burst: React.FC<{ t: number; at: number; x: number; y: number; color: string; r0?: number; r1?: number; n?: number }> = ({ t, at, x, y, color, r0 = 160, r1 = 380, n = 14 }) => {
  const k = pr(t, at, .55); if (t < at || k >= 1) return null;
  const a = lerp(r0, r1, eo(k)), b = lerp(r0, r1, eo(clamp(k * 1.6)));
  return <svg style={{ position: 'absolute', left: x - 500, top: y - 500, overflow: 'visible' }} width={1000} height={1000}>
    {Array.from({ length: n }, (_, i) => { const an = (i / n) * Math.PI * 2; return <line key={i} x1={500 + Math.cos(an) * a} y1={500 + Math.sin(an) * a} x2={500 + Math.cos(an) * b} y2={500 + Math.sin(an) * b} stroke={color} strokeWidth={14} strokeLinecap="round" />; })}
  </svg>;
};
const Ring: React.FC<{ t: number; at: number; x: number; y: number; color: string; r?: number }> = ({ t, at, x, y, color, r = 300 }) => {
  const k = pr(t, at, .7); if (t < at || k >= 1) return null;
  return <div style={{ position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', border: `${12 * (1 - k)}px solid ${color}`, transform: `scale(${.2 + .8 * eo(k)})`, opacity: 1 - k }} />;
};

// ---------- background decoration: drifting dot grid + floating shapes, pulsing on the beat
const Deco: React.FC<{ t: number; tint: string; seed: number }> = ({ t, tint, seed }) => {
  const bp = decay(t % BEAT, 0, 8);
  const shapes = [
    { x: 90, y: 1280, s: 120, k: 'ring' }, { x: 900, y: 180, s: 90, k: 'plus' }, { x: 930, y: 1300, s: 110, k: 'tri' }, { x: 60, y: 140, s: 70, k: 'dot' }, { x: 820, y: 1820, s: 140, k: 'squig' },
  ];
  return <>
    <AbsoluteFill style={{ backgroundImage: `radial-gradient(${tint} 3.5px, transparent 4px)`, backgroundSize: '54px 54px', backgroundPosition: `${t * 14}px ${t * 22}px`, opacity: .55 }} />
    {shapes.map((s, i) => {
      const r = t * (20 + i * 9) * (i % 2 ? 1 : -1) + seed * 40, dy = Math.sin(t * .8 + i + seed) * 20, sc = 1 + .12 * bp;
      const st = { position: 'absolute' as const, left: s.x - s.s / 2, top: s.y - s.s / 2 + dy, width: s.s, height: s.s, transform: `rotate(${r}deg) scale(${sc})` };
      return <svg key={i} style={st} viewBox="-50 -50 100 100">
        {s.k === 'ring' && <circle r={38} fill="none" stroke={tint} strokeWidth={10} />}
        {s.k === 'plus' && <path d="M0 -36V36M-36 0H36" stroke={tint} strokeWidth={14} strokeLinecap="round" />}
        {s.k === 'tri' && <path d="M0 -38L34 26H-34Z" fill="none" stroke={tint} strokeWidth={10} strokeLinejoin="round" />}
        {s.k === 'dot' && <circle r={30} fill={tint} />}
        {s.k === 'squig' && <path d="M-44 0Q-33 -22 -22 0T0 0T22 0T44 0" fill="none" stroke={tint} strokeWidth={10} strokeLinecap="round" />}
      </svg>;
    })}
  </>;
};

// ---------- character «Кодик» built from primitives; supports line-draw, assembly and gestures
type Part = 'legs' | 'armL' | 'armR' | 'body' | 'head' | 'eyes' | 'mouth';
const Kodik: React.FC<{ t: number; draw?: number; fill?: number; wave?: boolean; jump?: number; offs?: Partial<Record<Part, [number, number, number, number]>>; line?: string }> = ({ t, draw = 1, fill = 1, wave, jump, offs = {}, line = INK }) => {
  const bob = Math.sin(t * 4.4) * 6 - (jump !== undefined ? 80 * Math.max(0, Math.sin(Math.PI * clamp((t - jump) / .5))) : 0);
  const blink = (t % 2.7) < .12 ? .1 : 1;
  const wv = wave ? -30 + 32 * Math.sin(t * 11) : 6 * Math.sin(t * 2.2);
  const d = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw } as any;
  const F = (c: string) => (fill >= 1 ? c : `color-mix(in srgb, ${c} ${Math.round(fill * 100)}%, transparent)`);
  const g = (p: Part, extra = '') => { const o = offs[p] || [0, 0, 0, 1]; return { transform: `translate(${o[0]} ${o[1] + bob}) rotate(${o[2]}) scale(${o[3]}) ${extra}`, opacity: o[3] <= 0.001 ? 0 : 1 }; };
  const sw = 9;
  return (
    <svg viewBox="-220 -290 440 560" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <g {...g('legs')}><line x1={-50} y1={180} x2={-62} y2={250} stroke={line} strokeWidth={26} strokeLinecap="round" {...d} /><line x1={50} y1={180} x2={62} y2={250} stroke={line} strokeWidth={26} strokeLinecap="round" {...d} /></g>
      <g {...g('armL', `rotate(${4 * Math.sin(t * 3)} -100 70)`)}><line x1={-100} y1={70} x2={-172} y2={158} stroke={line} strokeWidth={26} strokeLinecap="round" {...d} /></g>
      <g {...g('armR', `rotate(${wv} 100 70)`)}><line x1={100} y1={70} x2={180} y2={-6} stroke={line} strokeWidth={26} strokeLinecap="round" {...d} /><circle cx={184} cy={-14} r={24} fill={F('#ffe9d2')} stroke={line} strokeWidth={sw} {...d} /></g>
      <g {...g('body')}><rect x={-114} y={18} width={228} height={176} rx={72} fill={F(CORAL)} stroke={line} strokeWidth={sw} {...d} />
        <text x={0} y={130} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={54} fill={CREAM} opacity={fill}>{'</>'}</text></g>
      <g {...g('head', `rotate(${3 * Math.sin(t * 2.3)} 0 -90)`)}>
        <line x1={0} y1={-208} x2={0} y2={-252} stroke={line} strokeWidth={sw} {...d} /><circle cx={0} cy={-256} r={18} fill={F(YELLOW)} stroke={line} strokeWidth={sw} {...d} />
        <circle cx={0} cy={-90} r={122} fill={F('#ffe9d2')} stroke={line} strokeWidth={sw} {...d} />
        <ellipse cx={-72} cy={-46} rx={21} ry={12} fill="#f4a99a" opacity={fill} /><ellipse cx={72} cy={-46} rx={21} ry={12} fill="#f4a99a" opacity={fill} /></g>
      <g {...g('eyes', `rotate(${3 * Math.sin(t * 2.3)} 0 -90) translate(0 -100) scale(1 ${blink}) translate(0 100)`)}>
        <ellipse cx={-42} cy={-100} rx={21} ry={31} fill={F(INK)} stroke={line} strokeWidth={4} {...d} /><ellipse cx={42} cy={-100} rx={21} ry={31} fill={F(INK)} stroke={line} strokeWidth={4} {...d} />
        <circle cx={-35} cy={-112} r={7} fill="#fff" opacity={fill} /><circle cx={49} cy={-112} r={7} fill="#fff" opacity={fill} /></g>
      <g {...g('mouth', `rotate(${3 * Math.sin(t * 2.3)} 0 -90)`)}><path d="M-40 -42 Q0 -2 40 -42" stroke={line} strokeWidth={11} fill="none" strokeLinecap="round" {...d} /></g>
    </svg>
  );
};

// ---------- scenes (t = global seconds)
const S1: React.FC<{ t: number }> = ({ t }) => {
  const swap = C.s1claude;
  const draw = eio(pr(t, C.s1draw, 1.0)), fill = pr(t, C.s1claude - .1, .4);
  const br = eo(pr(t, C.s1draw, .5));
  return <AbsoluteFill style={{ background: INK }}>
    <Deco t={t} tint="#2a2622" seed={1} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: FONT, fontWeight: 900, color: CREAM, letterSpacing: -4 }}>
      <div style={{ fontSize: 150, lineHeight: 1.02 }}><Slam t={t} at={C.s1w[0]}>ЭТОТ</Slam> <Slam t={t} at={C.s1w[1]}>МУЛЬТИК</Slam></div>
      <div style={{ fontSize: 124, lineHeight: 1.1, color: YELLOW }}><Slam t={t} at={C.s1w[2]}>НАРИСОВАЛ</Slam></div>
      <div style={{ position: 'relative', height: 150 }}>
        <Mask t={t} at={C.s1no - .05} out={swap - .2} style={{ position: 'absolute', inset: 0 }}>
          <div style={{ fontSize: 112, lineHeight: 1.3, color: GREY, position: 'relative', display: 'inline-block' }}>НЕ ХУДОЖНИК
            <div style={{ position: 'absolute', left: -14, right: -14, top: '48%', height: 16, borderRadius: 8, background: CORAL, transformOrigin: 'left', transform: `scaleX(${eo(pr(t, C.s1no + .15, .25))}) rotate(-3deg)` }} /></div>
        </Mask>
        <Mask t={t} at={swap + .12} style={{ position: 'absolute', inset: 0 }}>
          <div style={{ fontSize: 124, lineHeight: 1.2 }}><span style={{ color: CORAL }}>CLAUDE</span> <span style={{ fontFamily: MONO, fontSize: 96, color: CREAM, opacity: clamp((t - C.s1code) / .15) }}>кодом</span></div>
        </Mask>
      </div>
    </div>
    {/* brackets slide apart, character is drawn between them */}
    <Abs x={540 - 60 - 330 * br} y={980} style={{ fontFamily: MONO, fontWeight: 800, fontSize: 300, color: CORAL, opacity: br, lineHeight: 1 }}>{'<'}</Abs>
    <Abs x={540 - 90 + 330 * br} y={980} style={{ fontFamily: MONO, fontWeight: 800, fontSize: 300, color: CORAL, opacity: br, lineHeight: 1 }}>{'/>'}</Abs>
    <Ring t={t} at={C.s1code} x={540} y={1130} color={YELLOW} r={340} />
    <Burst t={t} at={C.s1code} x={540} y={1130} color={YELLOW} r0={260} r1={420} />
    <Abs x={340} y={850} w={400} h={510} style={{ opacity: t >= C.s1draw ? 1 : 0, transform: `scale(${1 + .08 * decay(t, C.s1code, 5)})` }}>
      <Kodik t={t} draw={draw} fill={fill} line={fill > .5 ? INK : CREAM} wave={t > C.s1claude} jump={C.s1code} />
    </Abs>
  </AbsoluteFill>;
};

const S2: React.FC<{ t: number; st: number }> = ({ t, st }) => {
  const msg = 'мультик про робота, который учится танцевать';
  const kt = pr(t, C.s2type, Math.max(.3, C.s2send - C.s2type - .1));
  const sent = t >= C.s2send, ks = eo(pr(t, C.s2send, .35));
  const minis = [
    <><circle cx={100} cy={120} r={42} fill={YELLOW} stroke={INK} strokeWidth={6} /><path d="M0 210Q100 160 200 210V280H0Z" fill={TEAL} /></>,
    <><rect x={60} y={110} width={80} height={90} rx={30} fill={CORAL} stroke={INK} strokeWidth={6} /><circle cx={100} cy={88} r={34} fill="#ffe9d2" stroke={INK} strokeWidth={6} /></>,
    <><path d="M40 80V160M40 80L90 70V150" stroke={INK} strokeWidth={8} fill="none" /><circle cx={30} cy={160} r={14} fill={INK} /><circle cx={80} cy={150} r={14} fill={INK} /><circle cx={140} cy={150} r={36} fill="#ffe9d2" stroke={INK} strokeWidth={6} /></>,
    <path d="M100 60L118 108L168 108L128 138L142 188L100 158L58 188L72 138L32 108L82 108Z" fill={YELLOW} stroke={INK} strokeWidth={6} />,
  ];
  const caps = ['утро', 'робот', 'музыка', 'финал'];
  return <AbsoluteFill style={{ background: CREAM }}>
    <Deco t={t} tint="#e6dccd" seed={2} />
    <StepNum t={t} at={st} n="01" color={INK} fill={CORAL} />
    <Abs x={470} y={270} style={{ fontFamily: FONT, fontWeight: 900, color: INK, letterSpacing: -3 }}>
      <Mask t={t} at={st + .1}><div style={{ fontSize: 96, lineHeight: 1.1 }}>ИДЕЯ</div></Mask>
      <Mask t={t} at={C.s2script - .1}><div style={{ fontSize: 76, lineHeight: 1.15, color: CORAL }}>→ СЦЕНАРИЙ</div></Mask>
    </Abs>
    {/* user bubble: typing then sent */}
    <Abs x={120} y={sent ? lerp(760, 640, ks) : 760} w={840} style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ background: INK, color: CREAM, fontFamily: FONT, fontWeight: 800, fontSize: 46, padding: '28px 38px', borderRadius: '44px 44px 10px 44px', maxWidth: 760, transform: `scale(${t < C.s2type ? 0 : sent ? 1 + .06 * decay(t, C.s2send, 7) : back(pr(t, C.s2type, .3))})`, transformOrigin: 'right bottom' }}>
        {sent ? msg : msg.slice(0, Math.round(msg.length * kt))}{!sent && Math.sin(t * 14) > 0 ? '▍' : ''}
      </div>
    </Abs>
    {/* Claude reply */}
    <Pop t={t} at={C.s2script} style={{ left: 120, top: 880, transformOrigin: 'left top' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ width: 82, height: 82, borderRadius: 22, background: CORAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={50} height={50} viewBox="-22 -22 44 44"><g stroke="#fff" strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 60})`}><line x1={0} y1={-18} x2={0} y2={18} /><line x1={-18} y1={0} x2={18} y2={0} /><line x1={-13} y1={-13} x2={13} y2={13} /><line x1={-13} y1={13} x2={13} y2={-13} /></g></svg></div>
        <div style={{ background: '#fff', border: `5px solid ${INK}`, color: INK, fontFamily: FONT, fontWeight: 900, fontSize: 44, padding: '20px 32px', borderRadius: '10px 40px 40px 40px' }}>сценарий ✓ <span style={{ color: CORAL, opacity: clamp((t - C.s2board) / .15) }}>раскадровка ✓</span></div>
      </div>
    </Pop>
    {minis.map((m, i) => {
      const a = C.s2board + .08 + i * .09, k = pr(t, a, .55); if (t < a) return null;
      const x = 70 + i * 240, rot = (i - 1.5) * 5;
      return <div key={i} style={{ position: 'absolute', left: x, top: 1070 + Math.abs(i - 1.5) * 26, width: 210, height: 300, borderRadius: 26, background: '#fff', border: `5px solid ${INK}`, boxSizing: 'border-box', overflow: 'hidden',
        transform: `translate(${(240 - x) * (1 - eo(k))}px, ${(1 - eo(k)) * -170}px) rotate(${rot * eo(k) + Math.sin(t * 2.4 + i) * 1.6}deg) scale(${lerp(.2, 1, back(k))})`, boxShadow: `8px 8px 0 ${INK}` }}>
        <div style={{ position: 'absolute', left: 12, top: 12, width: 46, height: 46, borderRadius: 23, background: INK, color: YELLOW, fontFamily: FONT, fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
        <svg width={200} height={290}>{m}</svg>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 26, color: INK }}>{caps[i]}</div>
      </div>;
    })}
  </AbsoluteFill>;
};

const S3: React.FC<{ t: number; st: number }> = ({ t, st }) => {
  const asm = eo(pr(t, C.s3asm, .5));
  // hover layout (svg units) before assembly; [dx, dy, rot, scale]
  const appear = (at: number) => back(pr(t, at, .4)) * (t >= at ? 1 : 0);
  const H = (dx: number, dy: number, r: number, at: number): [number, number, number, number] => [dx * (1 - asm), dy * (1 - asm), r * (1 - asm), Math.max(.0001, appear(at))];
  const offs = { body: H(0, 120, 0, C.s3body), head: H(-160, -40, -20, C.s3circle), eyes: H(240, 150, 12, C.s3oval), mouth: H(240, 200, 12, C.s3oval), armL: H(-40, 250, -30, C.s3line), armR: H(20, 240, 40, C.s3line), legs: H(60, 190, 0, C.s3line) };
  const lbl = (txt: string, at: number, x: number, y: number, bg: string, rot: number) => t < C.s3asm + .1 ? <Pop t={t} at={at + .05} rot={rot * 3} style={{ left: x, top: y }}><div style={{ background: bg, color: bg === CREAM ? INK : CREAM, fontFamily: MONO, fontWeight: 800, fontSize: 40, padding: '12px 26px', borderRadius: 40, transform: `rotate(${rot}deg)`, opacity: 1 - pr(t, C.s3asm - .1, .2) }}>{txt}</div></Pop> : null;
  return <AbsoluteFill style={{ background: TEAL }}>
    <Deco t={t} tint="#3cc4b3" seed={3} />
    <StepNum t={t} at={st} n="02" color={CREAM} fill={INK} />
    <Abs x={470} y={270} style={{ fontFamily: FONT, fontWeight: 900, color: CREAM, letterSpacing: -3 }}>
      <Mask t={t} at={st + .1}><div style={{ fontSize: 96, lineHeight: 1.1 }}>ФИГУРЫ</div></Mask>
      <Mask t={t} at={C.s3live - .05}><div style={{ fontSize: 76, lineHeight: 1.15, color: INK }}>→ ПЕРСОНАЖ</div></Mask>
    </Abs>
    {lbl('circle()', C.s3circle, 90, 640, CREAM, -5)}
    {lbl('ellipse()', C.s3oval, 640, 1010, INK, 4)}
    {lbl('line()', C.s3line, 90, 1260, INK, -3)}
    <Ring t={t} at={C.s3live} x={540} y={1060} color={YELLOW} r={380} />
    <Burst t={t} at={C.s3live} x={540} y={1060} color={CREAM} r0={300} r1={470} n={16} />
    <Abs x={290} y={720} w={500} h={640} style={{ transform: `scale(${1 + .07 * decay(t, C.s3live, 5)})` }}>
      <Kodik t={t} offs={offs} wave={t > C.s3live} jump={C.s3live} />
    </Abs>
  </AbsoluteFill>;
};

const S4: React.FC<{ t: number; st: number }> = ({ t, st }) => {
  const talking = TL.tok.some((x) => x.si === 3 && t >= x.s && t < x.e);
  const words = ['каждое', 'слово', 'в', 'такт'];
  const wi = t < C.s4subs + .1 ? -1 : Math.floor((t - C.s4subs - .1) / .16) % 4;
  const kSub = eo(pr(t, C.s4subs - .1, .35));
  return <AbsoluteFill style={{ background: YELLOW }}>
    <Deco t={t} tint="#f5b72a" seed={4} />
    <StepNum t={t} at={st} n="03" color={INK} fill={CREAM} />
    <Abs x={470} y={270} style={{ fontFamily: FONT, fontWeight: 900, color: INK, letterSpacing: -3 }}>
      <Mask t={t} at={st + .1}><div style={{ fontSize: 96, lineHeight: 1.1 }}>ГОЛОС</div></Mask>
      <Mask t={t} at={C.s4sfx - .05}><div style={{ fontSize: 76, lineHeight: 1.15, color: CORAL }}>+ ЗВУК + ТЕКСТ</div></Mask>
    </Abs>
    {/* waveform */}
    <Abs x={60} y={640} w={960} h={260}>
      {Array.from({ length: 32 }, (_, i) => {
        const k = eo(pr(t, C.s4voice - .1 + Math.abs(i - 15.5) * .015, .3));
        const a = Math.abs(noise(t * 3.2, 2.1 + i * .63, i * 1.7)), h = (20 + 220 * a * (talking ? 1 : .2)) * k;
        return <div key={i} style={{ position: 'absolute', left: i * 30, top: 130 - h / 2, width: 20, height: h, borderRadius: 10, background: i % 4 === 0 ? CORAL : INK }} />;
      })}
    </Abs>
    {/* sound chips */}
    {[['whoosh', 120, CREAM], ['pop', 430, INK], ['ding', 700, CORAL]].map(([n, x, bg], i) => (
      <React.Fragment key={i}>
        <Ring t={t} at={C.s4sfx + i * .16} x={(x as number) + 120} y={990} color={INK} r={150} />
        <Pop t={t} at={C.s4sfx + i * .16} rot={-20} style={{ left: x as number, top: 945 }}>
          <div style={{ background: bg as string, color: bg === INK || bg === CORAL ? CREAM : INK, border: `5px solid ${INK}`, fontFamily: MONO, fontWeight: 800, fontSize: 40, padding: '14px 30px', borderRadius: 50, transform: `rotate(${(i - 1) * 4}deg) translateY(${Math.sin(t * 5 + i) * 6}px)` }}>♪ {n}</div>
        </Pop>
      </React.Fragment>))}
    {/* subtitle demo with sliding marker */}
    <Abs x={0} y={1110} w={1080} style={{ textAlign: 'center', opacity: clamp(kSub * 2), transform: `translateY(${(1 - kSub) * 60}px)` }}>
      <div style={{ display: 'inline-flex', gap: 18, background: INK, padding: '22px 34px', borderRadius: 30, fontFamily: FONT, fontWeight: 900, fontSize: 64 }}>
        {words.map((w, i) => <span key={i} style={{ color: i === wi ? INK : CREAM, background: i === wi ? YELLOW : 'transparent', padding: '0 12px', borderRadius: 12, transform: `scale(${i === wi ? 1.08 : 1})`, display: 'inline-block' }}>{w}</span>)}
      </div>
    </Abs>
    <Abs x={0} y={1270} w={1080} style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: -3, color: INK }}>
      <Slam t={t} at={C.s4claude}>ТОЖЕ</Slam> <Slam t={t} at={C.s4claude + .2} style={{ color: CORAL }}>CLAUDE</Slam>
    </Abs>
  </AbsoluteFill>;
};

const S5: React.FC<{ t: number; st: number }> = ({ t, st }) => {
  const cmd = 'npx remotion render';
  const kc = pr(t, C.s5cmd, Math.max(.3, C.s5go - .1 - C.s5cmd));
  const p = eio(pr(t, C.s5go, Math.max(.5, C.s5done - C.s5go))), done = t >= C.s5done, kd = pr(t, C.s5done, .5);
  const R = 200, L = 2 * Math.PI * R;
  const shake = decay(t, C.s5zero, 7) * Math.sin(t * 70) * 14;
  return <AbsoluteFill style={{ background: INK, transform: `translateX(${shake}px)` }}>
    <Deco t={t} tint="#2a2622" seed={5} />
    <StepNum t={t} at={st} n="04" color={CREAM} fill={CORAL} />
    <Abs x={470} y={270} style={{ fontFamily: FONT, fontWeight: 900, color: CREAM, letterSpacing: -3 }}>
      <Mask t={t} at={st + .1}><div style={{ fontSize: 96, lineHeight: 1.1 }}>РЕНДЕР</div></Mask>
      <Mask t={t} at={C.s5done - .05}><div style={{ fontSize: 76, lineHeight: 1.15, color: YELLOW }}>→ ВИДЕО</div></Mask>
    </Abs>
    <Abs x={0} y={600} w={1080} style={{ textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 50, color: CREAM }}>
      <span style={{ color: TEAL }}>$ </span>{cmd.slice(0, Math.round(cmd.length * kc))}<span style={{ opacity: t < C.s5go && Math.sin(t * 14) > 0 ? 1 : 0 }}>▍</span>
    </Abs>
    {/* progress ring → file */}
    <Abs x={540 - 260} y={700} w={520} h={520} style={{ opacity: 1 - kd, transform: `scale(${1 + .5 * eo(kd)})` }}>
      <svg width={520} height={520} viewBox="-260 -260 520 520">
        <circle r={R} fill="none" stroke="#2f2a26" strokeWidth={34} />
        <circle r={R} fill="none" stroke={YELLOW} strokeWidth={34} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} transform="rotate(-90)" />
        {Array.from({ length: 24 }, (_, i) => <line key={i} x1={0} y1={-R - 50} x2={0} y2={-R - 66} stroke={i / 24 <= p ? YELLOW : '#3a342f'} strokeWidth={8} strokeLinecap="round" transform={`rotate(${i * 15 + t * 10})`} />)}
        <text y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={120} fill={CREAM}>{Math.round(p * 100)}%</text>
      </svg>
    </Abs>
    <Burst t={t} at={C.s5done} x={540} y={960} color={YELLOW} r0={230} r1={430} n={18} />
    {done && <Pop t={t} at={C.s5done} style={{ left: 260, top: 760 }}>
      <div style={{ width: 560, height: 400, background: CREAM, borderRadius: 40, display: 'flex', alignItems: 'center', gap: 28, padding: '0 34px', boxSizing: 'border-box', boxShadow: `14px 14px 0 ${CORAL}` }}>
        <div style={{ width: 200, height: 300, borderRadius: 24, background: INK, position: 'relative', overflow: 'hidden', flex: 'none' }}>
          <div style={{ position: 'absolute', left: 10, top: 30, width: 180, height: 230 }}><Kodik t={t} wave /></div>
          <div style={{ position: 'absolute', left: 64, top: 112, width: 72, height: 72, borderRadius: 36, background: 'rgba(244,237,227,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, color: INK }}>▶</div>
        </div>
        <div style={{ fontFamily: FONT, color: INK }}><div style={{ fontWeight: 900, fontSize: 44 }}>мультик.mp4</div><div style={{ fontWeight: 800, fontSize: 30, color: TEAL, marginTop: 8 }}>✓ готово</div><div style={{ fontWeight: 800, fontSize: 28, color: GREY }}>1080×1920</div></div>
      </div></Pop>}
    <Abs x={80} y={1250} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#b9b0a5', opacity: eo(pr(t, C.s5ae - .1, .3)), transform: `translateX(${(1 - eo(pr(t, C.s5ae - .1, .3))) * -80}px)` }}>
      After Effects
      <div style={{ position: 'absolute', left: -10, right: -10, top: '50%', height: 12, borderRadius: 6, background: CORAL, transformOrigin: 'left', transform: `scaleX(${eo(pr(t, C.s5ae + .25, .25))}) rotate(-4deg)` }} />
    </Abs>
    {t >= C.s5zero && <Abs x={660} y={1200} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 130, color: INK, background: YELLOW, borderRadius: 30, padding: '0 34px', lineHeight: 1.2, transform: `rotate(-8deg) scale(${lerp(2.6, 1, eo(pr(t, C.s5zero, .22)))})` }}>0 ₽</Abs>}
  </AbsoluteFill>;
};

const S6: React.FC<{ t: number; st: number }> = ({ t, st }) => {
  const kc = eo(pr(t, C.s6tg + .05, .5)), mk = eo(pr(t, C.s6link, .35)), pul = .5 + .5 * Math.sin(t * 7);
  const ka = pr(t, C.s6head, .45);
  return <AbsoluteFill style={{ background: CREAM }}>
    <Deco t={t} tint="#e6dccd" seed={6} />
    <Abs x={0} y={250} w={1080} style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 900, letterSpacing: -6, color: INK, lineHeight: .95 }}>
      <div style={{ fontSize: 150 }}><Slam t={t} at={C.s6all}>ВСЕ</Slam></div>
      <div style={{ fontSize: 176, color: CORAL }}><Slam t={t} at={C.s6prompts}>ПРОМПТЫ</Slam></div>
    </Abs>
    <Abs x={0} y={600} w={1080}><Mask t={t} at={C.s6tg - .05}><div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 58, color: INK }}>в моём телеграм-канале ✈️</div></Mask></Abs>
    <Abs x={80} y={740} w={920} h={470} style={{ background: '#fff', border: `6px solid ${INK}`, borderRadius: 44, boxShadow: `16px 16px 0 ${INK}`, boxSizing: 'border-box', opacity: clamp(kc * 2), transform: `translateY(${(1 - kc) * 300}px) rotate(${(1 - kc) * 6}deg)` }}>
      <div style={{ position: 'absolute', left: 40, top: 40, display: 'flex', alignItems: 'center', gap: 30 }}>
        <img src={staticFile('avatar.jpg')} style={{ width: 160, height: 160, borderRadius: 80, objectFit: 'cover', boxShadow: `0 0 0 7px ${CORAL}` }} />
        <div style={{ fontFamily: FONT }}><div style={{ fontWeight: 900, fontSize: 58, letterSpacing: -1, color: INK }}>@claudecode09</div>
          <div style={{ fontWeight: 800, fontSize: 30, color: GREY, marginTop: 6 }}>видео в Claude · промпты · разборы</div></div>
      </div>
      <div style={{ position: 'absolute', left: 40, top: 244, width: 560, height: 16, borderRadius: 8, background: '#ece4d8' }} />
      <div style={{ position: 'absolute', left: 40, top: 300, padding: '14px 24px', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#2a7fbf' }}>
        <div style={{ position: 'absolute', inset: 0, background: YELLOW, borderRadius: 18, transformOrigin: 'left', transform: `scaleX(${mk})`, opacity: .55 + .45 * pul * clamp(mk) }} />
        <span style={{ position: 'relative' }}>🔗 Telegram · @claudecode09</span>
      </div>
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 34, height: 0 }} />
    </Abs>
    {t >= C.s6head && <Abs x={640} y={1150} style={{ textAlign: 'center' }}>
      <svg width={230} height={170} viewBox="0 0 230 170" style={{ display: 'block', overflow: 'visible' }}>
        <path d="M160 165 C190 90 130 40 40 30" stroke={CORAL} strokeWidth={14} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - eo(ka)} />
        <path d="M70 2 L38 30 L74 56" stroke={CORAL} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={clamp((ka - .6) * 4)} />
      </svg>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 48, color: CORAL, lineHeight: 1, transform: `rotate(-4deg) scale(${back(pr(t, C.s6head + .2, .35))})` }}>ссылка<br />в шапке!</div>
    </Abs>}
  </AbsoluteFill>;
};

// ---------- transitions (mask reveals, completing exactly on the beat of each cut)
const TR_DUR = .42;
const clipFor = (i: number, k: number) => {
  const e = eio(k);
  switch (i % 4) {
    case 1: return `circle(${e * 160}% at 50% 62%)`;
    case 2: { const x = lerp(-60, 160, e); return `polygon(0 0, ${x}% 0, ${x - 40}% 100%, 0 100%)`; }
    case 3: return `circle(${e * 160}% at 50% 100%)`;
    default: { const y = lerp(100, -10, e); return `polygon(0 ${y}%, 100% ${y + 10}%, 100% 100%, 0 100%)`; }
  }
};

const Captions: React.FC<{ t: number; dark: boolean }> = ({ t, dark }) => {
  const ch = CH.find((c) => t >= c.s && t < c.e);
  if (!ch || t > VO_END + .5) return null;
  const k = pr(t, ch.s, .18);
  return <div style={{ position: 'absolute', left: 40, right: 40, top: 1500, textAlign: 'center', transform: `translateY(${(1 - eo(k)) * 30}px) scale(${.92 + .08 * back(k)})`, opacity: clamp(k * 4) }}>
    <div style={{ display: 'inline-block', background: dark ? CREAM : INK, borderRadius: 28, padding: '14px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 68, letterSpacing: -1, lineHeight: 1.15, boxShadow: '0 10px 30px rgba(0,0,0,.18)' }}>
      {ch.map((tk, i) => { const on = t >= tk.s - .03 && (i === ch.length - 1 || t < ch[i + 1].s - .03);
        return <span key={i} style={{ display: 'inline-block', margin: '0 8px', color: on ? (dark ? CORAL : YELLOW) : dark ? INK : CREAM, transform: `scale(${on ? 1.06 : 1})` }}>{tk.w.replace(/[«»]/g, '')}</span>; })}
    </div>
  </div>;
};

export const Main: React.FC = () => {
  const frame = useCurrentFrame(), t = frame / FPS;
  const Comps = [S1, S2, S3, S4, S5, S6] as React.FC<any>[];
  const idx = Math.max(0, SC.findIndex((s) => t >= s.start - TR_DUR && t < s.end - TR_DUR));
  const cur = SC[idx];
  const visible = [idx - 1, idx].filter((i) => i >= 0 && t >= SC[i].start - TR_DUR - .001 && t < (SC[i + 1]?.start ?? 1e9));
  const punch = [C.s1code, C.s2board, C.s3live, C.s4claude, C.s5done, C.s5zero, C.s6prompts].reduce((a, p) => a + .035 * decay(t, p, 6), 0);
  const cam = `translate(${noise(t, .3) * 8}px, ${noise(t, .25, 2) * 8}px) rotate(${noise(t, .2, 4) * .4}deg) scale(${1.01 + punch + .006 * noise(t, .4)})`;
  const dark = ['s1', 's5'].includes(SC.find((s) => t >= s.start && t < s.end)?.id ?? 's1');
  const fade = clamp((t - (DUR - .4)) / .4);
  return <AbsoluteFill style={{ background: INK, overflow: 'hidden' }}>
    {visible.map((i) => {
      const C2 = Comps[i], s = SC[i];
      const entering = i > 0 && t < s.start;
      const k = clamp((t - (s.start - TR_DUR)) / TR_DUR);
      const leaving = SC[i + 1] && t >= SC[i + 1].start - TR_DUR;
      const lk = leaving ? clamp((t - (SC[i + 1].start - TR_DUR)) / TR_DUR) : 0;
      return <AbsoluteFill key={i} style={{ clipPath: entering ? clipFor(i, k) : undefined, transform: `${cam} scale(${1 + .08 * ei(lk)})` }}>
        <C2 t={t} st={s.start} />
      </AbsoluteFill>;
    })}
    <Captions t={t} dark={dark} />
    <AbsoluteFill style={{ background: INK, opacity: fade }} />
    {META.voice && <Audio src={staticFile('voice.mp3')} startFrom={0} />}
    <Audio src={staticFile('music.wav')} volume={META.voice ? .32 : .5} />
    <Audio src={staticFile('sfx.wav')} volume={.38} />
  </AbsoluteFill>;
};
