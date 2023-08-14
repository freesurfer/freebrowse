import {
	type CreatePointSetResponseDto,
	EditPointSetCommand,
	type GetProjectPointSetDto,
	type PointSetClient,
	CreatePointSetCommand,
} from '@/generated/web-api-client';
import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IManageableFile } from '@/pages/project/models/file/extension/ManageableFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CloudFile } from '@/pages/project/models/file/location/CloudFile';
import type {
	IPointSetData,
	IPointSetFile,
	IPointSetWaypoint,
} from '@/pages/project/models/file/type/PointSetFile';
import { type HistoryHandlerEditPoints } from '@/pages/project/models/handlers/HistoryHandlerEditPoints';
import { getApiUrl } from '@/utils';
import { NVMesh } from '@niivue/niivue';
import { makeObservable, action, observable } from 'mobx';

export class CloudPointSetFile
	extends CloudFile
	implements IPointSetFile, IOrderableFile, IManageableFile
{
	readonly type = FileType.POINT_SET;
	readonly progress = 100;

	size: number;
	isActive = false;
	isChecked: boolean;
	order: number | undefined;
	niivueOrderIndex: number | undefined;
	selectedWayPoint = 1;
	data: IPointSetData | undefined;
	niivueRef: NVMesh | undefined;

	constructor(
		private readonly niivueWrapper: NiivueWrapper,
		private readonly history: HistoryHandlerEditPoints,
		dto: CreatePointSetResponseDto | GetProjectPointSetDto,
		private readonly client: PointSetClient,
		private readonly niivueUpdateOrder: () => void
	) {
		if (dto.id === undefined)
			throw new Error('each point set file needs to have an id');
		if (dto.fileName === undefined)
			throw new Error('each point set file needs to have a name');
		if (dto.fileSize === undefined)
			throw new Error('each point set file needs to have a size');
		super(
			dto.id,
			dto.fileName,
			`${getApiUrl()}/api/PointSet?Id=${String(dto.id)}`
		);
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
		this.size = dto.fileSize;
		this.isChecked = dto.visible ?? true;
		this.order = dto.order;
	}

	async initialize(): Promise<void> {
		return await this.apiGetData();
	}

	setNiivueRef(niivueRef: NVMesh): void {
		this.niivueRef = niivueRef;
		this.updateNiivueOrder();
	}

	setSelectedWayPoint(selectedWayPoint: number): void {
		this.selectedWayPoint = selectedWayPoint;
	}

	setData(data: IPointSetData): void {
		this.data = data;

		this.niivueDelete();
		void this.niivueAddNew();

		void this.apiPutData();
	}

	restoreWaypointsFromHistory(
		waypoints: IPointSetWaypoint[],
		selectedWayPoint: number
	): { waypoints: IPointSetWaypoint[]; selectedWaypoint: number } {
		if (this.data === undefined) throw new Error('no data');

		const stashPoints = this.data.points;
		const stashSelectedWaypoint = this.selectedWayPoint;
		this.setData({
			...this.data,
			points: waypoints,
		});

		this.setSelectedWayPoint(selectedWayPoint);

		return { waypoints: stashPoints, selectedWaypoint: stashSelectedWaypoint };
	}

	addWaypoint(waypoint: IPointSetWaypoint, logHistory = true): void {
		if (this.data === undefined) throw new Error('no data');
		if (logHistory)
			this.history.addWaypoint(this.data.points, this, this.selectedWayPoint);

		this.setData({
			...this.data,
			points: [...this.data.points, waypoint],
		});
	}

	removeWaypoint(waypoint: IPointSetWaypoint, logHistory = true): void {
		if (this.data === undefined) throw new Error('no data');

		if (logHistory)
			this.history.removeWaypoint(
				this.data.points,
				this,
				this.selectedWayPoint
			);

		const newPointArray = this.data.points.filter(
			(point) => JSON.stringify(point) !== JSON.stringify(waypoint)
		);

		if (this.data.points.length === newPointArray.length) {
			console.warn('not able to delete waypoint', waypoint);
			return;
		}

		this.setData({
			...this.data,
			points: newPointArray,
		});

		this.setSelectedWayPoint(
			this.selectedWayPoint -
				(newPointArray.length < this.selectedWayPoint ? 1 : 0)
		);
	}

	/**
	 * create file in the backend again, from the cached information
	 * especially needed for history feature
	 */
	async apiPost(projectId: number): Promise<CreatePointSetResponseDto> {
		return await this.client.create(
			new CreatePointSetCommand({
				base64: this.getBase64(),
				fileName: this.name,
				order: this.order,
				visible: this.isChecked,
				projectId,
			})
		);
	}

	/**
	 * this method will set all the properties of this file instance
	 * to stay the same instance for history comparison reasons, but aiming to the new file on the backend
	 * this can be necessary after a user has undo a deletion of a point set file
	 */
	reuseInstanceForNewBackendFile(response: CreatePointSetResponseDto): void {
		if (response.id === undefined)
			throw new Error('can not rewire the file without a new id');
		this.id = response.id;
		this.url = `${getApiUrl()}/api/PointSet?Id=${String(this.id)}`;
	}

	private async apiPutData(): Promise<void> {
		await this.client.edit(
			new EditPointSetCommand({ id: this.id, base64: this.getBase64() })
		);
	}

	setOrder(order: number): void {
		if (this.order === order) return;
		this.order = order;
		void this.apiPutOptions();
	}

	setIsActive(isActive: boolean): void {
		if (this.isActive === isActive) return;
		this.isActive = isActive;
	}

	setNiivueOrderIndex(niivueOrderIndex: number): void {
		if (this.niivueOrderIndex === niivueOrderIndex) return;

		this.niivueOrderIndex = niivueOrderIndex;
		this.updateNiivueOrder();
	}

	private updateNiivueOrder(): void {
		if (this.niivueRef === undefined || this.niivueOrderIndex === undefined)
			return;

		this.niivueWrapper.niivue.setMesh(this.niivueRef, this.niivueOrderIndex);
	}

	setIsChecked(isChecked: boolean): void {
		if (this.isChecked === isChecked) return;
		this.isChecked = isChecked;

		if (isChecked && this.niivueRef !== undefined) this.niivueAddFromRef();
		if (isChecked && this.niivueRef === undefined) void this.niivueAddNew();

		if (!isChecked) this.niivueDelete();

		void this.apiPutOptions();
	}

	private niivueAddFromRef(): void {
		if (this.niivueRef === undefined) return;
		this.niivueWrapper.niivue.meshes.push(this.niivueRef);
		this.niivueUpdateOrder();
	}

	/**
	 * pass this file to the niivue library
	 */
	async niivueAddNew(): Promise<void> {
		if (!this.isChecked) return;

		if (this.data === undefined || this.data.points.length === 0) {
			console.warn('no data');
			return;
		}

		const cmap = NiivueWrapper.rgbToCmap(this.data?.color);
		if (cmap !== undefined) {
			this.niivueWrapper.niivue.addColormap(this.name, cmap);
		}

		const niivueMesh = await NVMesh.loadConnectomeFromFreeSurfer(
			this.data,
			this.niivueWrapper.niivue.gl,
			this.name,
			'',
			1.0,
			true
		);

		if (cmap !== undefined) {
			niivueMesh.nodeColormap = this.name;
		}

		// this.niivueWrapper.niivue.addMesh(niivueMesh);
		niivueMesh.updateMesh(this.niivueWrapper.niivue.gl);
		this.setNiivueRef(niivueMesh);
		this.niivueAddFromRef();
	}

	/**
	 * remove file from the niivue library
	 * the reference will still be cached in this file
	 * to add this file later again without recreating everything
	 */
	niivueDelete(): void {
		if (this.niivueRef === undefined) return;
		this.niivueWrapper.niivue.setMesh(this.niivueRef, -1);
		this.niivueUpdateOrder();
	}

	private async apiPutOptions(): Promise<void> {
		await this.client.edit(
			new EditPointSetCommand({
				id: this.id,
				order: this.order,
				visible: this.isChecked,
			})
		);
	}

	private async apiGetData(): Promise<void> {
		const pointSetResponse = await this.client.get(this.id);
		try {
			this.setData(JSON.parse(await pointSetResponse.data.text()));
		} catch (error) {
			console.error(
				'something went wrong parsing the point set data json',
				error
			);
		}
	}

	private getBase64(): string {
		return btoa(JSON.stringify(this.data));
	}
}
