const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => errs.push(m.text()));
  await p.goto('file://' + path.resolve(__dirname, 'index.html') + '?render=1'); const r = await p.evaluate(() => SCN.map(s => [s.a.toFixed(2), s.b.toFixed(2)]).concat([[DUR]]));
  console.log(JSON.stringify(r)); console.log(errs.slice(0, 8).join('\n')); await b.close(); })();
