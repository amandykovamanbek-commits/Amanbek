import React from 'react';
import { interpolate, staticFile } from 'remotion';
import { SUBJECTS } from './data.js';
import TL from './timeline.json';
import { C, pop, prog, rise, typed, typedChars } from './util';

const FLAME = <svg viewBox="0 0 24 24" fill="#FFC845"><path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-6 1-8.5z" /></svg>;
const BOLT = <svg viewBox="0 0 24 24" fill="#38D6F5"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>;
const ICON = {
  bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
  arrow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  steps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/></svg>',
};
const html = (s: string) => ({ __html: s });

export const STUDENT = 'Әлия Н.';
export const CLASS = '9 «Ә»';

export const Header: React.FC<{ chips?: boolean; xp?: number; streak?: number }> = ({ chips = true, xp = 0, streak = 0 }) => (
  <header className="top">
    <div className="brand"><img src={staticFile('icon-192.png')} alt="" width={30} height={30} /><span className="bt">BILIM <span>QADAM</span></span></div>
    {chips && (
      <div className="chips">
        <span className="chip">{FLAME}<b>{streak}</b> күн</span>
        <span className="chip">{BOLT}<b>{xp}</b> XP</span>
      </div>
    )}
  </header>
);

/* ---------- 1. Registration ---------- */
export const RegScreen: React.FC<{ f: number }> = ({ f }) => {
  const name = typedChars(STUDENT, f, TL.typeName[0], TL.typeName[1]);
  const cls = typedChars(CLASS, f, TL.typeClass[0], TL.typeClass[1]);
  const caret = Math.floor(f / 8) % 2 === 0;
  const nameActive = f >= TL.typeName[0] - 10 && f < TL.typeClass[0];
  const clsActive = f >= TL.typeClass[0] && f < TL.tapStart;
  const pressed = f >= TL.tapStart && f < TL.tapStart + 6;
  return (
    <div className="screen">
      <div className="hero" style={{ ...rise(f, 612) }}>
        <svg className="orbit" viewBox="0 0 240 240" aria-hidden="true">
          <g style={{ transformOrigin: '120px 120px', transform: `rotate(${f * 1.2}deg)` }}><circle cx="120" cy="120" r="110" fill="none" stroke="#38D6F5" strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 12" /><circle cx="120" cy="10" r="7" fill="#38D6F5" /></g>
          <g style={{ transformOrigin: '120px 120px', transform: `rotate(${-f * 2}deg)` }}><circle cx="120" cy="120" r="78" fill="none" stroke="#FFC845" strokeOpacity=".55" strokeWidth="3" strokeDasharray="90 30 10 30" /><circle cx="198" cy="120" r="6" fill="#FFC845" /></g>
          <circle cx="120" cy="120" r="30" fill="#38D6F5" fillOpacity=".1" />
        </svg>
        <p className="eyebrow">9-сынып · 1–2 тоқсан</p>
        <h1 style={{ marginTop: 12 }}>Күн сайын<br />бір <span className="y">қадам</span></h1>
      </div>
      <p className="muted" style={rise(f, 618)}>Алгебра, геометрия, физика және информатика бойынша 10 сұрақтан тұратын қысқа тесттер. Қателессең, AI-көмекші қадамдап түсіндіреді.</p>
      <div className="steps4" style={rise(f, 624)}>
        <div className="st"><b>1</b>Тіркелу</div><div className="st"><b>2</b>Пән таңдау</div><div className="st"><b>3</b>Тапсырма</div><div className="st"><b>4</b>Нәтиже</div>
      </div>
      <form className="panel" style={rise(f, 630)}>
        <div className="grid2">
          <div><label>Аты-жөнің</label>
            <div className="field" style={{ borderColor: nameActive ? C.cyan : undefined, minHeight: 52 }}>
              {name || <span style={{ color: C.mute }}>Атыңды жаз</span>}{nameActive && caret && <span style={{ color: C.cyan }}>|</span>}
            </div></div>
          <div><label>Сынып</label>
            <div className="field" style={{ borderColor: clsActive ? C.cyan : undefined, minHeight: 52 }}>
              {cls || <span style={{ color: C.mute }}>9 «А»</span>}{clsActive && caret && <span style={{ color: C.cyan }}>|</span>}
            </div></div>
        </div>
        <button className="btn" type="button" style={pressed ? { transform: 'translateY(4px)', boxShadow: '0 2px 0 #C9951E' } : undefined}>Бастау</button>
      </form>
    </div>
  );
};

