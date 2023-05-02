enum DRAG_MODE {
	none = 0,
	contrast = 1,
	measurement = 2,
	pan = 3,
	slicer3D = 4,
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
interface NiivueOptions {
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
	 * @property {array}  [options.selectionBoxColor=[1,1,1,0.5]] the selection box color when the intensty selection box is shown (right click and drag). RGBA values from 0 to 1. Default is transparent white
	 */
	fontColor?: number[];
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
	dragMode?: DRAG_MODE;
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
}

interface VolumeObject {
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

declare module '@niivue/niivue' {
	class Niivue {
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
		// eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
		constructor(options: NiivueOptions) {}
		/**
		 * attach the Niivue instance to a canvas element directly
		 * @param {HTMLCanvasElement} canvas the canvas element reference
		 * @param {boolean} isAntiAlias indicates whether or not to perform anti-aliasing if possible.
		 * @example
		 * niivue = new Niivue()
		 * niivue.attachToCanvas(document.getElementById(id))
		 */
		attachToCanvas(canvas: HTMLCanvasElement, antialias: boolean = null);
		/**
		 * load an array of volume objects
		 * @param {array} volumeList the array of objects to load. each object must have a resolvable "url" property at a minimum
		 * @returns {Niivue} returns the Niivue instance
		 * @example
		 * niivue = new Niivue()
		 * niivue.loadVolumes([{url: 'someImage.nii.gz}, {url: 'anotherImage.nii.gz'}])
		 */
		async loadVolumes(volumes: VolumeObject[]): Promise<void>;
		on(event: 'location', callback: (data) => void);
		/**
		 * generate a blank canvas for the pen tool
		 * @example niivue.createEmptyDrawing()
		 */
		createEmptyDrawing(): void;
		/**
		 * determine color and style of drawing
		 * @param {number} penValue sets the color of the pen
		 * @param {boolean} [false] isFilledPen determines if dragging creates flood-filled shape
		 * @example niivue.setPenValue(1, true)
		 */
		setPenValue(penValue: number, isFilledPen = false): void;
	}
}
