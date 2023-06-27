import { LocalFile } from '@/pages/project/models/file/LocalFile';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import type { OverlayFile } from '@/pages/project/models/file/OverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISurfaceFile } from '@/pages/project/models/file/SurfaceFile';

export class LocalSurfaceFile extends LocalFile implements ISurfaceFile {
	public readonly type = FileType.SURFACE;

	constructor(
		file: File,
		isActive = false,
		isChecked = true,
		order: number | undefined = undefined,
		opacity = 100,
		public readonly overlayFiles: OverlayFile[] | undefined = undefined
	) {
		super(file, isActive, isChecked, order, opacity);
	}

	from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
	}): LocalSurfaceFile {
		return new LocalSurfaceFile(
			this.file,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.opacity ?? this.opacity,
			this.overlayFiles
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
			this.opacity,
			[...this.overlayFiles, new LocalOverlayFile(file)]
		);
	}

	fromDeleteOverlay(overlayFile: OverlayFile): LocalSurfaceFile {
		return new LocalSurfaceFile(
			this.file,
			this.isActive,
			this.isChecked,
			this.order,
			this.opacity,
			this.overlayFiles?.filter(
				(thisOverlayFile) => thisOverlayFile.name !== overlayFile.name
			)
		);
	}
}
