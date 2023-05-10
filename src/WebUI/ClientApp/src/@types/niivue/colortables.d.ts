/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@niivue/niivue' {
	export class colortables {
		version: number;
		gamma: number;
		cluts: {};
		addColormap(key: any, cmap: any): void;
		colorMaps(): string[];
		colormapFromKey(name: any): any;
		colormap(key?: string): Uint8ClampedArray;
		makeDrawLut(name: any): {
			lut: Uint8ClampedArray;
			labels: any;
		};
		makeLut(Rs: any, Gs: any, Bs: any, As: any, Is: any): Uint8ClampedArray;
	}
	export type cmapper = typeof colortables;
}
