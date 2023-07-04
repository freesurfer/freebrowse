import type { GetProjectVolumeDto } from '@/generated/web-api-client';
import { CloudFile } from '@/pages/project/models/file/CloudFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IVolumeFile } from '@/pages/project/models/file/VolumeFile';
import { getApiUrl } from '@/utils';

export class CloudVolumeFile extends CloudFile implements IVolumeFile {
	public readonly type = FileType.VOLUME;

	public static fromDto(fileDto: GetProjectVolumeDto): CloudVolumeFile {
		if (fileDto === undefined)
			throw new Error('undefined array entry is not allowed');

		if (fileDto?.id === undefined) throw new Error('no file without file id');

		if (fileDto?.fileName === undefined)
			throw new Error('no file without file name');

		if (fileDto?.fileSize === undefined)
			throw new Error('no file without file size');

		return new CloudVolumeFile(
			fileDto.id,
			fileDto.fileName,
			fileDto.fileSize,
			false,
			fileDto.visible,
			fileDto.order,
			fileDto.opacity ?? 100,
			fileDto.colorMap,
			fileDto.contrastMin ?? 0,
			fileDto.contrastMax ?? 100
		);
	}

	constructor(
		id: number,
		name: string,
		size: number,
		isActive = false,
		isChecked = true,
		order: number | undefined,
		opacity: number,
		public readonly colorMap: string | undefined,
		public readonly contrastMin = 0,
		public readonly contrastMax = 100
	) {
		if (id === undefined) throw new Error('no id for cloud volume file');
		super(
			id,
			name,
			size,
			`${getApiUrl()}/api/Volume?Id=${String(id)}`,
			isActive,
			isChecked,
			order,
			opacity
		);
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
