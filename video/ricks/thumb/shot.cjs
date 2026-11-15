const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto('file://' + path.join(__dirname, 'thumb.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await (await p.$('#t')).screenshot({ path: path.join(__dirname, 'обложка_youtube.png') }); await b.close(); })();
