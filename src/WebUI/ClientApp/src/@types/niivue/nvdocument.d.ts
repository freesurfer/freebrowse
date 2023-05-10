/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@niivue/niivue' {
	/**
	 * Slice Type
	 * @enum
	 * @readonly
	 */
	export type SLICE_TYPE = Readonly<{
		AXIAL: 0;
		CORONAL: 1;
		SAGITTAL: 2;
		MULTIPLANAR: 3;
		RENDER: 4;
	}>;
	/**
	 * @enum
	 * @readonly
	 */
	export type DRAG_MODE = Readonly<{
		none: 0;
		contrast: 1;
		measurement: 2;
		pan: 3;
		slicer3D: 4;
	}>;
	export namespace DEFAULT_OPTIONS {
		export const textHeight: number;
		export const colorbarHeight: number;
		export const crosshairWidth: number;
		export const rulerWidth: number;
		export const show3Dcrosshair: boolean;
		export const backColor: number[];
		export const crosshairColor: number[];
		export const fontColor: number[];
		export const selectionBoxColor: number[];
		export const clipPlaneColor: number[];
		export const rulerColor: number[];
		export const colorbarMargin: number;
		export const trustCalMinMax: boolean;
		export const clipPlaneHotKey: string;
		export const viewModeHotKey: string;
		export const doubleTouchTimeout: number;
		export const longTouchTimeout: number;
		export const keyDebounceTime: number;
		export const isNearestInterpolation: boolean;
		export const isResizeCanvas: boolean;
		export const isAtlasOutline: boolean;
		export const isRuler: boolean;
		export const isColorbar: boolean;
		export const isOrientCube: boolean;
		export const multiplanarPadPixels: number;
		export const multiplanarForceRender: boolean;
		export const isRadiologicalConvention: boolean;
		export const meshThicknessOn2D: number;
		import dragMode = contrast;
		export { dragMode };
		export const isDepthPickMesh: boolean;
		export const isCornerOrientationText: boolean;
		export const sagittalNoseLeft: boolean;
		export const isSliceMM: boolean;
		export const isHighResolutionCapable: boolean;
		export const logging: boolean;
		export const loadingText: string;
		export const dragAndDropEnabled: boolean;
		export const drawingEnabled: boolean;
		export const penValue: number;
		export const floodFillNeighbors: number;
		export const isFilledPen: boolean;
		export const thumbnail: string;
		export const maxDrawUndoBitmaps: number;
		import sliceType = MULTIPLANAR;
		export { sliceType };
		export const meshXRay: number;
		export const isAntiAlias: any;
	}
	export interface NVConfigOptions {
		textHeight: number;
		colorbarHeight: number;
		crosshairWidth: number;
		rulerWidth: number;
		show3Dcrosshair: boolean;
		backColor: number[];
		crosshairColor: number[];
		fontColor: number[];
		selectionBoxColor: number[];
		clipPlaneColor: number[];
		rulerColor: number[];
		colorbarMargin: number;
		trustCalMinMax: boolean;
		clipPlaneHotKey: string;
		viewModeHotKey: string;
		doubleTouchTimeout: number;
		longTouchTimeout: number;
		keyDebounceTime: number;
		isNearestInterpolation: boolean;
		isAtlasOutline: boolean;
		isRuler: boolean;
		isColorbar: boolean;
		isOrientCube: boolean;
		multiplanarPadPixels: number;
		multiplanarForceRender: boolean;
		isRadiologicalConvention: boolean;
		meshThicknessOn2D: number;
		dragMode: any;
		isDepthPickMesh: boolean;
		isCornerOrientationText: boolean;
		sagittalNoseLeft: boolean;
		isSliceMM: boolean;
		isHighResolutionCapable: boolean;
		logging: boolean;
		loadingText: string;
		dragAndDropEnabled: boolean;
		drawingEnabled: boolean;
		penValue: number;
		floodFillNeighbors: number;
		isFilledPen: boolean;
		thumbnail: string;
		maxDrawUndoBitmaps: number;
		sliceType: any;
		isAntiAlias: boolean;
	}
	/** Creates and instance of NVDocument
	 * @class NVDocument
	 * @type NVDocument
	 * @constructor
	 */
	export class NVDocument {
		/**
		 * Deserialize mesh data objects
		 * @param {NVDocument} document
		 */
		static deserializeMeshDataObjects(document: NVDocument): void;
		/**
		 * Factory method to return an instance of NVDocument from a URL
		 * @param {string} url
		 * @constructs NVDocument
		 */
		static loadFromUrl(url: string): Promise<NVDocument>;
		/**
		 * Factory method to return an instance of NVDocument from a File object
		 * @param {File} file
		 * @constructs NVDocument
		 */
		static loadFromFile(file: File): Promise<NVDocument>;
		/**
		 * Factory method to return an instance of NVDocument from JSON
		 */
		static loadFromJSON(data: any): NVDocument;
		data: any;
		/**
		 * @typedef {Object} NVSceneData
		 * @property {number} azimuth
		 * @property {number} elevation
		 * @property {number[]} crosshairPos
		 * @property {number[]} clipPlane
		 * @property {number[]} clipPlaneDepthAziElev
		 * @property {number} volScaleMultiplier
		 */
		scene: any;
		volumes: any;
		meshes: any;
		drawBitmap: any;
		imageOptionsMap: any;
		meshOptionsMap: any;
		/**
		 * @param {string} title title of document
		 */
		set title(arg: string);
		/**
		 * Title of the document
		 * @returns {string}
		 */
		get title(): string;
		/**
		 * Sets preview image blob
		 * @param {string} dataURL encoded preview image
		 */
		set previewImageDataURL(arg: string);
		/**
		 * Gets preview image blob
		 * @returns {string} dataURL of preview image
		 */
		get previewImageDataURL(): string;
		/**
		 * @returns {NVImageFromUrlOptions[]}
		 */
		get imageOptionsArray(): NVImageFromUrlOptions[];
		/**
		 * Gets the base 64 encoded blobs of associated images
		 * @returns {string[]}
		 */
		get encodedImageBlobs(): string[];
		/**
		 * Gets the base 64 encoded blob of the associated drawing
		 * @returns {string[]}
		 */
		get encodedDrawingBlob(): string[];
		/**
		 * Sets the options of the {@link Niivue} instance
		 */
		set opts(arg: any);
		/**
		 * Gets the options of the {@link Niivue} instance
		 * @returns {Object}
		 */
		get opts(): any;
		/**
		 * Checks if document has an image by id
		 * @param {NVImage} image
		 * @returns {boolean}
		 */
		hasImage(image: NVImage): boolean;
		/**
		 * Checks if document has an image by url
		 * @param {string} url
		 * @returns {boolean}
		 */
		hasImageFromUrl(url: string): boolean;
		/**
		 * Adds an image and the options an image was created with
		 * @param {NVImage} image
		 * @param {NVImageFromUrlOptions} imageOptions
		 */
		addImageOptions(image: NVImage, imageOptions: NVImageFromUrlOptions): void;
		/**
		 * Removes image from the document as well as its options
		 * @param {NVImage} image
		 */
		removeImage(image: NVImage): void;
		/**
		 * Returns the options for the image if it was added by url
		 * @param {NVImage} image
		 * @returns {NVImageFromUrlOptions}
		 */
		getImageOptions(image: NVImage): NVImageFromUrlOptions;
		/**
		 * @typedef {Object} NVDocumentData
		 * @property {string[]} encodedImageBlobs base64 encoded images
		 * @property {string} encodedDrawingBlob base64 encoded drawing
		 * @property {string} previewImageDataURL dataURL of the preview image
		 * @property {Map<string, number>} imageOptionsMap map of image ids to image options
		 * @property {NVImageFromUrlOptions} imageOptionsArray array of image options to recreate images
		 * @property {NVSceneData} sceneData data to recreate a scene
		 * @property {NVConfigOptions} opts configuration options of {@link Niivue} instance
		 * @property {string} meshesString encoded meshes
		 */
		/**
		 * Converts NVDocument to JSON
		 * @returns {NVDocumentData}
		 */
		json(): {
			/**
			 * base64 encoded images
			 */
			encodedImageBlobs: string[];
			/**
			 * base64 encoded drawing
			 */
			encodedDrawingBlob: string;
			/**
			 * dataURL of the preview image
			 */
			previewImageDataURL: string;
			/**
			 * map of image ids to image options
			 */
			imageOptionsMap: Map<string, number>;
			/**
			 * array of image options to recreate images
			 */
			imageOptionsArray: NVImageFromUrlOptions;
			/**
			 * data to recreate a scene
			 */
			sceneData: NVSceneData;
			/**
			 * configuration options of {@link Niivue } instance
			 */
			opts: NVConfigOptions;
			/**
			 * encoded meshes
			 */
			meshesString: string;
		};
		/**
		 * Downloads a JSON file with options, scene, images, meshes and drawing of {@link Niivue} instance
		 * @param {string} fileName
		 */
		download(fileName: string): void;
	}
}
