// node thumb.cjs  -> renders YouTube thumbnails (1280x720) using the series' character drawings
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, '..', 's2e5', 'index.html') + '?render');
  await p.waitForFunction(() => window.READY === true);
  await p.evaluate(() => document.fonts.ready);
  const variants = ['A', 'B'];
  for (const v of variants) {
    await p.evaluate((v) => {
      const txt = (x, y, s, fill, str, sw = 16, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="900" fill="${fill}" stroke="#111" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round" font-family="Inter" ${extra}>${str}</text>`;
      const dana = `<g transform="translate(${v === 'A' ? 330 : 300} ${v === 'A' ? 395 : 400}) scale(${v === 'A' ? .82 : .8}) translate(-540 -1170)"><g id="charPos">${charSVG()}</g></g>`;
      let bg, right, words;
      if (v === 'A') {
        bg = `<defs><linearGradient id="gL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8cff"/><stop offset="1" stop-color="#5560E6"/></linearGradient>
              <linearGradient id="gR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0f3a"/><stop offset="1" stop-color="#e5383b"/></linearGradient></defs>
              <rect width="1280" height="720" fill="url(#gL)"/><polygon points="700,0 1280,0 1280,720 560,720" fill="url(#gR)"/>
              <polygon points="690,0 715,0 575,720 550,720" fill="#FFD43B"/>`;
        right = `<g transform="translate(1010 430) scale(.62) translate(-540 -1140)">${blitzSVG()}</g>`;
        words = txt(36, 100, 88, '#FFD43B', 'ШКОЛЬНИК') + txt(736, 96, 76, '#fff', 'МИЛЛИОННИК', 16, 'textLength="520" lengthAdjust="spacingAndGlyphs"') +
          `<g transform="rotate(-6 640 400)">${txt(560, 430, 130, '#ff3b3b', 'VS', 20)}</g>` +
          `<rect x="30" y="620" width="560" height="74" rx="18" fill="#16171d"/>` + txt(54, 673, 44, '#fff', '1–2 СЕЗОН · ВСЕ СЕРИИ', 0);
      } else {
        bg = `<defs><radialGradient id="gB" cx="35%" cy="55%" r="80%"><stop offset="0" stop-color="#ffd27a"/><stop offset=".55" stop-color="#ff8a3d"/><stop offset="1" stop-color="#7a1f3a"/></radialGradient></defs>
              <rect width="1280" height="720" fill="url(#gB)"/>
              ${Array.from({ length: 14 }, (_, i) => `<text x="${(i * 97) % 1280}" y="${80 + (i * 173) % 640}" font-size="${40 + (i % 3) * 16}" font-weight="900" fill="#16a34a" opacity=".35" transform="rotate(${(i % 5) * 9 - 18} ${(i * 97) % 1280} ${80 + (i * 173) % 640})">₽</text>`).join('')}`;
        right = `<g transform="translate(1040 470) scale(.5) translate(-540 -1100)">${markSVG()}</g>`;
        words = txt(610, 115, 74, '#fff', 'ОТ 0 ₽ ДО') + txt(560, 232, 98, '#51cf66', '10 000 000 ₽', 18) +
          `<rect x="596" y="262" width="360" height="72" rx="16" fill="#16171d"/>` + txt(620, 314, 44, '#FFD43B', 'НА МОНТАЖЕ', 0) +
          `<rect x="30" y="620" width="560" height="74" rx="18" fill="#16171d"/>` + txt(54, 673, 44, '#fff', '1–2 СЕЗОН · ВСЕ СЕРИИ', 0);
      }
      document.body.innerHTML = `<svg id="thumb" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" style="display:block;font-family:Inter">
        ${bg}${right}${dana}${words}</svg>`;
      document.body.style.margin = '0';
      // Danya expression
      applyChar(0.5, v === 'A' ? MOODS.shock : MOODS.happy, v === 'A' ? 'idle' : 'cheer', 0, 0, 0, { bg: 'x' });
      document.getElementById('charPos').setAttribute('transform', 'translate(540 1170)');
      document.getElementById('sweat').setAttribute('opacity', v === 'A' ? 1 : 0);
      if (v === 'A') {
        const s = (id, a, val) => document.getElementById(id).setAttribute(a, val);
        s('bHeadSet', 'opacity', 1); s('bNeckSet', 'opacity', 0);
        ['L', 'R'].forEach(sd => s('bLid' + sd, 'height', 20));
        s('bBrowL', 'transform', 'translate(0 6) rotate(16 -58 -40)'); s('bBrowR', 'transform', 'translate(0 6) rotate(-16 58 -40)');
        s('bMouth', 'd', 'M-40,100 Q10,118 48,86');
        document.querySelectorAll('.rgbF').forEach((e, i) => e.setAttribute('fill', `hsl(${(i * 40) % 360},90%,60%)`));
      } else {
        document.getElementById('mLight').setAttribute('opacity', 0); document.getElementById('mHood').setAttribute('opacity', 0); document.getElementById('mHoodBack').setAttribute('opacity', 1);
      }
    }, v);
    await p.screenshot({ path: path.join(__dirname, `preview_${v}.png`), clip: { x: 0, y: 0, width: 1280, height: 720 } });
  }
  await b.close();
  console.log('ok');
})();
