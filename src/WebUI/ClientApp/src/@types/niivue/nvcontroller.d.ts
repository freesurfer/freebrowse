/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '@niivue/niivue' {
	/**
	 * @class NVController
	 * @type NVController
	 * @description NVController is for synchronizing both remote and local instances of Niivue
	 * @constructor
	 * @param {Niivue} niivue  Niivue object to conttrol
	 */
	export class NVController {
		constructor(niivue: any);
		niivue: any;
		mediaUrlMap: any;
		isInSession: any;
		onFrameChange: any;
		onLocationChangeHandler(location: any): void;
		addVolume(volume: any, url: any): void;
		addMesh(mesh: any, url: any): void;
		onNewMessage(msg: any): void;
		/**
		 *
		 * @param {string} serverBaseUrl
		 * @param {string} sessionName
		 * @param {string} sessionKey
		 * @param {SessionUser} user
		 * @description Connects to existing session or creates new session
		 */
		connectToSession(
			sessionName: string,
			user?: SessionUser,
			serverBaseUrl?: string,
			sessionKey?: string
		): void;
		user: any;
		sessionBus: any;
		/**
		 * Zoom level has changed
		 * @param {number} zoom
		 */
		onZoom3DChangeHandler(zoom: number): Promise<void>;
		/**
		 * Azimuth and/or elevation has changed
		 * @param {number} azimuth
		 * @param {number} elevation
		 */
		onAzimuthElevationChangeHandler(
			azimuth: number,
			elevation: number
		): Promise<void>;
		/**
		 * Clip plane has changed
		 * @param {number[]} clipPlane
		 */
		onClipPlaneChangeHandler(clipPlane: number[]): Promise<void>;
		/**
		 * Add an image and notify subscribers
		 * @param {NVImageFromUrlOptions} imageOptions
		 */
		onVolumeAddedFromUrlHandler(
			imageOptions: NVImageFromUrlOptions,
			volume: any
		): Promise<void>;
		/**
		 * A volume has been added
		 * @param {NVImage} volume
		 */
		onImageLoadedHandler(volume: NVImage): Promise<void>;
		/**
		 * Notifies other users that a volume has been removed
		 * @param {string} url
		 */
		onVolumeWithUrlRemovedHandler(url: string): Promise<void>;
		/**
		 * Notifies that a mesh has been loaded by URL
		 * @param {NVMeshFromUrlOptions} meshOptions
		 */
		onMeshAddedFromUrlHandler(meshOptions: NVMeshFromUrlOptions): Promise<void>;
		/**
		 * Notifies that a mesh has been added
		 * @param {NVMesh} mesh
		 */
		onMeshLoadedHandler(mesh: NVMesh): Promise<void>;
		onMeshWithUrlRemovedHandler(url: any): Promise<void>;
		/**
		 *
		 * @param {NVImage} volume volume that has changed color maps
		 */
		onColorMapChangeHandler(volume: NVImage): Promise<void>;
		/**
		 * @param {NVImage} volume volume that has changed opacity
		 */
		onOpacityChangeHandler(volume: NVImage): Promise<void>;
		/**
		 * Frame for 4D image has changed
		 * @param {NVImage} volume
		 * @param {number} index
		 */
		onFrameChangeHandler(volume: NVImage, index: number): void;
		/**
		 * Custom mesh shader has been added
		 * @param {string} fragmentShaderText shader code to be compiled
		 * @param {string} name name of shader, can be used as index
		 */
		onCustomMeshShaderAddedHandler(
			fragmentShaderText: string,
			name: string
		): void;
		/**
		 * Mesh shader has changed
		 * @param {number} meshIndex index of mesh
		 * @param {number} shaderIndex index of shader
		 */
		onMeshShaderChanged(meshIndex: number, shaderIndex: number): void;
		/**
		 * Mesh property has been changed
		 * @param {number} meshIndex index of mesh
		 * @param {any} key property index
		 * @param {any} val property value
		 */
		onMeshPropertyChanged(meshIndex: number, key: any, val: any): void;
	}
}
