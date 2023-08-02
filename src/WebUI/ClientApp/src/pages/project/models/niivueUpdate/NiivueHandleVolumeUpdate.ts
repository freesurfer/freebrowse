import type { INiivueCache } from '@/pages/project/NiivueWrapper';
import { COLOR_MAP_NIIVUE } from '@/pages/project/models/ColorMap';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { VolumeFile } from '@/pages/project/models/file/type/VolumeFile';
import type { NVImage, Niivue } from '@niivue/niivue';

interface IVolumeFilePair {
	niivueVolume: NVImage;
	volume: VolumeFile;
}

export const niivueHandleVolumeUpdate = async (
	prev: ProjectFiles | undefined,
	next: ProjectFiles,
	niivue: Niivue,
	cache: INiivueCache,
	updateMinMax: (
		update: { volume: VolumeFile; min: number; max: number }[]
	) => void
): Promise<boolean> => {
	if (prev !== undefined && prev.volumes === next.volumes) return false;

	const computeMinMax = ({
		niivueVolume,
		volume,
	}: IVolumeFilePair): { volume: VolumeFile; min: number; max: number } => {
		const { min, max } = niivueVolume.img.reduce<{
			min: number | undefined;
			max: number | undefined;
		}>(
			(
				result,
				value
			): { min: number | undefined; max: number | undefined } => ({
				min:
					result.min === undefined || value < result.min ? value : result.min,
				max:
					result.max === undefined || value > result.max ? value : result.max,
			}),
			{
				min: undefined,
				max: undefined,
			}
		);
		return { min: min ?? 0, max: max ?? 100, volume };
	};

	const putNiivueRefToFile = (): {
		niivueVolume: NVImage;
		volume: VolumeFile;
	}[] => {
		const newFiles: IVolumeFilePair[] = [];
		for (const volume of [...next.volumes.local, ...next.volumes.cloud]) {
			if (cache.volumes.has(volume.name)) continue;

			const niivueVolume = niivue.volumes.find(
				(niivueVolume) => niivueVolume.name === volume.name
			);
			if (niivueVolume === undefined) continue;
			cache.volumes.set(volume.name, niivueVolume);
			newFiles.push({ niivueVolume, volume });
		}
		return newFiles;
	};

	const initVolumes = async (): Promise<boolean> => {
		if (prev !== undefined) return false;

		const passVolumesToNiivue = async (): Promise<void> => {
			await niivue.loadVolumes(
				next.volumes.cloud
					.filter((file) => file.isChecked)
					.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
					.map((file) => {
						return {
							url: file.url,
							name: file.name,
							opacity: file.opacity / 100,
							colorMap: file.colorMap.niivue ?? COLOR_MAP_NIIVUE.GRAY,
							cal_min: file.contrastMin,
							cal_max: file.contrastMax,
							trustCalMinMax: false,
						};
					})
			);

			niivue.volumes.forEach((niivueVolume) => {
				const cmap = niivue.colormapFromKey(niivueVolume.colormap);

				if (
					cmap.R !== undefined &&
					cmap.labels !== undefined &&
					cmap.labels.length !== 0
				) {
					niivueVolume.setColormapLabel(cmap);
				} else {
					niivueVolume.colormapLabel = [];
				}
			});
		};

		try {
			await passVolumesToNiivue();
			const newFiles = putNiivueRefToFile();
			if (newFiles.length > 0)
				updateMinMax(newFiles.map((file) => computeMinMax(file)));
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
				!next.volumes.cloud.some(
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
		const newFiles: IVolumeFilePair[] = [];
		for (const cloudVolume of next.volumes.cloud) {
			if (!cloudVolume.isChecked) continue;
			if (
				niivue.volumes.some(
					(niivueVolume) => niivueVolume.name === cloudVolume.name
				)
			)
				continue;

			// files that are contained in the project files, but not in niivue
			// add them to niivue
			const cachedNiivueVolume = cache.volumes.get(cloudVolume.name);
			if (cachedNiivueVolume !== undefined) {
				niivue.addVolume(cachedNiivueVolume);
				hasChanged = true;
				continue;
			}

			const niivueVolume = await niivue.addVolumeFromUrl({
				url: cloudVolume.url,
				name: cloudVolume.name,
				opacity: cloudVolume.opacity / 100,
				cal_min: cloudVolume.contrastMin,
				cal_max: cloudVolume.contrastMax,
				trustCalMinMax: false,
			});
			cache.volumes.set(cloudVolume.name, niivueVolume);
			newFiles.push({ volume: cloudVolume, niivueVolume });
			hasChanged = true;
		}
		newFiles.map((file) => computeMinMax(file));
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
			if (
				niivueVolume === undefined ||
				niivueVolume.colormap === volumeFile.colorMap.niivue
			)
				return;

			niivueVolume.colormap = volumeFile.colorMap.niivue;
			const cmap = niivue.colormapFromKey(niivueVolume.colormap);

			if (
				cmap.R !== undefined &&
				cmap.labels !== undefined &&
				cmap.labels.length !== 0
			) {
				niivueVolume.setColormapLabel(cmap);
			} else {
				niivueVolume.colormapLabel = [];
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

		const volumeFiles = [...next.volumes.local, ...next.volumes.cloud]
			.filter((volume) => volume.isChecked)
			.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

		for (const volumeFile of volumeFiles) {
			const niivueVolume = cache.volumes.get(volumeFile.name);
			if (niivueVolume === undefined) continue;

			updateVolumeOrder(niivueVolume, tmpOrder++);

			/*
			 * the order is important here!
			 * the color map seems to need to get set before we adapt the contrast
			 */
			updateVolumeColorMap(niivueVolume, volumeFile);

			updateVolumeBrightness(niivueVolume, volumeFile);
			hasChanged = true;
		}

		return hasChanged;
	};

	const cleanCache = (): void => {
		for (const key of cache.volumes.keys()) {
			if (
				![...next.volumes.local, ...next.volumes.cloud].some(
					(file) => file.name === key
				)
			)
				cache.volumes.delete(key);
		}
	};

	const renderForInit = await initVolumes();
	const renderForRemove = remove();
	const renderForAdd = await add();
	const renderForProperties = propagateProperties();
	cleanCache();

	return (
		renderForInit || renderForRemove || renderForAdd || renderForProperties
	);
};
