import { Niivue } from '@niivue/niivue';
import { useRef, useEffect } from 'react';
import Select from 'react-select';
import ReactSlider from 'react-slider';

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
				<div className="flex items-center mt-2">
					<label htmlFor="opacityInput" className="mr-4">
						On drag with right click:
					</label>
					<Select
						id="rightClickSelection"
						className="flex-grow"
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
				</div>
				<div className="flex items-center mt-2">
					<label htmlFor="opacityInput" className="mr-4">
						Opacity:
					</label>
					<ReactSlider
						id="opacityInput"
						className="flex-grow h-7"
						thumbClassName="bg-gray-300 w-8 h-8 cursor-pointer rounded-full flex items-center justify-center"
						trackClassName="mt-3 rounded h-2 bg-gray-200 mx-4"
						defaultValue={100}
						renderThumb={(props, state) => (
							<div {...props}>{state.valueNow}</div>
						)}
						pearling
						onChange={(value: number[]) => {
							nv.current.setOpacity(0, value / 100);
							nv.current.setOpacity(1, value / 100);
						}}
					/>
				</div>
				<div className="flex items-center mt-2">
					<label htmlFor="contrastInput" className="mr-4">
						Contrast:
					</label>
					<ReactSlider
						id="contrastInput"
						className="flex-grow h-7"
						thumbClassName="bg-gray-300 w-8 h-8 cursor-pointer rounded-full flex items-center justify-center"
						trackClassName="mt-3 rounded h-2 bg-gray-200 mx-4"
						defaultValue={[40, 80]}
						ariaLabel={['Lower thumb', 'Upper thumb']}
						ariaValuetext={(state) => `Thumb value ${state.valueNow}`}
						renderThumb={(props, state) => (
							<div {...props}>{state.valueNow}</div>
						)}
						pearling
						minDistance={10}
						onChange={(values: number[]) => {
							nv.current.volumes[0].cal_min = values[0];
							nv.current.volumes[0].cal_max = values[1];
							nv.current.updateGLVolume();
						}}
					/>
				</div>
			</div>
			<div className="m-6">
				<canvas ref={canvas} height={640} width={640} />
			</div>
		</>
	);
};
