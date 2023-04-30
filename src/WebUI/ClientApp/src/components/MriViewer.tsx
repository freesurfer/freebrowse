import { useRef, useEffect } from 'react';
import { Niivue } from '@niivue/niivue';

export const MriViewer = () => {
	const canvas: any = useRef();
	useEffect(() => {
		const volumeList = [
			{
				url: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
			},
		];
		const nv = new Niivue({ isResizeCanvas: false });
		nv.attachToCanvas(canvas.current);
		nv.loadVolumes(volumeList).then(() =>
			console.log(canvas.current.toDataURL())
		);
	}, []);

	return (
		<div>
			{' '}
			<canvas ref={canvas} height={640} width={640} />{' '}
		</div>
	);
};