/* ---------- 2. Home ---------- */
export const SubjectCard: React.FC<{ s: any; style?: React.CSSProperties; best?: number; highlight?: number }> = ({ s, style, best, highlight = 0 }) => (
  <div className="subj" style={{ ['--c' as any]: s.c, borderColor: highlight ? s.c : undefined, transform: highlight ? `translateY(${-3 * highlight}px)` : undefined, ...style }}>
    <span className="blob" />
    <span className="ic" dangerouslySetInnerHTML={html(s.icon)} />
    <span className="nm">{s.name}</span>
    <span className="tp">{s.topics}</span>
    <div className="bar"><i style={{ width: `${(best || 0) * 10}%` }} /></div>
    <span className="meta">{best == null ? <><span>10 сұрақ</span><span>Жаңа</span></> : <><span>Ең жақсы</span><b>{best}/10</b></>}</span>
  </div>
);

export const BOARD = [
  { name: 'Нұрсұлтан Б.', cls: '9 «А»', total: 33 },
  { name: 'Дана С.', cls: '9 «Б»', total: 31 },
  { name: STUDENT, cls: CLASS, total: 26, me: true },
  { name: 'Ерасыл Т.', cls: '9 «А»', total: 24 },
  { name: 'Аружан К.', cls: '9 «Ә»', total: 22 },
];

