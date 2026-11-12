// node render.cjs frames 1,5.5 outdir          -> PNG stills
// node render.cjs cues out.json                 -> audio cue list
// node render.cjs video out.mp4 [fps] [workers] -> silent H.264 (parallel segments, concatenated)
// node render.cjs seg out.mp4 fps from to       -> one segment (internal)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const dir = __dirname;
async function open() {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto('file://' + path.join(dir, 'index.html') + '?render');
  await page.waitForFunction(() => window.READY === true);
  return { browser, page, duration: await page.evaluate(() => window.DURATION) };
}
(async () => {
  const [mode, a1, a2, a3, a4] = process.argv.slice(2);
  if (mode === 'video') {
    const fps = +(a2 || 60), nw = +(a3 || 4);
    const { browser, duration } = await open(); await browser.close();
    const n = Math.ceil(duration * fps), per = Math.ceil(n / nw);
    const tmp = path.join(path.dirname(path.resolve(a1)), '_seg'); fs.mkdirSync(tmp, { recursive: true });
    const t0 = Date.now();
    await Promise.all(Array.from({ length: nw }, (_, k) => new Promise((res, rej) => {
      const p = spawn('node', [__filename, 'seg', path.join(tmp, `s${k}.mp4`), fps, k * per, Math.min(n, (k + 1) * per)], { stdio: 'inherit' });
      p.on('close', c => c === 0 ? res() : rej(new Error('seg ' + k + ' failed')));
    })));
    fs.writeFileSync(path.join(tmp, 'list.txt'), Array.from({ length: nw }, (_, k) => `file 's${k}.mp4'`).join('\n'));
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', a1]);
    console.log('video done', n, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
    return;
  }
  const { browser, page, duration } = await open();
  if (mode === 'frames') {
    fs.mkdirSync(a2, { recursive: true });
    for (const s of a1.split(',').map(Number)) {
      await page.evaluate(t => renderAt(t), s);
      await page.screenshot({ path: path.join(a2, `f_${s.toFixed(2).padStart(6, '0')}.png`) });
    }
  } else if (mode === 'cues') {
    fs.writeFileSync(a1, JSON.stringify(await page.evaluate(() => getAudioCues()), null, 1));
  } else if (mode === 'seg') {
    const fps = +a2, from = +a3, to = +a4;
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), '-g', String(fps), a1], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let i = from; i < to; i++) {
      await page.evaluate(t => renderAt(t), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((i - from) % 300 === 0) console.log(`[${from}] frame ${i - from}/${to - from} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  console.log('duration', duration.toFixed(2));
  await browser.close();
})();
