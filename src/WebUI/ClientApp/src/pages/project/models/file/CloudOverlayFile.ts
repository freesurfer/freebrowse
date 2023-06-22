import { CloudFile } from '@/pages/project/models/file/CloudFile';
import type { IOverlayFile } from '@/pages/project/models/file/OverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';

export class CloudOverlayFile extends CloudFile implements IOverlayFile {
	public readonly type = FileType.OVERLAY;
}
