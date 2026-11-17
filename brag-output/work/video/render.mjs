import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'Brag', browserExecutable });
let last = -1;
await renderMedia({
  composition, serveUrl, browserExecutable, codec: 'h264', crf: 18, pixelFormat: 'yuv420p',
  audioCodec: 'aac', audioBitrate: '192k', outputLocation: path.resolve('../render.mp4'),
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(`progress ${p * 10}%`); } },
});
console.log('done');
