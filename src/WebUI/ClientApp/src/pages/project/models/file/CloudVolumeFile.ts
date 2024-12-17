import {
	type GetProjectVolumeDto,
	type CreateVolumeResponseDto,
	type VolumeClient,
	EditVolumeCommand,
} from '@/generated/web-api-client';
import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { ColorMap, COLOR_MAP_BACKEND } from '@/pages/project/models/ColorMap';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import { type IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import { type IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import {
	DEFAULT_CONTRAST_MAX,
	DEFAULT_CONTRAST_MIN,
	DEFAULT_OPACITY,
	type IVolumeFile,
} from '@/pages/project/models/file/type/VolumeFile';
import { getApiUrl } from '@/utils';
import { type NVImage } from '@niivue/niivue';
import { makeObservable, action, observable } from 'mobx';

export class CloudVolumeFile
	extends CloudFile
	implements IVolumeFile, IOrderableFile, IManageableFile
{
	static DEFAULT_COLOR_MAP: ColorMap = ColorMap.from(COLOR_MAP_BACKEND.GRAY);

	public readonly type = FileType.VOLUME;
	public readonly progress = 100;

	public readonly size: number;
	public isActive = false;
	public isChecked: boolean;
	public order: number | undefined;
	public niivueOrderIndex: number | undefined;
	public opacity: number = DEFAULT_OPACITY;
	public colorMap: ColorMap = ColorMap.fromBackend(COLOR_MAP_BACKEND.GRAY);
	public hasChanges = false;
	public base64: string | undefined = undefined;
	public contrastMin: number = DEFAULT_CONTRAST_MIN;
	public contrastMax: number = DEFAULT_CONTRAST_MAX;
	public contrastMinThreshold: number | undefined = undefined;
	public contrastMaxThreshold: number | undefined = undefined;

	public niivueRef: NVImage | undefined;

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		dto: GetProjectVolumeDto | CreateVolumeResponseDto,
		private readonly client: VolumeClient,
		private readonly niivueUpdateOrder: () => void,
		private readonly projectState: ProjectState
	) {
		if (dto === undefined)
			throw new Error('undefined array entry is not allowed');
		if (dto?.id === undefined) throw new Error('no file without file id');
		if (dto?.fileName === undefined)
			throw new Error('no file without file name');
		if (dto?.fileSize === undefined)
			throw new Error('no file without file size');
		if (dto?.order === undefined) throw new Error('no file without order');
		if (dto?.colorMap === undefined)
			throw new Error('no file without colorMap');

		if (
			dto.colorMap !== COLOR_MAP_BACKEND.GRAY &&
			dto.colorMap !== COLOR_MAP_BACKEND.HEAT &&
			dto.colorMap !== COLOR_MAP_BACKEND.LOOKUP_TABLE &&
			dto.colorMap !== COLOR_MAP_BACKEND.OPEN_MAP &&
			dto.colorMap !== COLOR_MAP_BACKEND.VTAU &&
			dto.colorMap !== null
		)
			throw new Error(
				`${dto.colorMap} is not one of the supported color schemes`
			);

		super(
			dto.id,
			dto.fileName,
			`${getApiUrl()}/api/Volume?Id=${String(dto.id)}`
		);

		makeObservable(this, {
			setOrder: action,
			setBrightness: action,
			setColorMap: action,
			setIsActive: action,
			setIsChecked: action,
			setBase64: action,
			setNiivueRef: action,
			order: observable,
			isChecked: observable,
			isActive: observable,
			opacity: observable,
			colorMap: observable,
			hasChanges: observable,
			base64: observable,
			contrastMin: observable,
			contrastMax: observable,
			contrastMinThreshold: observable,
			contrastMaxThreshold: observable,
		});

		this.size = dto.fileSize;
		this.isChecked = dto.visible ?? true;
		this.setOrder(dto.order);
		this.setBrightness({
			opacity: dto.opacity,
			contrastMin: dto.contrastMin,
			contrastMax: dto.contrastMax,
		});
		this.setColorMap(
			ColorMap.fromBackend(dto.colorMap) ?? CloudVolumeFile.DEFAULT_COLOR_MAP
		);
	}

	setNiivueRef(niivueRef: NVImage): void {
		this.niivueRef = niivueRef;
		this.computeMinMax();
	}

	private computeMinMax(): void {
		if (this.niivueRef === undefined) return;

		const { min, max } = this.niivueRef.img.reduce<{
			min: number | undefined;
			max: number | undefined;
		}>(
			(
				result,
				value
			): { min: number | undefined; max: number | undefined } => ({
				min:
					result.min === undefined || value < result.min ? value : result.min,
				max:
					result.max === undefined || value > result.max ? value : result.max,
			}),
			{
				min: undefined,
				max: undefined,
			}
		);
		this.contrastMinThreshold = min;
		this.contrastMaxThreshold = max;
	}

	async setBase64(base64: string): Promise<void> {
		this.base64 = base64;
		void this.apiPutBase64();
	}

	setIsChecked(isChecked: boolean): void {
		if (this.isChecked === isChecked) return;
		this.isChecked = isChecked;

		if (isChecked && this.niivueRef !== undefined) this.niivueAddFromRef();
		if (isChecked && this.niivueRef === undefined) void this.niivueAddNew();

		if (!isChecked && this.niivueRef !== undefined) this.niivueDelete();

		this.niivueWrapper.niivue.setSliceType(this.projectState.sliceType);

		void this.apiPutOptions();
	}

	private niivueAddFromRef(): void {
		if (this.niivueRef === undefined) return;
		this.niivueWrapper.niivue.volumes.push(this.niivueRef);
		this.niivueWrapper.niivue.setVolume(this.niivueRef, this.niivueOrderIndex);
		this.niivueUpdateOrder();
	}

	async niivueAddNew(): Promise<void> {
		if (!this.isChecked) return;

		const niivueVolume = await this.niivueWrapper.niivue.addVolumeFromUrl({
			url: this.url,
			name: this.name,
			opacity: this.opacity / 100,
			cal_min: this.contrastMin,
			cal_max: this.contrastMax,
			trustCalMinMax: false,
		});
		this.setNiivueRef(niivueVolume);
		this.niivueUpdateOrder();
	}

	private niivueDelete(): void {
		if (this.niivueRef === undefined) return;
		this.niivueWrapper.niivue.setVolume(this.niivueRef, -1);
		this.niivueUpdateOrder();
	}

	setColorMap(colorMap: ColorMap): void {
		if (this.colorMap.backend === colorMap.backend) return;
		this.colorMap = colorMap;

		if (this.niivueRef !== undefined) {
			this.niivueRef.colormap = colorMap.niivue;
			const cmap = this.niivueWrapper.niivue.colormapFromKey(
				this.niivueRef.colormap
			);
			if (
				cmap.R !== undefined &&
				cmap.labels !== undefined &&
				cmap.labels.length !== 0
			) {
				this.niivueRef.setColormapLabel(cmap);
			} else {
				this.niivueRef.colormapLabel = [];
			}
			this.niivueWrapper.niivue.updateGLVolume();
		}

		void this.apiPutOptions();
	}

	setBrightness(
		{
			opacity,
			contrastMin,
			contrastMax,
		}: {
			opacity?: number;
			contrastMin?: number;
			contrastMax?: number;
		},
		upload = true
	): void {
		if (
			this.opacity === opacity &&
			this.contrastMin === contrastMin &&
			this.contrastMax === contrastMax
		)
			return;

		if (opacity !== undefined) this.opacity = opacity;
		if (contrastMin !== undefined) this.contrastMin = contrastMin;
		if (contrastMax !== undefined) this.contrastMax = contrastMax;

		if (this.niivueRef !== undefined) {
			this.niivueRef.opacity = (opacity ?? 100) / 100;
			this.niivueRef.cal_min = contrastMin ?? 20;
			this.niivueRef.cal_max = contrastMax ?? 80;
			this.niivueWrapper.niivue.updateGLVolume();
		}

		if (upload) void this.apiPutOptions();
	}

	setOrder(order: number): void {
		if (this.order === order) return;
		this.order = order;
		void this.apiPutOptions();
	}

	setNiivueOrderIndex(niivueOrderIndex: number): void {
		if (this.niivueOrderIndex === niivueOrderIndex) return;
		this.niivueOrderIndex = niivueOrderIndex;
		this.updateNiivueOrder();
	}

	private updateNiivueOrder(): void {
		if (this.niivueRef === undefined || this.niivueOrderIndex === undefined)
			return;

		const volIndex = this.niivueWrapper.niivue.getVolumeIndexByID(
			this.niivueRef.id
		);

		if (this.niivueOrderIndex === 0) {
			this.niivueWrapper.niivue.volumes.splice(volIndex, 1);
			this.niivueWrapper.niivue.volumes.unshift(this.niivueRef);
			this.niivueWrapper.niivue.back = this.niivueWrapper.niivue.volumes[0];
			this.niivueWrapper.niivue.overlays =
				this.niivueWrapper.niivue.volumes.slice(1);
		} else if (this.niivueOrderIndex < 0) {
			// -1 to remove a volume
			this.niivueWrapper.niivue.volumes.splice(
				this.niivueWrapper.niivue.getVolumeIndexByID(this.niivueRef.id),
				1
			);
			// volumes = overlays
			this.niivueWrapper.niivue.back = this.niivueWrapper.niivue.volumes[0];
			if (this.niivueWrapper.niivue.volumes.length > 1) {
				this.niivueWrapper.niivue.overlays =
					this.niivueWrapper.niivue.volumes.slice(1);
			} else {
				this.niivueWrapper.niivue.overlays = [];
			}
		} else {
			this.niivueWrapper.niivue.volumes.splice(volIndex, 1);
			this.niivueWrapper.niivue.volumes.splice(
				this.niivueOrderIndex,
				0,
				this.niivueRef
			);
			this.niivueWrapper.niivue.overlays =
				this.niivueWrapper.niivue.volumes.slice(1);
			this.niivueWrapper.niivue.back = this.niivueWrapper.niivue.volumes[0];
		}
		// niivue.setVolume(this.niivueRef, order);
	}

	setIsActive(isActive: boolean): void {
		if (this.isActive === isActive) return;
		this.isActive = isActive;
	}

	setHasChanges(hasChanges: boolean): void {
		if (this.hasChanges === hasChanges) return;
		this.hasChanges = hasChanges;
	}

	private async apiPutOptions(): Promise<void> {
		await this.client.edit(
			new EditVolumeCommand({
				id: this.id,
				order: this.order,
				contrastMin: this.contrastMin,
				contrastMax: this.contrastMax,
				colorMap: this.colorMap.backend,
				opacity: this.opacity,
				visible: this.isChecked,
			})
		);
	}

	private async apiPutBase64(): Promise<void> {
		await this.client.edit(
			new EditVolumeCommand({
				id: this.id,
				base64: this.hasChanges ? this.base64 : undefined,
			})
		);
	}
}
