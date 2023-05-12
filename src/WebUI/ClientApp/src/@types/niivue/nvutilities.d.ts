/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-extraneous-class */
declare module '@niivue/niivue' {
	/**
	 * Namespace for utility functions
	 */
	export class NVUtilities {
		static arrayBufferToBase64(arrayBuffer: any): string;
		static uint8tob64(bytes: any): string;
		static download(content: any, fileName: any, contentType: any): void;
		static readFileAsync(file: any): Promise<any>;
		static blobToBase64(blob: any): Promise<any>;
	}
}
