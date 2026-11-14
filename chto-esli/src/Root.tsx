import { Composition, Folder } from 'remotion';
import { ChtoEsliKot } from './kot/ChtoEsliKot';

export const RemotionRoot: React.FC = () => {
	return (
		<Folder name="Chto-esli">
			<Composition id="KotShorts" component={ChtoEsliKot} durationInFrames={360} fps={30} width={1080} height={1920} />
		</Folder>
	);
};
