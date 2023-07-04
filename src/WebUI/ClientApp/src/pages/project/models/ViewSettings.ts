export class ViewSettings {
	public readonly sliceX: number;
	public readonly sliceY: number;
	public readonly sliceZ: number;
	public readonly rasX: number;
	public readonly rasY: number;
	public readonly rasZ: number;
	public readonly zoom3d: number;
	public readonly zoom2d: number;
	public readonly zoom2dX: number;
	public readonly zoom2dY: number;
	public readonly zoom2dZ: number;
	public readonly renderAzimuth: number;
	public readonly renderElevation: number;

	constructor(
		zoom2d: number,
		zoom2dX: number,
		zoom2dY: number,
		zoom2dZ: number,
		zoom3d: number,
		sliceX: number,
		sliceY: number,
		sliceZ: number,
		rasX: number,
		rasY: number,
		rasZ: number,
		renderAzimuth: number,
		renderElevation: number
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
