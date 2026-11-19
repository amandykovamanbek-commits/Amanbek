import type React from "react";
import type { Ctx } from "../kit";

export type Sfx = [number, string, number?]; // [offset s, name, gain]
export type Shot = {
  at: string; // cue phrase in the chapter text ("^" = chapter start)
  r: (c: Ctx) => React.ReactNode;
  cut?: "cut" | "fade" | "flash" | "black";
  lead?: number; delay?: number; noHud?: boolean;
  sfx?: Sfx[];
  music?: string; // mood change from this shot on
};
