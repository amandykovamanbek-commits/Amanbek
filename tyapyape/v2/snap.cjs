// usage: node snap.cjs outdir t1 t2 ...  -> outdir/f_<t>.jpg (540x960)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [out, ...ts] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../v2/index.html') + '?render=1'); await p.evaluate(() => document.fonts.ready);
  for (const t of ts) { await p.evaluate(t => window.__seek(+t), t); await p.locator('canvas').screenshot({ path: `${out}/f_${(+t).toFixed(2).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 80, scale: 'css' }); }
  if (errs.length) console.log('ERRORS:', [...new Set(errs)].slice(0, 5).join('\n')); await b.close();
})();
