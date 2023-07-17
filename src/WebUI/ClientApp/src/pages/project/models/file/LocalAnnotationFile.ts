import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { IAnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';

export class LocalAnnotationFile
	extends LocalFile
	implements IAnnotationFile, ISelectableFile
{
	public readonly type = FileType.ANNOTATION;

	constructor(file: File, public readonly isActive: boolean) {
		super(file);
	}

	fromIsActive(isActive: boolean): LocalAnnotationFile {
		if (this.isActive === isActive) return this;
		return new LocalAnnotationFile(this.file, isActive);
	}
}
