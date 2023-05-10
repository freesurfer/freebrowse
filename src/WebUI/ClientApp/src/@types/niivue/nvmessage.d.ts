/* eslint-disable @typescript-eslint/no-extraneous-class */
declare module '@niivue/niivue' {
	/**
	 * @class NVMessageUpdateData
	 * @type NVMessageUpdateData
	 * @constructor
	 * @param {number} azimuth
	 * @param {number} elevation
	 * @param {number[]} clipPlane
	 * @param {number} zoom
	 */
	export class NVMesssageUpdateData {
		/**
		 * @class NVMessageUpdateData
		 * @type NVMessageUpdateData
		 * @constructor
		 * @param {number} azimuth
		 * @param {number} elevation
		 * @param {number[]} clipPlane
		 * @param {number} zoom
		 */
		constructor(
			azimuth: number,
			elevation: number,
			clipPlane: number[],
			zoom: number
		);
	}
	/**
	 * @class NVMessageSet4DVolumeIndex
	 * @type NVMessageSet4DVolumeIndex
	 * @constructor
	 * @param {string} url
	 * @param {number} index
	 */
	export class NVMessageSet4DVolumeIndexData {
		/**
		 * @class NVMessageSet4DVolumeIndex
		 * @type NVMessageSet4DVolumeIndex
		 * @constructor
		 * @param {string} url
		 * @param {number} index
		 */
		constructor(url: string, index: number);
	}
	/**
	 * @class NVMessage
	 * @type NVMessage
	 * @description
	 * NVMessage can be used to synchronize a session actions
	 * @constructor
	 * @param {string} messageType
	 * @param {(string|NVMesssageUpdateData|NVImageFromUrlOptions|NVMeshFromUrlOptions|NVMessageSet4DVolumeIndex)} messageData
	 * @param {string} sessionKey
	 */
	export class NVMessage {
		/**
		 * @class NVMessage
		 * @type NVMessage
		 * @description
		 * NVMessage can be used to synchronize a session actions
		 * @constructor
		 * @param {string} messageType
		 * @param {(string|NVMesssageUpdateData|NVImageFromUrlOptions|NVMeshFromUrlOptions|NVMessageSet4DVolumeIndex)} messageData
		 * @param {string} sessionKey
		 */
		constructor(
			messageType: string,
			messageData?:
				| string
				| NVMesssageUpdateData
				| NVImageFromUrlOptions
				| NVMeshFromUrlOptions
				| NVMessageSet4DVolumeIndex,
			sessionKey?: string
		);
	}
	export const UPDATE: 'update';
	export const CREATE: 'create';
	export const JOIN: 'join';
	export const ADD_VOLUME_URL: 'add volume url';
	export const REMOVE_VOLUME_URL: 'remove volume media';
	export const ADD_MESH_URL: 'add mesh url';
	export const REMOVE_MESH_URL: 'remove mesh media';
	export const SET_4D_VOL_INDEX: 'set 4d vol index';
	export const UPDATE_IMAGE_OPTIONS: 'update image options';
}
