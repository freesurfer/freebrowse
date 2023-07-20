import { COLOR_MAP_BACKEND, ColorMap } from '@/pages/project/models/ColorMap';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { IVolumeFile } from '@/pages/project/models/file/type/VolumeFile';

export class LocalVolumeFile
	extends LocalFile
	implements IVolumeFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.VOLUME;
	public readonly progress = 100;
	public readonly size: number;

	constructor(
		file: File,
		public readonly isActive = false,
		public readonly isChecked = true,
		public readonly order: number | undefined = undefined,
		public readonly opacity = 100,
		public readonly colorMap: ColorMap = ColorMap.from(COLOR_MAP_BACKEND.GRAY),
		public readonly contrastMin = 0,
		public readonly contrastMax = 100
	) {
		super(file);
		this.size = file.size;
	}

	public from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		colorMap?: ColorMap;
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
