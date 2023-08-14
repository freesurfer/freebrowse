import {
	EditOverlayCommand,
	type CreateSurfaceResponseDto,
	type GetProjectOverlayDto,
	type OverlayClient,
} from '@/generated/web-api-client';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type { IOverlayFile } from '@/pages/project/models/file/type/OverlayFile';
import { getApiUrl } from '@/utils';
import { makeObservable, action, observable } from 'mobx';

export class CloudOverlayFile
	extends CloudFile
	implements IOverlayFile, ISelectableFile
{
	public readonly type = FileType.OVERLAY;

	public isActive: boolean;

	constructor(
		dto:
			| GetProjectOverlayDto
			| (CreateSurfaceResponseDto & { selected: boolean }),
		private readonly client: OverlayClient
	) {
		if (dto.id === undefined) throw new Error('no file without file id');
		if (dto.fileName === undefined)
			throw new Error('no file without file name');
		if (dto.fileSize === undefined)
			throw new Error('no file without file size');
		super(
			dto.id,
			dto.fileName,
			`${getApiUrl()}/api/Overlay?Id=${String(dto.id)}`
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
			new EditOverlayCommand({
				id: this.id,
				selected: this.isActive,
			})
		);
	}
}
