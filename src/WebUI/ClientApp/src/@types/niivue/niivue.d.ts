/* eslint-disable @typescript-eslint/lines-between-class-members */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-invalid-void-type */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '@niivue/niivue' {
	export class ColormapLut {
		R: number[];
		G: number[];
		B: number[];
		A: number[];
		I: number[];
		labels: string[];
	}

	export class Scene {
		renderAzimuth: number;
		renderElevation: number;
		volScaleMultiplier: number;
	}

	export class UIData {
		pan2Dxyzmm: [number, number, number, number];
		dpr: number;
		mouseButtonCenterDown: boolean;
		fracPos: [number];
		mouseButtonRightDown: boolean;
	}

	export class LocationData {
		frac: [number, number, number];
		mm: [number, number, number];
		values: {
			id: string;
			mm: [number, number, number, number];
			name: string;
			value: number;
			vox: [number, number, number];
			label: string;
		}[];
		vox: [number, number, number];
		xy: [number, number];
		string: string;
		toString(): string;
	}

	interface DragModes {
		none: 0;
		contrast: 1;
		measurement: 2;
		pan: 3;
		slicer3D: 4;
	}
	/**
	 * Niivue exposes many properties. It's always good to call `updateGLVolume` after altering one of these settings.
	 * @typedef {Object} NiivueOptions
	 * @property {number} [options.textHeight=0.06] the text height for orientation labels (0 to 1). Zero for no text labels
	 * @property {number} [options.colorbarHeight=0.05] size of colorbar. 0 for no colorbars, fraction of Nifti j dimension
	 * @property {number} [options.colorbarMargin=0.05] padding around colorbar when displayed
	 * @property {number} [options.crosshairWidth=1] crosshair size. Zero for no crosshair
	 * @property {number} [options.rulerWidth=4] ruler size. Zero (or isRuler is false) for no ruler
	 * @property {array}  [options.backColor=[0,0,0,1]] the background color. RGBA values from 0 to 1. Default is black
	 * @property {array}  [options.crosshairColor=[1,0,0,1]] the crosshair color. RGBA values from 0 to 1. Default is red
	 * @property {array}  [options.fontColor=[0.5,0.5,0.5,1]] the font color. RGBA values from 0 to 1. Default is gray
	 * @property {array}  [options.selectionBoxColor=[1,1,1,0.5]] the selection box color when the intensty selection box is shown (right click and drag). RGBA values from 0 to 1. Default is transparent white
	 * @property {array}  [options.clipPlaneColor=[1,1,1,0.5]] the color of the visible clip plane. RGBA values from 0 to 1. Default is white
	 * @property {array}  [options.rulerColor=[1, 0, 0, 0.8]] the color of the ruler. RGBA values from 0 to 1. Default is translucent red
	 * @property {boolean} [options.show3Dcrosshair=false] true/false whether crosshairs are shown on 3D rendering
	 * @property {boolean} [options.trustCalMinMax=true] true/false whether to trust the nifti header values for cal_min and cal_max. Trusting them results in faster loading because we skip computing these values from the data
	 * @property {string} [options.clipPlaneHotKey="KeyC"] the keyboard key used to cycle through clip plane orientations. The default is "c"
	 * @property {string} [options.viewModeHotKey="KeyV"] the keyboard key used to cycle through view modes. The default is "v"
	 * @property {number} [options.keyDebounceTime=50] the keyUp debounce time in milliseconds. The default is 50 ms. You must wait this long before a new hot-key keystroke will be registered by the event listener
	 * @property {number} [options.doubleTouchTimeout=500] the maximum time in milliseconds for a double touch to be detected. The default is 500 ms
	 * @property {number} [options.longTouchTimeout=1000] the minimum time in milliseconds for a touch to count as long touch. The default is 1000 ms
	 * @property {boolean} [options.isRadiologicalConvention=false] whether or not to use radiological convention in the display
	 * @property {boolean} [options.logging=false] turn on logging or not (true/false)
	 * @property {string} [options.loadingText="waiting on images..."] the loading text to display when there is a blank canvas and no images
	 * @property {boolean} [options.dragAndDropEnabled=true] whether or not to allow file and url drag and drop on the canvas
	 * @property {boolean} [options.isNearestInterpolation=false] whether nearest neighbor interpolation is used, else linear interpolation
	 * @property {boolean} [options.isAtlasOutline=false] whether atlas maps are only visible at the boundary of regions
	 * @property {boolean} [options.isRuler=false] whether a 10cm ruler is displayed
	 * @property {boolean} [options.isColorbar=false] whether colorbar(s) are shown illustrating values for color maps
	 * @property {boolean} [options.isOrientCube=false] whether orientation cube is shown for 3D renderings
	 * @property {number} [options.multiplanarPadPixels=0] spacing between tiles of a multiplanar view
	 * @property {boolean} [options.multiplanarForceRender=false] always show rendering in multiplanar view
	 * @property {number} [options.meshThicknessOn2D=Infinity] 2D slice views can show meshes within this range. Meshes only visible in sliceMM (world space) mode
	 * @property {DRAG_MODE} [options.dragMode=contrast] behavior for dragging (none, contrast, measurement, pan)
	 * @property {boolean} [options.isDepthPickMesh=false] when both voxel-based image and mesh is loaded, will depth picking be able to detect mesh or only voxels
	 * @property {boolean} [options.isCornerOrientationText=false] should slice text be shown in the upper right corner instead of the center of left and top axes?
	 * @property {boolean} [options.sagittalNoseLeft=false] should 2D sagittal slices show the anterior direction toward the left or right?
	 * @property {boolean} [options.isSliceMM=false] are images aligned to voxel space (false) or world space (true)
	 * @property {boolean} [options.isHighResolutionCapable=true] demand that high-dot-per-inch displays use native voxel size
	 * @property {boolean} [options.drawingEnabled=false] allow user to create and edit voxel-based drawings
	 * @property {number} [options.penValue=Infinity] color of drawing when user drags mouse (if drawingEnabled)
	 * @property {number} [options.penValue=Infinity] color of drawing when user drags mouse (if drawingEnabled)
	 * @property {boolean} [options.floodFillNeighbors=6] does a voxel have 6 (face), 18 (edge) or 26 (corner) neighbors?
	 * @property {number} [options.maxDrawUndoBitmaps=8] number of possible undo steps (if drawingEnabled)
	 * @property {string} [options.thumbnail=""] optional 2D png bitmap that can be rapidly loaded to defer slow loading of 3D image
	 * @example
	 * niivue.opts.isColorbar = true;
	 * niivue.updateGLVolume()
	 * @see {@link https://niivue.github.io/niivue/features/mosaics2.html|live demo usage}
	 */
	export interface NiivueOptions {
		/**
		 * the text height for orientation labels (0 to 1). Zero for no text labels
		 */
		textHeight?: number;
		/**
		 * size of colorbar. 0 for no colorbars, fraction of Nifti j dimension
		 */
		colorbarHeight?: number;
		/**
		 * padding around colorbar when displayed
		 */
		colorbarMargin?: number;
		/**
		 * crosshair size. Zero for no crosshair
		 */
		crosshairWidth?: number;
		/**
		 * ruler size. Zero (or isRuler is false) for no ruler
		 */
		rulerWidth?: number;
		/**
		 * the background color. RGBA values from 0 to 1. Default is black
		 */
		backColor?: number[];
		/**
		 * the crosshair color. RGBA values from 0 to 1. Default is red
		 */
		crosshairColor?: number[];
		/**
		 * the font color. RGBA values from 0 to 1. Default is gray
		 */
		fontColor?: number[];
		/**
		 * the selection box color when the intensty selection box is shown (right click and drag). RGBA values from 0 to 1. Default is transparent white
		 */
		selectionBoxColor?: number[];
		/**
		 * the color of the visible clip plane. RGBA values from 0 to 1. Default is white
		 */
		clipPlaneColor?: number[];
		/**
		 * the color of the ruler. RGBA values from 0 to 1. Default is translucent red
		 */
		rulerColor?: number[];
		/**
		 * true/false whether crosshairs are shown on 3D rendering
		 */
		show3Dcrosshair?: boolean;
		/**
		 * true/false whether to trust the nifti header values for cal_min and cal_max. Trusting them results in faster loading because we skip computing these values from the data
		 */
		trustCalMinMax?: boolean;
		/**
		 * the keyboard key used to cycle through clip plane orientations. The default is "c"
		 */
		clipPlaneHotKey?: string;
		/**
		 * the keyboard key used to cycle through view modes. The default is "v"
		 */
		viewModeHotKey?: string;
		/**
		 * the keyUp debounce time in milliseconds. The default is 50 ms. You must wait this long before a new hot-key keystroke will be registered by the event listener
		 */
		keyDebounceTime?: number;
		/**
		 * the maximum time in milliseconds for a double touch to be detected. The default is 500 ms
		 */
		doubleTouchTimeout?: number;
		/**
		 * the minimum time in milliseconds for a touch to count as long touch. The default is 1000 ms
		 */
		longTouchTimeout?: number;
		/**
		 * whether or not to use radiological convention in the display
		 */
		isRadiologicalConvention?: boolean;
		/**
		 * turn on logging or not (true/false)
		 */
		logging?: boolean;
		/**
		 * the loading text to display when there is a blank canvas and no images
		 */
		loadingText?: string;
		/**
		 * whether or not to allow file and url drag and drop on the canvas
		 */
		dragAndDropEnabled?: boolean;
		/**
		 * whether nearest neighbor interpolation is used, else linear interpolation
		 */
		isNearestInterpolation?: boolean;
		/**
		 * whether atlas maps are only visible at the boundary of regions
		 */
		isAtlasOutline?: boolean;
		/**
		 * whether a 10cm ruler is displayed
		 */
		isRuler?: boolean;
		/**
		 * whether colorbar(s) are shown illustrating values for color maps
		 */
		isColorbar?: boolean;
		/**
		 * whether orientation cube is shown for 3D renderings
		 */
		isOrientCube?: boolean;
		/**
		 * spacing between tiles of a multiplanar view
		 */
		multiplanarPadPixels?: number;
		/**
		 * always show rendering in multiplanar view
		 */
		multiplanarForceRender?: boolean;
		/**
		 * 2D slice views can show meshes within this range. Meshes only visible in sliceMM (world space) mode
		 */
		meshThicknessOn2D?: number;
		/**
		 * behavior for dragging (none, contrast, measurement, pan)
		 */
		dragMode?: DragModes[keyof DragModes];
		/**
		 * enable border highlight on hover
		 */
		enableBorderHighlight?: boolean;
		/**
		 * green in rgb values (1 -> 255, 0 -> 0) last number is the transparency a. If a is smaller than 0 the default red color is shown
		 */
		borderHighlightColor?: number[];
		/**
		 * enable border highlight on hover
		 */
		borderHighlightWidth?: number;
		/**
		 *  whether or not the current slice and total slice number are shown on the canvas
		 */
		displaySliceInfo?: boolean;
		/**
		 * the text height relative to canvas width and height labels (0 to 1). Zero for no text labels
		 */
		displaySliceScale?: number;
		/**
		 * when both voxel-based image and mesh is loaded, will depth picking be able to detect mesh or only voxels
		 */
		isDepthPickMesh?: boolean;
		/**
		 * should slice text be shown in the upper right corner instead of the center of left and top axes?
		 */
		isCornerOrientationText?: boolean;
		/**
		 * should 2D sagittal slices show the anterior direction toward the left or right?
		 */
		sagittalNoseLeft?: boolean;
		/**
		 * are images aligned to voxel space (false) or world space (true)
		 */
		isSliceMM?: boolean;
		/**
		 * demand that high-dot-per-inch displays use native voxel size
		 */
		isHighResolutionCapable?: boolean;
		/**
		 * allow user to create and edit voxel-based drawings
		 */
		drawingEnabled?: boolean;
		/**
		 * color of drawing when user drags mouse (if drawingEnabled)
		 */
		penValue?: number;
		/**
		 * does a voxel have 6 (face), 18 (edge) or 26 (corner) neighbors?
		 */
		floodFillNeighbors?: boolean;
		/**
		 * number of possible undo steps (if drawingEnabled)
		 */
		maxDrawUndoBitmaps?: number;
		/**
		 * optional 2D png bitmap that can be rapidly loaded to defer slow loading of 3D image
		 */
		thumbnail?: string;
		onLocationChange?: (location: LocationData) => void;
	}

	export interface VolumeObject {
		/**
		 * the url of the image to load
		 */
		url: string;
		/**
		 * the name of the image
		 */
		name?: string;
		/**
		 * the name of the color map to use
		 */
		colorMap?: string;
		colormap?: string;
		/**
		 * the name of the color map to use for negative values
		 */
		colorMapNegative?: string;
		/**
		 * the opacity of the image
		 */
		opacity?: number;
		/**
		 * the image data to use if header and image are separate files
		 */
		urlImgData?: string;
		/**
		 * the minimum value to display
		 */
		cal_min?: number;
		/**
		 * the maximum value to display
		 */
		cal_max?: number;
		/**
		 * whether to trust the cal_min and cal_max values in the header
		 */
		trustCalMinMax?: boolean;
		/**
		 * whether the image is a manifest file
		 */
		isManifest?: boolean;
		/**
		 * the index of the 4D data to load
		 */
		frame4D?: number;
	}

	/**
	 * @class Niivue
	 * @type Niivue
	 * @description
	 * Niivue can be attached to a canvas. An instance of Niivue contains methods for
	 * loading and rendering NIFTI image data in a WebGL 2.0 context.
	 * @constructor
	 * @param {NiivueOptions} [options={}] options object to set modifiable Niivue properties
	 * @example
	 * let niivue = new Niivue({crosshairColor: [0,1,0,0.5], textHeight: 0.5}) // a see-through green crosshair, and larger text labels
	 */
	export class Niivue {
		/**
		 * Niivue exposes many properties. It's always good to call `updateGLVolume` after altering one of these settings.
		 * @typedef {Object} NiivueOptions
		 * @property {number} [options.textHeight=0.06] the text height for orientation labels (0 to 1). Zero for no text labels
		 * @property {number} [options.colorbarHeight=0.05] size of colorbar. 0 for no colorbars, fraction of Nifti j dimension
		 * @property {number} [options.colorbarMargin=0.05] padding around colorbar when displayed
		 * @property {number} [options.crosshairWidth=1] crosshair size. Zero for no crosshair
		 * @property {number} [options.rulerWidth=4] ruler size. Zero (or isRuler is false) for no ruler
		 * @property {array}  [options.backColor=[0,0,0,1]] the background color. RGBA values from 0 to 1. Default is black
		 * @property {array}  [options.crosshairColor=[1,0,0,1]] the crosshair color. RGBA values from 0 to 1. Default is red
		 * @property {array}  [options.fontColor=[0.5,0.5,0.5,1]] the font color. RGBA values from 0 to 1. Default is gray
		 * @property {array}  [options.selectionBoxColor=[1,1,1,0.5]] the selection box color when the intensty selection box is shown (right click and drag). RGBA values from 0 to 1. Default is transparent white
		 * @property {array}  [options.clipPlaneColor=[1,1,1,0.5]] the color of the visible clip plane. RGBA values from 0 to 1. Default is white
		 * @property {array}  [options.rulerColor=[1, 0, 0, 0.8]] the color of the ruler. RGBA values from 0 to 1. Default is translucent red
		 * @property {boolean} [options.show3Dcrosshair=false] true/false whether crosshairs are shown on 3D rendering
		 * @property {boolean} [options.trustCalMinMax=true] true/false whether to trust the nifti header values for cal_min and cal_max. Trusting them results in faster loading because we skip computing these values from the data
		 * @property {string} [options.clipPlaneHotKey="KeyC"] the keyboard key used to cycle through clip plane orientations. The default is "c"
		 * @property {string} [options.viewModeHotKey="KeyV"] the keyboard key used to cycle through view modes. The default is "v"
		 * @property {number} [options.keyDebounceTime=50] the keyUp debounce time in milliseconds. The default is 50 ms. You must wait this long before a new hot-key keystroke will be registered by the event listener
		 * @property {number} [options.doubleTouchTimeout=500] the maximum time in milliseconds for a double touch to be detected. The default is 500 ms
		 * @property {number} [options.longTouchTimeout=1000] the minimum time in milliseconds for a touch to count as long touch. The default is 1000 ms
		 * @property {boolean} [options.isRadiologicalConvention=false] whether or not to use radiological convention in the display
		 * @property {boolean} [options.logging=false] turn on logging or not (true/false)
		 * @property {string} [options.loadingText="waiting on images..."] the loading text to display when there is a blank canvas and no images
		 * @property {boolean} [options.dragAndDropEnabled=true] whether or not to allow file and url drag and drop on the canvas
		 * @property {boolean} [options.isNearestInterpolation=false] whether nearest neighbor interpolation is used, else linear interpolation
		 * @property {boolean} [options.isAtlasOutline=false] whether atlas maps are only visible at the boundary of regions
		 * @property {boolean} [options.isRuler=false] whether a 10cm ruler is displayed
		 * @property {boolean} [options.isColorbar=false] whether colorbar(s) are shown illustrating values for color maps
		 * @property {boolean} [options.isOrientCube=false] whether orientation cube is shown for 3D renderings
		 * @property {number} [options.multiplanarPadPixels=0] spacing between tiles of a multiplanar view
		 * @property {boolean} [options.multiplanarForceRender=false] always show rendering in multiplanar view
		 * @property {number} [options.meshThicknessOn2D=Infinity] 2D slice views can show meshes within this range. Meshes only visible in sliceMM (world space) mode
		 * @property {DRAG_MODE} [options.dragMode=contrast] behavior for dragging (none, contrast, measurement, pan)
		 * @property {boolean} [options.isDepthPickMesh=false] when both voxel-based image and mesh is loaded, will depth picking be able to detect mesh or only voxels
		 * @property {boolean} [options.isCornerOrientationText=false] should slice text be shown in the upper right corner instead of the center of left and top axes?
		 * @property {boolean} [options.sagittalNoseLeft=false] should 2D sagittal slices show the anterior direction toward the left or right?
		 * @property {boolean} [options.isSliceMM=false] are images aligned to voxel space (false) or world space (true)
		 * @property {boolean} [options.isHighResolutionCapable=true] demand that high-dot-per-inch displays use native voxel size
		 * @property {boolean} [options.drawingEnabled=false] allow user to create and edit voxel-based drawings
		 * @property {number} [options.penValue=Infinity] color of drawing when user drags mouse (if drawingEnabled)
		 * @property {number} [options.penValue=Infinity] color of drawing when user drags mouse (if drawingEnabled)
		 * @property {boolean} [options.floodFillNeighbors=6] does a voxel have 6 (face), 18 (edge) or 26 (corner) neighbors?
		 * @property {number} [options.maxDrawUndoBitmaps=8] number of possible undo steps (if drawingEnabled)
		 * @property {string} [options.thumbnail=""] optional 2D png bitmap that can be rapidly loaded to defer slow loading of 3D image
		 * @example
		 * niivue.opts.isColorbar = true;
		 * niivue.updateGLVolume()
		 * @see {@link https://niivue.github.io/niivue/features/mosaics2.html|live demo usage}
		 */
		/**
		 * @class Niivue
		 * @type Niivue
		 * @description
		 * Niivue can be attached to a canvas. An instance of Niivue contains methods for
		 * loading and rendering NIFTI image data in a WebGL 2.0 context.
		 * @constructor
		 * @param {NiivueOptions} [options={}] options object to set modifiable Niivue properties
		 * @example
		 * let niivue = new Niivue({crosshairColor: [0,1,0,0.5], textHeight: 0.5}) // a see-through green crosshair, and larger text labels
		 */
		constructor(options?: NiivueOptions);
		canvas: HTMLCanvasElement | undefined;
		gl: any;
		isBusy: any;
		needsRefresh: any;
		colormap: string;
		colormapTexture: any;
		colormapLists: any;
		volumeTexture: any;
		drawTexture: any;
		drawUndoBitmaps: any;
		drawLut: any;
		drawOpacity: any;
		colorbarHeight: any;
		drawPenLocation: any;
		drawPenAxCorSag: any;
		drawFillOverwrites: any;
		drawPenFillPts: any;
		overlayTexture: any;
		overlayTextureID: any;
		sliceMMShader: any;
		orientCubeShader: any;
		orientCubeShaderVAO: any;
		rectShader: any;
		renderShader: any;
		pickingMeshShader: any;
		pickingImageShader: any;
		colorbarShader: any;
		fontShader: any;
		fontTexture: any;
		matCapTexture: any;
		bmpShader: any;
		bmpTexture: any;
		thumbnailVisible: any;
		bmpTextureWH: any;
		growCutShader: any;
		orientShaderAtlasU: any;
		orientShaderU: any;
		orientShaderI: any;
		orientShaderF: any;
		orientShaderRGBU: any;
		surfaceShader: any;
		genericVAO: any;
		unusedVAO: any;
		crosshairs3D: any;
		DEFAULT_FONT_GLYPH_SHEET: any;
		DEFAULT_FONT_METRICS: any;
		fontMets: any;
		backgroundMasksOverlays: any;
		overlayOutlineWidth: any;
		isAlphaClipDark: any;
		syncOpts: any;
		readyForSync: any;
		uiData: UIData;
		eventsToSubjects: any;
		back: any;
		overlays: any;
		deferredVolumes: any;
		deferredMeshes: any;
		furthestVertexFromOrigin: any;
		volScale: any;
		vox: any;
		mousePos: any;
		screenSlices: any;
		otherNV: any;
		volumeObject3D: any;
		pivot3D: any;
		furthestFromPivot: any;
		currentClipPlaneIndex: any;
		lastCalled: any;
		selectedObjectId: any;
		CLIP_PLANE_ID: any;
		VOLUME_ID: any;
		DISTANCE_FROM_CAMERA: any;
		graph: any;
		meshShaders: any;
		onLocationChange: any;
		onIntensityChange: any;
		onImageLoaded: any;
		onMeshLoaded: any;
		onFrameChange: any;
		onError: any;
		onInfo: any;
		onWarn: any;
		onDebug: any;
		onVolumeAddedFromUrl: any;
		onVolumeWithUrlRemoved: any;
		onVolumeUpdated: any;
		onMeshAddedFromUrl: any;
		onMeshAdded: any;
		onMeshWithUrlRemoved: any;
		onZoom3DChange: any;
		onAzimuthElevationChange: any;
		onClipPlaneChange: any;
		onCustomMeshShaderAdded: any;
		onMeshShaderChanged: any;
		onMeshPropertyChanged: any;
		onDocumentLoaded: any;
		document: any;
		opts: NiivueOptions;
		scene: Scene;
		dragModes: DragModes;
		sliceTypeAxial: any;
		sliceTypeCoronal: any;
		sliceTypeSagittal: any;
		sliceTypeMultiplanar: any;
		sliceTypeRender: any;
		sliceMosaicString: any;
		mediaUrlMap: any;
		initialized: any;
		currentDrawUndoBitmap: any;
		loadingText: any;
		subscriptions: any;
		volumes: NVImage[];
		set meshes(arg: NVMesh[]);
		get meshes(): NVMesh[];
		set drawBitmap(arg: any);
		get drawBitmap(): any;
		/**
		 * save webgl2 canvas as png format bitmap
		 * @param {string} [filename='niivue.png'] filename for screen capture
		 * @example niivue.saveScene('test.png');
		 * @see {@link https://niivue.github.io/niivue/features/ui.html|live demo usage}
		 */
		saveScene(filename?: string): void;
		/**
		 * attach the Niivue instance to the webgl2 canvas by element id
		 * @param {string} id the id of an html canvas element
		 * @example niivue = new Niivue().attachTo('gl')
		 * @example niivue.attachTo('gl')
		 * @see {@link https://niivue.github.io/niivue/features/multiplanar.html|live demo usage}
		 */
		attachTo(id: string, isAntiAlias?: any): Promise<Niivue>;
		/**
		 * register a callback function to run when known Niivue events happen
		 * @param {("location")} event the name of the event to watch for. Event names are shown in the type column
		 * @param {function} callback the function to call when the event happens
		 * @example
		 * niivue = new Niivue()
		 *
		 * // 'location' update event is fired when the crosshair changes position via user input
		 * function doSomethingWithLocationData(data){
		 *    // data has the shape {mm: [N, N, N], vox: [N, N, N], frac: [N, N, N], values: this.volumes.map(v => {return val})}
		 *    //...
		 * }
		 */
		on(event: 'location', callback: Function): void;
		/**
		 * off unsubscribes events and subjects (the opposite of on)
		 * @param {("location")} event the name of the event to watch for. Event names are shown in the type column
		 * @example
		 * niivue = new Niivue()
		 * niivue.off('location')
		 */
		off(event: 'location'): void;
		/**
		 * attach the Niivue instance to a canvas element directly
		 * @param {object} canvas the canvas element reference
		 * @example
		 * niivue = new Niivue()
		 * niivue.attachToCanvas(document.getElementById(id))
		 */
		attachToCanvas(
			canvas: HTMLCanvasElement,
			isAntiAlias?: boolean
		): Promise<Niivue>;
		/**
		 * Sync the scene controls (orientation, crosshair location, etc.) from one Niivue instance to another. useful for using one canvas to drive another.
		 * @param {object} otherNV the other Niivue instance that is the main controller
		 * @example
		 * niivue1 = new Niivue()
		 * niivue2 = new Niivue()
		 * niivue2.syncWith(niivue1)
		 */
		syncWith(
			otherNV: object,
			syncOpts?: {
				'2d': boolean;
				'3d': boolean;
			}
		): void;
		sync(): void;
		arrayEquals(a: any, b: any): boolean;
		resizeListener(): void;
		getRelativeMousePosition(
			event: any,
			target: any
		): {
			x: number;
			y: number;
		};
		getNoPaddingNoBorderCanvasRelativeMousePosition(
			event: any,
			target: any
		): {
			x: number;
			y: number;
		};
		mouseContextMenuListener(e: any): void;
		mouseDownListener(e: any): void;
		mouseLeftButtonHandler(e: any): void;
		mouseCenterButtonHandler(e: any): void;
		mouseRightButtonHandler(e: any): void;
		calculateMinMaxVoxIdx(array: any): number[];
		calculateNewRange(volIdx?: number): void;
		mouseUpListener(): void;
		checkMultitouch(e: any): void;
		touchStartListener(e: any): void;
		touchEndListener(e: any): void;
		mouseMoveListener(e: any): Promise<void>;
		resetBriCon(msg?: any): void;
		setDragStart(x: any, y: any): void;
		setDragEnd(x: any, y: any): void;
		touchMoveListener(e: any): void;
		handlePinchZoom(e: any): void;
		keyUpListener(e: any): void;
		keyDownListener(e: any): void;
		wheelListener(e: any): void;
		registerInteractions(): void;
		dragEnterListener(e: any): void;
		dragOverListener(e: any): void;
		getFileExt(fullname: any, upperCase?: boolean): string;
		/**
		 * Add an image and notify subscribers
		 * @param {NVImageFromUrlOptions} imageOptions
		 * @returns {NVImage}
		 */
		addVolumeFromUrl(imageOptions: NVImageFromUrlOptions): Promise<NVImage>;
		/**
		 * Find media by url
		 * @param {string} url -
		 * @returns {(NVImage|NVMesh)}
		 */
		getMediaByUrl(url: string): NVImage | NVMesh;
		/**
		 * Remove volume by url
		 * @param {string} url - Volume added by url to remove
		 */
		removeVolumeByUrl(url: string): void;
		readDirectory(directory: any): any[];
		/**
		 * Returns boolean: true if filename ends with mesh extension (TRK, pial, etc)
		 * @param {string} url - filename
		 */
		isMeshExt(url: string): boolean;
		dropListener(e: any): Promise<void>;
		/**
		 * determine if text appears at corner (true) or sides of 2D slice.
		 * @param {boolean} isCornerOrientationText controls position of text
		 * @example niivue.setCornerOrientationText(true)
		 * @see {@link https://niivue.github.io/niivue/features/worldspace2.html|live demo usage}
		 */
		setCornerOrientationText(isCornerOrientationText: boolean): void;
		/**
		 * control whether 2D slices use radiological or neurological convention.
		 * @param {boolean} isRadiologicalConvention new display convention
		 * @example niivue.setCornerOrientationText(true)
		 * @see {@link https://niivue.github.io/niivue/features/worldspace2.html|live demo usage}
		 */
		setRadiologicalConvention(isRadiologicalConvention: boolean): void;
		setDefaults(options?: {}, resetBriCon?: boolean): void;
		/**
		 * Limit visibility of mesh in front of a 2D image. Requires world-space mode.
		 * @param {number} meshThicknessOn2D distance from voxels for clipping mesh. Use Infinity to show entire mesh or 0.0 to hide mesh.
		 * @example niivue.setMeshThicknessOn2D(42)
		 * @see {@link https://niivue.github.io/niivue/features/worldspace2.html|live demo usage}
		 */
		setMeshThicknessOn2D(meshThicknessOn2D: number): void;
		/**
		 * Create a custom multi-slice mosaic (aka lightbox, montage) view.
		 * @param {string} str description of mosaic.
		 * @example niivue.setSliceMosaicString("A 0 20 C 30 S 42")
		 * @see {@link https://niivue.github.io/niivue/features/mosaics.html|live demo usage}
		 */
		setSliceMosaicString(str: string): void;
		/**
		 * control 2D slice view mode.
		 * @param {boolean} isSliceMM control whether 2D slices use world space (true) or voxel space (false). Beware that voxel space mode limits properties like panning, zooming and mesh visibility.
		 * @example niivue.setSliceMM(true)
		 * @see {@link https://niivue.github.io/niivue/features/worldspace2.html|live demo usage}
		 */
		setSliceMM(isSliceMM: boolean): void;
		/**
		 * Detect if display is using radiological or neurological convention.
		 * @returns {boolean} radiological convention status
		 * @example let rc = niivue.getRadiologicalConvention()
		 */
		getRadiologicalConvention(): boolean;
		/**
		 * Force WebGL canvas to use high resolution display, regardless of browser defaults.
		 * @param {boolean} isHighResolutionCapable allow high-DPI display
		 * @example niivue.setHighResolutionCapable(true);
		 * @see {@link https://niivue.github.io/niivue/features/sync.mesh.html|live demo usage}
		 */
		setHighResolutionCapable(isHighResolutionCapable: boolean): void;
		/**
		 * add a new volume to the canvas
		 * @param {NVImage} volume the new volume to add to the canvas
		 * @example
		 * niivue = new Niivue()
		 * niivue.addVolume(NVImage.loadFromUrl({url:'./someURL.nii.gz'}))
		 */
		addVolume(volume: NVImage): void;
		/**
		 * add a new mesh to the canvas
		 * @param {NVMesh} mesh the new mesh to add to the canvas
		 * @example
		 * niivue = new Niivue()
		 * niivue.addMesh(NVMesh.loadFromUrl({url:'./someURL.gii'}))
		 */
		addMesh(mesh: NVMesh): void;
		/**
		 * get the index of a volume by its unique id. unique ids are assigned to the NVImage.id property when a new NVImage is created.
		 * @param {string} id the id string to search for
		 * @example
		 * niivue = new Niivue()
		 * niivue.getVolumeIndexByID(someVolume.id)
		 */
		getVolumeIndexByID(id: string): number;
		drawAddUndoBitmap(fnm: any): Promise<boolean>;
		drawClearAllUndoBitmaps(): Promise<void>;
		/**
		 * Restore drawing to previous state
		 * @example niivue.drawUndo();
		 * @see {@link https://niivue.github.io/niivue/features/draw.ui.html|live demo usage}
		 */
		drawUndo(): void;
		loadDrawing(drawingBitmap: any): boolean;
		binarize(volume: any): Promise<void>;
		/**
		 * Open drawing
		 * @param {string} filename of NIfTI format drawing
		 * @param {boolean} [false] isBinarize if true will force drawing voxels to be either 0 or 1.
		 * @example niivue.loadDrawingFromUrl("../images/lesion.nii.gz");
		 * @see {@link https://niivue.github.io/niivue/features/draw.ui.html|live demo usage}
		 */
		loadDrawingFromUrl(fnm: any, isBinarize?: boolean): Promise<boolean>;
		findOtsu(mlevel?: number): Promise<false | any[]>;
		/**
		 * remove dark voxels in air
		 * @param {number} [2] levels (2-4) segment brain into this many types. For example drawOtsu(2) will create a binary drawing where bright voxels are colored and dark voxels are clear.
		 * @example niivue.drawOtsu(3);
		 * @see {@link https://niivue.github.io/niivue/features/draw.ui.html|live demo usage}
		 */
		drawOtsu(levels?: number): Promise<void>;
		/**
		 * remove dark voxels in air
		 * @param {number} [5] level (1-5) larger values for more preserved voxels
		 * @param {number} [0] volIndex volume to dehaze
		 * @example niivue.removeHaze(3, 0);
		 * @see {@link https://niivue.github.io/niivue/features/draw.ui.html|live demo usage}
		 */
		removeHaze(level?: number, volIndex?: number): Promise<void>;
		/**
		 * save voxel-based image to disk
		 * @param {string} fnm filename of NIfTI image to create
		 * @param {boolean} [false] isSaveDrawing determines whether drawing or background image is saved
		 * @example niivue.saveImage('test.nii', true);
		 * @see {@link https://niivue.github.io/niivue/features/draw.ui.html|live demo usage}
		 */
		saveImage(fnm: string, isSaveDrawing?: boolean): Promise<boolean>;
		getMeshIndexByID(id: any): number;
		/**
		 * change property of mesh, tractogram or connectome
		 * @param {number} id identity of mesh to change
		 * @param {str} key attribute to change
		 * @param {number} value for attribute
		 * @example niivue.setMeshProperty(niivue.meshes[0].id, 'fiberLength', 42)
		 */
		setMeshProperty(id: number, key: str, val: any): void;
		/**
		 * reverse triangle winding of mesh (swap front and back faces)
		 * @param {number} id identity of mesh to change
		 * @example niivue.reverseFaces(niivue.meshes[0].id)
		 */
		reverseFaces(mesh: any): void;
		/**
		 * reverse triangle winding of mesh (swap front and back faces)
		 * @param {number} id identity of mesh to change
		 * @param {number} layer selects the mesh overlay (e.g. GIfTI or STC file)
		 * @param {str} key attribute to change
		 * @param {number} value for attribute
		 * @example niivue.setMeshLayerProperty(niivue.meshes[0].id, 0, 'frame4D', 22)
		 */
		setMeshLayerProperty(mesh: any, layer: number, key: str, val: any): void;
		/**
		 * adjust offset position and scale of 2D sliceScale
		 * @param {vec4} xyzmmZoom first three components are spatial, fourth is scaling
		 * @example niivue.setPan2Dxyzmm([5,-4, 2, 1.5])
		 */
		setPan2Dxyzmm(xyzmmZoom: vec4): void;
		/**
		 * set rotation of 3D render view
		 * @param {number} azimuth
		 * @param {number} elevation
		 * @example niivue.setRenderAzimuthElevation(45, 15)
		 */
		setRenderAzimuthElevation(a: any, e: any): void;
		/**
		 * get the index of an overlay by its unique id. unique ids are assigned to the NVImage.id property when a new NVImage is created.
		 * @param {string} id the id string to search for
		 * @see NiiVue#getVolumeIndexByID
		 * @example
		 * niivue = new Niivue()
		 * niivue.getOverlayIndexByID(someVolume.id)
		 */
		getOverlayIndexByID(id: string): number;
		/**
		 * set the index of a volume. This will change it's ordering and appearance if there are multiple volumes loaded.
		 * @param {NVImage} volume the volume to update
		 * @param {number} [toIndex=0] the index to move the volume to. The default is the background (0 index)
		 * @example
		 * niivue = new Niivue()
		 * niivue.setVolume(someVolume, 1) // move it to the second position in the array of loaded volumes (0 is the first position)
		 */
		setVolume(volume: NVImage, toIndex?: number): void;
		setMesh(mesh: any, toIndex?: number): void;
		/**
		 * Remove a volume
		 * @param {NVImage} volume volume to delete
		 * @example
		 * niivue = new Niivue()
		 * niivue.removeVolume(this.volumes[3])
		 */
		removeVolume(volume: NVImage): void;
		/**
		 * Remove a volume by index
		 * @param {number} index of volume to remove
		 */
		removeVolumeByIndex(index: number): void;
		/**
		 * Remove a triangulated mesh, connectome or tractogram
		 * @param {NVMesh} mesh mesh to delete
		 * @example
		 * niivue = new Niivue()
		 * niivue.removeMesh(this.meshes[3])
		 */
		removeMesh(mesh: NVMesh): void;
		/**
		 * Remove a triangulated mesh, connectome or tractogram
		 * @param {string} url URL of mesh to delete
		 * @example
		 * niivue.removeMeshByUrl('./images/cit168.mz3')
		 */
		removeMeshByUrl(url: string): void;
		/**
		 * Move a volume to the bottom of the stack of loaded volumes. The volume will become the background
		 * @param {NVImage} volume the volume to move
		 * @example
		 * niivue = new Niivue()
		 * niivue.moveVolumeToBottom(this.volumes[3]) // move the 4th volume to the 0 position. It will be the new background
		 */
		moveVolumeToBottom(volume: NVImage): void;
		/**
		 * Move a volume up one index position in the stack of loaded volumes. This moves it up one layer
		 * @param {NVImage} volume the volume to move
		 * @example
		 * niivue = new Niivue()
		 * niivue.moveVolumeUp(this.volumes[0]) // move the background image to the second index position (it was 0 index, now will be 1)
		 */
		moveVolumeUp(volume: NVImage): void;
		/**
		 * Move a volume down one index position in the stack of loaded volumes. This moves it down one layer
		 * @param {NVImage} volume the volume to move
		 * @example
		 * niivue = new Niivue()
		 * niivue.moveVolumeDown(this.volumes[1]) // move the second image to the background position (it was 1 index, now will be 0)
		 */
		moveVolumeDown(volume: NVImage): void;
		/**
		 * Move a volume to the top position in the stack of loaded volumes. This will be the top layer
		 * @param {NVImage} volume the volume to move
		 * @example
		 * niivue = new Niivue()
		 * niivue.moveVolumeToTop(this.volumes[0]) // move the background image to the top layer position
		 */
		moveVolumeToTop(volume: NVImage): void;
		mouseDown(x: any, y: any): void;
		mouseMove(x: any, y: any): void;
		onMouseUp(uiData: UIData): void;
		/**
		 * convert spherical AZIMUTH, ELEVATION to Cartesian
		 * @param {number} azimuth azimuth number
		 * @param {number} elevation elevation number
		 * @returns {array} the converted [x, y, z] coordinates
		 * @example
		 * niivue = new Niivue()
		 * xyz = niivue.sph2cartDeg(42, 42)
		 */
		sph2cartDeg(azimuth: number, elevation: number): any[];
		/**
		 * update the clip plane orientation in 3D view mode
		 * @param {array} azimuthElevationDepth a two component vector. azimuth: camera position in degrees around object, typically 0..360 (or -180..+180). elevation: camera height in degrees, range -90..90
		 * @example
		 * niivue = new Niivue()
		 * niivue.setClipPlane([42, 42])
		 */
		setClipPlane(depthAzimuthElevation: any): void;
		/**
		 * set the crosshair color
		 * @param {array} color an RGBA array. values range from 0 to 1
		 * @example
		 * niivue = new Niivue()
		 * niivue.setCrosshairColor([0, 1, 0, 0.5]) // set crosshair to transparent green
		 */
		setCrosshairColor(color: any[]): void;
		/**
		 * set thickness of crosshair
		 * @param {number} crosshairWidth
		 * @example niivue.crosshairWidth(2)
		 */
		setCrosshairWidth(crosshairWidth: number): void;
		setDrawColormap(name: any): void;
		/**
		 * does dragging over a 2D slice create a drawing?
		 * @param {boolean} drawing enabled (true) or not (false)
		 * @example niivue.setDrawingEnabled(true)
		 */
		setDrawingEnabled(trueOrFalse: any): void;
		/**
		 * determine color and style of drawing
		 * @param {number} penValue sets the color of the pen
		 * @param {boolean} [false] isFilledPen determines if dragging creates flood-filled shape
		 * @example niivue.setPenValue(1, true)
		 */
		setPenValue(penValue: number, isFilledPen?: boolean): void;
		/**
		 * control whether drawing is transparent (0), opaque (1) or translucent (between 0 and 1).
		 * @param {number} opacity translucency of drawing
		 * @example niivue.setDrawOpacity(0.7)
		 * @see {@link https://niivue.github.io/niivue/features/draw.ui.html|live demo usage}
		 */
		setDrawOpacity(opacity: number): void;
		/**
		 * set the selection box color. A selection box is drawn when you right click and drag to change image intensity
		 * @param {array} color an RGBA array. values range from 0 to 1
		 * @example
		 * niivue = new Niivue()
		 * niivue.setSelectionBoxColor([0, 1, 0, 0.5]) // set to transparent green
		 */
		setSelectionBoxColor(color: any[]): void;
		sliceScroll2D(posChange: any, x: any, y: any, isDelta?: boolean): void;
		/**
		 * set the slice type. This changes the view mode
		 * @param {(Niivue.sliceTypeAxial | Niivue.sliceTypeCoronal | Niivue.sliceTypeSagittal | Niivue.sliceTypeMultiplanar | Niivue.sliceTypeRender)} sliceType an enum of slice types to use
		 * @example
		 * niivue = new Niivue()
		 * niivue.setSliceType(Niivue.sliceTypeMultiplanar)
		 */
		setSliceType(st: any): Niivue;
		/**
		 * set the opacity of a volume given by volume index
		 * @param {number} volIdx the volume index of the volume to change
		 * @param {number} newOpacity the opacity value. valid values range from 0 to 1. 0 will effectively remove a volume from the scene
		 * @example
		 * niivue = new Niivue()
		 * niivue.setOpacity(0, 0.5) // make the first volume transparent
		 */
		setOpacity(volIdx: number, newOpacity: number): void;
		/**
		 * set the scale of the 3D rendering. Larger numbers effectively zoom.
		 * @param {number} scale the new scale value
		 * @example
		 * niivue = new Niivue()
		 * niivue.setScale(2) // zoom some
		 */
		setScale(scale: number): void;
		set volScaleMultiplier(arg: any);
		get volScaleMultiplier(): any;
		/**
		 * set the color of the 3D clip plane
		 * @param {array} color the new color. expects an array of RGBA values. values can range from 0 to 1
		 * @example
		 * niivue = new Niivue()
		 * niivue.setClipPlaneColor([1, 1, 1, 0.5]) // white, transparent
		 */
		setClipPlaneColor(color: any[]): void;
		overlayRGBA(volume: any): Uint8ClampedArray;
		vox2mm(XYZ: any, mtx: any): mat.vec3;
		/**
		 * clone a volume and return a new volume
		 * @param {number} index the index of the volume to clone
		 * @returns {NVImage} returns a new volume to work with, but that volume is not added to the canvas
		 * @example
		 * niivue = new Niivue()
		 * niivue.cloneVolume(0)
		 */
		cloneVolume(index: number): NVImage;
		/**
		 *
		 * @param {string} url URL of NVDocument
		 */
		loadDocumentFromUrl(url: string): Promise<void>;
		/**
		 * Loads an NVDocument
		 * @param {NVDocument} document
		 * @returns {Niivue} returns the Niivue instance
		 */
		loadDocument(document: NVDocument): Niivue;
		saveDocument(fileName?: string): Promise<void>;
		/**
		 * load an array of volume objects
		 * @param {array} volumeList the array of objects to load. each object must have a resolvable "url" property at a minimum
		 * @returns {Niivue} returns the Niivue instance
		 * @example
		 * niivue = new Niivue()
		 * niivue.loadVolumes([{url: 'someImage.nii.gz}, {url: 'anotherImage.nii.gz'}])
		 *
		 * Each volume object can have the following properties:
		 * @property {string} url - the url of the image to load
		 * @property {string} name - the name of the image
		 * @property {string} colorMap - the name of the color map to use
		 * @property {string} colorMapNegative - the name of the color map to use for negative values
		 * @property {number} opacity - the opacity of the image
		 * @property {string} urlImgData - the image data to use if header and image are separate files
		 * @property {number} cal_min - the minimum value to display
		 * @property {number} cal_max - the maximum value to display
		 * @property {boolean} trustCalMinMax - whether to trust the cal_min and cal_max values in the header
		 * @property {boolean} isManifest - whether the image is a manifest file
		 * @property {number} frame4D - the index of the 4D data to load
		 */
		loadVolumes(volumeList: VolumeObject[]): Promise<Niivue>;
		/**
		 * Add mesh and notify subscribers
		 * @param {NVMeshFromUrlOptions} meshOptions
		 * @returns {NVMesh}
		 */
		addMeshFromUrl(meshOptions: NVMeshFromUrlOptions): Promise<NVMesh>;
		/**
		 * load an array of meshes
		 * @param {array} meshList the array of objects to load. each object must have a resolvable "url" property at a minimum
		 * @returns {Niivue} returns the Niivue instance
		 * @example
		 * niivue = new Niivue()
		 * niivue.loadMeshes([{url: 'someMesh.gii}])
		 */
		async loadMeshes(meshList: NVMeshFromUrlOptions[]): Promise<Niivue>;
		/**
		 * load a connectome specified by json
		 * @param {object} connectome model
		 * @returns {Niivue} returns the Niivue instance
		 */
		loadConnectome(json: any): Niivue;
		/**
		 * generate a blank canvas for the pen tool
		 * @example niivue.createEmptyDrawing()
		 */
		createEmptyDrawing(): Promise<void>;
		r16Tex(texID: any, activeID: any, dims: any, img16?: any[]): any;
		/**
		 * dilate drawing so all voxels are colored.
		 * works on drawing with multiple colors
		 * @example niivue.drawGrowCut();
		 */
		drawGrowCut(): void;
		drawPt(x: any, y: any, z: any, penValue: any): void;
		drawPenLine(ptA: any, ptB: any, penValue: any): void;
		drawFloodFillCore(img: any, seedVx: any, neighbors?: number): Promise<void>;
		drawFloodFill(
			seedXYZ: any,
			newColor?: number,
			growSelectedCluster?: number,
			forceMin?: number,
			forceMax?: number,
			neighbors?: number
		): void;
		drawPenFilled(): void;
		closeDrawing(): void;
		refreshDrawing(isForceRedraw?: boolean): void;
		r8Tex(texID: any, activeID: any, dims: any, isInit?: boolean): any;
		rgbaTex(texID: any, activeID: any, dims: any, isInit?: boolean): any;
		requestCORSIfNotSameOrigin(img: any, url: any): void;
		loadPngAsTexture(pngUrl: any, textureNum: any): Promise<any>;
		loadFontTexture(fontUrl: any): void;
		loadBmpTexture(bmpUrl: any): Promise<void>;
		loadMatCapTexture(bmpUrl: any): void;
		initFontMets(): void;
		loadFont(fontSheetUrl?: any, metricsUrl?: any): Promise<void>;
		fontMetrics: any;
		loadDefaultMatCap(): Promise<void>;
		loadDefaultFont(): Promise<void>;
		initText(): Promise<void>;
		meshShaderNameToNumber(meshShaderName?: string): number;
		/**
		 * select new shader for triangulated meshes and connectomes. Note that this function requires the mesh is fully loaded: you may want use `await` with loadMeshes (as seen in live demo).
		 * @param {number} id id of mesh to change
		 * @param {string | number} [2] meshShaderNameOrNumber identify shader for usage
		 * @example niivue.setMeshShader('toon');
		 * @see {@link https://niivue.github.io/niivue/features/meshes.html|live demo usage}
		 */
		setMeshShader(id: number, meshShaderNameOrNumber?: number): void;
		/**
		 *
		 * @param {string} fragmentShaderText custom fragment shader.
		 * @param {string} name title for new shader.
		 * @returns {Shader} created custom mesh shader
		 */
		createCustomMeshShader(
			fragmentShaderText: string,
			name?: string,
			vertexShaderText?: string
		): Shader;
		/**
		 * @param {string} [""] fragmentShaderText custom fragment shader.
		 * @param {string} ["Custom"] name title for new shader.
		 * @returns {number} index of the new shader (for setMeshShader)
		 * @see {@link https://niivue.github.io/niivue/features/mesh.atlas.html|live demo usage}
		 */
		setCustomMeshShader(fragmentShaderText?: string, name?: string): number;
		/**
		 * retrieve all currently loaded meshes
		 * @param {boolean} sort output alphabetically
		 * @returns {Array} list of available mesh shader names
		 * @example niivue.meshShaderNames();
		 * @see {@link https://niivue.github.io/niivue/features/meshes.html|live demo usage}
		 */
		meshShaderNames(sort?: boolean): any[];
		init(): Promise<Niivue>;
		cuboidVertexBuffer: any;
		orientCubeMtxLoc: any;
		lineShader: any;
		passThroughShader: any;
		fiberShader: any;
		/**
		 * update the webGL 2.0 scene after making changes to the array of volumes. It's always good to call this method after altering one or more volumes manually (outside of Niivue setter methods)
		 * @example
		 * niivue = new Niivue()
		 * niivue.updateGLVolume()
		 */
		updateGLVolume(): void;
		/**
		 * basic statistics for selected voxel-based image
		 * @param {number} layer selects image to describe
		 * @param {Array} masks are optional binary images to filter voxles
		 * @returns {Array} numeric values to describe image
		 * @example niivue.getDescriptives(0);
		 * @see {@link https://niivue.github.io/niivue/features/draw2.html|live demo usage}
		 */
		getDescriptives(layer?: number, masks?: any[]): any[];
		refreshLayers(overlayItem: any, layer: any): void;
		/**
		 * query all available color maps that can be applied to volumes
		 * @param {boolean} [sort=true] whether or not to sort the returned array
		 * @returns {array} an array of colormap strings
		 * @example
		 * niivue = new Niivue()
		 * colormaps = niivue.colormaps()
		 */
		colormaps(): string[];
		/**
		 * create a new colormap
		 * @param {string} key name of new colormap
		 * @param {object} colormap properties (Red, Green, Blue, Alpha and Indices)
		 * @see {@link https://niivue.github.io/niivue/features/colormaps.html|live demo usage}
		 */
		addColormap(key: string, cmap: any): void;
		/**
		 * update the colormap of an image given its ID
		 * @param {string} id the ID of the NVImage
		 * @param {string} colorMap the name of the colorMap to use
		 * @example
		 * niivue = new Niivue()
		 * niivue.setColorMap(someImage.id, 'red')
		 */
		setColorMap(id: string, colorMap: string): void;
		/**
		 * use given color map for negative voxels in image
		 * @param {string} id the ID of the NVImage
		 * @param {string} colorMapNegative the name of the colorMap to use
		 * @example
		 * niivue = new Niivue()
		 * niivue.setColorMapNegative(niivue.volumes[1].id,"winter");
		 * @see {@link https://niivue.github.io/niivue/features/mosaics2.html|live demo usage}
		 */
		setColorMapNegative(id: string, colorMapNegative: string): void;
		/**
		 * modulate intensity of one image based on intensity of another
		 * @param {string} idTarget the ID of the NVImage to be biased
		 * @param {string} idModulation the ID of the NVImage that controls bias (null to disable modulation)
		 * @param {boolean} [false] modulateAlpha does the modulation influence alpha transparency (true) or RGB color (false) components.
		 * @example niivue.setModulationImage(niivue.volumes[0].id, niivue.volumes[1].id);
		 * @see {@link https://niivue.github.io/niivue/features/modulate.html|live demo usage}
		 */
		setModulationImage(
			idTarget: string,
			idModulation: string,
			modulateAlpha?: boolean
		): void;
		/**
		 * adjust screen gamma. Low values emphasize shadows but can appear flat, high gamma hides shadow details.
		 * @param {number} gamma selects luminance, default is 1
		 * @example niivue.setGamma(1.0);
		 * @see {@link https://niivue.github.io/niivue/features/colormaps.html|live demo usage}
		 */
		setGamma(gamma?: number): void;
		/** Load all volumes for image opened with `limitFrames4D`
		 * @param {string} id the ID of the 4D NVImage
		 **/
		loadDeferred4DVolumes(id: string): Promise<void>;
		/**
		 * show desired 3D volume from 4D time series
		 * @param {string} id the ID of the 4D NVImage
		 * @param {number} frame4D to display (indexed from zero)
		 * @example nv1.setFrame4D(nv1.volumes[0].id, 42);
		 * @see {@link https://niivue.github.io/niivue/features/timeseries.html|live demo usage}
		 */
		setFrame4D(id: string, frame4D: number): void;
		/**
		 * determine active 3D volume from 4D time series
		 * @param {string} id the ID of the 4D NVImage
		 * @returns {number} currently selected volume (indexed from 0)
		 * @example nv1.getFrame4D(nv1.volumes[0].id);
		 * @see {@link https://niivue.github.io/niivue/features/timeseries.html|live demo usage}
		 */
		getFrame4D(id: string): number;
		colormapFromKey(name: any): ColormapLut;
		/**
		 * determine active 3D volume from 4D time series
		 * @param {string} id the ID of the 4D NVImage
		 * @returns {number} currently selected volume (indexed from 0)
		 * @example nv1.getFrame4D(nv1.volumes[0].id);
		 * @see {@link https://niivue.github.io/niivue/features/colormaps.html|live demo usage}
		 */
		colormap(lutName?: string): number;
		createColorMapTexture(nLayer: any): void;
		addColormapList(
			nm?: string,
			mn?: number,
			mx?: number,
			alpha?: boolean,
			neg?: boolean,
			vis?: boolean
		): void;
		refreshColormaps(): Niivue;
		sliceScale(forceVox?: boolean): {
			volScale: number[];
			vox: any[];
			longestAxis: number;
			dimsMM: any;
		};
		inRenderTile(x: any, y: any): number;
		sliceScroll3D(posChange?: number): void;
		deleteThumbnail(): void;
		inGraphTile(x: any, y: any): boolean;
		mouseClick(x: any, y: any, posChange?: number, isDelta?: boolean): void;
		drawRuler(): void;
		drawRuler10cm(startXYendXY: any): void;
		screenXY2mm(x: any, y: any, forceSlice?: number): number[];
		dragForPanZoom(startXYendXY: any): void;
		dragForCenterButton(startXYendXY: any): void;
		dragForSlicer3D(startXYendXY: any): void;
		drawMeasurementTool(startXYendXY: any): void;
		drawRect(leftTopWidthHeight: any, lineColor?: number[]): void;
		drawSelectionBox(leftTopWidthHeight: any): void;
		effectiveCanvasHeight(): number;
		reserveColorbarPanel(): any[];
		drawColorbarCore(
			layer: number,
			leftTopWidthHeight: number[],
			isNegativeColor: boolean,
			min: number,
			max: number,
			isAlphaThreshold: any
		): void;
		drawColorbar(): void;
		textWidth(scale: any, str: any): number;
		drawChar(xy: any, scale: any, char: any): number;
		drawLoadingText(text: any): void;
		drawText(xy: any, str: any, scale?: number, color?: any): void;
		drawTextRight(xy: any, str: any, scale?: number): void;
		drawTextLeft(xy: any, str: any, scale?: number, color?: any): void;
		drawTextRightBelow(xy: any, str: any, scale?: number, color?: any): void;
		drawTextBetween(
			startXYendXY: any,
			str: any,
			scale?: number,
			color?: any
		): void;
		drawTextBelow(xy: any, str: any, scale?: number, color?: any): void;
		updateInterpolation(layer: any, isForceLinear?: boolean): void;
		setAtlasOutline(isOutline: any): void;
		/**
		 * select between nearest and linear interpolation for voxel based images
		 * @property {boolean} isNearest whether nearest neighbor interpolation is used, else linear interpolation
		 * @example niivue.setInterpolation(true);
		 * @see {@link https://niivue.github.io/niivue/features/draw2.html|live demo usage}
		 */
		setInterpolation(isNearest: any): void;
		calculateMvpMatrix2D(
			leftTopWidthHeight: any,
			mn: any,
			mx: any,
			clipTolerance: number,
			clipDepth: number,
			azimuth: any,
			elevation: any,
			isRadiolgical: any
		): {
			modelViewProjectionMatrix: mat.mat4;
			modelMatrix: mat.mat4;
			normalMatrix: mat.mat4;
			leftTopMM: any[];
			fovMM: number[];
		};
		swizzleVec3MM(v3: any, axCorSag: any): any;
		screenFieldOfViewVox(axCorSag?: number): any;
		screenFieldOfViewMM(axCorSag?: number, forceSliceMM?: boolean): any;
		screenFieldOfViewExtendedVox(axCorSag?: number): {
			mnMM: any[];
			mxMM: any[];
			rotation: mat.mat4;
			fovMM: mat.vec3;
		};
		screenFieldOfViewExtendedMM(axCorSag?: number): {
			mnMM: any;
			mxMM: any;
			rotation: mat.mat4;
			fovMM: mat.vec3;
		};
		drawSliceOrientationText(leftTopWidthHeight: any, axCorSag: any): void;
		xyMM2xyzMM(axCorSag: any, sliceFrac: any): number[];
		draw2D(leftTopWidthHeight: any, axCorSag: any, customMM?: number): void;
		calculateMvpMatrix(
			unused: any,
			leftTopWidthHeight: number[],
			azimuth: any,
			elevation: any
		): mat.mat4[];
		calculateRayDirection(azimuth: any, elevation: any): mat.vec3;
		sceneExtentsMinMax(isSliceMM?: boolean): mat.vec3[];
		setPivot3D(): void;
		extentsMin: any;
		extentsMax: any;
		getMaxVols(): number;
		detectPartialllyLoaded4D(): boolean;
		drawGraph(): void;
		depthPicker(leftTopWidthHeight: any, mvpMatrix: any): void;
		drawImage3D(mvpMatrix: any, azimuth: any, elevation: any): void;
		drawOrientationCube(
			leftTopWidthHeight: any,
			azimuth?: number,
			elevation?: number
		): void;
		createOnLocationChange(axCorSag?: number): void;
		draw3D(
			leftTopWidthHeight: number[],
			mvpMatrix: any,
			modelMatrix: any,
			normalMatrix: any,
			azimuth: any,
			elevation: any
		): string;
		drawMesh3D(
			isDepthTest: boolean,
			alpha: number,
			m: any,
			modelMtx: any,
			normMtx: any
		): void;
		drawCrosshairs3D(
			isDepthTest?: boolean,
			alpha?: number,
			mvpMtx?: any,
			is2DView?: boolean,
			isSliceMM?: boolean
		): void;
		mm2frac(mm: any, volIdx?: number, isForceSliceMM?: boolean): number[];
		vox2frac(vox: any, volIdx?: number): number[];
		frac2vox(frac: any, volIdx?: number): number[];
		/**
		 * move crosshair a fixed number of voxels (not mm)
		 * @param {number} x translate left (-) or right (+)
		 * @param {number} y translate posterior (-) or +anterior (+)
		 * @param {number} z translate inferior (-) or superior (+)
		 * @see {@link https://niivue.github.io/niivue/features/draw2.html|live demo usage}
		 * @example niivue.moveCrosshairInVox(1, 0, 0)
		 */
		moveCrosshairInVox(x: number, y: number, z: number): void;
		frac2mm(frac: any, volIdx?: number, isForceSliceMM?: boolean): mat.vec4;
		screenXY2TextureFrac(
			x: any,
			y: any,
			i: any,
			restrict0to1?: boolean
		): number[];
		canvasPos2frac(canvasPos: any): number[];
		scaleSlice(
			w: any,
			h: any,
			widthPadPixels?: number,
			heightPadPixels?: number
		): number[];
		drawThumbnail(): void;
		drawLine(startXYendXY: any, thickness?: number, lineColor?: number[]): void;
		drawGraphLine(LTRB: any, color?: number[], thickness?: number): void;
		drawCrossLinesMM(
			sliceIndex: any,
			axCorSag: any,
			axiMM: any,
			corMM: any,
			sagMM: any
		): void;
		drawCrossLines(
			sliceIndex: any,
			axCorSag: any,
			axiMM: any,
			corMM: any,
			sagMM: any
		): void;
		/**
		 * display a lightbox or montage view
		 * @param {string} mosaicStr specifies orientation (A,C,S) and location of slices.
		 * @example niivue.setSliceMosaicString("A -10 0 20");
		 * @see {@link https://niivue.github.io/niivue/features/mosaics.html|live demo usage}
		 */
		drawMosaic(mosaicStr: string): void;
		drawSceneCore(): string | void;
		drawScene(): any;
	}
}
