import { Niivue } from '@niivue/niivue';
import { useRef, useEffect } from 'react';

export const MriViewer = (): React.ReactElement => {
	const canvas = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const volumeList = [
			{
				url: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
			},
		];

		if (canvas.current === null) {
			console.warn('canvas reference not wired, niivue can not get rendered');
			return;
		}

		const nv = new Niivue({});
		nv.attachToCanvas(canvas.current);
		void nv
			.loadVolumes(volumeList)
			.then(() => console.log(canvas.current?.toDataURL()));
	}, []);

	return (
		<div className="m-6 h-full">
			<canvas className="m-0 h-full" ref={canvas} />
		</div>
	);
};
