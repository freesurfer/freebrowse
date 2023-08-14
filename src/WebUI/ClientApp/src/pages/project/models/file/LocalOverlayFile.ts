import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { IOverlayFile } from '@/pages/project/models/file/type/OverlayFile';
import { action, makeObservable, observable } from 'mobx';

export class LocalOverlayFile
	extends LocalFile
	implements IOverlayFile, ISelectableFile
{
	public readonly type = FileType.OVERLAY;
	public isActive = true;

	constructor(file: File) {
		super(file);
		makeObservable(this, {
			setIsActive: action,
			isActive: observable,
		});
	}

	setIsActive(isActive: boolean): void {
		if (this.isActive === isActive) return;
		this.isActive = isActive;
	}
}
