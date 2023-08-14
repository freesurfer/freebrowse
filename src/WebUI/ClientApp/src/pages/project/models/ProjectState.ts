import {
	CreateProjectCommand,
	CreateProjectSurfaceDto,
	CreateProjectVolumeDto,
	EditProjectCommand,
	type FileResponse,
	ProjectsClient,
} from '@/generated/web-api-client';
import { LOCAL_STORAGE_KEY, localStorageGet } from '@/model/localStorage';
import {
	DEFAULT_MESH_THICKNESS,
	NiivueWrapper,
} from '@/pages/project/NiivueWrapper';
import { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { type IPointSetWaypoint } from '@/pages/project/models/file/type/PointSetFile';
import {
	DeepLinkHandler,
	type IQueryParam,
} from '@/pages/project/models/handlers/DeepLinkHandler';
import { DownloadFilesHandler } from '@/pages/project/models/handlers/DownloadFilesHandler';
import { EventHandler } from '@/pages/project/models/handlers/EventHandler';
import { HistoryHandler } from '@/pages/project/models/handlers/HistoryHandler';
import { getApiUrl } from '@/utils';
import { type UIData, type LocationData } from '@niivue/niivue';
import { makeAutoObservable } from 'mobx';
import { Store } from 'react-notifications-component';

const DEFAULT_PROJECT_NAME = 'Subject_1';

/**
 * The mode the user is interacting with the UI right now
 */
export enum USER_MODE {
	NAVIGATE,
	EDIT_VOXEL,
	EDIT_POINTS,
}

/**
 * The slice type of the canvas
 */
export enum SLICE_TYPE {
	AXIAL,
	CORONAL,
	SAGITTAL,
	MULTIPLANAR,
	RENDER,
}

export interface ICrosshairPosition {
	x: number;
	y: number;
	z: number;
}

/**
 * class to uncouple backend dto from data used from ui
 * - keep the expected backend data state without fetching it again
 * - keep the ui state of the project in one place
 */
export class ProjectState {
	private readonly client = new ProjectsClient(getApiUrl());

	private readonly niivueWrapper: NiivueWrapper = new NiivueWrapper(
		this,
		(location) => this.setLocation(location),
		(uiData) => this.onNiivueMouseUp(uiData)
	);

	readonly deepLinkHandler = new DeepLinkHandler(this, this.niivueWrapper);

	readonly downloadFilesHandler = new DownloadFilesHandler(
		this,
		this.niivueWrapper
	);

	readonly historyHandler = new HistoryHandler(this, this.niivueWrapper);

	readonly eventHandler = new EventHandler(this, this.niivueWrapper);

	/**
	 * given name of the project
	 */
	public name = DEFAULT_PROJECT_NAME;
	/**
	 * thickness of the mesh on the 2d plane
	 */
	public meshThicknessOn2D = DEFAULT_MESH_THICKNESS;
	/**
	 * user information
	 */
	public userName =
		localStorageGet(LOCAL_STORAGE_KEY.LAST_USER_NAME) ?? 'Anonymus User';

	/**
	 * the value of the brush when editing the voxel
	 */
	public brushValue = 0;
	/**
	 * the mode the user is interacting with the UI right now
	 */
	public sliceType: SLICE_TYPE = SLICE_TYPE.MULTIPLANAR;
	/**
	 * the size of the brush when editing the voxel
	 */
	public brushSize = 1;
	/**
	 * all files related to the project
	 */
	public files: ProjectFiles | undefined = undefined;
	/**
	 * the mode the user is interacting with the UI right now
	 */
	public userMode: USER_MODE = USER_MODE.NAVIGATE;
	/**
	 * the 3D point which is marked in the niivue canvas
	 */
	public crosshairPosition: ICrosshairPosition | undefined = undefined;
	public location: LocationData | undefined = undefined;

	/**
	 * pass a id to load the project from the backend
	 * without id, you can adapt the project settings and should call post afterwards
	 */
	constructor(
		/**
		 * project id defined by the backend
		 * if undefined, the project has not been created yet in the backend
		 */
		public id?: number,
		private readonly query?: IQueryParam
	) {
		console.log('CREATE');
		makeAutoObservable(this, {
			deepLinkHandler: false,
			downloadFilesHandler: false,
			historyHandler: false,
			eventHandler: false,
		});

		if (id === undefined)
			this.files = new ProjectFiles(
				this.niivueWrapper,
				this.historyHandler.editPoints,
				this
			);
	}

	/**
	 * create the project in the backend, if it does not exist already
	 */
	async apiPost(): Promise<void> {
		if (this.id !== undefined) {
			return;
		}

		if (this.files === undefined) {
			console.warn('the project files instance should be there already.');
			return;
		}

		const createProjectResponse = await this.client.create(
			new CreateProjectCommand({
				name: this.name,
				meshThicknessOn2D: this.meshThicknessOn2D,
				volumes: await Promise.all(
					this.files.volumes.local.map(
						async (file) =>
							new CreateProjectVolumeDto({
								base64: await file.getBase64(),
								fileName: file.name,
								visible: file.isChecked,
								order: file.order,
								colorMap: undefined,
								opacity: file.opacity,
								contrastMin: file.contrastMin,
								contrastMax: file.contrastMax,
							})
					)
				),
				surfaces: await Promise.all(
					this.files.surfaces.local.map(
						async (file) =>
							new CreateProjectSurfaceDto({
								base64: await file.getBase64(),
								fileName: file.name,
								visible: file.isChecked,
								order: file.order,
								color: file.color,
							})
					)
				),
			})
		);

		if (createProjectResponse.id === undefined)
			throw new Error('no project id received from backend');

		const newProjectId = createProjectResponse.id;
		this.setId(newProjectId);
		if (this.id === undefined) return;

		await this.files.pointSets.apiPost(this.files.pointSets.local, this.id);
	}

	/**
	 * sets the project id
	 * should only get used after the creation of the project in the backend
	 */
	setId(id: number): void {
		this.id = id;
	}

	private async apiGet(projectId: number): Promise<void> {
		try {
			const backendState = await this.client.getProject(projectId);

			if (backendState.id === undefined)
				throw new Error('no id given for project');
			if (backendState.name === undefined)
				throw new Error('no name given for project');

			this.name = backendState.name;
			if (backendState.meshThicknessOn2D !== undefined)
				this.setMeshThickness(backendState.meshThicknessOn2D);

			this.niivueWrapper.niivue.setSliceType(this.sliceType);

			this.setFiles(
				new ProjectFiles(
					this.niivueWrapper,
					this.historyHandler.editPoints,
					this,
					backendState
				)
			);

			await this.files?.initialize();
			this.niivueWrapper.niivue.createOnLocationChange();

			this.deepLinkHandler.processQuery(this.query);
		} catch (error) {
			console.warn('error fetching the project', error);
		}
	}

	setFiles(files: ProjectFiles): void {
		this.files = files;
	}

	setCanvas(canvas: HTMLCanvasElement | null): void {
		if (canvas === null) return;
		if (this.id === undefined) return;

		this.niivueWrapper.setCanvas(canvas);
		void this.apiGet(this.id);
	}

	setName(value: string): void {
		if (this.id !== undefined)
			throw new Error(
				'can not change name, after a project has been uploaded already'
			);
		this.name = value;
	}

	setSliceType(sliceType: SLICE_TYPE): void {
		this.sliceType = sliceType;
		this.niivueWrapper.niivue.setSliceType(this.sliceType);
	}

	setUserMode(userMode: USER_MODE): void {
		this.userMode = userMode;
	}

	setUserName(userName: string): void {
		this.userName = userName;
		localStorage.setItem(LOCAL_STORAGE_KEY.LAST_USER_NAME, this.userName);
	}

	setMeshThickness(meshThicknessOn2D: number, upload = true): void {
		this.meshThicknessOn2D = meshThicknessOn2D;
		if (upload) void this.apiPutMeshThickness();
		this.niivueUpdateMeshThickness();
	}

	private async apiPutMeshThickness(): Promise<void> {
		if (this.id === undefined) return;

		await this.client.edit(
			new EditProjectCommand({
				id: Number(this.id),
				name: this.name,
				meshThicknessOn2D: this.meshThicknessOn2D,
			})
		);
	}

	private niivueUpdateMeshThickness(): void {
		if (
			this.meshThicknessOn2D ===
			this.niivueWrapper.niivue.opts.meshThicknessOn2D
		)
			return;
		this.niivueWrapper.niivue.opts.meshThicknessOn2D = this.meshThicknessOn2D;
		this.niivueWrapper.niivue.updateGLVolume();
	}

	setBrushValue(brushValue: number): void {
		this.brushValue = brushValue;
	}

	setBrushSize(brushSize: number): void {
		this.brushSize = brushSize;
	}

	setCrosshairPosition(
		crosshairPosition: ICrosshairPosition | undefined
	): void {
		if (crosshairPosition === undefined) return;
		this.crosshairPosition = crosshairPosition;
		this.niivueUpdateCrosshairPosition();
	}

	private niivueUpdateCrosshairPosition(): void {
		const newPosition = this.niivueWrapper.niivue.mm2frac([
			this.crosshairPosition?.x ?? 0,
			this.crosshairPosition?.y ?? 0,
			this.crosshairPosition?.z ?? 0,
		]);
		if (
			newPosition[0] === this.niivueWrapper.niivue.scene.crosshairPos[0] &&
			newPosition[1] === this.niivueWrapper.niivue.scene.crosshairPos[1] &&
			newPosition[2] === this.niivueWrapper.niivue.scene.crosshairPos[2]
		)
			return;
		this.niivueWrapper.niivue.scene.crosshairPos = newPosition;
		this.niivueWrapper.niivue.updateGLVolume();
	}

	setLocation(location: LocationData): void {
		this.location = location;

		this.setCrosshairPosition({
			x: location?.mm[0],
			y: location?.mm[1],
			z: location?.mm[2],
		});

		this.detectVolumeChanges(location);
	}

	private detectVolumeChanges(location: LocationData): void {
		if (
			this.userMode !== USER_MODE.EDIT_VOXEL ||
			!this.niivueWrapper.niivue.uiData.mouseButtonLeftDown
		)
			return;

		this.files?.volumes.cloud.forEach((volume) => {
			if (!volume.isActive) return;

			const index =
				this.niivueWrapper.niivue.volumes.findIndex(
					(niivueVolume) => niivueVolume === volume.niivueRef
				) ?? -1;

			if (index === -1) return;

			this.niivueWrapper.niivue.setVoxelsWithBrushSize(
				location.values[index]?.vox[0] ?? 0,
				location.values[index]?.vox[1] ?? 0,
				location.values[index]?.vox[2] ?? 0,
				this.brushValue ?? 0,
				index,
				this.brushSize ?? 0,
				0
			);

			volume.setHasChanges(true);
		});
	}

	async apiGetDownload(): Promise<FileResponse> {
		if (this.id === undefined)
			throw new Error('can not download files, when there is no project id');
		return await this.client.download(this.id);
	}

	private onNiivueMouseUp(uiData: UIData): void {
		if (this.userMode !== USER_MODE.EDIT_POINTS) return;

		const file = this.files?.pointSets.all.find((file) => file.isActive);

		if (file === undefined) {
			Store.addNotification({
				message: 'you need to select a point set to add points',
				type: 'warning',
				insert: 'top',
				container: 'top-right',
				animationIn: ['animate__animated', 'animate__fadeIn'],
				animationOut: ['animate__animated', 'animate__fadeOut'],
				dismiss: {
					duration: 1500,
					onScreen: true,
				},
			});
			return;
		}

		if (!file.isChecked) {
			Store.addNotification({
				message: 'the selected file needs to be visible to add points',
				type: 'warning',
				insert: 'top',
				container: 'top-right',
				animationIn: ['animate__animated', 'animate__fadeIn'],
				animationOut: ['animate__animated', 'animate__fadeOut'],
				dismiss: {
					duration: 1500,
					onScreen: true,
				},
			});
			return;
		}
		if (!('data' in file) || file.data === undefined) return;

		if (uiData.fracPos[0] < 0) return; // not on volume
		if (uiData.mouseButtonCenterDown) return;

		const position = this.niivueWrapper.coordinatesFromMouse(uiData.fracPos);

		const newPoint: IPointSetWaypoint = {
			coordinates: {
				x: position[0],
				y: position[1],
				z: position[2],
			},
			legacy_stat: 1,
		};

		file.addWaypoint(newPoint);

		file.setSelectedWayPoint(file.data.points.length);
	}
}
