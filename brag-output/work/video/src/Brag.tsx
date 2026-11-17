import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from 'remotion';
import './site.css';
import { SUBJECTS } from './data.js';
import TL from './timeline.json';
import QR from './qr.json';
import { LogoMark } from './Logo';
import { BOARD, Header, HomeScreen, QuizScreen, RegScreen, ResultScreen, SubjectCard, quizScroll, STUDENT } from './Screens';
import { C, DISPLAY, TEXT, exitStyle, pop, prog, rand, rise } from './util';

const S = TL.scenes as Record<string, [number, number]>;

/* ---------------- background ---------------- */
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const a = f / 240;
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 1500, height: 1500, left: 900 + 120 * Math.sin(a), top: -700 + 80 * Math.cos(a), borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,214,245,.16), rgba(56,214,245,0) 60%)' }} />
      <div style={{ position: 'absolute', width: 1400, height: 1400, left: -600 + 90 * Math.cos(a * 0.8), top: 300 + 60 * Math.sin(a * 0.8), borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,200,69,.09), rgba(255,200,69,0) 60%)' }} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 70 }, (_, i) => {
          const x = rand(i) * 1920, y = rand(i + 99) * 1080, r = 1 + rand(i + 7) * 2;
          const tw = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(f / 20 + i));
          return <circle key={i} cx={x} cy={(y - f * (0.1 + rand(i + 3) * 0.2) + 1080) % 1080} r={r} fill={i % 5 === 0 ? C.sun : C.light} opacity={tw * 0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- 1. hook ---------------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const [w1, w2, w3] = TL.hookWords;
  const big = { fontFamily: DISPLAY, fontWeight: 900, fontSize: 128, letterSpacing: -3, lineHeight: 1.05, color: C.light, margin: 0 } as const;
  const strike = prog(f, w2 + 4, 14);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', ...exitStyle(f, S.hook[1]) }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', gap: 34, alignItems: 'baseline' }}>
          <p style={{ ...big, ...rise(f, w1, 16, 60), color: C.bad, position: 'relative' }}>
            Қате жауап
            <span style={{ position: 'absolute', left: -10, right: -10, top: '55%', height: 12, borderRadius: 6, background: C.light, transformOrigin: 'left', transform: `scaleX(${strike})`, opacity: 0.85 }} />
          </p>
          <p style={{ ...big, ...rise(f, w2, 16, 60) }}>— соңы емес.</p>
        </div>
        <p style={{ ...big, fontSize: 112, ...rise(f, w3, 18, 60) }}>
          Бұл — келесі <span style={{ color: C.sun }}>қадам</span>.
        </p>
      </div>
      <div style={{ position: 'absolute', left: 1470, top: 300, transform: `scale(${pop(f, w3 + 10, 18)}) rotate(${(f - w3) * 0.6}deg)` }}>
        <svg width={120} height={120} viewBox="-70 -70 140 140"><circle r={66} fill="#FFC845" opacity={0.25} /><path d="M0 -60 C 6 -20 15 -11 56 -5 C 15 1 6 10 0 50 C -6 10 -15 1 -56 -5 C -15 -11 -6 -20 0 -60 Z" fill="#FFF4D1" /></svg>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 2. logo reveal ---------------- */
const LogoReveal: React.FC = () => {
  const f = useCurrentFrame();
  const t = f - S.logo[0];
  const word = prog(f, 300, 20);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', ...exitStyle(f, S.logo[1]) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div style={{ transform: `translateX(${interpolate(word, [0, 1], [260, 0])}px)` }}>
          <LogoMark t={t} size={520} id="lg" steps={[TL.logoSteps[0] - S.logo[0], TL.logoSteps[1] - S.logo[0], TL.logoSteps[2] - S.logo[0]]} star={TL.logoStar - S.logo[0]} ringDur={42} />
        </div>
        <div style={{ opacity: word, transform: `translateX(${(1 - word) * 60}px)`, filter: `blur(${(1 - word) * 10}px)`, width: word > 0 ? 760 : 0, overflow: 'visible' }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 132, lineHeight: 0.95, letterSpacing: -4, color: C.light, margin: 0 }}>BILIM<br /><span style={{ color: C.sun }}>QADAM</span></p>
          <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, letterSpacing: 9, color: C.cyan, margin: '26px 0 0', ...rise(f, 318, 16) }}>КҮН САЙЫН БІР ҚАДАМ</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 3. what it is ---------------- */
