import type { SurfaceFile } from '@/pages/project/models/file/SurfaceFile';
import type { VolumeFile } from '@/pages/project/models/file/VolumeFile';

export enum FileType {
	UNKNOWN,
	VOLUME,
	SURFACE,
	OVERLAY,
}

/**
 * all properties each file has
 * probably mostly about the configuration
 */
export abstract class ProjectFileBase {
	readonly selection?: 'grayscale' | 'lookupTable';
	readonly resampleRAS?: boolean;
	abstract readonly type: FileType;

	constructor(
		public readonly name: string,
		public readonly size: number,
		/**
		 * the meta data and tools for the file are accessible
		 */
		public readonly isActive: boolean,
		/**
		 * the file is shown in the diagram
		 */
		public readonly isChecked: boolean,
		public readonly order: number | undefined,
		public readonly opacity: number
	) {}

	/**
	 * method to compute a readable representation of the file size
	 */
	public sizeReadable(): string {
		return `${Math.floor(this.size / 10000) / 100} MB`;
	}

	public static typeFromFileExtension(fileName: string): FileType {
		if (fileName.endsWith('.mgz')) return FileType.VOLUME;
		if (fileName.endsWith('.nii.gz')) return FileType.VOLUME;

		if (fileName.endsWith('.inflated')) return FileType.SURFACE;
		if (fileName.endsWith('.pial')) return FileType.SURFACE;
		if (fileName.endsWith('.white')) return FileType.SURFACE;
		if (fileName.endsWith('.sphere')) return FileType.SURFACE;

		return FileType.UNKNOWN;
	}
}

export type ProjectFile = SurfaceFile | VolumeFile;
