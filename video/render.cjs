// Usage:
//   node render.cjs frames 1,5,10.5 outdir   -> PNG stills at given seconds
//   node render.cjs video out.mp4 [fps]      -> silent H.264 video (frames piped to ffmpeg)
//   node render.cjs sfx sfx.json             -> dump SFX cue list + duration
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { writeFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const dir = __dirname;
(async () => {
const [mode, a1, a2, a3] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto('file://' + path.join(process.env.EP ? path.resolve(process.env.EP) : dir, 'index.html') + '?render');
await page.waitForFunction(() => window.READY === true);
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);

if (mode === 'frames') {
  mkdirSync(a2, { recursive: true });
  for (const s of a1.split(',').map(Number)) {
    await page.evaluate(t => renderAt(t), s);
    await page.screenshot({ path: path.join(a2, `f_${s.toFixed(2)}.png`) });
  }
} else if (mode === 'sfx') {
  const ev = await page.evaluate(() => getSfx());
  writeFileSync(a1, JSON.stringify({ duration, events: ev }, null, 1));
} else if (mode === 'video') {
  const fps = +(a2 || 30), n = Math.ceil(duration * fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), a1], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => renderAt(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
console.log('duration', duration.toFixed(2));
await browser.close();
})();
