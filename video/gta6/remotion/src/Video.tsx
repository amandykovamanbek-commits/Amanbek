import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {TIMING, findCue, sec2f, scene} from './lib/timeline';
import {HudEv, SceneDef} from './lib/shot';
import {Grain, Vignette} from './lib/FX';
import {Chapter, HUD} from './lib/UI';
import {C, FONT, clamp, glowText, ramp} from './lib/theme';
import {Void} from './lib/Sets';
import {SCENES, HUD_EVENTS} from './shots';

const FADE = 8;

type Placed = {key: string; from: number; dur: number; C: SceneDef['shots'][0]['C']; at: (p: string, nth?: number) => number; hud: boolean; fadeIn: boolean; fadeOut: boolean; dip?: boolean};

const place = (): Placed[] => {
  const out: Placed[] = [];
  SCENES.forEach((sc, si) => {
    const s = scene(sc.id);
    const sceneStart = sec2f(s.start);
    const next = TIMING.scenes[si + 1];
    let sceneEnd: number;
    if (s.title) sceneEnd = sec2f(s.title[0]);
    else if (next) sceneEnd = sec2f(next.start) - 2;
    else sceneEnd = sec2f(TIMING.end[0]);
    let idx = 0;
    const starts = sc.shots.map((sh, i) => {
      if (i === 0) return {f: sceneStart - (si === 0 ? sec2f(0.6) : 6), idx: 0};
      const r = findCue(sc.id, sh.cue, idx);
      idx = r.idx + 1;
      return {f: sec2f(r.t) - 3, idx: r.idx};
    });
    sc.shots.forEach((sh, i) => {
      const from = Math.max(0, starts[i].f);
      const to = i < sc.shots.length - 1 ? starts[i + 1].f : sceneEnd;
      const fromIdx = starts[i].idx;
      const at = (p: string, nth = 0) => {
        let k = fromIdx;
        let r = findCue(sc.id, p, k);
        for (let n = 0; n < nth; n++) r = findCue(sc.id, p, r.idx + 1);
        return sec2f(r.t) - from;
      };
      out.push({key: `${sc.id}_${i}`, from, dur: Math.max(1, to - from), C: sh.C, at, hud: sh.hud !== false, fadeIn: i === 0 && si > 1, fadeOut: i === sc.shots.length - 1 && si > 0, dip: si === 1 && i === 0});
    });
  });
  return out;
};

const PLACED = place();

