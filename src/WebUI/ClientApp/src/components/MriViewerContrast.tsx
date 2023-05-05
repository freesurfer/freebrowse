import { Niivue } from '@niivue/niivue';
import { useRef, useEffect } from 'react';
import Select from 'react-select';

export const MriViewerContrast = (): React.ReactElement => {
	const canvas = useRef<HTMLCanvasElement>(null);
	const nv = useRef<Niivue>(new Niivue());

	const dragModeSelectionOptions = [
		{ value: nv.current.dragModes.none, label: 'none' },
		{ value: nv.current.dragModes.contrast, label: 'contrast' },
		{ value: nv.current.dragModes.measurement, label: 'measurement' },
		{ value: nv.current.dragModes.pan, label: 'pan' },
		{ value: nv.current.dragModes.slicer3D, label: 'slicer3D' },
	];

	useEffect(() => {
		const initNiivue = async (): Promise<void> => {
			const volumeList = [
				{
					url: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
				},
			];

			if (canvas.current === null) return;
			nv.current.attachToCanvas(canvas.current);

			await nv.current.loadVolumes(volumeList);
		};

		void initNiivue();
	}, []);

	return (
		<>
			<div className="m-6">
				<Select
					options={dragModeSelectionOptions}
					defaultValue={dragModeSelectionOptions[1]}
					onChange={(newValue) => {
						if (newValue === null) return;
						if (
							![
								nv.current.dragModes.none,
								nv.current.dragModes.contrast,
								nv.current.dragModes.measurement,
								nv.current.dragModes.pan,
								nv.current.dragModes.slicer3D,
							].includes(newValue.value)
						)
							return;
						nv.current.opts.dragMode = newValue.value;
					}}
				/>
				<p>
					Use the right key dragging on the image to adapt the selected property
				</p>
				<label htmlFor="opacityInput" className="mr-4">
					Opacity:
				</label>
				<input
					className="border p-1 text-end"
					id="opacityInput"
					type="number"
					defaultValue={1.0}
					min="0"
					max="1"
					step={0.1}
					onChange={(e) => nv.current.setOpacity(0, Number(e.target.value))}
				></input>
			</div>
			<div className="m-6">
				<canvas ref={canvas} height={640} width={640} />
			</div>
		</>
	);
};
