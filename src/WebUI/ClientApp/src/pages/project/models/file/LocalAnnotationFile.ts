import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { IAnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import { makeObservable, action, observable } from 'mobx';

export class LocalAnnotationFile
	extends LocalFile
	implements IAnnotationFile, ISelectableFile
{
	public readonly type = FileType.ANNOTATION;
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
