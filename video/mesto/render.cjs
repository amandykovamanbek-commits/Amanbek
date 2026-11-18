// node render.cjs stills 1,5.5,10 outdir [scale] [test]   -> JPG stills at given seconds
// node render.cjs frames <f0> <f1> outdir [scale]          -> frames f0..f1-1 as JPG (24 fps)
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path');
const serve = require('./server.cjs');
(async () => {
  const [mode, a1, a2, a3, a4, a5] = process.argv.slice(2);
  const { server, port } = await serve(__dirname);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const scale = +(mode === 'stills' ? (a3 || 0.5) : (a4 || 1));
  const test = mode === 'stills' ? a4 : null;
  const page = await browser.newPage({ viewport: { width: Math.round(1920 * scale), height: Math.round(1080 * scale) } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('CONSOLE', m.text().slice(0, 300)); });
  const q = `?scale=${scale}` + (test ? `&test=${test}` : '') + (process.env.MSAA ? `&msaa=${process.env.MSAA}` : '');
  await page.goto(`http://localhost:${port}/index.html${q}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 600000 });
  const fps = 24;
  if (mode === 'stills') {
    fs.mkdirSync(a2, { recursive: true });
    for (const s of a1.split(',').map(Number)) {
      const t0 = Date.now();
      const label = await page.evaluate(t => renderAt(t), s);
      await page.screenshot({ path: path.join(a2, `s_${s.toFixed(2)}.jpg`), type: 'jpeg', quality: 90 });
      console.log(`still ${s} ${label} ${Date.now() - t0}ms`);
    }
  } else if (mode === 'frames') {
    fs.mkdirSync(a3, { recursive: true });
    const f0 = +a1, f1 = Math.min(+a2, Math.ceil(await page.evaluate(() => DURATION) * fps));
    const t0 = Date.now();
    for (let i = f0; i < f1; i++) {
      const out = path.join(a3, `f_${String(i).padStart(5, '0')}.jpg`);
      if (fs.existsSync(out) && !process.env.FORCE) continue;
      await page.evaluate(t => renderAt(t), i / fps);
      await page.screenshot({ path: out, type: 'jpeg', quality: 93 });
      if ((i - f0) % 24 === 0) console.log(`frame ${i}/${f1} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  await browser.close(); server.close();
})();
