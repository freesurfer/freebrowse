declare module '@niivue/niivue' {
	/**
	 * @class NiivueObject3D
	 * @type NiivueObject3D
	 * @typedef NiivueObject3D
	 * @property {Shader[]} renderShaders
	 * @property {boolean} isVisible
	 * @property {WebGLVertexArrayObject} vertexBuffer
	 * @property {number} indexCount
	 * @property {WebGLVertexArrayObject} indexBuffer
	 * @property {WebGLVertexArrayObject} textureCoordinateBuffer
	 * @property {number} mode
	 * @description Object rendered with WebGL
	 * @constructor
	 * @param {number} id
	 * @param {WebGLVertexArrayObject} vertexBuffer
	 * @param {number} mode
	 * @param {number} indexCount
	 * @param {WebGLVertexArrayObject} indexBuffer
	 * @param {WebGLVertexArrayObject} textureCoordinateBuffer
	 **/
	export interface NiivueObject3D {
		renderShaders: Shader[];
		isVisible: boolean;
		vertexBuffer: WebGLVertexArrayObject;
		indexCount: number;
		indexBuffer: WebGLVertexArrayObject;
		textureCoordinateBuffer: WebGLVertexArrayObject;
		mode: number;
	}
}
