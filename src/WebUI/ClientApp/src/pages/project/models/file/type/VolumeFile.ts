import type { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import type { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';
import type { NVImage } from '@niivue/niivue';

export type VolumeFile = CloudVolumeFile | LocalVolumeFile;

export interface IVolumeFile {
	readonly type: FileType.VOLUME;
	readonly opacity: number;
	/**
	 * reference to niivue working object
	 * will be filled, if it has been passed to the niivue library already
	 * to cache while hidden and for easier tracking of changes
	 * @important not immutable - the content of the reference is not immutable -> no state changes when the library adapts it
	 */
	readonly niivueRef: NVImage | undefined;

	from: (options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		colorMap?: string;
		opacity?: number;
		contrastMin?: number;
		contrastMax?: number;
		niivueRef: NVImage | undefined;
	}) => VolumeFile;
}
