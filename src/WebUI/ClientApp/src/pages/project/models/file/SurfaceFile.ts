import type { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import type { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';

export type SurfaceFile = CloudSurfaceFile | LocalSurfaceFile;

export interface ISurfaceFile {
	type: FileType.SURFACE;

	fromAddOverlay: (file: File) => SurfaceFile;
	from: (options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		color?: string;
	}) => SurfaceFile;
}
