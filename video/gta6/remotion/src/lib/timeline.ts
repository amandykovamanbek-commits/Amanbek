import T from '../timing.json';
import {FPS} from './theme';

export type Word = {w: string; n: string; s: number; e: number};
export type SceneT = {id: string; start: number; dur: number; audio: string | null; words: Word[]; title?: number[]};

export const TIMING = T as unknown as {fps: number; total: number; frames: number; end: number[]; scenes: SceneT[]};

const norm = (w: string) => w.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

export const scene = (id: string) => {
  const s = TIMING.scenes.find((x) => x.id === id);
  if (!s) throw new Error('no scene ' + id);
  return s;
};

/**
 * Resolve a cue phrase inside a scene to a time (seconds).
 * Matches the first occurrence at or after word index `from`. Returns {t, idx}.
 */
export const findCue = (id: string, phrase: string, from = 0) => {
  const s = scene(id);
  const p = phrase.split(/\s+/).map(norm).filter(Boolean);
  for (let i = from; i <= s.words.length - p.length; i++) {
    if (p.every((x, k) => s.words[i + k].n === x)) return {t: s.words[i].s, idx: i};
  }
  throw new Error(`cue "${phrase}" not found in ${id} after ${from}`);
};

export const sec2f = (t: number) => Math.round(t * FPS);

/** Time of a word cue as a global frame (first match in scene, searching from start). */
export const cueF = (id: string, phrase: string) => sec2f(findCue(id, phrase).t);
/** End of a word as global frame */
export const wordEndF = (id: string, phrase: string) => {
  const {idx} = findCue(id, phrase);
  const p = phrase.split(/\s+/).filter((x) => norm(x)).length;
  return sec2f(scene(id).words[idx + p - 1].e);
};
export const sceneStartF = (id: string) => sec2f(scene(id).start);
export const sceneVoiceEndF = (id: string) => sec2f(scene(id).start + scene(id).dur);
