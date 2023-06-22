import { LocalFile } from '@/pages/project/models/file/LocalFile';
import type { IOverlayFile } from '@/pages/project/models/file/OverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';

export class LocalOverlayFile extends LocalFile implements IOverlayFile {
	public readonly type = FileType.OVERLAY;
}
