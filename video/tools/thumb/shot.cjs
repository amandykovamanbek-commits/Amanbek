const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 1500 } });
  await p.goto('file://' + path.join(__dirname, 'thumbs.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  for (const [id, n] of [['v1', 'обложка_A.png'], ['v2', 'обложка_B.png']]) await (await p.$('#' + id)).screenshot({ path: path.join(__dirname, n) });
  await b.close(); })();