const What: React.FC = () => {
  const f = useCurrentFrame();
  const chips = ['1–2 тоқсан тақырыптары', '40 сұрақ', 'Телефоннан ашылады'];
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 56, display: 'flex', flexDirection: 'column', ...exitStyle(f, S.what[1]) }}>
      <div style={{ textAlign: 'center', ...rise(f, S.what[0] + 4, 18) }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: C.cyan, margin: 0 }}>9-СЫНЫПҚА АРНАЛҒАН</p>
        <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, letterSpacing: -2, color: C.light, margin: '14px 0 0' }}>Тест <span style={{ color: C.sun }}>платформасы</span></p>
      </div>
      <div className="site" style={{ display: 'flex', gap: 34 }}>
        {SUBJECTS.map((s: any, i: number) => {
          const p = pop(f, TL.whatCards[i], 16);
          return (
            <div key={s.id} style={{ width: 380, transform: `translateY(${(1 - p) * 80}px) scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 1.4) }}>
              <div style={{ zoom: 1.78 } as any}><SubjectCard s={s} /></div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 22 }}>
        {chips.map((c, i) => {
          const p = pop(f, TL.whatChips[i], 14);
          return <div key={c} style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 32, color: C.light, background: C.card, border: `2px solid ${C.line}`, borderRadius: 999, padding: '14px 30px', transform: `scale(${p})`, opacity: Math.min(1, p * 1.5) }}>{c}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- captions beside the phone ---------------- */
const Caption: React.FC<{ start: number; end: number; label: string; title: React.ReactNode; sub: string; bullets?: { text: string; at: number }[] }> = ({ start, end, label, title, sub, bullets }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: 140, top: 0, bottom: 0, width: 820, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, ...exitStyle(f, end) }}>
      <p style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, letterSpacing: 6, color: C.cyan, margin: 0, ...rise(f, start + 4, 16) }}>{label}</p>
      <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 104, letterSpacing: -3, lineHeight: 1.02, color: C.light, margin: 0, ...rise(f, start + 8, 18, 50) }}>{title}</p>
      <p style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 40, lineHeight: 1.4, color: C.soft, margin: 0, maxWidth: 780, ...rise(f, start + 14, 18) }}>{sub}</p>
      {bullets && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 6 }}>
          {bullets.map((b, i) => {
            const on = prog(f, b.at, 12);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, ...rise(f, start + 20 + i * 6, 16), opacity: Math.min(prog(f, start + 20 + i * 6, 16), 0.45 + 0.55 * on) }}>
                <span style={{ width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 24, color: C.ink, background: on > 0 ? `linear-gradient(135deg, ${C.cyan}, ${C.sun})` : C.card, transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, on) * Math.PI)})` }}>{i + 1}</span>
                <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 36, color: on > 0 ? C.light : C.mute }}>{b.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------------- phone ---------------- */
const PHONE_X = 1160, PHONE_Y = 81, SCREEN_W = 400, SCREEN_H = 880;
const TAPS: { at: number; x: number; y: number; from?: [number, number] }[] = [
  { at: TL.tapStart, x: 200, y: 611 },
  { at: TL.tapSubject, x: 290, y: 320 },
  { at: TL.tapWrong, x: 200, y: 357 },
  { at: TL.tapAi, x: 210, y: 549 },
  { at: TL.tapReveal, x: 100, y: 344 },
];

function screenFade(f: number, b: number) {
  // old content fades out over [b-8,b], new fades in over [b,b+10]
  return { out: 1 - prog(f, b - 8, 8), in: prog(f, b, 10) };
}

const Phone: React.FC = () => {
  const f = useCurrentFrame();
  const enter = prog(f, S.reg[0], 26);
  const leave = prog(f, S.result[1] - 14, 14);
  const bounds = [S.home[0], S.quiz[0], S.result[0]];
  let screen: React.ReactNode, op = 1, scroll = 0, chips = true, xp = 80, streak = 2;
  if (f < bounds[0]) { screen = <RegScreen f={f} />; chips = false; op = screenFade(f, bounds[0]).out; }
  else if (f < bounds[1]) { screen = <HomeScreen f={f} />; op = Math.min(screenFade(f, bounds[0]).in, screenFade(f, bounds[1]).out); }
  else if (f < bounds[2]) { screen = <QuizScreen f={f} />; scroll = quizScroll(f); op = Math.min(screenFade(f, bounds[1]).in, screenFade(f, bounds[2]).out); xp = 80; }
  else { screen = <ResultScreen f={f} />; op = screenFade(f, bounds[2]).in; xp = Math.round(80 + 90 * prog(f, TL.resultXp, 30)); streak = 3; }

  // cursor
  let cur: React.ReactNode = null;
  for (let i = 0; i < TAPS.length; i++) {
    const tp = TAPS[i];
    const startMove = tp.at - 26;
    if (f >= startMove && f < tp.at + 16) {
      const prev = TAPS[i - 1];
      const fx = prev && prev.at > startMove - 60 ? prev.x : tp.x + 70, fy = prev && prev.at > startMove - 60 ? prev.y : tp.y + 160;
      const m = prog(f, startMove, 22);
      const x = fx + (tp.x - fx) * m, y = fy + (tp.y - fy) * m;
      const press = f >= tp.at && f < tp.at + 6 ? 0.8 : 1;
      const ring = prog(f, tp.at, 14);
      const vis = Math.min(prog(f, startMove, 6), 1 - prog(f, tp.at + 8, 8));
      cur = (
        <div style={{ position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, opacity: vis }}>
          {f >= tp.at && <div style={{ position: 'absolute', inset: -30 * ring, borderRadius: '50%', border: `3px solid rgba(255,255,255,${0.7 * (1 - ring)})` }} />}
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.55)', border: '2px solid rgba(255,255,255,.9)', boxShadow: '0 4px 18px rgba(0,0,0,.35)', transform: `scale(${press})` }} />
        </div>
      );
    }
  }

  const tilt = interpolate(enter, [0, 1], [10, 0]);
  return (
    <div style={{
      position: 'absolute', left: PHONE_X, top: PHONE_Y, width: SCREEN_W + 28, height: SCREEN_H + 28, borderRadius: 62, padding: 14,
      background: 'linear-gradient(145deg, #2B3780, #0D1336)', boxShadow: '0 40px 120px rgba(0,0,0,.55), 0 0 0 2px #3A4790, 0 0 80px rgba(56,214,245,.15)',
      transform: `translateX(${(1 - enter) * 700 + leave * 700}px) rotate(${tilt}deg) scale(1.1)`, transformOrigin: 'center center', opacity: Math.min(enter * 1.5, 1 - leave),
    }}>
      <div style={{ position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 48, overflow: 'hidden', background: C.ink,
        backgroundImage: 'radial-gradient(600px 340px at 110% -10%, rgba(56,214,245,.16), transparent 60%), radial-gradient(500px 340px at -20% 110%, rgba(255,200,69,.08), transparent 60%)' }}>
        <div className="site" style={{ position: 'absolute', inset: 0, padding: '18px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: TEXT, fontWeight: 600, fontSize: 13, color: C.light, padding: '0 10px 10px' }}><span>09:41</span><span>5G ▮▮▮</span></div>
          <div style={{ transform: `translateY(${-scroll}px)` }}>
            <Header chips={chips} xp={xp} streak={streak} />
            <div style={{ opacity: op }}>{screen}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: SCREEN_W / 2 - 60, top: 10, width: 120, height: 30, borderRadius: 20, background: '#000' }} />
        {cur}
      </div>
    </div>
  );
};

/* ---------------- confetti ---------------- */
const Confetti: React.FC = () => {
  const f = useCurrentFrame();
  const t = f - TL.resultXp;
  if (t < 0 || t > 110) return null;
  const cols = [C.cyan, C.sun, C.good, C.bad, C.light];
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 110 }, (_, i) => {
        const vx = (rand(i) - 0.5) * 26, vy = -rand(i + 50) * 26 - 8;
        const x = 1394 + vx * t, y = 330 + vy * t + 0.55 * t * t;
        const r = 7 + rand(i + 9) * 9;
        return <rect key={i} x={x} y={y} width={r} height={r / 2} fill={cols[i % cols.length]} opacity={1 - t / 110}
          transform={`rotate(${(rand(i + 4) - 0.5) * 20 * t} ${x + r / 2} ${y + r / 4})`} />;
      })}
    </svg>
  );
};

