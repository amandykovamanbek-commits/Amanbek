// Builds sfx.wav and music.wav in public/ from the same timeline the video uses.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { buildTimeline, BPM } from '../src/timeline.ts';
const words = JSON.parse(readFileSync(new URL('../src/words.json', import.meta.url)));
const meta = JSON.parse(readFileSync(new URL('../src/meta.json', import.meta.url)));
const tl = buildTimeline(words, meta.lead || 0);
writeFileSync('out/sfx.json', JSON.stringify({ duration: tl.duration, events: tl.sfx }));
execFileSync('node', ['../sfx.cjs', 'out/sfx.json', 'public/sfx.wav'], { stdio: 'inherit' });
execFileSync('node', ['scripts/music.cjs', String(tl.duration), 'public/music.wav', String(BPM)], { stdio: 'inherit' });
console.log('scenes', tl.scenes.map(s => s.start.toFixed(2)).join(' '), 'dur', tl.duration.toFixed(2));
