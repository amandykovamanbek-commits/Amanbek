// node render.cjs out.mp4 [fps] [workers] [scale] [t0] [t1]
const { chromium } = require('playwright'); const path = require('path'); const { spawn, execSync } = require('child_process'); const fs = require('fs');
const [out, fpsA = '60', wA = '4', scA = '1', t0A, t1A] = process.argv.slice(2);
const fps = +fpsA, NW = +wA, sc = +scA;
(async () => {
  const b0 = await chromium.launch(); const p0 = await b0.newPage();
  await p0.goto('file://' + path.resolve(__dirname, '../src/index.html') + '?render=1'); const DUR = await p0.evaluate(() => window.__DUR); await b0.close();
  const T0 = t0A ? +t0A : 0, T1 = t1A ? +t1A : DUR; const N = Math.round((T1 - T0) * fps);
  const tmp = path.resolve(path.dirname(out), '_parts'); fs.mkdirSync(tmp, { recursive: true });
  const per = Math.ceil(N / NW); const st = Date.now(); let doneAll = 0;
  await Promise.all([...Array(NW)].map(async (_, w) => {
    const a = w * per, z = Math.min(N, a + per); if (a >= z) return;
    const br = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
    pg.on('pageerror', e => console.log('ERR', e.message));
    await pg.goto('file://' + path.resolve(__dirname, '../src/index.html') + '?render=1'); await pg.evaluate(() => document.fonts.ready);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=${Math.round(1080 * sc)}:${Math.round(1920 * sc)}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', sc < 1 ? '23' : '15', '-r', String(fps), `${tmp}/p${w}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < z; f++) {
      const t = T0 + f / fps;
      const b64 = await pg.evaluate(t => { window.__seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95).split(',')[1]; }, t);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (++doneAll % 300 === 0) console.log(`${doneAll}/${N} frames, ${((Date.now() - st) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close();
  }));
  fs.writeFileSync(`${tmp}/list.txt`, [...Array(NW)].map((_, w) => `file 'p${w}.mp4'`).filter((_, w) => w * per < N).join('\n'));
  execSync(`ffmpeg -v error -y -f concat -safe 0 -i ${tmp}/list.txt -c copy ${out}`);
  console.log('done', out, ((Date.now() - st) / 1000).toFixed(0) + 's');
})();
