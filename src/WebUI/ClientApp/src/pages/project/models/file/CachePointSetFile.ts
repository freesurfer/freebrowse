import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CachedFile } from '@/pages/project/models/file/location/CachedFile';
import {
	hexToRgb,
	type IPointSetWaypoint,
	type IPointSetData,
	type IPointSetFile,
} from '@/pages/project/models/file/type/PointSetFile';
import { makeObservable, action, observable } from 'mobx';

export class CachePointSetFile
	extends CachedFile
	implements IPointSetFile, IOrderableFile
{
	public readonly type = FileType.POINT_SET;
	static DEFAULT_NAME = 'New Point Set';

	public isActive = true;
	public isChecked = true;
	public order: number | undefined;
	public niivueOrderIndex: number | undefined;
	public selectedWayPoint = 1;
	public data: IPointSetData;

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		name: string,
		color: string
	) {
		super(name);

		makeObservable(this, {
			setOrder: action,
			setIsChecked: action,
			setIsActive: action,
			setSelectedWayPoint: action,
			setData: action,
			order: observable,
			isChecked: observable,
			isActive: observable,
			selectedWayPoint: observable,
			data: observable,
		});

		this.data = {
			color: hexToRgb(color),
			data_type: 'fs_pointset',
			points: [],
			version: 1,
			vox2ras: 'scanner_ras',
		};
	}

	setSelectedWayPoint(selectedWayPoint: number): void {
		this.selectedWayPoint = selectedWayPoint;
	}

	setData(data: IPointSetData): void {
		this.data = data;
	}

	addWaypoint(waypoint: IPointSetWaypoint): void {
		if (this.data === undefined) return;

		this.setData({
			...this.data,
			points: [...this.data.points, waypoint],
		});
	}

	removeWaypoint(waypoint: IPointSetWaypoint): void {
		if (this.data === undefined) {
			console.warn('point set data undefined - should not be possible');
			return;
		}

		const newPointArray = this.data.points.filter(
			(point) => point !== waypoint
		);

		this.setData({
			...this.data,
			points: newPointArray,
		});

		this.setSelectedWayPoint(
			this.selectedWayPoint -
				(newPointArray.length < this.selectedWayPoint ? 1 : 0)
		);
	}

	setIsChecked(isChecked: boolean): void {
		if (this.isChecked === isChecked) return;
		this.isChecked = isChecked;
	}

	setIsActive(isActive: boolean): void {
		if (this.isActive === isActive) return;
		this.isActive = isActive;
	}

	setOrder(order: number): void {
		if (this.order === order) return;
		this.order = order;
	}

	setNiivueOrderIndex(niivueOrderIndex: number): void {
		if (this.niivueOrderIndex === niivueOrderIndex) return;
		this.niivueOrderIndex = niivueOrderIndex;
	}

	async getBase64(): Promise<string> {
		return await Promise.resolve(btoa(JSON.stringify(this.data)));
	}
}