/* ---------------- rating ---------------- */
const Rank: React.FC = () => {
  const f = useCurrentFrame();
  const swap = prog(f, TL.rankSwap, 22);
  const meScore = Math.round(26 + 9 * prog(f, TL.rankSwap - 6, 22));
  const order = [{ ...BOARD[0] }, { ...BOARD[1] }, { ...BOARD[2], total: meScore }, BOARD[3], BOARD[4]];
  const fromIdx = [0, 1, 2, 3, 4], toIdx = [1, 2, 0, 3, 4];
  const ROW = 104;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', ...exitStyle(f, S.rank[1]) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 110 }}>
        <div style={{ width: 640 }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, letterSpacing: 6, color: C.cyan, margin: 0, ...rise(f, S.rank[0] + 2, 14) }}>ТІКЕЛЕЙ ЭФИРДЕ</p>
          <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 104, letterSpacing: -3, lineHeight: 1.02, color: C.light, margin: '22px 0 0', ...rise(f, S.rank[0] + 6, 16, 50) }}>Сынып<br /><span style={{ color: C.sun }}>рейтингі</span></p>
        </div>
        <div className="site" style={{ width: 680, ...rise(f, S.rank[0] + 10, 18) }}>
          <div className="panel" style={{ zoom: 1.5, padding: 18 } as any}>
            <div className="head-row"><h2>Сынып рейтингі</h2><span className="live">Тікелей · 24 оқушы</span></div>
            <div style={{ position: 'relative', height: ROW / 1.5 * 5 }}>
              {order.map((r: any, i) => {
                const y = (fromIdx[i] + (toIdx[i] - fromIdx[i]) * swap) * (ROW / 1.5);
                const pos = swap > 0.5 ? toIdx[i] : fromIdx[i];
                return (
                  <div key={r.name} className={`lb-row${r.me ? ' me' : ''} p${pos + 1}`} style={{ position: 'absolute', left: 0, right: 0, top: y, zIndex: r.me ? 2 : 1,
                    boxShadow: r.me && swap > 0 && swap < 1 ? '0 0 30px rgba(255,200,69,.45)' : undefined }}>
                    <div className="lb-pos">{pos + 1}</div><div className="lb-name">{r.name}<small>{r.cls}</small></div><div className="lb-score">{r.total}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- outro ---------------- */
const QrCode: React.FC<{ size: number }> = ({ size }) => {
  const n = QR.length, m = size / (n + 8);
  const finder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const hole = 9, c0 = (n - hole) / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} rx={size * 0.06} fill="#F7F8FD" />
      {QR.flatMap((row: number[], r: number) => row.map((v, c) => {
        if (!v || finder(r, c) || (r >= c0 && r < c0 + hole && c >= c0 && c < c0 + hole)) return null;
        return <rect key={`${r}-${c}`} x={(c + 4) * m + m * 0.03} y={(r + 4) * m + m * 0.03} width={m * 0.94} height={m * 0.94} rx={m * 0.22} fill="#0A0F2C" />;
      }))}
      {[[0, 0], [0, n - 7], [n - 7, 0]].map(([r, c]) => (
        <g key={`${r}${c}`}>
          <rect x={(c + 4.5) * m} y={(r + 4.5) * m} width={6 * m} height={6 * m} rx={1.8 * m} fill="none" stroke="#0A0F2C" strokeWidth={m} />
          <rect x={(c + 6) * m} y={(r + 6) * m} width={3 * m} height={3 * m} rx={0.9 * m} fill="#1C6F9A" />
        </g>
      ))}
      <g transform={`translate(${(c0 + 4 + 0.6) * m} ${(c0 + 4 + 0.6) * m})`}>
        <rect width={(hole - 1.2) * m} height={(hole - 1.2) * m} rx={(hole - 1.2) * m * 0.22} fill="#0A0F2C" />
        <g transform={`scale(${(hole - 1.2) * m / 1024})`}><LogoMark t={0} size={1024} id="qrlogo" still /></g>
      </g>
    </svg>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const s0 = S.outro[0];
  const qrP = pop(f, s0 + 15, 18);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 120, marginTop: -60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, width: 820 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26, ...rise(f, s0 + 2, 16) }}>
            <LogoMark t={f - s0} size={170} id="out" steps={[4, 8, 12]} star={18} ringDur={16} />
            <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 92, lineHeight: 0.95, letterSpacing: -3, color: C.light, margin: 0 }}>BILIM<br /><span style={{ color: C.sun }}>QADAM</span></p>
          </div>
          <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, lineHeight: 1.08, letterSpacing: -1.5, color: C.light, margin: 0, ...rise(f, s0 + 10, 16) }}>Сканерле де, бірінші <span style={{ color: C.sun }}>қадамыңды</span> жаса!</p>
          <p style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 36, color: C.cyan, margin: 0, ...rise(f, s0 + 16, 16) }}>bilim-qadam-xcnr.onrender.com</p>
        </div>
        <div style={{ padding: 10, borderRadius: 44, background: `linear-gradient(135deg, ${C.cyan}, #8B7CFF, ${C.sun})`, transform: `scale(${qrP}) rotate(${(1 - qrP) * -8}deg)`, opacity: Math.min(1, qrP * 1.5) }}>
          <QrCode size={440} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontFamily: TEXT, fontSize: 28, lineHeight: 1.5, color: C.soft, ...rise(f, s0 + 22, 16) }}>
        <b style={{ color: C.light }}>Авторлары:</b> Амандыков Аманбек, Ғаллем Жұлдыз, Муратова Айлина, Бейбіт Қалдыбай<br />
        <b style={{ color: C.light }}>Жетекшісі:</b> Альмурзина Айымгуль Айбатыровна
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- composition ---------------- */
/** Shows children while the global frame is inside [from, to); frames are NOT re-based. */
const Range: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const f = useCurrentFrame();
  return f >= from && f < to ? <>{children}</> : null;
};
const seq = (k: string) => ({ from: S[k][0], to: S[k][1] });

