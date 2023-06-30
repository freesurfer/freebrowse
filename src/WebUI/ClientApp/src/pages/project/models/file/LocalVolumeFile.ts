import { LocalFile } from '@/pages/project/models/file/LocalFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IVolumeFile } from '@/pages/project/models/file/VolumeFile';

export class LocalVolumeFile extends LocalFile implements IVolumeFile {
	public readonly type = FileType.VOLUME;

	constructor(
		file: File,
		isActive = false,
		isChecked?: boolean,
		order?: number | undefined,
		opacity?: number,
		public readonly colorMap?: string | undefined,
		public readonly contrastMin = 0,
		public readonly contrastMax = 100
	) {
		super(file, isActive, isChecked, order, opacity);
	}

	public from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		colorMap?: string;
		contrastMin?: number;
		contrastMax?: number;
	}): LocalVolumeFile {
		return new LocalVolumeFile(
			this.file,
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
