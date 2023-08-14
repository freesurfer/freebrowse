import { COLOR_MAP_BACKEND, ColorMap } from '@/pages/project/models/ColorMap';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type { IVolumeFile } from '@/pages/project/models/file/type/VolumeFile';
import { makeObservable, action, observable } from 'mobx';

export class LocalVolumeFile
	extends LocalFile
	implements IVolumeFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.VOLUME;
	public readonly progress = 100;
	public readonly size: number;

	public isActive = false;
	public isChecked = true;
	public order: number | undefined = undefined;
	public niivueOrderIndex: number | undefined;
	public opacity = 100;
	public colorMap: ColorMap = ColorMap.from(COLOR_MAP_BACKEND.GRAY);
	public hasChanges = false;
	public base64: string | undefined = undefined;
	public contrastMin = 0;
	public contrastMax = 100;
	public contrastMinThreshold: number | undefined = undefined;
	public contrastMaxThreshold: number | undefined = undefined;

	constructor(file: File) {
		super(file);
		makeObservable(this, {
			setBrightness: action,
			setColorMap: action,
			setIsActive: action,
			setIsChecked: action,
			order: observable,
			isChecked: observable,
			isActive: observable,
			opacity: observable,
			colorMap: observable,
			contrastMin: observable,
			contrastMax: observable,
			contrastMinThreshold: observable,
			contrastMaxThreshold: observable,
		});
		this.size = file.size;
	}

	setIsChecked(isChecked: boolean): void {
		if (this.isChecked === isChecked) return;
		this.isChecked = isChecked;
	}

	setColorMap(colorMap: ColorMap): void {
		if (this.colorMap.backend === colorMap.backend) return;
		this.colorMap = colorMap;
	}

	setBrightness({
		opacity,
		contrastMin,
		contrastMax,
	}: {
		opacity?: number;
		contrastMin?: number;
		contrastMax?: number;
	}): void {
		const normalizedOpacity = opacity !== undefined ? opacity / 100 : undefined;
		if (
			this.opacity === normalizedOpacity &&
			this.contrastMin === contrastMin &&
			this.contrastMax === contrastMax
		)
			return;

		if (opacity !== undefined) this.opacity = opacity;
		if (contrastMin !== undefined) this.contrastMin = contrastMin;
		if (contrastMax !== undefined) this.contrastMax = contrastMax;
	}

	setOrder(order: number): void {
		if (this.order === order) return;
		this.order = order;
	}

	setNiivueOrderIndex(niivueOrderIndex: number): void {
		if (this.niivueOrderIndex === niivueOrderIndex) return;
		this.niivueOrderIndex = niivueOrderIndex;
	}

	setIsActive(isActive: boolean): void {
		if (this.isActive === isActive) return;
		this.isActive = isActive;
	}
}
