import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { IOverlayFile } from '@/pages/project/models/file/type/OverlayFile';

export class LocalOverlayFile
	extends LocalFile
	implements IOverlayFile, ISelectableFile
{
	public readonly type = FileType.OVERLAY;

	constructor(file: File, public readonly isActive: boolean) {
		super(file);
	}

	fromIsActive(isActive: boolean): LocalOverlayFile {
		if (this.isActive === isActive) return this;
		return new LocalOverlayFile(this.file, isActive);
	}
}
