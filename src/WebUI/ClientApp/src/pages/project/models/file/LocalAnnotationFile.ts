import type { IAnnotationFile } from '@/pages/project/models/file/AnnotationFile';
import { LocalFile } from '@/pages/project/models/file/LocalFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';

export class LocalAnnotationFile extends LocalFile implements IAnnotationFile {
	public readonly type = FileType.ANNOTATION;

	fromIsActive(isActive: boolean): LocalAnnotationFile {
		if (this.isActive === isActive) return this;
		return new LocalAnnotationFile(
			this.file,
			isActive,
			this.isChecked,
			this.order,
			this.opacity
		);
	}
}
