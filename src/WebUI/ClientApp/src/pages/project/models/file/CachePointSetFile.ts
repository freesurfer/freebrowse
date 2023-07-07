import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CachedFile } from '@/pages/project/models/file/location/CachedFile';
import type { IPointSetFile } from '@/pages/project/models/file/type/PointSetFile';

export class CachePointSetFile
	extends CachedFile
	implements IPointSetFile, IOrderableFile
{
	public readonly type = FileType.POINT_SET;

	constructor(
		name: string,
		public readonly isActive: boolean,
		public readonly isChecked: boolean,
		public readonly order: number
	) {
		super(name);
	}
}
