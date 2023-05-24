import { ProjectContext } from '@/pages/project/ProjectPage';
import { useContext, useEffect, useRef } from 'react';

export const MainView = (): React.ReactElement => {
	const canvas = useRef<HTMLCanvasElement>(null);
	const { niivue } = useContext(ProjectContext);

	useEffect(() => {
		const initNiivue = async (): Promise<void> => {
			if (canvas.current === null) return;
			if (niivue === undefined) return;
			await niivue.attachToCanvas(canvas.current);
		};

		void initNiivue();
	}, [niivue, canvas]);

	return (
		<div className="border-2 border-gray-500 relative grow">
			<canvas className="absolute" ref={canvas} />
		</div>
	);
};
