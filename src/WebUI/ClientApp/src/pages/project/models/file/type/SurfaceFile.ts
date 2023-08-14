import { type CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import { type LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import { type FileType } from '@/pages/project/models/file/ProjectFile';
import { type AnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import { type OverlayFile } from '@/pages/project/models/file/type/OverlayFile';

export type SurfaceFile = CloudSurfaceFile | LocalSurfaceFile;

export interface ISurfaceFile {
	readonly type: FileType.SURFACE;

	color: string;
	overlayFiles: OverlayFile[];
	annotationFiles: AnnotationFile[];

	addLocalOverlay: (file: File) => void;
	addLocalAnnotation: (file: File) => void;

	setActiveFile: (file: OverlayFile | AnnotationFile) => void;
	setColor: (color: string, upload?: boolean) => void;
}
