// parallel frame renderer (same contract as obsion render.cjs: window.__seek(t), frame-exact screenshots)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const [page_, outDir, fpsS, worker, workers] = process.argv.slice(2); const fps = +fpsS, wi = +worker, wn = +workers;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(page_)); await p.evaluate(async () => { await document.fonts.ready; });
  const total = await p.evaluate(() => window.__duration), n = Math.round(total * fps);
  if (wi === 0 && process.argv.includes('--audio')) { const b64 = await p.evaluate(async () => await window.__audioWav()); fs.writeFileSync(path.join(outDir, '..', 'sfx.wav'), Buffer.from(b64, 'base64')); }
  const per = Math.ceil(n / wn), a = wi * per, z = Math.min(n, a + per);
  for (let i = a; i < z; i++) {
    await p.evaluate(t => window.__seek(t), i / fps);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await p.screenshot({ path: path.join(outDir, `f${String(i).padStart(6, '0')}.png`) });
    if ((i - a) % 120 === 0) console.log(`w${wi} ${i - a}/${z - a}`);
  }
  await b.close(); console.log(`w${wi} done`);
})();
