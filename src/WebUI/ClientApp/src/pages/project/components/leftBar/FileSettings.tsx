import { Collapse } from '@/components/Collapse';
import { Slider } from '@/components/Slider';
import type { ProjectFile } from '@/pages/project/models/ProjectFile';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { useCallback, type Dispatch } from 'react';

export const FileSettings = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): React.ReactElement => {
	const selectedVolumes =
		projectState?.files.volumes.filter((volume) => volume.isActive) ?? [];

	const selectedSurfaces =
		projectState?.files.surfaces.filter((surface) => surface.isActive) ?? [];

	const selectedFiles = [...selectedVolumes, ...selectedSurfaces];

	const updateFileOptions = useCallback(
		<T_FILE_TYPE extends ProjectFile>(
			file: T_FILE_TYPE,
			options: Parameters<ProjectState['fromFileUpdate']>[1],
			upload: boolean
		) => {
			setProjectState((currentProjectState) =>
				currentProjectState?.fromFileUpdate(file, options, upload)
			);
		},
		[setProjectState]
	);

	return (
		<Collapse
			className="border-b border-gray py-2 text-xs"
			title={<span className="text-xs font-semibold">File Settings</span>}
		>
			{selectedFiles.length === 0 ? (
				<span className="ml-1 mr-1 mt-2 block text-left text-xs text-gray-500">
					Select a file to use this section.
				</span>
			) : (
				<>
					{selectedVolumes.map((volume) => {
						if (volume === undefined) return <></>;
						return (
							<Collapse
								key={volume?.name}
								className="mt-2 pr-4"
								title={
									<span className="grow border-b border-gray text-xs">
										{volume.name ?? 'No file selected'}
									</span>
								}
							>
								<div className="mr-4 pl-1">
									<Slider
										className="mt-2"
										label="Opacity:"
										value={volume.opacity}
										unit="%"
										onChange={(value) =>
											updateFileOptions(volume, { opacity: value }, false)
										}
										onEnd={(value) =>
											updateFileOptions(volume, { opacity: value }, true)
										}
									></Slider>
									{/*
									<div className="mb-4 flex items-center">
										<span className="mr-2 grow">Color Map:</span>
										<Select
											options={colorMapOptions}
											classNames={{
												indicatorSeparator: () => 'hidden',
												singleValue: () => 'text-xs z-1',
												menu: () => 'text-xs',
											}}
											value={colorMapOptions.find(
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
									*/}
									<span className="font-semibold">Contrast & Brightness</span>
									<Slider
										className="mt-2"
										label="Minimum:"
										value={volume.contrastMin}
										onChange={(value) =>
											updateFileOptions(volume, { contrastMin: value }, false)
										}
										onEnd={(value) =>
											updateFileOptions(volume, { contrastMin: value }, true)
										}
									></Slider>
									<Slider
										className="mt-2"
										label="Maximum:"
										value={volume.contrastMax}
										onChange={(value) =>
											updateFileOptions(volume, { contrastMax: value }, false)
										}
										onEnd={(value) =>
											updateFileOptions(volume, { contrastMax: value }, true)
										}
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
								className="mt-1 pr-4"
								title={
									<span className="grow border-b border-gray text-xs">
										{surface.name ?? 'No file selected'}
									</span>
								}
							>
								<div className="mr-4 pl-1">
									<Slider
										className="mt-2"
										label="Opacity:"
										value={surface.opacity}
										unit="%"
										onChange={(value) =>
											updateFileOptions(surface, { opacity: value }, false)
										}
										onEnd={(value) =>
											updateFileOptions(surface, { opacity: value }, true)
										}
									></Slider>
								</div>
							</Collapse>
						);
					})}
				</>
			)}
		</Collapse>
	);
};
