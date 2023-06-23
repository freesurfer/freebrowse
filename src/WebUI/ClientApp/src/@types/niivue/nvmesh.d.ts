/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-extraneous-class */
declare module '@niivue/niivue' {
	/**
	 * @typedef {Object} NVMeshLayer
	 * @property {string} url
	 * @property {number} opacity
	 * @property {string} colorMap
	 * @property {string} colorMapNegative
	 * @property {boolean} useNegativeCmap
	 * @property {number} cal_min
	 * @property {number} cal_max
	 */
	export interface NVMeshLayer {
		url: string;
		opacity?: number;
		colorMap?: string;
		colorMapNegative?: string;
		useNegativeCmap?: boolean;
		cal_min?: number;
		cal_max?: number;
	}
	/**
	 * @typedef {Object} NVMeshFromUrlOptions
	 * @property {string} url
	 * @property {WebGL2RenderingContext} gl
	 * @property {string} name
	 * @property {number} opacity
	 * @property {number[]} rgba255
	 * @property {boolean} visible
	 * @property {NVMeshLayer[]} layers
	 */
	export interface NVMeshFromUrlOptions {
		url: string;
		gl?: WebGL2RenderingContext;
		name?: string;
		opacity?: number;
		rgba255?: number[];
		visible?: boolean;
		layers?: NVMeshLayer[];
		colorbarVisible?: boolean;
	}
	/**
	 * @class NVMesh
	 * @type NVMesh
	 * @description
	 * a NVImage encapsulates some images data and provides methods to query and operate on images
	 * @constructor
	 * @param {array} pts a 3xN array of vertex positions (X,Y,Z coordinates).
	 * @param {array} tris a 3xN array of triangle indices (I,J,K; indexed from zero). Each triangle generated from three vertices.
	 * @param {string} [name=''] a name for this image. Default is an empty string
	 * @property {array} rgba255 the base color of the mesh. RGBA values from 0 to 255. Default is white
	 * @param {number} [opacity=1.0] the opacity for this image. default is 1
	 * @param {boolean} [visible=true] whether or not this image is to be visible
	 * @param {WebGLRenderingContext} gl - WebGL rendering context
	 * @param {object} connectome specify connectome edges and nodes. Default is null (not a connectome).
	 * @property {array} dpg Data per group for tractography, see TRK format. Default is null (not tractograpgy)
	 * @property {array} dps  Data per streamline for tractography, see TRK format.  Default is null (not tractograpgy)
	 * @property {array} dpv Data per vertex for tractography, see TRK format.  Default is null (not tractograpgy)
	 */
	export class NVMesh {
		/**
		 * @class NVMesh
		 * @type NVMesh
		 * @description
		 * a NVImage encapsulates some images data and provides methods to query and operate on images
		 * @constructor
		 * @param {array} pts a 3xN array of vertex positions (X,Y,Z coordinates).
		 * @param {array} tris a 3xN array of triangle indices (I,J,K; indexed from zero). Each triangle generated from three vertices.
		 * @param {string} [name=''] a name for this image. Default is an empty string
		 * @property {array} rgba255 the base color of the mesh. RGBA values from 0 to 255. Default is white
		 * @param {number} [opacity=1.0] the opacity for this image. default is 1
		 * @param {boolean} [visible=true] whether or not this image is to be visible
		 * @param {WebGLRenderingContext} gl - WebGL rendering context
		 * @param {object} connectome specify connectome edges and nodes. Default is null (not a connectome).
		 * @property {array} dpg Data per group for tractography, see TRK format. Default is null (not tractograpgy)
		 * @property {array} dps  Data per streamline for tractography, see TRK format.  Default is null (not tractograpgy)
		 * @property {array} dpv Data per vertex for tractography, see TRK format.  Default is null (not tractograpgy)
		 */
		constructor(
			pts: any[],
			tris: any[],
			name?: string,
			rgba255: number[],
			opacity?: number,
			visible?: boolean,
			gl: WebGLRenderingContext,
			connectome?: object,
			dpg?: any,
			dps?: any,
			dpv?: any,
			colorbarVisible?: boolean
		);
		name: any;
		colorbarVisible: any;
		id: any;
		furthestVertexFromOrigin: any;
		extentsMin: any;
		extentsMax: any;
		opacity: any;
		visible: any;
		meshShaderIndex: any;
		indexBuffer: any;
		vertexBuffer: any;
		vao: any;
		offsetPt0: any;
		hasConnectome: any;
		pts: any;
		layers: NVMeshLayer[];
		fiberLength: any;
		fiberDither: any;
		fiberColor: any;
		fiberDecimationStride: any;
		fiberMask: any;
		colormap: any;
		dpg: any;
		dps: any;
		dpv: any;
		rgba255: any;
		tris: any;
		updateFibers(gl: any): void;
		fiberLengths: any;
		indexCount: any;
		updateConnectome(gl: any): void;
		updateMesh(gl: any): void;
		vertexCount: any;
		reverseFaces(gl: any): void;
		setLayerProperty(id: any, key: any, val: any, gl: any): void;
		setProperty(key: any, val: any, gl: any): void;
		generatePosNormClr(pts: any, tris: any, rgba255: any): Float32Array;
	}
	export namespace NVMesh {
		function readTRACT(buffer: any): {
			pts: number[];
			offsetPt0: number[];
			dps: {
				id: string;
				vals: any[];
			}[];
		};
		function readTCK(buffer: any): {
			pts: number[];
			offsetPt0: number[];
		};
		function readTRK(buffer: any): {
			pts: number[];
			offsetPt0: number[];
			dps: {
				id: string;
				vals: any[];
			}[];
			dpv: {
				id: string;
				vals: any[];
			}[];
		};
		function readSMP(buffer: any, n_vert: any): Float32Array;
		function readSTC(buffer: any, n_vert: any): Float32Array;
		function readCURV(buffer: any, n_vert: any): Float32Array;
		function readANNOT(buffer: any, n_vert: any): Uint32Array;
		function readNV(buffer: any): {
			positions: any[];
			indices: any[];
		};
		function readASC(buffer: any): {
			positions: Float32Array;
			indices: Int32Array;
		};
		function readVTK(buffer: any):
			| {
					pts: any[];
					offsetPt0: any[];
					positions?: undefined;
					indices?: undefined;
			  }
			| {
					positions: Float32Array;
					indices: Int32Array;
					pts?: undefined;
					offsetPt0?: undefined;
			  }
			| {
					pts: Float32Array;
					offsetPt0: Uint32Array;
			  };
		function readDFS(
			buffer: any,
			n_vert?: number
		): {
			positions: Float32Array;
			indices: Int32Array;
			colors: Float32Array;
		};
		function readMZ3(
			buffer: any,
			n_vert?: number
		):
			| any[]
			| {
					positions: Float32Array;
					indices: Int32Array;
					scalars: any[];
					colors: Float32Array;
			  };
		function readPLY(buffer: any):
			| {
					positions: Float32Array;
					indices: Int32Array;
			  }
			| {
					positions: any[];
					indices: Int32Array;
			  };
		function readLayer(
			name: any,
			buffer: any,
			nvmesh: any,
			opacity?: number,
			colorMap?: string,
			colorMapNegative?: string,
			useNegativeCmap?: boolean,
			cal_min?: any,
			cal_max?: any,
			isOutlineBorder?: boolean
		): void;
		function readICO(buffer: any): {
			positions: Float32Array;
			indices: Int32Array;
		};
		function readGEO(
			buffer: any,
			isFlipWinding?: boolean
		): {
			positions: Float32Array;
			indices: Int32Array;
		};
		function readOFF(buffer: any): {
			positions: Float32Array;
			indices: Int32Array;
		};
		function readOBJ(buffer: any): {
			positions: Float32Array;
			indices: Int32Array;
		};
		function readFreeSurfer(buffer: any): {
			positions: Float32Array;
			indices: Int32Array;
		};
		function readSRF(buffer: any): {
			positions: Float32Array;
			indices: Int32Array;
		};
		function readSTL(buffer: any): {
			positions: Float32Array;
			indices: Int32Array;
		};
		function readNII2(buffer: any, n_vert?: number): any[] | Float32Array;
		function readNII(buffer: any, n_vert?: number): any[] | Float32Array;
		function readMGH(buffer: any, n_vert?: number): any[];
		function readX3D(
			buffer: any,
			n_vert?: number
		): {
			positions: any[];
			indices: any[];
			rgba255: any[];
		};
		function readGII(
			buffer: any,
			n_vert?: number
		):
			| any[]
			| {
					positions: any[];
					indices: any[];
					scalars: any[];
			  };
		function loadConnectomeFromJSON(
			json: any,
			gl: any,
			name?: string,
			colorMap?: string,
			opacity?: number,
			visible?: boolean
		): Promise<NVMesh>;
		function readMesh(
			buffer: any,
			name: any,
			gl: any,
			opacity?: number,
			rgba255?: number[],
			visible?: boolean
		): Promise<NVMesh>;
		function readTRX(buffer: any): Promise<{
			pts: any[];
			offsetPt0: any[];
			dpg: {
				id: string;
				vals: any[];
			}[];
			dps: {
				id: string;
				vals: any[];
			}[];
			dpv: {
				id: string;
				vals: any[];
			}[];
			header: any;
		}>;
		function loadLayer(layer: any, nvmesh: any): Promise<void>;
		/**
		 * factory function to load and return a new NVMesh instance from a given URL
		 * @param {string} url the resolvable URL pointing to a nifti image to load
		 * @param {string} [name=''] a name for this image. Default is an empty string
		 * @param {string} [colorMap='gray'] a color map to use. default is gray
		 * @param {number} [opacity=1.0] the opacity for this image. default is 1
		 * @param {boolean} [visible=true] whether or not this image is to be visible
		 * @param {NVMeshLayer[]} [layers=[]] layers of the mesh to load
		 * @returns {NVMesh} returns a NVImage instance
		 * @example
		 * myImage = NVMesh.loadFromUrl('./someURL/mesh.gii') // must be served from a server (local or remote)
		 */
		function loadFromUrl({
			url,
			gl,
			name,
			opacity,
			rgba255,
			visible,
			layers,
		}?: string): NVMesh;
		function readFileAsync(file: any): Promise<any>;
		/**
		 * factory function to load and return a new NVMesh instance from a file in the browser
		 * @param {string} file the file object
		 * @param {WebGLRenderingContext} gl - WebGL rendering context
		 * @param {string} [name=''] a name for this image. Default is an empty string
		 * @param {number} [opacity=1.0] the opacity for this image. default is 1
		 * @property {array} rgba255 the base color of the mesh. RGBA values from 0 to 255. Default is white
		 * @property {array} layers optional files that determine per-vertex colors, e.g. statistical maps.
		 * @param {boolean} [visible=true] whether or not this image is to be visible
		 * @returns {NVMesh} returns a NVMesh instance
		 */
		function loadFromFile({
			file,
			gl,
			name,
			opacity,
			rgba255,
			visible,
			layers,
		}?: string): NVMesh;
		/**
		 * load and return a new NVMesh instance from a base64 encoded string
		 * @param {string} [base64=null] the base64 encoded string
		 * @param {WebGLRenderingContext} gl - WebGL rendering context
		 * @param {string} [name=''] a name for this image. Default is an empty string
		 * @param {number} [opacity=1.0] the opacity for this image. default is 1
		 * @property {array} rgba255 the base color of the mesh. RGBA values from 0 to 255. Default is white
		 * @property {array} layers optional files that determine per-vertex colors, e.g. statistical maps.
		 * @param {boolean} [visible=true] whether or not this image is to be visible
		 * @returns {NVMesh} returns a NVMesh instance
		 */
		function loadFromBase64({
			base64,
			gl,
			name,
			opacity,
			rgba255,
			visible,
			layers,
		}?: string): NVMesh;
	}
}
