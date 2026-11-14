import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/beer/Bridge";
import { FaceGrid, FACE_W, FACE_H } from "./FaceGrid";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BeerShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="FaceGrid" component={FaceGrid} durationInFrames={1} fps={30} width={FACE_W} height={FACE_H} />
  </>
);
