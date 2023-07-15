import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { VolumeFile } from '@/pages/project/models/file/type/VolumeFile';
import type { NVImage, Niivue } from '@niivue/niivue';
import type { Dispatch } from 'react';

export const niivueHandleVolumeUpdate = async (
	prev: ProjectFiles | undefined,
	next: ProjectFiles,
	niivue: Niivue,
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>
): Promise<boolean> => {
	if (prev !== undefined && prev.volumes === next.volumes) return false;

	let hasChanged = false;

	const putNiivueRefToFile = (): void => {
		setProjectState((projectState) => {
			if (projectState === undefined) return projectState;
			let tmpProjectState = projectState;
			for (const volume of next.volumes) {
				if (volume.niivueRef !== undefined) continue;

				const niivueVolume = niivue.volumes.find(
					(niivueVolume) => niivueVolume.name === volume.name
				);
				if (niivueVolume === undefined) continue;
				tmpProjectState = tmpProjectState?.fromFileUpdate(
					volume,
					{ niivueRef: niivueVolume },
					true
				);
			}
			return tmpProjectState;
		});
	};

	const initVolumes = async (): Promise<boolean> => {
		if (prev !== undefined) return false;

		const passVolumesToNiivue = async (): Promise<void> => {
			await niivue.loadVolumes(
				next.cloudVolumes
					.filter((file) => file.isChecked)
					.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
					.map((file) => {
						return {
							url: file.url,
							name: file.name,
							opacity: file.opacity / 100,
							colorMap: file.colorMap ?? 'gray',
							cal_min: file.contrastMin,
							cal_max: file.contrastMax,
						};
					})
			);
		};

		try {
			await passVolumesToNiivue();
			putNiivueRefToFile();
		} catch (error) {
			// probably we can just ignore that warning
			console.warn(error);
		}

		// it updates the diagram already, so no need to render the canvas again
		return false;
	};

	const remove = (): boolean => {
		let hasChanged = false;
		for (const niivueVolume of niivue.volumes) {
			if (
				!next.cloudVolumes.some(
					(cloudVolume) =>
						cloudVolume.isChecked && cloudVolume.name === niivueVolume.name
				)
			) {
				// files that are contained in niivue, but not in the project files
				// delete them from niivue
				niivue.setVolume(niivueVolume, -1);
				hasChanged = true;
			}
		}
		return hasChanged;
	};

	const add = async (): Promise<boolean> => {
		let hasChanged = false;
		for (const cloudVolume of next.cloudVolumes) {
			if (!cloudVolume.isChecked) continue;
			if (
				niivue.volumes.some(
					(niivueVolume) => niivueVolume.name === cloudVolume.name
				)
			)
				continue;

			// files that are contained in the project files, but not in niivue
			// add them to niivue
			if (cloudVolume.niivueRef !== undefined) {
				niivue.addVolume(cloudVolume.niivueRef);
				hasChanged = true;
				continue;
			}
			const niivueVolume = await niivue.addVolumeFromUrl({
				url: cloudVolume.url,
				name: cloudVolume.name,
				opacity: cloudVolume.opacity / 100,
				cal_min: cloudVolume.contrastMin,
				cal_max: cloudVolume.contrastMax,
			});
			setProjectState((projectState) =>
				projectState?.fromFileUpdate(
					cloudVolume,
					{ niivueRef: niivueVolume },
					false
				)
			);
		}
		return hasChanged;
	};

	const propagateProperties = (): boolean => {
		const updateVolumeOrder = (niivueVolume: NVImage, order: number): void => {
			if (niivue.getVolumeIndexByID(niivueVolume.id) === order) return;

			const numberOfLoadedImages = niivue.volumes.length;
			if (order > numberOfLoadedImages) {
				return;
			}

			const volIndex = niivue.getVolumeIndexByID(niivueVolume.id);
			if (order === 0) {
				niivue.volumes.splice(volIndex, 1);
				niivue.volumes.unshift(niivueVolume);
				niivue.back = niivue.volumes[0];
				niivue.overlays = niivue.volumes.slice(1);
			} else if (order < 0) {
				// -1 to remove a volume
				niivue.volumes.splice(niivue.getVolumeIndexByID(niivueVolume.id), 1);
				// volumes = overlays
				niivue.back = niivue.volumes[0];
				if (niivue.volumes.length > 1) {
					niivue.overlays = niivue.volumes.slice(1);
				} else {
					niivue.overlays = [];
				}
			} else {
				niivue.volumes.splice(volIndex, 1);
				niivue.volumes.splice(order, 0, niivueVolume);
				niivue.overlays = niivue.volumes.slice(1);
				niivue.back = niivue.volumes[0];
			}
			// niivue.setVolume(niivueVolume, order);
		};

		const updateVolumeColorMap = (
			niivueVolume: NVImage,
			volumeFile: VolumeFile
		): void => {
			if (niivueVolume.colorMap === volumeFile.colorMap) return;

			const index = niivue.getVolumeIndexByID(niivueVolume.id);
			const volume = niivue.volumes[index];
			if (volume !== undefined) {
				volume.colormap = volumeFile.colorMap ?? 'gray';
				const cmap = niivue.colormapFromKey(volume.colormap);

				if (
					cmap.R !== undefined &&
					cmap.labels !== undefined &&
					cmap.labels.length !== 0
				) {
					volume.setColormapLabel(cmap);
				} else {
					volume.colormapLabel = [];
				}
			}
			// niivue.setColorMap(niivueVolume.id, volumeFile.colorMap ?? 'gray');
		};

		const updateVolumeBrightness = (
			niivueVolume: NVImage,
			volumeFile: VolumeFile
		): void => {
			if (
				niivueVolume.opacity === volumeFile.opacity / 100 &&
				niivueVolume.cal_min === volumeFile.contrastMin &&
				niivueVolume.cal_max === volumeFile.contrastMax
			)
				return;

			niivueVolume.opacity = volumeFile.opacity / 100;
			niivueVolume.cal_min = volumeFile.contrastMin;
			niivueVolume.cal_max = volumeFile.contrastMax;
		};

		/**
		 * needed to compute order of visible files only
		 */
		let tmpOrder = 0;
		let hasChanged = false;

		const volumeFiles = next.volumes
			.filter((volume) => volume.isChecked)
			.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

		for (const volumeFile of volumeFiles) {
			if (volumeFile.niivueRef === undefined) continue;

			updateVolumeOrder(volumeFile.niivueRef, tmpOrder++);

			/*
			 * the order is important here!
			 * the color map seems to need to get set before we adapt the contrast
			 */
			updateVolumeColorMap(volumeFile.niivueRef, volumeFile);

			updateVolumeBrightness(volumeFile.niivueRef, volumeFile);
			hasChanged = true;
		}

		return hasChanged;
	};

	hasChanged ||= await initVolumes();
	hasChanged ||= remove();
	hasChanged ||= await add();
	hasChanged ||= propagateProperties();
	return hasChanged;
};
