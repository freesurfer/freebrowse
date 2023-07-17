import type { GetProjectOverlayDto } from '@/generated/web-api-client';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type { IOverlayFile } from '@/pages/project/models/file/type/OverlayFile';
import { getApiUrl } from '@/utils';

export class CloudOverlayFile
	extends CloudFile
	implements IOverlayFile, ISelectableFile
{
	public readonly type = FileType.OVERLAY;

	static fromDto(fileDto: GetProjectOverlayDto): CloudOverlayFile {
		if (fileDto?.id === undefined) throw new Error('no file without file id');

		if (fileDto?.fileName === undefined)
			throw new Error('no file without file name');

		if (fileDto?.fileSize === undefined)
			throw new Error('no file without file size');

		return new CloudOverlayFile(
			fileDto.id,
			fileDto.fileName,
			fileDto.selected ?? false
		);
	}

	constructor(id: number, name: string, public readonly isActive: boolean) {
		super(id, name, `${getApiUrl()}/api/Overlay?Id=${String(id)}`);
	}

	fromIsActive(isActive: boolean): CloudOverlayFile {
		if (this.isActive === isActive) return this;
		return new CloudOverlayFile(this.id, this.name, isActive);
	}
}
