import { Niivue } from '@niivue/niivue';
import { useRef, useEffect } from 'react';

export const MriViewerDraw = (): React.ReactElement => {
	const canvas = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const initNiivue = async (): Promise<void> => {
			const volumeList = [
				{
					url: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
				},
			];

			const nv = new Niivue({
				drawingEnabled: true,
			});

			if (canvas.current === null) return;
			await nv.attachToCanvas(canvas.current);

			await nv.loadVolumes(volumeList);

			await nv.createEmptyDrawing();
			nv.setPenValue(1, true);
		};

		void initNiivue();
	}, []);

	return (
		<div className="m-6">
			<canvas ref={canvas} height={640} width={640} />
		</div>
	);
};