export const Brag: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Background />
    <Range {...seq('hook')}><Hook /></Range>
    <Range {...seq('logo')}><LogoReveal /></Range>
    <Range {...seq('what')}><What /></Range>

    <Range {...seq('reg')}>
      <Caption start={S.reg[0]} end={S.reg[1]} label="1-ҚАДАМ" title="Тіркелу" sub="Атыңды жаз — болды. Құпиясөз де, пошта да керек емес." />
    </Range>
    <Range {...seq('home')}>
      <Caption start={S.home[0]} end={S.home[1]} label="2-ҚАДАМ" title={<>Пән <span style={{ color: C.sun }}>таңдау</span></>} sub="Төрт пән, әрқайсысында 1–2 тоқсан тақырыптары бойынша 10 сұрақ." />
    </Range>
    <Range {...seq('quiz')}>
      <Caption start={S.quiz[0]} end={S.quiz[1]} label="3-ҚАДАМ" title="Тапсырма" sub="Жауап бірден тексеріледі: дұрысы жасыл, қатесі қызыл болып жанады." />
    </Range>
    <Range {...seq('ai')}>
      <Caption start={S.ai[0]} end={S.ai[1]} label="AI-КӨМЕКШІ" title={<>Қатеңді <span style={{ color: C.cyan }}>түсіндіреді</span></>}
        sub="Әр сұраққа дайын, қадамдық түсіндірме:"
        bullets={[{ text: 'Шешімі қадам-қадаммен', at: TL.aiSteps[0] }, { text: 'Жиі кездесетін қате', at: TL.aiWarn }, { text: '«Өзіңді тексер» жаттығуы', at: TL.aiTry }]} />
    </Range>
    <Range {...seq('result')}>
      <Caption start={S.result[0]} end={S.result[1]} label="4-ҚАДАМ" title={<>Нәтиже</>} sub="Ұпай, XP және жетістік белгілері — тест біткен сәтте." />
    </Range>

    <Range from={S.reg[0]} to={S.result[1]}><Phone /></Range>
    <Confetti />
    <Range {...seq('rank')}><Rank /></Range>
    <Range {...seq('outro')}><Outro /></Range>
    <Audio src={staticFile('music.wav')} />
  </AbsoluteFill>
);
