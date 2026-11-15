const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 2300 } });
await p.goto('file://' + path.join(__dirname, 'variants.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
for (const [id, n] of [['A', 'обложка_A_триптих'], ['B', 'обложка_B_скопировал'], ['C', 'обложка_C_ии_сделал']]) await (await p.$('#' + id)).screenshot({ path: path.join(__dirname, n + '.png') });
await b.close(); })();
