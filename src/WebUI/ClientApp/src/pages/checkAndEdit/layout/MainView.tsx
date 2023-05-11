import { Niivue } from '@niivue/niivue';
import { useEffect, useRef } from 'react';

export const MainView = (): React.ReactElement => {
	const canvas = useRef<HTMLCanvasElement>(null);
	const nv = useRef<Niivue>(new Niivue());

	useEffect(() => {
		const initNiivue = async (): Promise<void> => {
			const volumeList = [
				{
					url: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
				},
			];

			if (canvas.current === null) return;
			await nv.current.attachToCanvas(canvas.current);

			await nv.current.loadVolumes(volumeList);
		};

		void initNiivue();
	}, []);

	return (
		<div className="border-2 border-gray-500">
			<canvas ref={canvas} />
		</div>
	);
};
