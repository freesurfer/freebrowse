import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type {
	IPointSetData,
	IPointSetFile,
} from '@/pages/project/models/file/type/PointSetFile';
import { getApiUrl } from '@/utils';
import type { NVMesh } from '@niivue/niivue';

export class CloudPointSetFile
	extends CloudFile
	implements IPointSetFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.POINT_SET;
	public readonly progress = 100;

	constructor(
		id: number,
		name: string,
		public readonly size: number,
		public readonly data: IPointSetData,
		public readonly isActive: boolean,
		public readonly isChecked: boolean,
		public readonly order: number | undefined,
		public readonly niivueRef: NVMesh | undefined = undefined
	) {
		if (id === undefined) throw new Error('no id for cloud volume file');
		super(id, name, `${getApiUrl()}/api/PointSet?Id=${String(id)}`);
	}

	public from(options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		data?: IPointSetData;
		niivueRef?: NVMesh;
	}): CloudPointSetFile {
		return new CloudPointSetFile(
			this.id,
			this.name,
			this.size,
			options.data ?? this.data,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.niivueRef ?? this.niivueRef
		);
	}

	getBase64(): string {
		return btoa(JSON.stringify(this.data));
	}
}
