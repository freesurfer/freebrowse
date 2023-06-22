import { CloudFile } from '@/pages/project/models/file/CloudFile';
import { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import type { OverlayFile } from '@/pages/project/models/file/OverlayFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { ISurfaceFile } from '@/pages/project/models/file/SurfaceFile';
import { getApiUrl } from '@/utils';

export class CloudSurfaceFile extends CloudFile implements ISurfaceFile {
	public readonly type = FileType.SURFACE;

	constructor(
		id: number,
		name: string,
		size: number,
		isActive = false,
		isChecked = true,
		order: number | undefined,
		opacity: number,
		public readonly overlayFile: OverlayFile | undefined = undefined
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
	}): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.opacity ?? this.opacity
		);
	}

	fromAddedOverlay(file: File): CloudSurfaceFile {
		return new CloudSurfaceFile(
			this.id,
			this.name,
			this.size,
			this.isActive,
			this.isChecked,
			this.order,
			this.opacity,
			new LocalOverlayFile(file)
		);
	}
}
