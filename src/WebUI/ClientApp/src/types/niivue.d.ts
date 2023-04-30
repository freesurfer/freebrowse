// this types should get resolved if found
type Canvas = any;

declare module '@niivue/niivue' {
	class Niivue {
		constructor(options: { isResizeCanvas: boolean }) {}
		attachToCanvas(canvas: Canvas, h: number = null);
		loadVolumes(
			volumes: {
				url: string;
				name?: string;
				colorMap?: any;
				colorMapNegative?: any;
				opacity?: number;
				urlImgData?: string;
				cal_min?: number;
				cal_max?: number;
				trustCalMinMax?: any;
				isManifest?: boolean;
				frame4D?: any;
			}[]
		);
	}
}
