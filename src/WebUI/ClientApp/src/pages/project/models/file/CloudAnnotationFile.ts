import type { GetProjectAnnotationDto } from '@/generated/web-api-client';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type { IAnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import { getApiUrl } from '@/utils';

export class CloudAnnotationFile
	extends CloudFile
	implements IAnnotationFile, ISelectableFile
{
	public readonly type = FileType.ANNOTATION;

	static fromDto(fileDto: GetProjectAnnotationDto): CloudAnnotationFile {
		if (fileDto?.id === undefined) throw new Error('no file without file id');

		if (fileDto?.fileName === undefined)
			throw new Error('no file without file name');

		if (fileDto?.fileSize === undefined)
			throw new Error('no file without file size');

		return new CloudAnnotationFile(
			fileDto.id,
			fileDto.fileName,
			fileDto.selected ?? false
		);
	}

	constructor(id: number, name: string, public readonly isActive: boolean) {
		super(id, name, `${getApiUrl()}/api/Annotation?Id=${String(id)}`);
	}

	fromIsActive(isActive: boolean): CloudAnnotationFile {
		if (this.isActive === isActive) return this;
		return new CloudAnnotationFile(this.id, this.name, isActive);
	}
}
