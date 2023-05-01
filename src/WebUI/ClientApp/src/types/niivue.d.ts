/* eslint-disable @typescript-eslint/no-explicit-any */
// this types should get resolved if found
// eslint-disable @typescript-eslint/no-explicit-any
type Canvas = any;

declare module '@niivue/niivue' {
	class Niivue {
		// eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
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
