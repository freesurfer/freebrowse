import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CachedFile } from '@/pages/project/models/file/location/CachedFile';
import type { IPointSetFile } from '@/pages/project/models/file/type/PointSetFile';

export class CachePointSetFile
	extends CachedFile
	implements IPointSetFile, IOrderableFile
{
	public readonly type = FileType.POINT_SET;
	static DEFAULT_NAME = 'New Point Set';

	constructor(
		name: string,
		public readonly color: string,
		public readonly isActive: boolean,
		public readonly isChecked: boolean,
		public readonly order: number | undefined
	) {
		super(name);
	}

	from(options: {
		color?: string;
		isActive?: boolean;
		isChecked?: boolean;
		order?: number | undefined;
	}): CachePointSetFile {
		return new CachePointSetFile(
			this.name,
			options.color ?? this.color,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order
		);
	}
}
