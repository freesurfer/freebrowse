import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { LocalFile } from '@/pages/project/models/file/location/LocalFile';
import type {
	IPointSetData,
	IPointSetFile,
	IPointSetWaypoint,
} from '@/pages/project/models/file/type/PointSetFile';
import { makeObservable, action, observable } from 'mobx';

export class LocalPointSetFile
	extends LocalFile
	implements IPointSetFile, IOrderableFile, IManageableFile
{
	public readonly type = FileType.POINT_SET;
	public readonly progress = 100;
	public readonly size: number;

	public order: number | undefined = undefined;
	public niivueOrderIndex: number | undefined;
	public isActive = false;
	public isChecked = true;
	public selectedWayPoint = 1;
	public data: IPointSetData | undefined = undefined;

	constructor(private readonly niivueWrapper: NiivueWrapper, file: File) {
		super(file);

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

		this.size = file.size;
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
}
