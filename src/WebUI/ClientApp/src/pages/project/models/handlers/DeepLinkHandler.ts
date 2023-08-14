import { type NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { ColorMap } from '@/pages/project/models/ColorMap';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { Store } from 'react-notifications-component';
import { type DecodedValueMap, type QueryParamConfig } from 'use-query-params';

export type IQueryParam = DecodedValueMap<{
	sliceX: QueryParamConfig<number | null | undefined, number | undefined>;
	sliceY: QueryParamConfig<number | null | undefined, number | undefined>;
	sliceZ: QueryParamConfig<number | null | undefined, number | undefined>;
	zoom3d: QueryParamConfig<number | null | undefined, number | undefined>;
	zoom2d: QueryParamConfig<number | null | undefined, number | undefined>;
	zoom2dX: QueryParamConfig<number | null | undefined, number | undefined>;
	zoom2dY: QueryParamConfig<number | null | undefined, number | undefined>;
	zoom2dZ: QueryParamConfig<number | null | undefined, number | undefined>;
	rasX: QueryParamConfig<number | null | undefined, number | undefined>;
	rasY: QueryParamConfig<number | null | undefined, number | undefined>;
	rasZ: QueryParamConfig<number | null | undefined, number | undefined>;
	renderAzimuth: QueryParamConfig<
		number | null | undefined,
		number | undefined
	>;
	renderElevation: QueryParamConfig<
		number | null | undefined,
		number | undefined
	>;
	userMode: QueryParamConfig<number | null | undefined, number | undefined>;
	volumes: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	volumeOpacity: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	volumeOrder: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	volumeVisible: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	volumeSelected: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	volumeContrastMin: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	volumeContrastMax: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	volumeColormap: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	surfaces: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	surfaceOpacity: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	surfaceOrder: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	surfaceVisible: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	surfaceSelected: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	pointSets: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	pointSetOrder: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	pointSetVisible: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
	pointSetSelected: QueryParamConfig<
		(string | null)[] | null | undefined,
		(string | null)[] | never[]
	>;
}>;

export class DeepLinkHandler {
	constructor(
		private readonly projectState: ProjectState,
		private readonly niivueWrapper: NiivueWrapper
	) {}

	processQuery(query?: IQueryParam): void {
		if (query === undefined) return;
		this.adjustFiles(query);
		this.adjustViewport(query);
	}

	private adjustFiles(query: IQueryParam): void {
		const {
			volumes,
			volumeOpacity,
			volumeOrder,
			volumeVisible,
			volumeSelected,
			volumeContrastMin,
			volumeContrastMax,
			volumeColormap,
			surfaces,
			// surfaceOpacity,
			surfaceOrder,
			surfaceVisible,
			surfaceSelected,
			pointSets,
			pointSetOrder,
			pointSetVisible,
			pointSetSelected,
		} = query;

		if (volumes !== undefined && volumes.length > 0) {
			this.projectState.files?.volumes.all.forEach((volume) => {
				const index = volumes
					.filter((value) => value !== null)
					.indexOf(volume.name);

				if (index === -1) {
					volume.setIsChecked(false);
					return;
				}

				volume.setOrder(Number(volumeOrder[index]));
				volume.setIsActive(volumeSelected[index] === 'true');
				volume.setIsChecked(volumeVisible[index] === 'true');
				volume.setBrightness({
					opacity: Number(volumeOpacity[index]),
					contrastMin: Number(volumeContrastMin[index]),
					contrastMax: Number(volumeContrastMax[index]),
				});
				volume.setColorMap(ColorMap.fromBackend(volumeColormap[index]));
			});
		}

		if (surfaces !== undefined && surfaces.length > 0) {
			this.projectState.files?.surfaces.all.forEach((surface) => {
				const index = surfaces
					.filter((surface) => surface !== null)
					.indexOf(surface.name);
				if (index === -1) {
					surface.setIsChecked(false);
					return;
				}

				surface.setOrder(Number(surfaceOrder[index]));
				surface.setIsActive(surfaceSelected[index] === 'true');
				surface.setIsChecked(surfaceVisible[index] === 'true');
				// NOT IMPLEMENTED
				// surface.setOpacity(Number(surfaceOpacity[index]))
			});
		}

		if (pointSets !== undefined && pointSets.length > 0) {
			this.projectState.files?.pointSets.all.forEach((pointSet) => {
				const index = pointSets
					.filter((pointSet) => pointSet !== null)
					.indexOf(pointSet.name);
				if (index === -1) {
					pointSet.setIsChecked(false);
					return;
				}

				pointSet.setOrder(Number(pointSetOrder[index]));
				pointSet.setIsActive(pointSetSelected[index] === 'true');
				pointSet.setIsChecked(pointSetVisible[index] === 'true');
			});
		}
	}

	private adjustViewport(query: IQueryParam): void {
		const {
			sliceX,
			sliceY,
			sliceZ,
			zoom3d,
			zoom2d,
			zoom2dX,
			zoom2dY,
			zoom2dZ,
			renderAzimuth,
			renderElevation,
		} = query;

		if (
			zoom2dX !== undefined &&
			zoom2dY !== undefined &&
			zoom2dZ !== undefined &&
			zoom2d !== undefined &&
			zoom3d !== undefined &&
			renderAzimuth !== undefined &&
			renderElevation !== undefined
		) {
			this.niivueWrapper.niivue.uiData.pan2Dxyzmm = [
				zoom2dX,
				zoom2dY,
				zoom2dZ,
				zoom2d,
			];
			this.niivueWrapper.niivue.scene.volScaleMultiplier = zoom3d;
			this.niivueWrapper.niivue.scene.renderAzimuth = renderAzimuth;
			this.niivueWrapper.niivue.scene.renderElevation = renderElevation;
			this.niivueWrapper.navigateToSlice(sliceX, sliceY, sliceZ);
		}

		/*
		try {
			this.niivueWrapper.niivue.createOnLocationChange();
		} catch (error) {
			// something seems to fail here, but it should not stop the execution
			console.warn('ignore?!', error);
		}
		this.niivueWrapper.niivue.updateGLVolume();
		*/
	}

	private adjustProject(query: IQueryParam): void {
		if (query.userMode === undefined) return;
		this.projectState.setUserMode(query.userMode);
	}

	createDeepLink(): string {
		let deepLink = `${window.location.origin}${window.location.pathname}?`;

		if (
			this.projectState.location !== undefined &&
			this.niivueWrapper !== undefined
		) {
			deepLink += `sliceX=${this.projectState.location.vox[0]}&sliceY=${this.projectState.location.vox[1]}&sliceZ=${this.projectState.location.vox[2]}&zoom2dX=${this.niivueWrapper.niivue.uiData.pan2Dxyzmm[0]}&zoom2dY=${this.niivueWrapper.niivue.uiData.pan2Dxyzmm[1]}&zoom2dZ=${this.niivueWrapper.niivue.uiData.pan2Dxyzmm[2]}&zoom2d=${this.niivueWrapper.niivue.uiData.pan2Dxyzmm[3]}&zoom3d=${this.niivueWrapper.niivue.scene.volScaleMultiplier}&rasX=${this.projectState.location.mm[0]}&rasY=${this.projectState.location.mm[1]}&rasZ=${this.projectState.location.mm[2]}&renderAzimuth=${this.niivueWrapper.niivue.scene.renderAzimuth}&renderElevation=${this.niivueWrapper.niivue.scene.renderElevation}`;
		}

		this.projectState.files?.volumes.all.forEach((volume) => {
			deepLink += `&volumes=${encodeURIComponent(
				volume.name.toString()
			)}&volumeOpacity=${volume.opacity.toString()}&volumeOrder=${
				volume.order ?? 0
			}&volumeVisible=${volume.isChecked.toString()}&volumeSelected=${volume.isActive.toString()}&volumeContrastMin=${
				volume.contrastMin
			}&volumeContrastMax=${volume.contrastMax.toString()}&volumeColormap=${
				volume.colorMap.backend
			}`;
		});

		this.projectState.files?.surfaces.all.forEach((surface) => {
			deepLink += `&surfaces=${encodeURIComponent(surface.name)}&surfaceOrder=${
				surface.order ?? 0
			}&surfaceVisible=${surface.isChecked.toString()}&surfaceSelected=${surface.isActive.toString()}`;
		});

		this.projectState.files?.pointSets.all.forEach((pointSet) => {
			deepLink += `&pointSets=${encodeURIComponent(
				pointSet.name
			)}&pointSetOrder=${
				pointSet.order ?? 0
			}&pointSetVisible=${pointSet.isChecked.toString()}&pointSetSelected=${pointSet.isActive.toString()}`;
		});

		deepLink += `&userMode=${this.projectState.userMode}`;

		return deepLink;
	}

	static displayDeeplinkCopiedNotification(): void {
		Store.addNotification({
			message: 'link copied to clipboard',
			type: 'success',
			insert: 'top',
			container: 'top-right',
			animationIn: ['animate__animated', 'animate__fadeIn'],
			animationOut: ['animate__animated', 'animate__fadeOut'],
			dismiss: {
				duration: 1500,
				onScreen: true,
			},
		});
	}
}
