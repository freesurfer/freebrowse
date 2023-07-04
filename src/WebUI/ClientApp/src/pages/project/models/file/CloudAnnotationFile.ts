import type { GetProjectAnnotationDto } from '@/generated/web-api-client';
import type { IAnnotationFile } from '@/pages/project/models/file/AnnotationFile';
import { CloudFile } from '@/pages/project/models/file/CloudFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import { getApiUrl } from '@/utils';

export class CloudAnnotationFile extends CloudFile implements IAnnotationFile {
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
			fileDto.fileSize,
			fileDto.selected ?? false,
			fileDto.visible ?? false,
			undefined,
			fileDto.opacity ?? 100
		);
	}

	constructor(
		id: number,
		name: string,
		size: number,
		isActive: boolean,
		isChecked: boolean,
		order: number | undefined,
		opacity: number
	) {
		super(
			id,
			name,
			size,
			`${getApiUrl()}/api/Annotation?Id=${String(id)}`,
			isActive,
			isChecked,
			order,
			opacity
		);
	}

	fromIsActive(isActive: boolean): CloudAnnotationFile {
		if (this.isActive === isActive) return this;
		return new CloudAnnotationFile(
			this.id,
			this.name,
			this.size,
			isActive,
			this.isChecked,
			this.order,
			this.opacity
		);
	}
}
