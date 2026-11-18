// 2D overlay: titles, animated text, time counters (drawn in 1920x1080 space; picture area y 138..942)
import { clamp, ease, inv } from './core.js';

export const PIC = { x: 0, y: 138, w: 1920, h: 804 };

// Reveal text char-by-char: each glyph fades from blur+offset to sharp. t = seconds since start.
export function reveal(ctx, text, t, o = {}) {
  const { x = 960, y = 540, size = 48, font = `italic 300 ${size}px "Cormorant Garamond"`, color = '#f3efe6', align = 'center',
    perChar = 0.035, dur = 0.9, rise = 10, blur = 8, tracking = 0.02, alpha = 1, shadow = 0.6, fadeOut = null } = o;
  ctx.save();
  ctx.font = font; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  const chars = [...text];
  const widths = chars.map(c => ctx.measureText(c).width + size * tracking);
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  let fo = 1; if (fadeOut) fo = 1 - clamp((t - fadeOut[0]) / fadeOut[1]);
  chars.forEach((c, i) => {
    const k = clamp((t - i * perChar) / dur), e = ease.out(k);
    if (k > 0 && c !== ' ') {
      ctx.globalAlpha = e * alpha * fo;
      const b = (1 - e) * blur; ctx.filter = b > 0.3 ? `blur(${b.toFixed(1)}px)` : 'none';
      if (shadow) { ctx.shadowColor = `rgba(0,0,0,${shadow})`; ctx.shadowBlur = 18; }
      ctx.fillStyle = color; ctx.fillText(c, cx, y + (1 - e) * rise);
    }
    cx += widths[i];
  });
  ctx.restore();
  return total;
}
// Word-by-word reveal (for long lines), returns width
export function revealWords(ctx, text, t, o = {}) {
  const { perWord = 0.18, ...rest } = o;
  const words = text.split(' ');
  ctx.save(); ctx.font = rest.font || `italic 300 ${rest.size || 48}px "Cormorant Garamond"`;
  const sp = ctx.measureText(' ').width, ws = words.map(w => ctx.measureText(w).width + (rest.size || 48) * (rest.tracking ?? 0.02) * [...w].length);
  ctx.restore();
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let x = (rest.x ?? 960) - total / 2;
  words.forEach((w, i) => { reveal(ctx, w, t - i * perWord, { ...rest, x, align: 'left', perChar: 0.012 }); x += ws[i] + sp; });
  return total;
}
// Big time display HH:MM with rolling digits (odometer). value = minutes since 0:00 (float)
export function clockText(ctx, minutes, o = {}) {
  const { x = 960, y = 540, size = 120, alpha = 1, color = '#f4f1ea', font = `200 ${size}px Inter`, tracking = 0.04, glow = 0.5 } = o;
  ctx.save(); ctx.font = font; ctx.textBaseline = 'middle'; ctx.globalAlpha = alpha;
  const dw = ctx.measureText('0').width + size * tracking, cw = ctx.measureText(':').width + size * tracking;
  const total = dw * 4 + cw; let cx = x - total / 2;
  const whole = Math.floor(minutes), frac = minutes - whole;
  const roll = frac > 0.82 ? ease.io((frac - 0.82) / 0.18) : 0;
  const digitsAt = m => { const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60); return [Math.floor(h / 10), h % 10, Math.floor(mm / 10), mm % 10]; };
  const d0 = digitsAt(whole), d1 = digitsAt(whole + 1);
  ctx.beginPath(); ctx.rect(x - total, y - size * 0.62, total * 2, size * 1.24); ctx.clip();
  if (glow) { ctx.shadowColor = `rgba(255,240,220,${glow})`; ctx.shadowBlur = size * 0.25; }
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    if (i === 2) { ctx.fillText(':', cx, y - size * 0.04); cx += cw; continue; }
    const di = i < 2 ? i : i - 1;
    if (d0[di] !== d1[di] && roll > 0) {
      ctx.globalAlpha = alpha * (1 - roll); ctx.fillText(String(d0[di]), cx, y - roll * size * 0.9);
      ctx.globalAlpha = alpha * roll; ctx.fillText(String(d1[di]), cx, y + (1 - roll) * size * 0.9);
      ctx.globalAlpha = alpha;
    } else ctx.fillText(String(d0[di]), cx, y);
    cx += dw;
  }
  ctx.restore();
}
export function fadeEnv(t, a, b, fi = 0.5, fo = 0.5) { return clamp(inv(a, a + fi, t)) * (1 - clamp(inv(b - fo, b, t))); }
