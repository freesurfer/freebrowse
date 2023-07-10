import type { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';

export type PointSetFile = CachePointSetFile;

export interface IPointSetFile {
	readonly type: FileType.POINT_SET;
}
