import { Collapse } from '@/components/Collapse';
import { Slider } from '@/components/Slider';
import { ProjectContext } from '@/pages/project/ProjectPage';
import { useContext } from 'react';
import Select from 'react-select';

export const RightBar = (): React.ReactElement => {
	// TODO remove
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { niivueWrapper } = useContext(ProjectContext);

	if (
		niivueWrapper === undefined ||
		niivueWrapper.current === undefined ||
		niivueWrapper.current === null
	) {
		return (
			<div className="w-[16rem] grow-0 bg-gray-100 border border-gray-500">
				<span className="m-4 block text-gray-500 text-xs text-center">
					Niivue is not initialized
				</span>
			</div>
		);
	}

	// TODO choose volume according to selected file name
	// const niivueVolume = niivue?.volumes.find(
	// 	(volume) => volume.name === selectedFile
	// );
	const niivueVolume = niivueWrapper.current.niivue.volumes[0];
	const niivueVolumeIndex = 0;

	const colorMapOptions = niivueWrapper.current.niivue
		.colormaps()
		.map((colormap) => {
			return { value: colormap, label: colormap };
		});

	return (
		<div className="w-[16rem] grow-0 bg-gray-100 border border-gray-500">
			{niivueVolume === undefined ? (
				<span className="m-4 block text-gray-500 text-xs text-center">
					Select a volume to use this section.
				</span>
			) : (
				<Collapse
					className="border-b border-gray-300 pl-1 pt-1 pr-4"
					title={
						<span className="font-semibold">
							{niivueVolume.name ?? 'No file selected'}
						</span>
					}
				>
					<>
						<Slider
							className="mt-1"
							label="Opacity"
							defaultValue={niivueVolume.opacity * 100}
							unit="%"
							onChange={(value) => {
								niivueWrapper?.current?.niivue.setOpacity(
									niivueVolumeIndex,
									value / 100
								);
							}}
						></Slider>
						<div className="flex items-center mb-4">
							<span className="grow mr-2">Color Map:</span>
							<Select
								options={colorMapOptions}
								classNames={{
									indicatorSeparator: () => 'hidden',
									singleValue: () => 'text-xs z-1',
									menu: () => 'text-xs',
								}}
								defaultValue={colorMapOptions.find(
									(colorMapOption) =>
										colorMapOption.value === niivueVolume.colorMap
								)}
								onChange={(colorMap) => {
									if (colorMap === null) return;
									niivueVolume.colorMap = colorMap.value;
									niivueWrapper?.current?.niivue.updateGLVolume();
								}}
							/>
						</div>
						<span>Contrast & Brightness</span>
						<Slider
							className="mt-1"
							label="Minimum"
							defaultValue={niivueVolume.cal_min}
							onChange={(value) => {
								niivueVolume.cal_min = value;
								niivueWrapper?.current?.niivue.updateGLVolume();
							}}
						></Slider>
						<Slider
							className="mt-1"
							label="Maximum"
							defaultValue={niivueVolume.cal_max}
							onChange={(value) => {
								niivueVolume.cal_max = value;
								niivueWrapper?.current?.niivue.updateGLVolume();
							}}
						></Slider>
					</>
				</Collapse>
			)}
		</div>
	);
};
