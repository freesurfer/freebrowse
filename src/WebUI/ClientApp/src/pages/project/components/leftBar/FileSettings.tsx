import { Collapse } from '@/components/Collapse';
import { ColorPicker } from '@/components/ColorPicker';
import { DropDown } from '@/components/DropDown';
import { Slider } from '@/components/Slider';
import { FileSelection } from '@/pages/project/components/leftBar/FileSelection';
import { FileSettingsWayPoints } from '@/pages/project/components/leftBar/FileSettingsWayPoints';
import {
	COLOR_MAP_BACKEND,
	COLOR_MAP_TRANSLATION,
	ColorMap,
} from '@/pages/project/models/ColorMap';
import { ProjectState } from '@/pages/project/models/ProjectState';
import type { ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { useCallback, type Dispatch, type ReactElement } from 'react';

export const FileSettings = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): ReactElement => {
	const activeVolumes =
		[
			...(projectState?.files.volumes.cloud ?? []),
			...(projectState?.files.volumes.local ?? []),
		].filter((file) => file.isActive) ?? [];

	const activeSurfaces =
		[
			...(projectState?.files.surfaces.cloud ?? []),
			...(projectState?.files.surfaces.local ?? []),
		].filter((file) => file.isActive) ?? [];

	const activePointSets =
		[
			...(projectState?.files.pointSets.cloud ?? []),
			...(projectState?.files.pointSets.local ?? []),
			...(projectState?.files.pointSets.cache ?? []),
		].filter((file) => file.isActive) ?? [];

	const activeFiles = [...activeVolumes, ...activeSurfaces, ...activePointSets];

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
			{activeFiles.length === 0 ? (
				<span className="ml-1 mr-1 mt-2 block text-left text-xs text-gray-500">
					Select a file to use this section.
				</span>
			) : (
				<>
					{activeVolumes.map((volume) => {
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
										value={
											volume.colorMap.translation ?? COLOR_MAP_TRANSLATION.GRAY
										}
										onChange={(value) =>
											updateFileOptions(
												volume,
												{ colorMap: ColorMap.fromTranslation(value) },
												true
											)
										}
										options={[
											COLOR_MAP_TRANSLATION.GRAY,
											COLOR_MAP_TRANSLATION.HEAT,
											COLOR_MAP_TRANSLATION.LOOKUP_TABLE,
										]}
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
									{volume.colorMap.backend === COLOR_MAP_BACKEND.GRAY ? (
										<>
											<span className="font-semibold">
												Contrast & Brightness
											</span>
											<Slider
												className="mt-2"
												label="Minimum:"
												value={volume.contrastMin}
												onChange={(value) =>
													updateFileOptions(
														volume,
														{ contrastMin: value },
														false
													)
												}
												onEnd={(value) =>
													updateFileOptions(
														volume,
														{ contrastMin: value },
														true
													)
												}
											></Slider>
											<Slider
												className="mt-2"
												label="Maximum:"
												value={volume.contrastMax}
												onChange={(value) =>
													updateFileOptions(
														volume,
														{ contrastMax: value },
														false
													)
												}
												onEnd={(value) =>
													updateFileOptions(
														volume,
														{ contrastMax: value },
														true
													)
												}
											></Slider>
										</>
									) : (
										<></>
									)}
								</div>
							</Collapse>
						);
					})}
					{activeSurfaces.map((surfaceFile) => {
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
										min={0}
										max={50}
										onChange={(value) =>
											setProjectState((projectState) => {
												if (projectState === undefined) return undefined;
												return new ProjectState(
													{ projectState, meshThicknessOn2D: value * 0.1 },
													false
												);
											})
										}
										onEnd={(value) =>
											setProjectState((projectState) => {
												if (projectState === undefined) return undefined;
												return new ProjectState(
													{ projectState, meshThicknessOn2D: value * 0.1 },
													true
												);
											})
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
					{activePointSets.map((pointSetFile) => {
						if (pointSetFile === undefined) return <></>;
						return (
							<Collapse
								key={pointSetFile?.name}
								className="mt-1 pr-4"
								title={
									<span className="grow border-b border-gray text-xs">
										{pointSetFile.name ?? 'No file selected'}
									</span>
								}
							>
								<FileSettingsWayPoints
									pointSetFile={pointSetFile}
									setProjectState={setProjectState}
								></FileSettingsWayPoints>
							</Collapse>
						);
					})}
				</>
			)}
		</Collapse>
	);
};