export const HomeScreen: React.FC<{ f: number }> = ({ f }) => {
  const press = f >= TL.tapSubject && f < TL.tapSubject + 8;
  return (
    <div className="screen">
      <div style={rise(f, 846)}>
        <p className="eyebrow">Сәлем, Әлия!</p>
        <h1 style={{ marginTop: 10, fontSize: 36 }}>Бүгінгі <span className="y">қадамыңды</span> таңда</h1>
      </div>
      <div className="subjects">
        {SUBJECTS.map((s: any, i: number) => {
          const hl = s.id === 'geo' ? prog(f, TL.tapSubject - 20, 12) : 0;
          return <SubjectCard key={s.id} s={s} best={s.id === 'alg' ? 8 : undefined} highlight={hl}
            style={{ ...rise(f, 852 + i * 6), ...(press && s.id === 'geo' ? { transform: 'scale(.97)' } : {}) }} />;
        })}
      </div>
      <div className="panel" style={rise(f, 880)}>
        <div className="head-row"><h2>Сынып рейтингі</h2><span className="live">Тікелей · 24 оқушы</span></div>
        <div className="lb">
          {BOARD.slice(0, 3).map((r, i) => (
            <div key={r.name} className={`lb-row${r.me ? ' me' : ''} p${i + 1}`}>
              <div className="lb-pos">{i + 1}</div><div className="lb-name">{r.name}<small>{r.cls}</small></div><div className="lb-score">{r.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- 3. Quiz + AI ---------- */
const GEO = SUBJECTS.find((s: any) => s.id === 'geo');
export const Q = GEO.qs.find((q: any) => q.t === 'Вектордың ұзындығы');
export const ORDER = ['14', '7', '10', '100'];
const WRONG = 0, RIGHT = 2;

function shakeX(f: number, at: number) {
  const t = f - at;
  if (t < 0 || t > 14) return 0;
  return Math.sin(t * 1.4) * 9 * (1 - t / 14);
}

export const QuizScreen: React.FC<{ f: number }> = ({ f }) => {
  const answered = f >= TL.tapWrong;
  const showRight = f >= TL.showRight;
  const glow = showRight ? Math.max(0, Math.sin(Math.min(1, (f - TL.showRight) / 27) * Math.PI)) : 0;
  const fbP = prog(f, TL.feedback, 16);
  const aiOpen = f >= TL.tapAi;
  const launchPress = f >= TL.tapAi - 4 && f < TL.tapAi;
  return (
    <div className="screen">
      <div className="qtop">
        <button className="x" type="button"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9C3E6" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        <div className="bar"><i style={{ width: `${answered ? 10 * prog(f, TL.tapWrong, 20) : 0}%` }} /></div>
        <span className="count">5/10</span>
      </div>
      <div className="qcard" style={{ ['--c' as any]: GEO.c, ...rise(f, 1026) }}>
        <span className="tag">Геометрия · {Q.t}</span>
        <p className="qtext">{Q.q}</p>
      </div>
      <div className="opts">
        {ORDER.map((o, k) => {
          let cls = 'opt';
          const st: React.CSSProperties = { ...rise(f, 1034 + k * 5, 16) };
          if (answered) {
            if (k === WRONG) { cls += ' wrong'; st.transform = `translateX(${shakeX(f, TL.tapWrong)}px)`; }
            else if (k === RIGHT && showRight) { cls += ' right'; st.boxShadow = `0 0 0 ${6 * glow}px rgba(61,220,151,.25), 0 0 ${40 * glow}px rgba(61,220,151,.35)`; }
            else cls += ' dim';
          }
          return <button key={o} className={cls} type="button" style={st}><span className="k">{'ABCD'[k]}</span><span>{o}</span></button>;
        })}
      </div>
      {f >= TL.feedback && (
        <div className="feedback no" style={{ opacity: fbP, transform: `translateY(${(1 - fbP) * 24}px)` }}>
          <h3>Қате. Дұрыс жауап: 10</h3>
          <p>{Q.e}</p>
          {!aiOpen
            ? <button className="ai-launch" type="button" style={launchPress ? { transform: 'scale(.98)' } : undefined}>
                <span><Orb f={f} /><span><b>AI-көмекші</b><small>Қай жерде қателескеніңді көрсетеді</small></span><span className="go" dangerouslySetInnerHTML={html(ICON.arrow)} /></span>
              </button>
            : <AiCard f={f} />}
        </div>
      )}
      {f >= TL.feedback && <button className="btn" type="button" style={{ opacity: fbP }}>Келесі сұрақ</button>}
    </div>
  );
};

const Orb: React.FC<{ f: number; think?: boolean }> = ({ f, think }) => {
  const a = f * (think ? 9 : 2);
  return (
    <span className="orb" style={{ transform: `rotate(${a}deg)` }}>
      <i style={{ transform: `rotate(${-a}deg)` }} dangerouslySetInnerHTML={html(ICON.bot)} />
    </span>
  );
};

const AiCard: React.FC<{ f: number }> = ({ f }) => {
  const ai = Q.ai;
  const thinking = f < TL.aiTry;
  const dots = f < TL.aiSteps[0];
  const cardP = prog(f, TL.tapAi, 14);
  return (
    <div className="ai-card" style={{ opacity: cardP, transform: `translateY(${(1 - cardP) * 20}px)` }}>
      <div className="ai-in">
        <div className="ai-head"><Orb f={f} think={thinking} /><div><b>AI-көмекші</b><small>AI дайындаған түсіндірме</small></div></div>
        {dots && (
          <div className="typing">{[0, 1, 2].map((i) => <i key={i} style={{ transform: `translateY(${-5 * Math.max(0, Math.sin((f / 4) - i * 0.9))}px)`, opacity: 0.5 + 0.5 * Math.max(0, Math.sin((f / 4) - i * 0.9)) }} />)}</div>
        )}
        {!dots && (
          <div className="ai-sec" style={rise(f, TL.aiSteps[0], 12, 16)}>
            <p className="ai-label"><span dangerouslySetInnerHTML={html(ICON.steps)} style={{ display: 'flex' }} />Шешімі</p>
            <ol className="ai-steps">
              {ai.s.map((step: string, i: number) => {
                const start = TL.aiSteps[i];
                if (f < start) return null;
                const end = (TL.aiSteps[i + 1] ?? TL.aiWarn) - 14;
                const t = typed(step, f, start, end);
                return (
                  <li key={i} style={rise(f, start, 10, 12)}>
                    <span className="n">{i + 1}</span>
                    <p className={`tx${!t.done ? ' caret' : ''}`}>{t.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {f >= TL.aiWarn && (
          <div className="ai-warn" style={rise(f, TL.aiWarn, 14, 16)}>
            <span dangerouslySetInnerHTML={html(ICON.warn)} style={{ display: 'flex' }} />
            <div><b>Қате қайдан шығуы мүмкін</b><p>{ai.m}</p></div>
          </div>
        )}
        {f >= TL.aiTry && (
          <div className="ai-try" style={rise(f, TL.aiTry, 14, 16)}>
            <b>Өзіңді тексер</b>
            <p>{ai.p}</p>
            {f < TL.tapReveal
              ? <button className="reveal" type="button" style={f >= TL.tapReveal - 4 ? { transform: 'scale(.95)' } : undefined}>Жауабын көру</button>
              : <div className="answer" style={{ transform: `scale(${pop(f, TL.tapReveal, 14)})`, transformOrigin: 'left center' }}>
                  <span dangerouslySetInnerHTML={html(ICON.check)} style={{ display: 'flex' }} /><span>Жауабы: {ai.pa}</span>
                </div>}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- 4. Result ---------- */
export const ResultScreen: React.FC<{ f: number }> = ({ f }) => {
  const R = 2 * Math.PI * 80;
  const p = prog(f, TL.resultRing, 42);
  const score = Math.round(9 * p);
  return (
    <div className="screen">
      <div className="center" style={rise(f, 1744)}><p className="eyebrow">Геометрия · Нәтиже</p></div>
      <div style={rise(f, 1748)}>
        <div className="ring">
          <svg viewBox="0 0 190 190" aria-hidden="true">
            <defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stopColor="#38D6F5" /><stop offset="1" stopColor="#FFC845" /></linearGradient></defs>
            <circle cx="95" cy="95" r="80" fill="none" stroke="#18225A" strokeWidth="16" />
            <circle cx="95" cy="95" r="80" fill="none" stroke="url(#rg)" strokeWidth="16" strokeLinecap="round" strokeDasharray={R} strokeDashoffset={R * (1 - 0.9 * p)} />
          </svg>
          <div className="val"><div><b>{score}</b><small>10 сұрақтан</small></div></div>
        </div>
      </div>
      <div className="center" style={{ ...rise(f, 1770), display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <h2>Керемет! Сен бұл тақырыптарды жақсы білесің.</h2>
        <div className="xp-pop" style={{ transform: `scale(${pop(f, TL.resultXp, 16)})` }}>+90 XP</div>
      </div>
      <div className="badges">
        <div className="badge" style={{ transform: `scale(${pop(f, TL.resultBadge, 16)})`, opacity: prog(f, TL.resultBadge, 8) }}>
          <span className="bi" dangerouslySetInnerHTML={html(ICON.star)} />
          <div><b>Алғашқы қадам</b><small>Бірінші тестті тапсырдың</small></div>
        </div>
      </div>
      <div className="row" style={rise(f, 1850)}>
        <button className="btn" type="button">Қайта тапсыру</button>
        <button className="btn ghost" type="button">Рейтинг</button>
      </div>
    </div>
  );
};

/** Scroll offset inside the phone during quiz + AI. */
export function quizScroll(f: number) {
  return interpolate(f,
    [1140, 1170, TL.tapAi, TL.tapAi + 20, TL.aiSteps[2], TL.aiWarn, TL.aiTry, TL.aiTry + 20, 1740],
    [0, 200, 200, 330, 470, 600, 760, 900, 900],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 3) });
}
