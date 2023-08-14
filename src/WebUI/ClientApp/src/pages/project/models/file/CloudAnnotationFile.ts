import {
	type AnnotationClient,
	EditAnnotationCommand,
	type GetProjectAnnotationDto,
	type CreateAnnotationResponseDto,
} from '@/generated/web-api-client';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type { IAnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import { getApiUrl } from '@/utils';
import { makeObservable, action, observable } from 'mobx';

export class CloudAnnotationFile
	extends CloudFile
	implements IAnnotationFile, ISelectableFile
{
	public readonly type = FileType.ANNOTATION;
	public isActive: boolean;

	constructor(
		dto:
			| GetProjectAnnotationDto
			| (CreateAnnotationResponseDto & { selected: boolean }),
		private readonly client: AnnotationClient
	) {
		if (dto.id === undefined) throw new Error('no file without file id');
		if (dto.fileName === undefined)
			throw new Error('no file without file name');
		if (dto.fileSize === undefined)
			throw new Error('no file without file size');
		super(
			dto.id,
			dto.fileName,
			`${getApiUrl()}/api/Annotation?Id=${String(dto.id)}`
		);
		makeObservable(this, {
			setIsActive: action,
			isActive: observable,
		});

		this.isActive = dto.selected ?? false;
	}

	setIsActive(isActive: boolean): void {
		if (this.isActive === isActive) return;
		this.isActive = isActive;

		void this.apiPut();
	}

	private async apiPut(): Promise<void> {
		await this.client.edit(
			new EditAnnotationCommand({
				id: this.id,
				selected: this.isActive,
			})
		);
	}
}
