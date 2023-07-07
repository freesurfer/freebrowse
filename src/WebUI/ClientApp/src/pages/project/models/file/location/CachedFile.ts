import {
	FileLocation,
	ProjectFileBase,
} from '@/pages/project/models/file/ProjectFile';

/**
 * files only cached in the memory, in general because they have not been uploaded yet
 */
export abstract class CachedFile extends ProjectFileBase {
	public readonly location = FileLocation.CACHED;
}
