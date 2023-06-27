import type { GetProjectOverlayDto } from '@/generated/web-api-client';
import { CloudFile } from '@/pages/project/models/file/CloudFile';
import type { IOverlayFile } from '@/pages/project/models/file/OverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import { getApiUrl } from '@/utils';

export class CloudOverlayFile extends CloudFile implements IOverlayFile {
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
			`${getApiUrl()}/api/Overlay?Id=${String(id)}`,
			isActive,
			isChecked,
			order,
			opacity
		);
	}
}
