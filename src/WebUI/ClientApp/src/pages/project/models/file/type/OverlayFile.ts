import type { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import type { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';

export type OverlayFile = LocalOverlayFile | CloudOverlayFile;

export interface IOverlayFile {
	type: FileType.OVERLAY;
	fromIsActive: (isActive: boolean) => IOverlayFile;
}
