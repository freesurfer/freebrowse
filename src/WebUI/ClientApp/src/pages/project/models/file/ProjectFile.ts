import type { PointSetFile } from '@/pages/project/models/file/type/PointSetFile';
import type { SurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import type { VolumeFile } from '@/pages/project/models/file/type/VolumeFile';

export type ProjectFile = SurfaceFile | VolumeFile | PointSetFile;

export enum FileType {
	UNKNOWN,
	VOLUME,
	SURFACE,
	POINT_SET,
	OVERLAY,
	ANNOTATION,
}

export enum FileLocation {
	/**
	 * binary data is contained in a file on the local hard drive
	 */
	LOCAL,
	/**
	 * binary data is contained in a file on the Backend
	 */
	CLOUD,
	/**
	 * binary data is saved in the memory
	 */
	CACHED,
}

/**
 * all properties each file has
 * probably mostly about the configuration
 */
export abstract class ProjectFileBase {
	abstract readonly type: FileType;
	abstract readonly location: FileLocation;
	/**
	 * property to share with niivue
	 * or as key for lists
	 * to not only rely on the file name, but also type or backend id, if provided
	 */
	abstract readonly uniqueName: string;

	constructor(public readonly name: string) {}

	public static typeFromFileExtension(fileName: string): FileType {
		if (fileName.endsWith('.mgz')) return FileType.VOLUME;
		if (fileName.endsWith('.nii.gz')) return FileType.VOLUME;

		if (fileName.endsWith('.inflated')) return FileType.SURFACE;
		if (fileName.endsWith('.pial')) return FileType.SURFACE;
		if (fileName.endsWith('.white')) return FileType.SURFACE;
		if (fileName.endsWith('.sphere')) return FileType.SURFACE;

		if (fileName.endsWith('.json')) return FileType.POINT_SET;

		return FileType.UNKNOWN;
	}
}
