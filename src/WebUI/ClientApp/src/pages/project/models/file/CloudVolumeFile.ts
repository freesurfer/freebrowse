import type { GetProjectVolumeDto } from '@/generated/web-api-client';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type { IVolumeFile } from '@/pages/project/models/file/type/VolumeFile';
import { getApiUrl } from '@/utils';

export class CloudVolumeFile
	extends CloudFile
	implements IVolumeFile, IOrderableFile, IManageableFile
{
	static DEFAULT_COLOR_MAP = 'gray';

	public readonly type = FileType.VOLUME;
	public readonly progress = 100;

	public static fromDto(fileDto: GetProjectVolumeDto): CloudVolumeFile {
		if (fileDto === undefined)
			throw new Error('undefined array entry is not allowed');

		if (fileDto?.id === undefined) throw new Error('no file without file id');

		if (fileDto?.fileName === undefined)
			throw new Error('no file without file name');

		if (fileDto?.fileSize === undefined)
			throw new Error('no file without file size');

		if (fileDto?.order === undefined) throw new Error('no file without order');

		if (fileDto?.colorMap === undefined)
			throw new Error('no file without colorMap');

		return new CloudVolumeFile(
			fileDto.id,
			fileDto.fileName,
			fileDto.fileSize,
			false,
			fileDto.visible,
			fileDto.order,
			fileDto.opacity ?? 100,
			fileDto.colorMap ?? CloudVolumeFile.DEFAULT_COLOR_MAP,
			fileDto.contrastMin ?? 0,
			fileDto.contrastMax ?? 100
		);
	}

	constructor(
		id: number,
		name: string,
		public readonly size: number,
		public readonly isActive = false,
		public readonly isChecked = true,
		public readonly order: number,
		public readonly opacity: number,
		public readonly colorMap: string,
		public readonly contrastMin = 0,
		public readonly contrastMax = 100
	) {
		if (id === undefined) throw new Error('no id for cloud volume file');
		super(id, name, `${getApiUrl()}/api/Volume?Id=${String(id)}`);
	}

	public from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		colorMap?: string;
		contrastMin?: number;
		contrastMax?: number;
	}): CloudVolumeFile {
		return new CloudVolumeFile(
			this.id,
			this.name,
			this.size,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.opacity ?? this.opacity,
			options.colorMap ?? this.colorMap,
			options.contrastMin ?? this.contrastMin,
			options.contrastMax ?? this.contrastMax
		);
	}
}
