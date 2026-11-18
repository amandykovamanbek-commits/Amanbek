// Phone screen drawing (messenger, keyboard, lock screen). Canvas 540x1170.
const F = (w, s) => `${w} ${s}px Inter`;
function rr(x, ctx, X, Y, W, H, R) { ctx.beginPath(); ctx.moveTo(X + R, Y); ctx.arcTo(X + W, Y, X + W, Y + H, R); ctx.arcTo(X + W, Y + H, X, Y + H, R); ctx.arcTo(X, Y + H, X, Y, R); ctx.arcTo(X, Y, X + W, Y, R); ctx.closePath(); }
const round = (ctx, X, Y, W, H, R) => rr(0, ctx, X, Y, W, H, R);
export function heart(ctx, x, y, s, col = '#ff3b5c') {
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s * 0.55, y - s * 0.05, x - s * 0.35, y - s * 0.55, x, y - s * 0.2);
  ctx.bezierCurveTo(x + s * 0.35, y - s * 0.55, x + s * 0.55, y - s * 0.05, x, y + s * 0.35); ctx.fill(); ctx.restore();
}
function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function statusBar(ctx, time, light = '#e8edf3') {
  ctx.fillStyle = light; ctx.font = F(600, 24); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(time, 40, 34);
  ctx.textAlign = 'right'; ctx.font = F(600, 18); ctx.fillText('LTE', 430, 34);
  round(ctx, 446, 24, 44, 20, 5); ctx.strokeStyle = light; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = light; ctx.fillRect(449, 27, 26, 14);
  for (let i = 0; i < 4; i++) ctx.fillRect(370 + i * 9, 40 - i * 5, 6, 6 + i * 5);
}
const KB = ['йцукенгшщзхъ', 'фывапролджэ', 'ячсмитьбю'];
function keyboard(ctx, y0, pressed) {
  ctx.fillStyle = '#1c1f24'; ctx.fillRect(0, y0, 540, 1170 - y0);
  const kw = 540 / 12, kh = 72;
  KB.forEach((row, r) => {
    const n = row.length, off = r === 0 ? 0 : r === 1 ? kw * 0.5 : kw * 1.5;
    [...row].forEach((c, i) => {
      const x = off + i * kw + 3, y = y0 + 14 + r * (kh + 10), on = pressed === c;
      round(ctx, x, on ? y - 34 : y, kw - 6, on ? kh + 34 : kh, 8); ctx.fillStyle = on ? '#5a6270' : '#3a3f47'; ctx.fill();
      ctx.fillStyle = '#eef1f5'; ctx.font = F(400, on ? 38 : 28); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c, x + (kw - 6) / 2, on ? y - 2 : y + kh / 2);
    });
  });
  const y = y0 + 14 + 3 * (kh + 10);
  round(ctx, 3, y, kw * 1.4, kh, 8); ctx.fillStyle = '#2a2e35'; ctx.fill();
  round(ctx, 540 - kw * 1.4 - 3, y - kh - 10, kw * 1.4, kh, 8); ctx.fill(); round(ctx, 3, y - kh - 10, kw * 1.4, kh, 8); ctx.fill();
  round(ctx, kw * 1.6, y, 540 - kw * 3.2, kh, 8); ctx.fillStyle = pressed === ' ' ? '#5a6270' : '#3a3f47'; ctx.fill();
  ctx.fillStyle = '#c8ccd2'; ctx.font = F(400, 22); ctx.fillText('пробел', 270, y + kh / 2);
  round(ctx, 540 - kw * 1.4 - 3, y, kw * 1.4, kh, 8); ctx.fillStyle = '#2f6fd6'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = F(600, 26); ctx.fillText('⏎', 540 - kw * 0.7 - 3, y + kh / 2);
}
// state: {mode, time, msgs:[{me,text,time,heart}], typed, cursor, kb, pressed, typingDots(0..1 visible), status, wake, notif}
export function drawPhone(c, st) {
  const ctx = c.getContext('2d'); ctx.save();
  ctx.clearRect(0, 0, 540, 1170);
  if (st.mode === 'lock') return lock(ctx, st);
  if (st.mode === 'off') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 540, 1170); ctx.restore(); return; }
  // chat bg
  const g = ctx.createLinearGradient(0, 0, 0, 1170); g.addColorStop(0, '#16222e'); g.addColorStop(1, '#0e1620');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 540, 1170);
  ctx.globalAlpha = 0.05; ctx.strokeStyle = '#9fb8d0'; ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) { const x = (i * 137) % 540, y = (i * 271) % 1170; ctx.beginPath(); ctx.arc(x, y, 12 + (i % 3) * 6, 0, 5); ctx.stroke(); }
  ctx.globalAlpha = 1;
  // header
  ctx.fillStyle = '#1b2735'; ctx.fillRect(0, 0, 540, 140);
  statusBar(ctx, st.time || '21:47');
  ctx.fillStyle = '#6ab0ff'; ctx.font = F(300, 54); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('‹', 18, 98);
  const ag = ctx.createLinearGradient(70, 70, 130, 130); ag.addColorStop(0, '#f2a46a'); ag.addColorStop(1, '#d9607a');
  ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(100, 100, 30, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = F(600, 28); ctx.textAlign = 'center'; ctx.fillText('М', 100, 101);
  ctx.textAlign = 'left'; ctx.fillStyle = '#f2f5f8'; ctx.font = F(600, 30); ctx.fillText(st.title || 'Мама', 146, 86);
  ctx.font = F(400, 21); ctx.fillStyle = st.status === 'печатает…' ? '#6ab0ff' : '#8fa3b8'; ctx.fillText(st.status || 'в сети', 146, 118);
  // input + keyboard
  const kbH = st.kb ? 420 : 0, inY = 1170 - kbH - 96;
  if (st.kb) keyboard(ctx, 1170 - kbH, st.pressed);
  ctx.fillStyle = '#1b2735'; ctx.fillRect(0, inY, 540, 96);
  round(ctx, 70, inY + 18, 380, 60, 30); ctx.fillStyle = '#0f1822'; ctx.fill();
  ctx.font = F(400, 25); ctx.textBaseline = 'middle';
  const typed = st.typed || '';
  let shown = typed; while (ctx.measureText(shown).width > 340 && shown.length) shown = shown.slice(1);
  ctx.fillStyle = typed ? '#eef2f6' : '#5d6e80'; ctx.fillText(typed ? shown : 'Сообщение', 92, inY + 49);
  if (st.cursor) { const w = typed ? ctx.measureText(shown).width : 0; ctx.fillStyle = '#6ab0ff'; ctx.fillRect(94 + w, inY + 32, 3, 34); }
  ctx.fillStyle = typed ? '#3d8bfd' : '#5d6e80'; ctx.beginPath(); ctx.arc(490, inY + 48, 28, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(478, inY + 36); ctx.lineTo(506, inY + 48); ctx.lineTo(478, inY + 60); ctx.lineTo(482, inY + 48); ctx.fill();
  // messages, bottom-up
  let y = inY - 22;
  const msgs = [...(st.msgs || [])];
  if (st.typingDots > 0) msgs.push({ me: false, dots: st.typingDots });
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    ctx.font = F(400, 31);
    const lines = m.dots ? [''] : wrap(ctx, m.text, 350);
    const lw = m.dots ? 96 : Math.max(...lines.map(l => ctx.measureText(l).width)) + (m.heart ? 40 : 0);
    const bw = Math.min(440, Math.max(lw + 36 + (m.dots ? 0 : 80), 120)), bh = lines.length * 42 + (m.dots ? 40 : 44);
    const enter = m.enter ?? 1, slide = (1 - enter) * 40;
    y -= bh + 12 - slide * 0;
    const x = m.me ? 540 - bw - 18 : 18;
    ctx.save(); ctx.globalAlpha = Math.min(1, enter * 1.5) * (m.dots ? m.dots : 1); ctx.translate(0, slide);
    round(ctx, x, y, bw, bh, 22); ctx.fillStyle = m.me ? '#2b5d9c' : '#1f2c3a'; ctx.fill();
    if (m.dots) {
      for (let k = 0; k < 3; k++) { const a = 0.35 + 0.65 * Math.max(0, Math.sin((st.clock || 0) * 6 - k * 0.9)); ctx.fillStyle = `rgba(180,200,220,${a})`; ctx.beginPath(); ctx.arc(x + 30 + k * 22, y + bh / 2, 7, 0, 7); ctx.fill(); }
    } else {
      ctx.fillStyle = '#f1f4f7'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      lines.forEach((l, k) => ctx.fillText(l, x + 18, y + 14 + k * 42));
      if (m.heart) { const lx = x + 18 + ctx.measureText(lines[lines.length - 1]).width + 22; heart(ctx, lx, y + 14 + (lines.length - 1) * 42 + 18, 34); }
      ctx.font = F(400, 17); ctx.fillStyle = m.me ? '#9cc4f0' : '#7f93a8'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(m.time + (m.me ? (m.read ? '  ✓✓' : '  ✓') : ''), x + bw - 14, y + bh - 8);
    }
    ctx.restore();
    if (y < 150) break;
  }
  // date chip
  ctx.restore();
  if (st.dim) { ctx.fillStyle = `rgba(0,0,0,${st.dim})`; ctx.fillRect(0, 0, 540, 1170); }
}
function lock(ctx, st) {
  const g = ctx.createLinearGradient(0, 0, 540, 1170); g.addColorStop(0, '#2a3550'); g.addColorStop(0.6, '#3a2a40'); g.addColorStop(1, '#141824');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 540, 1170);
  for (let i = 0; i < 14; i++) { const x = (i * 97) % 540, y = 300 + (i * 173) % 800; const gg = ctx.createRadialGradient(x, y, 0, x, y, 90); gg.addColorStop(0, 'rgba(255,190,120,0.18)'); gg.addColorStop(1, 'rgba(255,190,120,0)'); ctx.fillStyle = gg; ctx.fillRect(x - 90, y - 90, 180, 180); }
  statusBar(ctx, '', '#fff');
  ctx.fillStyle = '#f4f6fa'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = F(500, 26); ctx.fillText('четверг, 31 декабря', 270, 150);
  ctx.font = F(200, 150); ctx.fillText(st.time || '22:51', 270, 260);
  if (st.notif) {
    const e = st.notif, y = 420 + (1 - e) * -60;
    ctx.save(); ctx.globalAlpha = Math.min(1, e * 1.4);
    round(ctx, 22, y, 496, 150, 30); ctx.fillStyle = 'rgba(235,238,244,0.86)'; ctx.fill();
    const ig = ctx.createLinearGradient(44, y + 24, 104, y + 84); ig.addColorStop(0, '#5fb0ff'); ig.addColorStop(1, '#2a72d8');
    round(ctx, 44, y + 24, 58, 58, 14); ctx.fillStyle = ig; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(60, y + 40); ctx.lineTo(90, y + 53); ctx.lineTo(60, y + 66); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#111'; ctx.font = F(600, 26); ctx.fillText('Папа', 120, y + 44);
    ctx.font = F(400, 18); ctx.fillStyle = '#555'; ctx.textAlign = 'right'; ctx.fillText('сейчас', 494, y + 44);
    ctx.textAlign = 'left'; ctx.fillStyle = '#222'; ctx.font = F(400, 23); ctx.fillText('Видео · отправил видео', 120, y + 82);
    ctx.fillStyle = '#333'; ctx.fillText('Айко весь день рисовала', 120, y + 118);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; round(ctx, 200, 1130, 140, 8, 4); ctx.fill();
  ctx.restore();
  if (st.wake !== undefined && st.wake < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - st.wake})`; ctx.fillRect(0, 0, 540, 1170); }
}
