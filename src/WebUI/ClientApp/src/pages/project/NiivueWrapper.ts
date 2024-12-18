import LookUpTable from '@/pages/project/colorMaps/LookUpTable.json';
import OpenMapTable from '@/pages/project/colorMaps/LookUpTableOpenMap.json';
import VTAUTable from '@/pages/project/colorMaps/LookUpTableVTAU.json';
import { COLOR_MAP_NIIVUE } from '@/pages/project/models/ColorMap';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import {
	type LocationData,
	type UIData,
	Niivue,
	type NVImage,
	type NVMesh,
	type ColormapLut,
} from '@niivue/niivue';

export const DEFAULT_MESH_THICKNESS = 1;

export const DEFAULT_CROSSHAIR_WIDTH = 1;

export interface INiivueCache {
	volumes: Map<string, NVImage>;
	surfaces: Map<string, NVMesh>;
	pointSets: Map<string, NVMesh>;
}

/**
 * this class is a wrapper for the niivue library reference
 * to prevent access to a not existing reference (by not catching accesses to undefined or guards everywhere)
 * and to have the logic in a separate place to not overload the project component
 */
export class NiivueWrapper {
	public readonly niivue = new Niivue({
		show3Dcrosshair: false,
		trustCalMinMax: false,
		onLocationChange: (location) => {
			this.onLocationChange?.({
				...location,
				values: location.values.map((v) => {
					return {
						...v,
						label: this.getVoxelLabel(v),
					};
				}),
			});
		},
		dragAndDropEnabled: false,
		dragMode: 3,
		meshThicknessOn2D: DEFAULT_MESH_THICKNESS,
		crosshairWidth: DEFAULT_CROSSHAIR_WIDTH,
		isHighResolutionCapable: false,
		isOrientCube: false,
		enableBorderHighlight: true,
		displaySliceInfo: true,
		multiplanarForceRender: true,
	});

	static rgbToCmap(
		rgb: [number, number, number] | undefined
	): ColormapLut | undefined {
		if (rgb === undefined) return undefined;
		if (rgb.length !== 3) throw new Error('Invalid RGB input');
		return {
			R: [rgb[0], rgb[0]],
			G: [rgb[1], rgb[1]],
			B: [rgb[2], rgb[2]],
			A: [0, 128],
			I: [0, 255],
		};
	}

	constructor(
		private readonly projectState: ProjectState,
		private readonly onLocationChange: (value: LocationData) => void,
		onMouseUp: (uiData: UIData) => void
	) {
		this.niivue.onMouseUp = onMouseUp;
	}

	public setCanvas(canvasRef: HTMLCanvasElement): void {
		this.niivue.addColormap(COLOR_MAP_NIIVUE.LOOKUP_TABLE, LookUpTable);
		this.niivue.addColormap(COLOR_MAP_NIIVUE.OPEN_MAP, OpenMapTable);
		this.niivue.addColormap(COLOR_MAP_NIIVUE.VTAU, VTAUTable);
		void this.niivue.attachToCanvas(canvasRef);
	}

	coordinatesFromMouse(
		fracPos: [number]
	): ReturnType<typeof this.niivue.frac2mm> {
		return this.niivue.frac2mm(fracPos);
	}

	static hexToRGBA(hex: string): [number, number, number, number] {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);

		return [r, g, b, 255];
	}

	static compareRgba(
		rgba255: [number, number, number, number],
		rgba: [number, number, number, number]
	): boolean {
		return (
			rgba255[0] === rgba[0] &&
			rgba255[1] === rgba[1] &&
			rgba255[2] === rgba[2] &&
			rgba255[3] === rgba[3]
		);
	}

	navigateToSlice(
		x: number | undefined,
		y: number | undefined,
		z: number | undefined
	): void {
		if (this.niivue === undefined) return;

		const calculateDistance = (
			target: number | undefined,
			dimensions: number
		): number => {
			if (target === undefined) return 0;

			const startingPoint = Math.floor(dimensions / 2);

			return target >= startingPoint
				? target - startingPoint
				: (startingPoint - target) * -1;
		};

		const distanceX = calculateDistance(x, this.niivue.vox[0]);
		const distanceY = calculateDistance(y, this.niivue.vox[1]);
		const distanceZ = calculateDistance(z, this.niivue.vox[2]);

		this.niivue.moveCrosshairInVox(distanceX, distanceY, distanceZ);
	}

	private getVoxelLabel(volumeLocationData: {
		id: string;
		mm: [number, number, number, number];
		name: string;
		value: number;
		rawValue: number;
		vox: [number, number, number];
	}): string | undefined {
		const volume = this.niivue.volumes.find(
			(v) => v.name === volumeLocationData.name
		);

		if (volume?.colormapLabel?.labels === undefined) return undefined;

		try {
			const value = Math.round(
				volume.getRawValue(
					volumeLocationData.vox[0],
					volumeLocationData.vox[1],
					volumeLocationData.vox[2],
					volume.frame4D
				)
			);

			if (value < 0 || value >= volume.colormapLabel.labels.length)
				return undefined;

			const label = volume.colormapLabel.labels[value];
			return label;
		} catch (error) {
			console.warn(error);
			return undefined;
		}
	}
}
