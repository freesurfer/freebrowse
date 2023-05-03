import { useRef, useEffect } from 'react';
import { Niivue } from '@niivue/niivue';

export const MriViewer = (): React.ReactElement => {
	const canvas = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const volumeList = [
			{
				url: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
			},
		];
		const nv = new Niivue({});
		nv.attachToCanvas(canvas.current);
		nv.loadVolumes(volumeList).then(() =>
			console.log(canvas.current?.toDataURL())
		);
	}, []);

	return (
		<div className="m-6 h-full">
			<canvas className="m-0 h-full" ref={canvas} />
		</div>
	);
};
