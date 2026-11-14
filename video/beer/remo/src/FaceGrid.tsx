// A sheet of every character of the Pisa short x the main expressions (heads and shoulders), drawn with the same
// Canvas2D code as the video's cards (toon.ts). Rendered as a still for review; not part of the video.
import React, { useEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen, bodyFront, MASONS, KNIGHT, DUCE, BLACKSHIRT, WORKER34, GUARD, ENGINEER, TOURISTS, KID, Expr, Outfit, TOWNS12 } from "./videos/beer/toon";

const ROWS: [string, Outfit][] = [
  ["Каменщик", MASONS[0]], ["Каменщик 2", MASONS[3]], ["Горожанка", TOWNS12[0]], ["Рыцарь", KNIGHT(1)], ["Муссолини", DUCE], ["Чернорубашечник", BLACKSHIRT],
  ["Рабочий 1934", WORKER34[1]], ["Охранник", GUARD], ["Инженер", ENGINEER(0)], ["Инженер 2", ENGINEER(2)], ["Турист", TOURISTS[1]], ["Мальчик", KID],
];
const EX: Expr[] = ["neutral", "smile", "grin", "laugh", "shock", "nervous", "pained", "stern"];
const CW = 180, CH = 250, LW = 230, TOP = 60;
export const FACE_W = LW + EX.length * CW, FACE_H = TOP + ROWS.length * CH;

export const FaceGrid: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("face grid"));
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#f4efe6"; g.fillRect(0, 0, FACE_W, FACE_H);
    g.fillStyle = "#241726"; g.font = "bold 26px sans-serif";
    EX.forEach((e, c) => g.fillText(e, LW + c * CW + 12, 40));
    ROWS.forEach(([name, o], r) => {
      g.fillStyle = "#241726"; g.font = "bold 24px sans-serif"; g.fillText(name, 14, TOP + r * CH + CH / 2);
      EX.forEach((e, c) => {
        g.save();
        g.translate(LW + c * CW, TOP + r * CH);
        g.beginPath(); g.rect(0, 0, CW, CH); g.clip();
        g.fillStyle = (r + c) % 2 ? "#ebe3d6" : "#f7f2ea"; g.fillRect(0, 0, CW, CH);
        const k = 0.5, kid = o.build === "kid";
        g.scale(k, k);
        g.translate(-120, kid ? -150 : -60); // design crop x 120..480, y 60..560 (heads and shoulders)
        bodyFront(new Pen(g), o, { mode: "stand", expr: e, seed: r * 7 + c + 1 });
        g.restore();
      });
    });
    continueRender(h);
  }, [h]);
  return <AbsoluteFill><canvas ref={ref} width={FACE_W} height={FACE_H} /></AbsoluteFill>;
};
