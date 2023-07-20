import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { IPointSetFile } from '@/pages/project/models/file/type/PointSetFile';

export class LocalPointSetFile
	extends LocalFile
	implements IPointSetFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.POINT_SET;
	public readonly progress = 100;
	public readonly size: number;

	constructor(
		file: File,
		public readonly isActive = false,
		public readonly isChecked = true,
		public readonly order: number | undefined = undefined,
		public readonly selectedWayPoint: number = 1
	) {
		super(file);
		this.size = file.size;
	}

	from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		selectedWayPoint?: number;
	}): LocalPointSetFile {
		return new LocalPointSetFile(
			this.file,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.selectedWayPoint ?? this.selectedWayPoint
		);
	}
}
