// usage: node render.js timeline.json outdir [w h] [times(comma) for preview]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [tlPath, outDir, W = '1080', H = '1920', only] = process.argv.slice(2);
const root = __dirname;
const types = { '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((q, r) => {
  const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
}).listen(0, async () => {
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE', m.text()); });
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?w=${W}&h=${H}`);
  await page.waitForFunction(() => window.ready && window.renderAt, null, { timeout: 60000 });
  await page.evaluate(() => window.ready);
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  await page.evaluate(t => window.setTimeline(t), tl);
  fs.mkdirSync(outDir, { recursive: true });
  const fps = tl.fps;
  let frames = only ? only.split(',').map(Number).map(s => Math.round(s * fps)) : [...Array(Math.ceil(tl.total * fps)).keys()];
  const t0 = Date.now();
  for (const f of frames) {
    const fn = path.join(outDir, `f${String(f).padStart(5, '0')}.jpg`);
    if (!only && fs.existsSync(fn)) continue;
    const url = await page.evaluate(t => window.renderAt(t), f / fps);
    fs.writeFileSync(fn, Buffer.from(url.split(',')[1], 'base64'));
    if (f % 60 === 0) console.log('frame', f, '/', frames.length, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  await browser.close(); srv.close();
});
