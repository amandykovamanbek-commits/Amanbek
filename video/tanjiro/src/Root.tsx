import { Composition } from "remotion";
import { ModelSheet, FaceSheet } from "./ModelSheet";
import { Cast } from "./Cast";
import { Thumb } from "./Thumb";
import { Main, TOTAL } from "./Main";
export const RemotionRoot = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.ceil(TOTAL * 30)} fps={30} width={1920} height={1080} />
    {[0, 1, 2, 3].map((i) => (
      <Composition key={i} id={`Sheet${i}`} component={ModelSheet} durationInFrames={30} fps={30} width={1920} height={1080} defaultProps={{ page: i }} />
    ))}
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Cast" component={Cast} durationInFrames={30} fps={30} width={1920} height={1080} />
  </>
);
