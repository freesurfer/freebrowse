import { CloudFile } from '@/pages/project/models/file/CloudFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IVolumeFile } from '@/pages/project/models/file/VolumeFile';
import { getApiUrl } from '@/utils';

export class CloudVolumeFile extends CloudFile implements IVolumeFile {
	public readonly type = FileType.VOLUME;

	constructor(
		id: number,
		name: string,
		size: number,
		isActive = false,
		isChecked = true,
		order: number | undefined,
		opacity: number,
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
			options.contrastMin ?? this.contrastMin,
			options.contrastMax ?? this.contrastMax
		);
	}
}
