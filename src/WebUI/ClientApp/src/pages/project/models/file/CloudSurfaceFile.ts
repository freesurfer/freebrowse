import type { GetProjectSurfaceDto } from '@/generated/web-api-client';
import type { AnnotationFile } from '@/pages/project/models/file/AnnotationFile';
import { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import { CloudFile } from '@/pages/project/models/file/CloudFile';
import { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import { LocalAnnotationFile } from '@/pages/project/models/file/LocalAnnotationFile';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import type { OverlayFile } from '@/pages/project/models/file/OverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISurfaceFile } from '@/pages/project/models/file/SurfaceFile';
import { getApiUrl } from '@/utils';

export class CloudSurfaceFile extends CloudFile implements ISurfaceFile {
	public readonly type = FileType.SURFACE;

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
			fileDto.order,
			fileDto.opacity ?? 100,
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
		size: number,
		isActive = false,
		isChecked = true,
		order: number | undefined,
		opacity: number,
		public readonly color = '#ffffff',
		public readonly overlayFiles: readonly OverlayFile[] = [],
		public readonly annotationFiles: readonly AnnotationFile[] = []
	) {
		if (id === undefined) throw new Error('no id for cloud surface file');
		super(
			id,
			name,
			size,
			`${getApiUrl()}/api/Surface?Id=${String(id)}`,
			isActive,
			isChecked,
			order,
			opacity
		);
	}

	public from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		color?: string;
		overlayFiles?: OverlayFile[];
		annotationFiles?: AnnotationFile[];
	}): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.opacity ?? this.opacity,
			options.color ?? this.color,
			options.overlayFiles ?? this.overlayFiles,
			options.annotationFiles ?? this.annotationFiles
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
			this.opacity,
			this.color,
			[
				...this.overlayFiles.map((overlay) => overlay.fromIsActive(false)),
				new LocalOverlayFile(file, true, true),
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
			this.opacity,
			this.color,
			this.overlayFiles,
			[
				...this.annotationFiles.map((annotation) =>
					annotation.fromIsActive(false)
				),
				new LocalAnnotationFile(file, true, true),
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
			this.opacity,
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
			this.opacity,
			this.color,
			this.overlayFiles,
			this.annotationFiles.filter(
				(thisAnnotationFile) => thisAnnotationFile.name !== annotationFile.name
			)
		);
	}
}
