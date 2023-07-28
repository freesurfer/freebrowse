/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@niivue/niivue' {
	/**
	 * query all available color maps that can be applied to volumes
	 * @param {boolean} [sort=true] whether or not to sort the returned array
	 * @returns {array} an array of colormap strings
	 * @example
	 * niivue = new Niivue()
	 * colormaps = niivue.colorMaps()
	 */
	/**
	 * Enum for supported image types
	 * @readonly
	 * @enum {number}
	 */
	export type NVIMAGE_TYPE = Readonly<{
		UNKNOWN: 0;
		NII: 1;
		DCM: 2;
		DCM_MANIFEST: 3;
		MIH: 4;
		MIF: 5;
		NHDR: 6;
		NRRD: 7;
		MHD: 8;
		MHA: 9;
		MGH: 10;
		MGZ: 11;
		V: 12;
		V16: 13;
		VMR: 14;
		HEAD: 15;
		DCM_FOLDER: 16;
		parse: (ext: any) => 0;
	}>;

	export interface INVImageFooter {
		tr: number;
		flipAngle: number;
		te: number;
		ti: number;
		fov: number;
		tagsBytes: Uint8Array;
	}

	export interface INVImageHeader {
		img: byte[];
		littleEndian: boolean;
		dims: [number, number, number, number, number, number, number, number];
		vox_offset: number;
		numBitsPerVoxel: number;
		datatypeCode: number;
		pixDims: [number, number, number, number];
		rot44: [
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number
		];
	}

	/**
 * NVImageFromUrlOptions
 * @typedef  NVImageFromUrlOptions
 * @type {object}
 * @property {string} url - the resolvable URL pointing to a nifti image to load
 * @property {string} [urlImgData=""] Allows loading formats where header and image are separate files (e.g. nifti.hdr, nifti.img)
 * @property {string} [name=""] a name for this image. Default is an empty string
 * @property {string} [colorMap="gray"] a color map to use. default is gray
 * @property {number} [opacity=1.0] the opacity for this image. default is 1
 * @property {number} [cal_min=NaN] minimum intensity for color brightness/contrast
 * @property {number} [cal_max=NaN] maximum intensity for color brightness/contrast
 * @property {boolean} [trustCalMinMax=true] whether or not to trust cal_min and cal_max from the nifti header (trusting results in faster loading)
 * @property {number} [percentileFrac=0.02] the percentile to use for setting the robust range of the display values (smart intensity setting for images with large ranges)
 * @property {boolean} [visible=true] whether or not this image is to be visible
 * @property {boolean} [useQFormNotSForm=false] whether or not to use QForm over SForm constructing the NVImage instance
 * @property {boolean} [alphaThreshold=false] if true, values below cal_min are shown as translucent, not transparent
 * @property {string} [colorMapNegative=""] a color map to use for negative intensities
 * @property {number} [cal_minNeg=NaN] minimum intensity for colorMapNegative brightness/contrast (NaN for symmetrical cal_min)
 * @property {number} [cal_maxNeg=NaN] maximum intensity for colorMapNegative brightness/contrast (NaN for symmetrical cal_max)
 * @property {boolean} [colorbarVisible=true] hide colormaps


 * @property {NVIMAGE_TYPE} [imageType=NVIMAGE_TYPE.UNKNOWN] image type being loaded
 */

	/**
	 * Image M.
	 */
	export interface NVImageMetadata {
		/**
		 * - unique if of image
		 */
		id: string;
		/**
		 * - data type
		 */
		datatypeCode: number;
		/**
		 * - number of columns
		 */
		nx: number;
		/**
		 * - number of rows
		 */
		ny: number;
		/**
		 * - number of slices
		 */
		nz: number;
		/**
		 * - number of volumes
		 */
		nt: number;
		/**
		 * - space between columns
		 */
		dx: number;
		/**
		 * - space between rows
		 */
		dy: number;
		/**
		 * - space between slices
		 */
		dz: number;
		/**
		 * - time between volumes
		 */
		dt: number;
		/**
		 * - bits per voxel
		 */
		bpx: number;
	}
	/**
	 *
	 * @constructor
	 * @returns {NVImageFromUrlOptions}
	 */
	export class NVImageFromUrlOptions {
		/**
     * NVImageFromUrlOptions
     * @typedef  NVImageFromUrlOptions
     * @type {object}
     * @property {string} url - the resolvable URL pointing to a nifti image to load
     * @property {string} [urlImgData=""] Allows loading formats where header and image are separate files (e.g. nifti.hdr, nifti.img)
     * @property {string} [name=""] a name for this image. Default is an empty string
     * @property {string} [colorMap="gray"] a color map to use. default is gray
     * @property {number} [opacity=1.0] the opacity for this image. default is 1
     * @property {number} [cal_min=NaN] minimum intensity for color brightness/contrast
     * @property {number} [cal_max=NaN] maximum intensity for color brightness/contrast
     * @property {boolean} [trustCalMinMax=true] whether or not to trust cal_min and cal_max from the nifti header (trusting results in faster loading)
     * @property {number} [percentileFrac=0.02] the percentile to use for setting the robust range of the display values (smart intensity setting for images with large ranges)
     * @property {boolean} [visible=true] whether or not this image is to be visible
     * @property {boolean} [useQFormNotSForm=false] whether or not to use QForm over SForm constructing the NVImage instance
     * @property {boolean} [alphaThreshold=false] if true, values below cal_min are shown as translucent, not transparent
     * @property {string} [colorMapNegative=""] a color map to use for negative intensities
     * @property {number} [cal_minNeg=NaN] minimum intensity for colorMapNegative brightness/contrast (NaN for symmetrical cal_min)
     * @property {number} [cal_maxNeg=NaN] maximum intensity for colorMapNegative brightness/contrast (NaN for symmetrical cal_max)
     * @property {boolean} [colorbarVisible=true] hide colormaps
    
    
     * @property {NVIMAGE_TYPE} [imageType=NVIMAGE_TYPE.UNKNOWN] image type being loaded
     */
		/**
		 *
		 * @constructor
		 * @returns {NVImageFromUrlOptions}
		 */
		constructor(
			url: any,
			urlImageData?: string,
			name?: string,
			colorMap?: string,
			opacity?: number,
			cal_min?: number,
			cal_max?: number,
			trustCalMinMax?: boolean,
			percentileFrac?: number,
			ignoreZeroVoxels?: boolean,
			visible?: boolean,
			useQFormNotSForm?: boolean,
			alphaThreshold?: boolean,
			colorMapNegative?: string,
			frame4D?: number,
			imageType?: 0,
			cal_minNeg?: number,
			cal_maxNeg?: number,
			colorbarVisible?: boolean
		);
	}
	/**
	 * @class NVImage
	 * @type NVImage
	 * @description
	 * a NVImage encapsulates some images data and provides methods to query and operate on images
	 * @constructor
	 * @param {array} dataBuffer an array buffer of image data to load (there are also methods that abstract this more. See loadFromUrl, and loadFromFile)
	 * @param {string} [name=''] a name for this image. Default is an empty string
	 * @param {string} [colorMap='gray'] a color map to use. default is gray
	 * @param {number} [opacity=1.0] the opacity for this image. default is 1
	 * @param {string} [pairedImgData=null] Allows loading formats where header and image are separate files (e.g. nifti.hdr, nifti.img)
	 * @param {number} [cal_min=NaN] minimum intensity for color brightness/contrast
	 * @param {number} [cal_max=NaN] maximum intensity for color brightness/contrast
	 * @param {boolean} [trustCalMinMax=true] whether or not to trust cal_min and cal_max from the nifti header (trusting results in faster loading)
	 * @param {number} [percentileFrac=0.02] the percentile to use for setting the robust range of the display values (smart intensity setting for images with large ranges)
	 * @param {boolean} [ignoreZeroVoxels=false] whether or not to ignore zero voxels in setting the robust range of display values
	 * @param {boolean} [visible=true] whether or not this image is to be visible
	 * @param {boolean} [useQFormNotSForm=true] give precedence to QForm (Quaternion) or SForm (Matrix)
	 * @param {string} [colorMapNegative=''] a color map to use for symmetrical negative intensities
	 * @param {number} [frame4D = 0] volume displayed, 0 indexed, must be less than nFrame4D
	 * @param {function} [onColorMapChange=()=>{}] callback for color map change
	 * @param {function} [onOpacityChange=()=>{}] callback for color map change
	 */
	export class NVImage {
		/**
		 * @class NVImage
		 * @type NVImage
		 * @description
		 * a NVImage encapsulates some images data and provides methods to query and operate on images
		 * @constructor
		 * @param {array} dataBuffer an array buffer of image data to load (there are also methods that abstract this more. See loadFromUrl, and loadFromFile)
		 * @param {string} [name=''] a name for this image. Default is an empty string
		 * @param {string} [colorMap='gray'] a color map to use. default is gray
		 * @param {number} [opacity=1.0] the opacity for this image. default is 1
		 * @param {string} [pairedImgData=null] Allows loading formats where header and image are separate files (e.g. nifti.hdr, nifti.img)
		 * @param {number} [cal_min=NaN] minimum intensity for color brightness/contrast
		 * @param {number} [cal_max=NaN] maximum intensity for color brightness/contrast
		 * @param {boolean} [trustCalMinMax=true] whether or not to trust cal_min and cal_max from the nifti header (trusting results in faster loading)
		 * @param {number} [percentileFrac=0.02] the percentile to use for setting the robust range of the display values (smart intensity setting for images with large ranges)
		 * @param {boolean} [ignoreZeroVoxels=false] whether or not to ignore zero voxels in setting the robust range of display values
		 * @param {boolean} [visible=true] whether or not this image is to be visible
		 * @param {boolean} [useQFormNotSForm=true] give precedence to QForm (Quaternion) or SForm (Matrix)
		 * @param {string} [colorMapNegative=''] a color map to use for symmetrical negative intensities
		 * @param {number} [frame4D = 0] volume displayed, 0 indexed, must be less than nFrame4D
		 * @param {function} [onColorMapChange=()=>{}] callback for color map change
		 * @param {function} [onOpacityChange=()=>{}] callback for color map change
		 */
		constructor(
			dataBuffer: any[],
			name?: string,
			colorMap?: string,
			opacity?: number,
			pairedImgData?: string,
			cal_min?: number,
			cal_max?: number,
			trustCalMinMax?: boolean,
			percentileFrac?: number,
			ignoreZeroVoxels?: boolean,
			visible?: boolean,
			useQFormNotSForm?: boolean,
			colorMapNegative?: string,
			frame4D?: number,
			imageType?: 0,
			cal_minNeg?: number,
			cal_maxNeg?: number,
			colorbarVisible?: boolean
		);
		DT_NONE: any;
		DT_UNKNOWN: any;
		DT_BINARY: any;
		DT_UNSIGNED_CHAR: any;
		DT_SIGNED_SHORT: any;
		DT_SIGNED_INT: any;
		DT_FLOAT: any;
		DT_COMPLEX: any;
		DT_DOUBLE: any;
		DT_RGB: any;
		DT_ALL: any;
		DT_INT8: any;
		DT_UINT16: any;
		DT_UINT32: any;
		DT_INT64: any;
		DT_UINT64: any;
		DT_FLOAT128: any;
		DT_COMPLEX128: any;
		DT_COMPLEX256: any;
		DT_RGBA32: any;
		name: string;
		colormapLabel: { labels: string[] } | any;
		id: any;
		_colorMap: any;
		_opacity: any;
		percentileFrac: any;
		ignoreZeroVoxels: any;
		trustCalMinMax: any;
		colorMapNegative: any;
		frame4D: any;
		cal_minNeg: any;
		cal_maxNeg: any;
		colorbarVisible: any;
		visible: any;
		modulationImage: any;
		modulateAlpha: any;
		series: any;
		onColorMapChange: any;
		onOpacityChange: any;
		hdr: INVImageHeader;
		footer: INVImageFooter;
		imageType: any;
		nFrame4D: any;
		nVox3D: any;
		nTotalFrame4D: any;
		img: Float64Array;
		computeObliqueAngle(mtx44: any): number;
		calculateOblique(): void;
		oblique_angle: any;
		obliqueRAS: any;
		maxShearDeg: any;
		frac2mm: any;
		frac2mmOrtho: any;
		extentsMinOrtho: any;
		extentsMaxOrtho: any;
		mm2ortho: any;
		THD_daxes_to_NIFTI(
			xyzDelta: any,
			xyzOrigin: any,
			orientSpecific: any
		): void;
		SetPixDimFromSForm(): void;
		readDICOM(buf: any): any[];
		readECAT(buffer: any): any[];
		readV16(buffer: any): any;
		readVMR(buffer: any): any;
		readMGH(buffer: any): any;
		readHEAD(dataBuffer: any, pairedImgData: any): any;
		readMHA(buffer: any, pairedImgData: any): any;
		readMIF(buffer: any, pairedImgData: any): any[];
		readNRRD(dataBuffer: any, pairedImgData: any): any;
		calculateRAS(): void;
		mm000: any;
		mm100: any;
		mm010: any;
		mm001: any;
		dimsRAS: [number, number, number, number];
		pixDimsRAS: any;
		permRAS: any;
		toRAS: any;
		matRAS: any;
		toRASvox: any;
		img2RAS(): any;
		vox2mm(XYZ: any, mtx: any): vec3;
		mm2vox(mm: any, frac?: boolean): number[] | Float32Array;
		arrayEquals(a: any, b: any): boolean;
		setColorMap(cm: any): void;
		setColormapLabel(cm: any): void;
		set colormap(arg: any);
		get colormap(): any;
		set opacity(arg: any);
		get opacity(): any;
		calMinMax(): any[];
		cal_min: any;
		cal_max: any;
		robust_min: any;
		robust_max: any;
		global_min: any;
		global_max: any;
		intensityRaw2Scaled(raw: any): any;
		intensityScaled2Raw(scaled: any): number;
		saveToUint8Array(fnm: any, drawing8?: any): Promise<Uint8Array>;
		saveToDisk(fnm: any, drawing8?: any): Promise<void>;
		/**
		 * make a clone of a NVImage instance and return a new NVImage
		 * @returns {NVImage} returns a NVImage instance
		 * @example
		 * myImage = NVImage.loadFromFile(SomeFileObject) // files can be from dialogs or drag and drop
		 * clonedImage = myImage.clone()
		 */
		clone(): NVImage;
		/**
		 * fill a NVImage instance with zeros for the image data
		 * @example
		 * myImage = NVImage.loadFromFile(SomeFileObject) // files can be from dialogs or drag and drop
		 * clonedImageWithZeros = myImage.clone().zeroImage()
		 */
		zeroImage(): void;
		/**
		 * Image M.
		 * @typedef {Object} NVImageMetadata
		 * @property {string} id - unique if of image
		 * @property {number} datatypeCode - data type
		 * @property {number} nx - number of columns
		 * @property {number} ny - number of rows
		 * @property {number} nz - number of slices
		 * @property {number} nt - number of volumes
		 * @property {number} dx - space between columns
		 * @property {number} dy - space between rows
		 * @property {number} dz - space between slices
		 * @property {number} dt - time between volumes
		 * @property {number} bpx - bits per voxel
		 */
		/**
		 * get nifti specific metadata about the image
		 * @returns {NVImageMetadata} - {@link NVImageMetadata}
		 */
		getImageMetadata(): NVImageMetadata;
		getValue(x: any, y: any, z: any, frame4D?: number): any;
		getRawValue(x: any, y: any, z: any, frame4D?: number): any;
		/**
		 * calculate cuboid extents via pixdims * dims
		 * @returns {number[]}
		 */
		/**
		 * @param {number} id - id of 3D Object (is this the base volume or an overlay?)
		 * @param {WebGLRenderingContext} gl - WebGL rendering context
		 * @returns {NiivueObject3D} returns a new 3D object in model space
		 */
		toNiivueObject3D(id: number, gl: WebGLRenderingContext): NiivueObject3D;
		/**
		 * Update options for image
		 * @param {NVImageFromUrlOptions} options
		 */
		applyOptionsUpdate(options: NVImageFromUrlOptions): void;
		getImageOptions(): any;
		/**
		 * Converts NVImage to NIfTI compliant byte array
		 * @param {Uint8Array} drawingBytes
		 */
		toUint8Array(drawingBytes?: Uint8Array): Uint8Array;
	}
	export namespace NVImage {
		function fetchDicomData(url: any): Promise<ArrayBuffer[]>;
		/**
		 * factory function to load and return a new NVImage instance from a given URL
		 * @constructs NVImage
		 * @param {NVImageFromUrlOptions} options
		 * @returns {NVImage} returns a NVImage instance
		 * @example
		 * myImage = NVImage.loadFromUrl('./someURL/image.nii.gz') // must be served from a server (local or remote)
		 */
		function loadFromUrl({
			url,
			urlImgData,
			name,
			colorMap,
			opacity,
			cal_min,
			cal_max,
			trustCalMinMax,
			percentileFrac,
			ignoreZeroVoxels,
			visible,
			useQFormNotSForm,
			colorMapNegative,
			frame4D,
			isManifest,
			limitFrames4D,
			imageType,
		}?: NVImageFromUrlOptions): NVImage;
		function readFileAsync(file: any): Promise<any>;
		/**
		 * factory function to load and return a new NVImage instance from a file in the browser
		 * @constructs NVImage
		 * @param {File} file the file object
		 * @param {string} [name=''] a name for this image. Default is an empty string
		 * @param {string} [colorMap='gray'] a color map to use. default is gray
		 * @param {number} [opacity=1.0] the opacity for this image. default is 1
		 * @param {string} [urlImgData=null] Allows loading formats where header and image are separate files (e.g. nifti.hdr, nifti.img)
		 * @param {number} [cal_min=NaN] minimum intensity for color brightness/contrast
		 * @param {number} [cal_max=NaN] maximum intensity for color brightness/contrast
		 * @param {boolean} [trustCalMinMax=true] whether or not to trust cal_min and cal_max from the nifti header (trusting results in faster loading)
		 * @param {number} [percentileFrac=0.02] the percentile to use for setting the robust range of the display values (smart intensity setting for images with large ranges)
		 * @param {boolean} [ignoreZeroVoxels=false] whether or not to ignore zero voxels in setting the robust range of display values
		 * @param {boolean} [visible=true] whether or not this image is to be visible
		 * @param {boolean} [useQFormNotSForm=false] whether or not to use QForm instead of SForm during construction
		 * @param {string} [colorMapNegative=""] colormap negative for the image
		 * @param {NVIMAGE_TYPE} [imageType=NVIMAGE_TYPE.UNKNOWN] image type
		 * @returns {NVImage} returns a NVImage instance
		 * @example
		 * myImage = NVImage.loadFromFile(SomeFileObject) // files can be from dialogs or drag and drop
		 */
		function loadFromFile({
			file,
			name,
			colorMap,
			opacity,
			urlImgData,
			cal_min,
			cal_max,
			trustCalMinMax,
			percentileFrac,
			ignoreZeroVoxels,
			visible,
			useQFormNotSForm,
			colorMapNegative,
			frame4D,
			imageType,
		}: {
			file: File;
			name?: string;
			colorMap?: string;
			opacity?: number;
			urlImgData?: string;
			cal_min?: number;
			cal_max?: number;
			trustCalMinMax?: boolean;
			percentileFrac?: number;
			ignoreZeroVoxels?: boolean;
			visible?: boolean;
			useQFormNotSForm?: boolean;
			colorMapNegative?: string;
			frame4D?: string;
			imageType?: number;
		}): NVImage;
		/**
		 * factory function to load and return a new NVImage instance from a base64 encoded string
		 * @constructs NVImage
		 * @param {string} [base64=null] base64 string
		 * @param {string} [name=''] a name for this image. Default is an empty string
		 * @param {string} [colorMap='gray'] a color map to use. default is gray
		 * @param {number} [opacity=1.0] the opacity for this image. default is 1
		 * @param {number} [cal_min=NaN] minimum intensity for color brightness/contrast
		 * @param {number} [cal_max=NaN] maximum intensity for color brightness/contrast
		 * @param {boolean} [trustCalMinMax=true] whether or not to trust cal_min and cal_max from the nifti header (trusting results in faster loading)
		 * @param {number} [percentileFrac=0.02] the percentile to use for setting the robust range of the display values (smart intensity setting for images with large ranges)
		 * @param {boolean} [ignoreZeroVoxels=false] whether or not to ignore zero voxels in setting the robust range of display values
		 * @param {boolean} [visible=true] whether or not this image is to be visible
		 * @returns {NVImage} returns a NVImage instance
		 * @example
		 * myImage = NVImage.loadFromBase64('SomeBase64String')
		 */
		function loadFromBase64({
			base64,
			name,
			colorMap,
			opacity,
			cal_min,
			cal_max,
			trustCalMinMax,
			percentileFrac,
			ignoreZeroVoxels,
			visible,
		}?: string): NVImage;
		/**
		 * a factory function to make a zero filled image given a NVImage as a reference
		 * @param {NVImage} nvImage an existing NVImage as a reference
		 * @param {dataType} string the output data type. Options: 'same', 'uint8'
		 * @returns {NVImage} returns a new NVImage filled with zeros for the image data
		 * @example
		 * myImage = NVImage.loadFromFile(SomeFileObject) // files can be from dialogs or drag and drop
		 * newZeroImage = NVImage.zerosLike(myImage)
		 */
		function zerosLike(nvImage: NVImage, dataType?: string): NVImage;
		function getValue(x: number, y: number, z: number, frame4D: number): number;
		/**
		 * Sets the intesity of a specific voxel to a given value
		 * @param {number} x x coordinate of the voxel
		 * @param {number} y y coordinate of the voxel
		 * @param {number} z z coordinate of the voxel
		 * @param {number} value number between 0 and 1, where 1 is full intensity and 0 is no intensity(black)
		 * @param {number} [frame4D=0] volume displayed, 0 indexed, must be less than nFrame4D
		 */
		function setVoxel(
			x: number,
			y: number,
			z: number,
			value: number,
			frame4D: number
		);
		function setVoxelValueOnIndex(index: number, value: number);
		/**
		 * Converts an input value to the intensity value of the corresponding image
		 * @param {number} value needs to be a value between 0 and 1, where 1 is high intensity and 0 is no intensity
		 * @returns {number} converted value for the given into to the corresponding image
		 */
		function convertToIntensityValue(value: number): number;
	}
}
