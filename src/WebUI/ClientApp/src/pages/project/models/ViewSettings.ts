export class ViewSettings {
	public readonly sliceX: number | undefined;
	public readonly sliceY: number | undefined;
	public readonly sliceZ: number | undefined;
	public readonly rasX: number | undefined;
	public readonly rasY: number | undefined;
	public readonly rasZ: number | undefined;
	public readonly zoom3d: number | undefined;
	public readonly zoom2d: number | undefined;
	public readonly zoom2dX: number | undefined;
	public readonly zoom2dY: number | undefined;
	public readonly zoom2dZ: number | undefined;
	public readonly renderAzimuth: number | undefined;
	public readonly renderElevation: number | undefined;

	constructor(
		zoom2d: number | undefined,
		zoom2dX: number | undefined,
		zoom2dY: number | undefined,
		zoom2dZ: number | undefined,
		zoom3d: number | undefined,
		sliceX: number | undefined,
		sliceY: number | undefined,
		sliceZ: number | undefined,
		rasX: number | undefined,
		rasY: number | undefined,
		rasZ: number | undefined,
		renderAzimuth: number | undefined,
		renderElevation: number | undefined
	) {
		this.zoom2d = zoom2d;
		this.zoom2dX = zoom2dX;
		this.zoom2dY = zoom2dY;
		this.zoom2dZ = zoom2dZ;
		this.zoom3d = zoom3d;
		this.sliceX = sliceX;
		this.sliceY = sliceY;
		this.sliceZ = sliceZ;
		this.rasX = rasX;
		this.rasY = rasY;
		this.rasZ = rasZ;
		this.renderAzimuth = renderAzimuth;
		this.renderElevation = renderElevation;
	}
}