/** whip transition: slide + motion blur in/out */
const Fader: React.FC<{dur: number; fadeIn: boolean; fadeOut: boolean; dip?: boolean; children: React.ReactNode}> = ({dur, fadeIn, fadeOut, dip, children}) => {
  const f = useCurrentFrame();
  if (dip) {
    const o = Math.min(fadeIn ? interpolate(f, [0, FADE], [0, 1], clamp) : 1, fadeOut ? interpolate(f, [dur - FADE, dur], [1, 0], clamp) : 1);
    return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
  }
  const W = 7;
  const kin = fadeIn ? interpolate(f, [0, W], [1, 0], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)}) : 0;
  const kout = fadeOut ? interpolate(f, [dur - W, dur], [0, 1], {...clamp, easing: (t) => t * t * t}) : 0;
  const x = kin * 260 - kout * 260;
  const blur = (kin + kout) * 26;
  const o = Math.min(1 - kin * 0.6, 1 - kout * 0.6);
  return (
    <AbsoluteFill style={{opacity: o, transform: `translateX(${x}px) scale(${1 + (kin + kout) * 0.04})`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>{children}</AbsoluteFill>
  );
};

const CHAPTERS: Record<string, [string, string]> = {
  S01: ['1', 'КОРОБКА'], S03: ['2', 'ПРАВИЛА'], S04: ['3', 'ОТКРЫТЫЙ МИР'], S05: ['4', 'ТИМУР'],
  S06: ['5', 'КОДЫ'], S07: ['6', 'ПЯТЬ ЗВЁЗД'], S08: ['7', 'ГЛАВНАЯ МИССИЯ'], S09: ['8', 'РЕЛИЗ'],
};

// ---- global HUD -----------------------------------------------------------
type HudKey = {f: number; money: number; stars: number; show: boolean; flash: boolean};
const HUD_KEYS: HudKey[] = (() => {
  let st = {money: 0, stars: 0, show: false, flash: false};
  const ks: HudKey[] = [];
  const evs = HUD_EVENTS.map((e: HudEv) => ({e, f: sec2f(findCue(e.id, e.cue).t) + (e.offset ?? 0)})).sort((a, b) => a.f - b.f);
  for (const {e, f} of evs) {
    st = {money: e.money ?? st.money, stars: e.stars ?? st.stars, show: e.show ?? st.show, flash: e.flash ?? st.flash};
    ks.push({f, ...st});
  }
  return ks;
})();

const GlobalHUD: React.FC = () => {
  const f = useCurrentFrame();
  const placed = PLACED.find((p) => f >= p.from && f < p.from + p.dur);
  if (placed && !placed.hud) return null;
  let cur: HudKey = {f: 0, money: 0, stars: 0, show: false, flash: false};
  let prev = cur;
  for (const k of HUD_KEYS) {
    if (k.f <= f) {
      prev = cur;
      cur = k;
    }
  }
  if (!cur.show && f - cur.f > 12) return null;
  const since = f - cur.f;
  const mk = interpolate(since, [0, 18], [0, 1], clamp);
  const money = prev.money + (cur.money - prev.money) * mk;
  const pop = cur.money !== prev.money ? Math.max(0, 1 - since / 10) : 0;
  const o = cur.show ? (prev.show ? 1 : ramp(since, 0, 10)) : 1 - ramp(since, 0, 10);
  const starAnim = [0, 1, 2, 3, 4].map((i) => {
    const on = i < cur.stars;
    const was = i < prev.stars;
    if (on && !was) return interpolate(since, [0, 10], [0.5, 1], clamp) + (since < 10 ? 0 : 0);
    if (!on && was) return interpolate(since, [0, 10], [1, 0], clamp);
    return on ? 1 : 0;
  });
  return <HUD money={money} stars={cur.stars} o={o} pop={pop} flash={cur.flash} starAnim={starAnim} />;
};

// ---- title & end cards ----------------------------------------------------
const TitleCard: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Void glow="rgba(255,160,60,0.18)" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
        <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 40, letterSpacing: 10, opacity: ramp(f, 2, 10)}}>ЧТО, ЕСЛИ БЫ ТЫ ПОЛУЧИЛ</div>
        <div style={{color: C.gold, fontWeight: 900, fontSize: 150, textShadow: glowText, marginTop: 6, opacity: ramp(f, 8, 12), transform: `scale(${0.94 + 0.06 * ramp(f, 8, 12)})`}}>ГТА 6 РАНЬШЕ ВСЕХ?</div>
        <div style={{color: '#B9B3C9', fontWeight: 700, fontSize: 40, marginTop: 22, opacity: ramp(f, 26, 12)}}>…но всё, что ты делаешь в игре, происходит в реальности</div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Void glow="rgba(140,91,216,0.25)" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
        <div style={{color: C.gold, fontWeight: 900, fontSize: 96, textShadow: glowText, opacity: ramp(f, 0, 12)}}>А ЧТО БЫ СДЕЛАЛ ТЫ?</div>
        <div style={{color: '#EDE7DA', fontWeight: 800, fontSize: 44, marginTop: 26, opacity: ramp(f, 14, 12)}}>Пиши в комментариях 👇</div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const s1 = scene('S00');
  const t0 = sec2f(s1.title![0]);
  const t1 = sec2f(s1.title![1]);
  const e0 = sec2f(TIMING.end[0]);
  const e1 = TIMING.frames;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {PLACED.map((p) => (
        <Sequence key={p.key} from={p.from} durationInFrames={p.dur}>
          <Fader dur={p.dur} fadeIn={p.fadeIn || !!p.dip} fadeOut={p.fadeOut} dip={p.dip}>
            <p.C d={p.dur} at={p.at} />
          </Fader>
        </Sequence>
      ))}
      <Sequence from={t0} durationInFrames={t1 - t0}>
        <Fader dur={t1 - t0} fadeIn fadeOut dip>
          <TitleCard />
        </Fader>
      </Sequence>
      <Sequence from={e0} durationInFrames={e1 - e0}>
        <Fader dur={e1 - e0} fadeIn fadeOut={false} dip>
          <EndCard />
        </Fader>
      </Sequence>
      {Object.entries(CHAPTERS).map(([id, [n, title]]) => (
        <Sequence key={'ch' + id} from={sec2f(scene(id).start) + 8} durationInFrames={90}>
          <Chapter n={n} title={title} />
        </Sequence>
      ))}
      <GlobalHUD />
      <Grain />
    </AbsoluteFill>
  );
};
