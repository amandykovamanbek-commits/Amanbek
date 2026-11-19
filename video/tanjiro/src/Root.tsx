import { Composition } from "remotion";
import { ModelSheet, FaceSheet } from "./ModelSheet";
import { Cast } from "./Cast";
import { Thumb } from "./Thumb";
import { ThumbGenre } from "./ThumbGenre";
import { Main, TOTAL } from "./Main";
export const RemotionRoot = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.ceil(TOTAL * 30)} fps={30} width={1920} height={1080} />
    {[0, 1, 2, 3].map((i) => (
      <Composition key={i} id={`Sheet${i}`} component={ModelSheet} durationInFrames={30} fps={30} width={1920} height={1080} defaultProps={{ page: i }} />
    ))}
    {[1, 2, 3].map((v) => (
      <Composition key={v} id={`Thumb${v}`} component={Thumb} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{ v }} />
    ))}
    {[1, 2, 3].map((v) => (
      <Composition key={"g" + v} id={`Cover${v}`} component={ThumbGenre} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{ v }} />
    ))}
    <Composition id="Cast" component={Cast} durationInFrames={30} fps={30} width={1920} height={1080} />
  </>
);
