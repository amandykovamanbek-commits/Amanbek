// HUD state changes keyed to narration cues.
export type HudEvent = {
  ch: number; at?: string; age?: number; fam?: number;
  set?: { friends?: number; countdown?: [number, number] | undefined; heart?: boolean };
  cdTo?: [number, string]; // start a dawn countdown that ends at this cue
};
export const HUD_EVENTS: HudEvent[] = [
  { ch: 0, age: 13, fam: 6 },
  { ch: 1, at: "Только Незуко ещё тёплая", fam: 1 },
  { ch: 3, at: "Однажды ты наконец", age: 15 },
  { ch: 11, at: "В деревне кузнецов", age: 16 },
  { ch: 12, at: "До рассвета", cdTo: [13, "Мудзан горит"] },
  { ch: 13, at: "Мудзан горит", set: { countdown: undefined } },
  { ch: 14, at: "Твоё сердце останавливается", set: { heart: true } },
  { ch: 14, at: "Ты возвращаешься", set: { heart: false } },
  { ch: 15, at: "Ты возвращаешься в дом", set: { friends: 3 } },
];
