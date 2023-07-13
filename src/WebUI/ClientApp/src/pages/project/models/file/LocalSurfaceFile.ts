import { LocalAnnotationFile } from '@/pages/project/models/file/LocalAnnotationFile';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { AnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import type { OverlayFile } from '@/pages/project/models/file/type/OverlayFile';
import type { ISurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import type { NVMesh } from '@niivue/niivue';

export class LocalSurfaceFile
	extends LocalFile
	implements ISurfaceFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.SURFACE;
	public readonly progress = 100;
	public readonly size: number;

	constructor(
		file: File,
		public readonly isActive = false,
		public readonly isChecked = true,
		public readonly order: number | undefined = undefined,
		public readonly color = '#ffffff',
		public readonly overlayFiles: OverlayFile[] = [],
		public readonly annotationFiles: AnnotationFile[] = [],
		public readonly niivueRef: NVMesh | undefined = undefined
	) {
		super(file);
		this.size = file.size;
	}

	from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		color?: string;
		overlayFiles?: OverlayFile[];
		annotationFiles?: AnnotationFile[];
		niivueRef?: NVMesh;
	}): LocalSurfaceFile {
		return new LocalSurfaceFile(
			this.file,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.color ?? this.color,
			options.overlayFiles ?? this.overlayFiles,
			options.annotationFiles ?? this.annotationFiles,
			options.niivueRef ?? this.niivueRef
		);
	}

	fromAddOverlay(file: File): LocalSurfaceFile {
		if (
			this.overlayFiles?.find(
				(overlayFile) => overlayFile.name === file.name
			) === undefined
		)
			return this;

		return new LocalSurfaceFile(
			this.file,
			this.isActive,
			this.isChecked,
			this.order,
			this.color,
			[
				...this.overlayFiles.map((overlay) => overlay.fromIsActive(false)),
				new LocalOverlayFile(file, true),
			],
			this.annotationFiles
		);
	}

	fromAddAnnotation(file: File): LocalSurfaceFile {
		if (
			this.annotationFiles?.find(
				(annotationFile) => annotationFile.name === file.name
			) === undefined
		)
			return this;

		return new LocalSurfaceFile(
			this.file,
			this.isActive,
			this.isChecked,
			this.order,
			this.color,
			this.overlayFiles,
			[
				...this.annotationFiles.map((annotation) =>
					annotation.fromIsActive(false)
				),
				new LocalAnnotationFile(file, true),
			]
		);
	}

	fromDeleteOverlay(overlayFile: OverlayFile): LocalSurfaceFile {
		return new LocalSurfaceFile(
			this.file,
			this.isActive,
			this.isChecked,
			this.order,
			this.color,
			this.overlayFiles?.filter(
				(thisOverlayFile) => thisOverlayFile.name !== overlayFile.name
			),
			this.annotationFiles
		);
	}

	fromDeleteAnnotation(annotationFile: AnnotationFile): LocalSurfaceFile {
		return new LocalSurfaceFile(
			this.file,
			this.isActive,
			this.isChecked,
			this.order,
			this.color,
			this.overlayFiles,
			this.annotationFiles?.filter(
				(thisAnnotationFile) => thisAnnotationFile.name !== annotationFile.name
			)
		);
	}
}
