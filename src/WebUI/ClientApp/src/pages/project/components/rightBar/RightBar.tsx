import { Collapse } from '@/components/Collapse';
import { Slider } from '@/components/Slider';
import { ProjectContext } from '@/pages/project/ProjectPage';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { useContext } from 'react';
import Select from 'react-select';

export const RightBar = ({
	projectState,
}: {
	projectState: ProjectState | undefined;
}): React.ReactElement => {
	const { niivueWrapper } = useContext(ProjectContext);

	if (
		niivueWrapper === undefined ||
		niivueWrapper.current === undefined ||
		niivueWrapper.current === null
	) {
		return (
			<div className="bg-gray-100 border-gray-500 w-[16rem] grow-0 border">
				<span className="text-gray-500 m-4 block text-center text-xs">
					Niivue is not initialized
				</span>
			</div>
		);
	}

	const selectedVolumes =
		projectState?.files.volumes
			.map((volumeFile) => {
				if (!volumeFile.isActive) return undefined;
				const niivueVolume = niivueWrapper.current?.niivue.volumes.find(
					(niivueVolume) => volumeFile.name === niivueVolume.name
				);
				return niivueVolume;
			})
			.filter((value) => value !== undefined) ?? [];

	const selectedSurfaces =
		projectState?.files.surfaces
			.map((surfaceFile) => {
				if (!surfaceFile.isActive) return undefined;
				const niivueSurface = niivueWrapper.current?.niivue.meshes.find(
					(niivueSurface) => surfaceFile.name === niivueSurface.name
				);
				return niivueSurface;
			})
			.filter((value) => value !== undefined) ?? [];

	const selectedFiles = [...selectedVolumes, ...selectedSurfaces];

	const colorMapOptions = niivueWrapper.current.niivue
		.colormaps()
		.map((colormap) => {
			return { value: colormap, label: colormap };
		});

	return (
		<div className="bg-gray-100 border-gray-500 w-[16rem] grow-0 border">
			{selectedFiles.length === 0 ? (
				<span className="text-gray-500 m-4 block text-center text-xs">
					Select a volume to use this section.
				</span>
			) : (
				<>
					{selectedVolumes.map((volume) => {
						if (volume === undefined) return <></>;
						return (
							<Collapse
								key={volume?.name}
								className="border-gray-300 border-b"
								title={
									<span className="font-semibold">
										{volume.name ?? 'No file selected'}
									</span>
								}
							>
								<div className="mr-4">
									<Slider
										className="mt-1"
										label="Opacity:"
										defaultValue={volume.opacity * 100}
										unit="%"
										onChange={(value) => {
											niivueWrapper?.current?.niivue.setOpacity(
												niivueWrapper.current.niivue.getVolumeIndexByID(
													volume.id
												),
												value / 100
											);
										}}
									></Slider>
									<div className="mb-4 flex items-center">
										<span className="mr-2 grow">Color Map:</span>
										<Select
											options={colorMapOptions}
											classNames={{
												indicatorSeparator: () => 'hidden',
												singleValue: () => 'text-xs z-1',
												menu: () => 'text-xs',
											}}
											defaultValue={colorMapOptions.find(
												(colorMapOption) =>
													colorMapOption.value === volume.colorMap
											)}
											onChange={(colorMap) => {
												if (colorMap === null) return;
												volume.colorMap = colorMap.value;
												niivueWrapper?.current?.niivue.updateGLVolume();
											}}
										/>
									</div>
									<span>Contrast & Brightness</span>
									<Slider
										className="mt-1"
										label="Minimum:"
										defaultValue={volume.cal_min}
										onChange={(value) => {
											volume.cal_min = value;
											niivueWrapper?.current?.niivue.updateGLVolume();
										}}
									></Slider>
									<Slider
										className="mt-1"
										label="Maximum:"
										defaultValue={volume.cal_max}
										onChange={(value) => {
											volume.cal_max = value;
											niivueWrapper?.current?.niivue.updateGLVolume();
										}}
									></Slider>
								</div>
							</Collapse>
						);
					})}
					{selectedSurfaces.map((surface) => {
						if (surface === undefined) return <></>;
						return (
							<Collapse
								key={surface?.name}
								className="border-gray-300 border-b pl-1 pr-4 pt-1"
								title={
									<span className="font-semibold">
										{surface.name ?? 'No file selected'}
									</span>
								}
							>
								<>
									<Slider
										className="mt-1"
										label="Opacity:"
										defaultValue={surface.opacity * 100}
										unit="%"
										onChange={(value) => {
											niivueWrapper.current?.niivue.setMeshProperty(
												surface.id,
												'opacity',
												value / 100
											);
										}}
										onEnd={(value) =>
											console.log('TODO persist new opacity value', value)
										}
									></Slider>
								</>
							</Collapse>
						);
					})}
				</>
			)}
		</div>
	);
};
