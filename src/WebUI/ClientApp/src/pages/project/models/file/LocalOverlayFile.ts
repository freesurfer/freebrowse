import { LocalFile } from '@/pages/project/models/file/LocalFile';
import type { IOverlayFile } from '@/pages/project/models/file/OverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';

export class LocalOverlayFile extends LocalFile implements IOverlayFile {
	public readonly type = FileType.OVERLAY;

	fromIsActive(isActive: boolean): LocalOverlayFile {
		if (this.isActive === isActive) return this;
		return new LocalOverlayFile(
			this.file,
			isActive,
			this.isChecked,
			this.order,
			this.opacity
		);
	}
}
