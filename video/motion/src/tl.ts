import { buildTimeline } from './timeline';
import words from './words.json';
import meta from './meta.json';
export const META = meta as any;
export const TL = buildTimeline(words as any, META.lead || 0);
