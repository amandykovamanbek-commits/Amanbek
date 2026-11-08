// node thumb2.cjs -> preview_C.png (было/стало), preview_D.png (продать за 10 млн?)
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + path.join(__dirname, '..', 's2e5', 'index.html') + '?render');
  await p.waitForFunction(() => window.READY === true);
  await p.evaluate(() => document.fonts.ready);
  for (const v of ['C', 'D']) {
    await p.evaluate((v) => {
      const txt = (x, y, s, fill, str, sw = 16, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="900" fill="${fill}" stroke="#111" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round" ${extra}>${str}</text>`;
      const pill = (x, y, w, h, bg, fg, s, str) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}"/><text x="${x + w / 2}" y="${y + h / 2 + s * .36}" text-anchor="middle" font-size="${s}" font-weight="900" fill="${fg}">${str}</text>`;
      const danaAt = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc}) translate(-540 -1170)"><g id="charPos">${charSVG()}</g></g>`;
      let html;
      if (v === 'C') {
        html = `<defs><linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b6f7a"/><stop offset="1" stop-color="#3a3d46"/></linearGradient>
                  <linearGradient id="gV" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16a34a"/><stop offset="1" stop-color="#00b8e6"/></linearGradient>
                  <filter id="gray"><feColorMatrix type="saturate" values="0.15"/></filter></defs>
          <rect width="640" height="720" fill="url(#gG)"/><rect x="640" width="640" height="720" fill="url(#gV)"/>
          <g id="leftSlot" filter="url(#gray)"></g>
          <clipPath id="rightHalf"><rect x="652" y="0" width="628" height="720"/></clipPath><g clip-path="url(#rightHalf)">${danaAt(975, 430, .74)}</g>
          <rect x="628" y="0" width="24" height="720" fill="#fff"/>
          <g transform="translate(250 205) rotate(-8)"><rect x="-70" y="-80" width="140" height="160" rx="16" fill="#fff"/><text x="0" y="55" text-anchor="middle" font-size="150" font-weight="900" font-style="italic" fill="#e5383b">2</text></g>
          ${txt(400, 300, 96, '#ff4d4f', '0 ₽', 14)}
          <g transform="translate(1110 220) rotate(8)"><rect x="-110" y="-60" width="220" height="120" rx="20" fill="#fff"/>
            <path d="M-80,-35 V-50 H-55 M55,-50 H80 V-35 M80,35 V50 H55 M-55,50 H-80 V35" stroke="#16171d" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-25,0 L-5,20 L30,-18" stroke="#16a34a" stroke-width="11" fill="none" stroke-linecap="round"/></g>
          ${txt(30, 92, 82, '#fff', 'БЫЛО')}${txt(1250, 92, 82, '#FFD43B', 'СТАЛО', 16, 'text-anchor="end"')}
          <g transform="translate(310 548)"><rect width="660" height="150" rx="26" fill="#16171d"/>
            <rect x="24" y="22" width="64" height="64" rx="14" fill="#FFD43B"/><polygon points="46,36 46,72 76,54" fill="#16171d"/>
            <text x="104" y="78" font-size="64" font-weight="900" fill="#FFD43B" textLength="530" lengthAdjust="spacingAndGlyphs">ДАНЯ МОНТАЖЁР</text>
            <text x="330" y="128" text-anchor="middle" font-size="30" font-weight="900" fill="#fff">своя студия в 15 лет · 1–2 сезон</text></g>`;
      } else {
        html = `<defs><radialGradient id="gD" cx="40%" cy="45%" r="80%"><stop offset="0" stop-color="#3a1d5c"/><stop offset=".6" stop-color="#1a0f2e"/><stop offset="1" stop-color="#07050c"/></radialGradient>
                  <radialGradient id="ph" cx="50%" cy="50%"><stop offset="0" stop-color="#7fd4ff" stop-opacity=".7"/><stop offset="1" stop-color="#7fd4ff" stop-opacity="0"/></radialGradient></defs>
          <rect width="1280" height="720" fill="url(#gD)"/>
          <g transform="translate(1110 470) scale(.55) translate(-540 -1100)" opacity=".9">${markSVG()}</g>
          <rect x="880" y="0" width="400" height="720" fill="#000" opacity=".35"/>
          <ellipse cx="420" cy="520" rx="320" ry="260" fill="url(#ph)"/>
          ${danaAt(400, 400, .82)}
          <g transform="translate(870 300) rotate(-5)"><rect x="-270" y="-140" width="540" height="280" rx="28" fill="#fff"/>
            <text x="0" y="-70" text-anchor="middle" font-size="28" font-weight="800" fill="#8a8f9c">ПРЕДЛОЖЕНИЕ О ПОКУПКЕ</text>
            <text x="0" y="22" text-anchor="middle" font-size="78" font-weight="900" fill="#16a34a">10 000 000 ₽</text>
            <text x="0" y="90" text-anchor="middle" font-size="34" font-weight="900" fill="#16171d">за «Чистый кадр»</text></g>
          ${txt(40, 110, 110, '#FFD43B', 'ПРОДАТЬ?', 18)}
          <g transform="translate(36 540)"><rect width="600" height="150" rx="26" fill="#16171d"/>
            <rect x="24" y="24" width="64" height="64" rx="14" fill="#FFD43B"/><polygon points="46,38 46,74 76,56" fill="#16171d"/>
            <text x="104" y="80" font-size="62" font-weight="900" fill="#FFD43B" textLength="470" lengthAdjust="spacingAndGlyphs">ДАНЯ МОНТАЖЁР</text>
            <rect x="24" y="100" width="300" height="36" rx="18" fill="#e5383b"/><text x="174" y="126" text-anchor="middle" font-size="22" font-weight="900" fill="#fff">1–2 СЕЗОН · ВСЕ СЕРИИ</text></g>`;
      }
      document.body.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" style="display:block;font-family:Inter">${html}</svg>`;
      document.body.style.margin = '0';
      if (v === 'C') {
        // left: sad Danya with old-laptop vibe (cloned, ids stripped), right: cheering Danya (live)
        applyChar(0.5, MOODS.sad, 'idle', 0, 0, 0, { bg: 'x' });
        document.getElementById('charPos').setAttribute('transform', 'translate(540 1170)');
        const clone = document.getElementById('charPos').cloneNode(true);
        clone.removeAttribute('id'); clone.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
        const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        wrap.setAttribute('transform', 'translate(300 450) scale(.74) translate(-540 -1170)'); wrap.appendChild(clone);
        document.getElementById('leftSlot').appendChild(wrap);
        applyChar(0.5, MOODS.happy, 'cheer', 0, 0, 0, { bg: 'x' });
      } else {
        applyChar(0.5, MOODS.shock, 'phone', .3, 0, 0, { bg: 'bedNight' });
        document.getElementById('sweat').setAttribute('opacity', 1);
        document.getElementById('mLight').setAttribute('opacity', 0); document.getElementById('mHood').setAttribute('opacity', 0); document.getElementById('mHoodBack').setAttribute('opacity', 1);
        document.getElementById('mMouth').setAttribute('d', 'M-34,106 Q10,100 38,94');
      }
      document.getElementById('charPos').setAttribute('transform', 'translate(540 1170)');
    }, v);
    await p.screenshot({ path: path.join(__dirname, `preview_${v}.png`), clip: { x: 0, y: 0, width: 1280, height: 720 } });
  }
  await b.close(); console.log('ok');
})();
