import type { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import type { LocalAnnotationFile } from '@/pages/project/models/file/LocalAnnotationFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';

export type AnnotationFile = LocalAnnotationFile | CloudAnnotationFile;

export interface IAnnotationFile {
	type: FileType.ANNOTATION;
}
