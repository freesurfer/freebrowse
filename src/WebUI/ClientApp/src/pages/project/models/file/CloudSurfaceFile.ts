import type { GetProjectSurfaceDto } from '@/generated/web-api-client';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import { LocalAnnotationFile } from '@/pages/project/models/file/LocalAnnotationFile';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type { AnnotationFile } from '@/pages/project/models/file/type/AnnotationFile';
import type { OverlayFile } from '@/pages/project/models/file/type/OverlayFile';
import type { ISurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import { getApiUrl } from '@/utils';
import type { NVMesh } from '@niivue/niivue';

export class CloudSurfaceFile
	extends CloudFile
	implements ISurfaceFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.SURFACE;
	public readonly progress = 100;

	static fromDto(fileDto: GetProjectSurfaceDto): CloudSurfaceFile {
		if (fileDto === undefined)
			throw new Error('undefined array entry is not allowed');

		if (fileDto?.id === undefined) throw new Error('no file without file id');

		if (fileDto?.fileName === undefined)
			throw new Error('no file without file name');

		if (fileDto?.fileSize === undefined)
			throw new Error('no file without file size');

		return new CloudSurfaceFile(
			fileDto.id,
			fileDto.fileName,
			fileDto.fileSize,
			false,
			fileDto.visible,
			fileDto.order ?? 0,
			fileDto.color ?? '#ffffff',
			fileDto.overlays?.map((overlayDto) =>
				CloudOverlayFile.fromDto(overlayDto)
			),
			fileDto.annotations?.map((annotationDto) =>
				CloudAnnotationFile.fromDto(annotationDto)
			)
		);
	}

	constructor(
		id: number,
		name: string,
		public readonly size: number,
		public readonly isActive = false,
		public readonly isChecked = true,
		public readonly order: number | undefined,
		public readonly color = '#ffffff',
		public readonly overlayFiles: readonly OverlayFile[] = [],
		public readonly annotationFiles: readonly AnnotationFile[] = [],
		public readonly niivueRef: NVMesh | undefined = undefined
	) {
		if (id === undefined) throw new Error('no id for cloud surface file');
		super(id, name, `${getApiUrl()}/api/Surface?Id=${String(id)}`);
	}

	public from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		color?: string;
		overlayFiles?: OverlayFile[];
		annotationFiles?: AnnotationFile[];
		niivueRef?: NVMesh;
	}): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.color ?? this.color,
			options.overlayFiles ?? this.overlayFiles,
			options.annotationFiles ?? this.annotationFiles,
			options.niivueRef ?? this.niivueRef
		);
	}

	fromAddOverlay(file: File): CloudSurfaceFile {
		if (
			this.overlayFiles.find(
				(overlayFile) => overlayFile.name === file.name
			) !== undefined
		)
			return this;

		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
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

	fromAddAnnotation(file: File): CloudSurfaceFile {
		if (
			this.annotationFiles.find(
				(annotationFile) => annotationFile.name === file.name
			) !== undefined
		)
			return this;

		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
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

	fromDeleteOverlay(overlayFile: OverlayFile): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			this.isActive,
			this.isChecked,
			this.order,
			this.color,
			this.overlayFiles.filter(
				(thisOverlayFile) => thisOverlayFile.name !== overlayFile.name
			),
			this.annotationFiles
		);
	}

	fromDeleteAnnotation(annotationFile: AnnotationFile): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			this.isActive,
			this.isChecked,
			this.order,
			this.color,
			this.overlayFiles,
			this.annotationFiles.filter(
				(thisAnnotationFile) => thisAnnotationFile.name !== annotationFile.name
			)
		);
	}
}
