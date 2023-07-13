import type { GetProjectPointSetDto } from '@/generated/web-api-client';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type { IPointSetFile } from '@/pages/project/models/file/type/PointSetFile';
import { getApiUrl } from '@/utils';
import type { NVMesh } from '@niivue/niivue';

export class CloudPointSetFile
	extends CloudFile
	implements IPointSetFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.POINT_SET;
	public readonly progress = 100;

	public static fromDto(fileDto: GetProjectPointSetDto): CloudPointSetFile {
		if (fileDto === undefined)
			throw new Error('undefined array entry is not allowed');

		if (fileDto?.id === undefined) throw new Error('no file without file id');

		if (fileDto?.fileName === undefined)
			throw new Error('no file without file name');

		if (fileDto?.fileSize === undefined)
			throw new Error('no file without file size');

		return new CloudPointSetFile(
			fileDto.id,
			fileDto.fileName,
			fileDto.fileSize
		);
	}

	constructor(
		id: number,
		name: string,
		public readonly size: number,
		public readonly isActive = false,
		public readonly isChecked = true,
		public readonly order: number | undefined = undefined,
		public readonly niivueRef: NVMesh | undefined = undefined
	) {
		if (id === undefined) throw new Error('no id for cloud volume file');
		super(id, name, `${getApiUrl()}/api/PointSet?Id=${String(id)}`);
	}

	public from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		niivueRef?: NVMesh;
	}): CloudPointSetFile {
		return new CloudPointSetFile(
			this.id,
			this.name,
			this.size,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.niivueRef ?? this.niivueRef
		);
	}
}
