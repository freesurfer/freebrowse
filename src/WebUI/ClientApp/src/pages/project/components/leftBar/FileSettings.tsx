import { Collapse } from '@/components/Collapse';
import { Slider } from '@/components/Slider';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { Dispatch } from 'react';

const DEFAULT_OPACITY = 100;
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;

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

	return (
		<Collapse
			className="mt-1 border-b border-gray text-xs"
			title={<span className="text-xs font-semibold">File Settings</span>}
		>
			{selectedFiles.length === 0 ? (
				<span className="my-2 ml-1 mr-1 block text-left text-xs text-gray-500">
					Select a file to use this section.
				</span>
			) : (
				<>
					{selectedVolumes.map((volume) => {
						if (volume === undefined) return <></>;
						return (
							<Collapse
								key={volume?.name}
								className="mb-2 mt-1 pl-4 pr-4"
								title={
									<span className="grow border-b border-gray text-xs">
										{volume.name ?? 'No file selected'}
									</span>
								}
							>
								<div className="mr-4">
									<Slider
										className="mt-1"
										label="Opacity:"
										defaultValue={DEFAULT_OPACITY}
										unit="%"
										onChange={(value) => {
											setProjectState((currentProjectState) =>
												currentProjectState?.fromFiles(
													currentProjectState.files.fromAdaptedVolumes(
														currentProjectState.files.volumes.map((tmpVolume) =>
															tmpVolume === volume
																? tmpVolume.from({ opacity: value })
																: tmpVolume
														)
													),
													false
												)
											);
										}}
										onEnd={(value) => {
											setProjectState((currentProjectState) =>
												currentProjectState?.fromFiles(
													currentProjectState.files.fromAdaptedVolumes(
														currentProjectState.files.volumes.map((tmpVolume) =>
															tmpVolume === volume
																? tmpVolume.from({ opacity: value })
																: tmpVolume
														)
													),
													true
												)
											);
										}}
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
									*/}
									<span>Contrast & Brightness</span>
									<Slider
										className="mt-1"
										label="Minimum:"
										defaultValue={DEFAULT_MIN}
										onChange={(value) => {
											setProjectState((currentProjectState) =>
												currentProjectState?.fromFiles(
													currentProjectState.files.fromAdaptedVolumes(
														currentProjectState.files.volumes.map((tmpVolume) =>
															tmpVolume === volume
																? tmpVolume.from({ contrastMin: value })
																: tmpVolume
														)
													),
													false
												)
											);
										}}
										onEnd={(value) => {
											setProjectState((currentProjectState) =>
												currentProjectState?.fromFiles(
													currentProjectState.files.fromAdaptedVolumes(
														currentProjectState.files.volumes.map((tmpVolume) =>
															tmpVolume === volume
																? tmpVolume.from({ contrastMin: value })
																: tmpVolume
														)
													),
													true
												)
											);
										}}
									></Slider>
									<Slider
										className="mt-1"
										label="Maximum:"
										defaultValue={DEFAULT_MAX}
										onChange={(value) => {
											setProjectState((currentProjectState) =>
												currentProjectState?.fromFiles(
													currentProjectState.files.fromAdaptedVolumes(
														currentProjectState.files.volumes.map((tmpVolume) =>
															tmpVolume === volume
																? tmpVolume.from({ contrastMax: value })
																: tmpVolume
														)
													),
													false
												)
											);
										}}
										onEnd={(value) => {
											setProjectState((currentProjectState) =>
												currentProjectState?.fromFiles(
													currentProjectState.files.fromAdaptedVolumes(
														currentProjectState.files.volumes.map((tmpVolume) =>
															tmpVolume === volume
																? tmpVolume.from({ contrastMax: value })
																: tmpVolume
														)
													),
													true
												)
											);
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
								className="pl-1 pr-4 pt-1"
								title={
									<span className="grow border-b border-gray text-xs">
										{surface.name ?? 'No file selected'}
									</span>
								}
							>
								<>
									<Slider
										className="mt-1"
										label="Opacity:"
										defaultValue={DEFAULT_OPACITY}
										unit="%"
										onChange={(value) => {
											setProjectState((currentProjectState) =>
												currentProjectState?.fromFiles(
													currentProjectState.files.fromAdaptedSurfaces(
														currentProjectState.files.surfaces.map(
															(tmpSurface) =>
																tmpSurface === surface
																	? tmpSurface.from({ opacity: value })
																	: tmpSurface
														)
													),
													false
												)
											);
										}}
										onEnd={(value) =>
											setProjectState((currentProjectState) =>
												currentProjectState?.fromFiles(
													currentProjectState.files.fromAdaptedSurfaces(
														currentProjectState.files.surfaces.map(
															(tmpSurface) =>
																tmpSurface === surface
																	? tmpSurface.from({ opacity: value })
																	: tmpSurface
														)
													),
													true
												)
											)
										}
									></Slider>
								</>
							</Collapse>
						);
					})}
				</>
			)}
		</Collapse>
	);
};
