import { continueRender, delayRender, Easing, interpolate, staticFile } from 'remotion';
import FONTS from './fonts.json';

// The site's own fonts (Montserrat, Inter), served locally with the Cyrillic subsets that carry Kazakh letters
if (typeof document !== 'undefined' && !document.getElementById('bq-fonts')) {
  const style = document.createElement('style');
  style.id = 'bq-fonts';
  style.textContent = FONTS.map((f: any) => `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};font-display:block;src:url('${staticFile('fonts/' + f.file)}') format('woff2');unicode-range:${f.range};}`).join('\n');
  document.head.appendChild(style);
  const handle = delayRender('Loading local fonts');
  const loads: Promise<unknown>[] = [];
  for (const w of [400, 500, 600, 700]) loads.push(document.fonts.load(`${w} 20px Inter`, 'Әәқңғүұөһі ABC'));
  for (const w of [600, 700, 800, 900]) loads.push(document.fonts.load(`${w} 20px Montserrat`, 'Әәқңғүұөһі ABC'));
  Promise.all(loads).then(() => continueRender(handle), () => continueRender(handle));
}

export const C = {
  ink: '#0A0F2C', ink2: '#121A46', card: '#18225A', line: '#2A3778',
  light: '#F3F5FB', soft: '#B9C3E6', mute: '#8592C4',
  cyan: '#38D6F5', sun: '#FFC845', good: '#3DDC97', bad: '#FF6B7A',
};
export const DISPLAY = "'Montserrat', 'Arial Black', Arial, sans-serif";
export const TEXT = "'Inter', 'Segoe UI', Arial, sans-serif";

export const ease = Easing.bezier(0.16, 0.84, 0.24, 1);
export const swift = Easing.bezier(0.76, 0, 0.24, 1);

/** 0 → 1 progress starting at `start`, eased, lasting `dur` frames. */
export function prog(frame: number, start: number, dur = 18, easing = ease) {
  return interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
}

/** Rise-in with blur, the same move the site uses for its entrances. */
export function rise(frame: number, start: number, dur = 20, dist = 40): React.CSSProperties {
  const p = prog(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined };
}

/** Exit up with blur over the last `dur` frames before `end`. */
export function exitStyle(frame: number, end: number, dur = 12): React.CSSProperties {
  const p = prog(frame, end - dur, dur, swift);
  if (p <= 0) return {};
  return { opacity: 1 - p, transform: `translateY(${-36 * p}px)`, filter: `blur(${10 * p}px)` };
}

/** Pop with a small overshoot. */
export function pop(frame: number, start: number, dur = 16) {
  const p = interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  return p;
}

/** Deterministic pseudo-random in [0,1). */
export function rand(i: number) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Text typed word by word between start and end. */
export function typed(text: string, frame: number, start: number, end: number) {
  const words = text.split(' ');
  const n = Math.round(interpolate(frame, [start, end], [0, words.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return { text: words.slice(0, n).join(' '), done: n >= words.length, started: frame >= start };
}

/** Text typed character by character. */
export function typedChars(text: string, frame: number, start: number, end: number) {
  const chars = Array.from(text);
  const n = Math.round(interpolate(frame, [start, end], [0, chars.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return chars.slice(0, n).join('');
}
