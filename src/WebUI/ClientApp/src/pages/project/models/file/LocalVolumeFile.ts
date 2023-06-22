import {
	CreateProjectVolumeDto,
	CreateVolumeDto,
} from '@/generated/web-api-client';
import { LocalFile } from '@/pages/project/models/file/LocalFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IVolumeFile } from '@/pages/project/models/file/VolumeFile';

export class LocalVolumeFile extends LocalFile implements IVolumeFile {
	public readonly type = FileType.VOLUME;

	constructor(
		file: File,
		isActive = false,
		isChecked?: boolean,
		order?: number | undefined,
		opacity?: number,
		public readonly contrastMin = 0,
		public readonly contrastMax = 100
	) {
		super(file, isActive, isChecked, order, opacity);
	}

	async toCreateProjectVolumeDto(): Promise<CreateProjectVolumeDto> {
		return new CreateProjectVolumeDto({
			base64: await this.getBase64(),
			fileName: this.name,
			visible: this.isChecked,
			order: this.order,
			colorMap: undefined,
			opacity: this.opacity,
			contrastMin: this.contrastMin,
			contrastMax: this.contrastMax,
		});
	}

	async toCreateVolumeDto(): Promise<CreateVolumeDto> {
		return new CreateVolumeDto({
			base64: await this.getBase64(),
			fileName: this.name,
			visible: this.isChecked,
			order: this.order,
			colorMap: undefined,
			opacity: this.opacity,
			contrastMin: this.contrastMin,
			contrastMax: this.contrastMax,
		});
	}

	public from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		opacity?: number;
		contrastMin?: number;
		contrastMax?: number;
	}): LocalVolumeFile {
		return new LocalVolumeFile(
			this.file,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.opacity ?? this.opacity,
			options.contrastMin ?? this.contrastMin,
			options.contrastMax ?? this.contrastMax
		);
	}
}
