import { type ColorMap } from '@/pages/project/models/ColorMap';
import { type CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { type LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import { type FileType } from '@/pages/project/models/file/ProjectFile';

export type VolumeFile = CloudVolumeFile | LocalVolumeFile;

export const DEFAULT_OPACITY = 100;
export const DEFAULT_CONTRAST_MIN = 20;
export const DEFAULT_CONTRAST_MAX = 80;

export interface IVolumeFile {
	readonly type: FileType.VOLUME;
	readonly opacity: number;
	readonly colorMap: ColorMap;
	readonly contrastMin: number;
	readonly contrastMax: number;
	readonly contrastMinThreshold: number | undefined;
	readonly contrastMaxThreshold: number | undefined;

	setColorMap: (colorMap: ColorMap) => void;
	setBrightness: (
		{
			opacity,
			contrastMin,
			contrastMax,
		}: {
			opacity?: number;
			contrastMin?: number;
			contrastMax?: number;
		},
		upload?: boolean
	) => void;
}
