import { Collapse } from '@/components/Collapse';
import { ColorPicker } from '@/components/ColorPicker';
import { DropDown } from '@/components/DropDown';
import { Slider } from '@/components/Slider';
import { FileSelection } from '@/pages/project/components/leftBar/FileSelection';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { ProjectFile } from '@/pages/project/models/file/ProjectFile';
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

	const updateProjectOptions = useCallback(
		(
			options: Parameters<ProjectState['fromProjectUpdate']>[0],
			upload: boolean
		) => {
			setProjectState((currentProjectState) =>
				currentProjectState?.fromProjectUpdate(options, upload)
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
								<div className="pl-1">
									<DropDown
										className="mt-2"
										label="Color Map:"
										value={volume.colorMap ?? 'Gray'}
										onChange={(value) =>
											updateFileOptions(volume, { colorMap: value }, true)
										}
										options={['Gray', 'Hot', 'LookupTable']}
									/>
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
					{selectedSurfaces.map((surfaceFile) => {
						if (surfaceFile === undefined) return <></>;
						return (
							<Collapse
								key={surfaceFile?.name}
								className="mt-1 pr-4"
								title={
									<span className="grow border-b border-gray text-xs">
										{surfaceFile.name ?? 'No file selected'}
									</span>
								}
							>
								<div className="pl-1">
									<Slider
										className="mt-2"
										label="Opacity:"
										value={surfaceFile.opacity}
										unit="%"
										onChange={(value) =>
											updateFileOptions(surfaceFile, { opacity: value }, false)
										}
										onEnd={(value) =>
											updateFileOptions(surfaceFile, { opacity: value }, true)
										}
									></Slider>
									<ColorPicker
										className="mt-2"
										label="Edge-Color:"
										value={surfaceFile.color}
										onChange={(value) =>
											updateFileOptions(surfaceFile, { color: value }, false)
										}
										onEnd={(value) =>
											updateFileOptions(surfaceFile, { color: value }, true)
										}
									></ColorPicker>
									<Slider
										className="mt-2"
										label="Edge-Thickness:"
										value={(projectState?.meshThicknessOn2D ?? 0) * 10}
										unit=""
										min={1}
										max={10}
										onChange={(value) =>
											updateProjectOptions(
												{ meshThicknessOn2D: value * 0.1 },
												false
											)
										}
										onEnd={(value) =>
											updateProjectOptions(
												{ meshThicknessOn2D: value * 0.1 },
												true
											)
										}
									></Slider>
									<FileSelection
										title="Overlays:"
										className="mt-4"
										setProjectState={setProjectState}
										surfaceFile={surfaceFile}
									></FileSelection>
								</div>
							</Collapse>
						);
					})}
				</>
			)}
		</Collapse>
	);
};
