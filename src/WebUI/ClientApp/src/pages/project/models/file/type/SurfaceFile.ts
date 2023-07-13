import type { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import type { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';
import type { NVMesh } from '@niivue/niivue';

export type SurfaceFile = CloudSurfaceFile | LocalSurfaceFile;

export interface ISurfaceFile {
	readonly type: FileType.SURFACE;

	/**
	 * reference to niivue working object
	 * will be filled, if it has been passed to the niivue library already
	 * to cache while hidden and for easier tracking of changes
	 * @important not immutable - the content of the reference is not immutable -> no state changes when the library adapts it
	 */
	readonly niivueRef: NVMesh | undefined;

	fromAddOverlay: (file: File) => SurfaceFile;
	from: (options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		color?: string;
	}) => SurfaceFile;
}
