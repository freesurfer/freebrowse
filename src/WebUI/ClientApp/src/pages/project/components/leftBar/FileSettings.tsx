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
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { observer } from 'mobx-react-lite';
import { type ReactElement } from 'react';

export const FileSettings = observer(
	({
		projectState,
	}: {
		projectState: ProjectState | undefined;
	}): ReactElement => {
		const activeVolumes =
			projectState?.files?.volumes.all.filter((file) => file.isActive) ?? [];
		const activeSurfaces =
			projectState?.files?.surfaces.all.filter((file) => file.isActive) ?? [];
		const activePointSets =
			projectState?.files?.pointSets.all.filter((file) => file.isActive) ?? [];

		return (
			<Collapse
				className="border-b border-gray py-2 text-xs"
				title={<span className="text-xs font-semibold">File Settings</span>}
			>
				{[...activeVolumes, ...activeSurfaces, ...activePointSets].length ===
				0 ? (
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
												volume.colorMap.translation ??
												COLOR_MAP_TRANSLATION.GRAY
											}
											onChange={(value) =>
												volume.setColorMap(ColorMap.fromTranslation(value))
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
												volume.setBrightness({ opacity: value }, false)
											}
											onEnd={(value) =>
												volume.setBrightness({ opacity: value }, true)
											}
											min={0}
											max={100}
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
														volume.setBrightness({ contrastMin: value }, false)
													}
													onEnd={(value) =>
														volume.setBrightness({ contrastMin: value }, true)
													}
													min={volume.contrastMinThreshold}
													max={volume.contrastMaxThreshold}
												></Slider>
												<Slider
													className="mt-2"
													label="Maximum:"
													value={volume.contrastMax}
													onChange={(value) =>
														volume.setBrightness({ contrastMax: value }, false)
													}
													onEnd={(value) =>
														volume.setBrightness({ contrastMax: value }, true)
													}
													min={volume.contrastMinThreshold}
													max={volume.contrastMaxThreshold}
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
											grow={true}
											label="Edge-Color:"
											value={surfaceFile.color}
											onChange={(value) => surfaceFile.setColor(value, false)}
											onBlur={(value) => surfaceFile.setColor(value, true)}
										></ColorPicker>
										<Slider
											className="mt-2"
											label="Edge-Thickness:"
											value={(projectState?.meshThicknessOn2D ?? 0) * 10}
											unit=""
											min={0}
											max={50}
											onChange={(value) =>
												projectState?.setMeshThickness(value * 0.1, false)
											}
											onEnd={(value) =>
												projectState?.setMeshThickness(value * 0.1)
											}
										></Slider>
										<FileSelection
											title="Overlays:"
											className="mt-4"
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
										projectState={projectState}
										pointSetFile={pointSetFile}
									></FileSettingsWayPoints>
								</Collapse>
							);
						})}
					</>
				)}
			</Collapse>
		);
	}
);
