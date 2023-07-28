import type { INVImageHeader, NVImage } from '@niivue/niivue';
import * as fflate from 'fflate';

export const convertFileToBase64 = async (file: File): Promise<string> => {
	return await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			if (reader.result === null) {
				reject(new Error('result is null'));
				return;
			}
			if (reader.result instanceof ArrayBuffer) {
				reject(
					new Error('result is an ArrayBuffer instead of expected string')
				);
				return;
			}
			const arr = reader.result.split(',');
			const base64 = arr[arr.length - 1];
			if (base64 === undefined) {
				reject(new Error('not possible'));
				return;
			}

			resolve(base64);
		};
		reader.onerror = (error) => {
			reject(error);
		};
	});
};

export const convertVolumeToBase64 = async (
	volume: NVImage
): Promise<string> => {
	if (volume.name.endsWith('.mgh') || volume.name.endsWith('.mgz')) {
		return convertMghVolumeToBase64(volume);
	} else {
		const volumeData = await volume.saveToUint8Array(volume.name);
		return arrayBufferToBase64(volumeData.buffer);
	}
};

export const convertMghVolumeToBase64 = (volume: NVImage): string => {
	const headerBytes = mghHeaderToArray(volume.hdr);
	let imgRaw: Uint8Array | Int32Array = new Uint8Array(volume.img);

	if (volume.hdr.numBitsPerVoxel === 16) {
		// inspired by https://github.com/rii-mango/Papaya
		const u16 = new Uint16Array(volume.img);
		for (let i = 0; i < u16.length; i++) {
			const val = u16[i] ?? 0;
			u16[i] = ((((val & 0xff) << 8) | ((val >> 8) & 0xff)) << 16) >> 16; // since JS uses 32-bit when bit shifting
		}

		imgRaw = new Int32Array(u16);
	} else if (volume.hdr.numBitsPerVoxel === 32) {
		// inspired by https://github.com/rii-mango/Papaya
		const i32 = new Int32Array(volume.img);
		for (let i = 0; i < i32.length; i++) {
			const val = i32[i] ?? 0;
			i32[i] =
				((val & 0xff) << 24) |
				((val & 0xff00) << 8) |
				((val >> 8) & 0xff00) |
				((val >> 24) & 0xff);
		}

		imgRaw = new Int32Array(i32);
	} else if (volume.hdr.numBitsPerVoxel === 64) {
		// inspired by MIT licensed code: https://github.com/rochars/endianness
		const numBytesPerVoxel = volume.hdr.numBitsPerVoxel / 8;
		const u8 = new Uint8Array(volume.img);
		for (let index = 0; index < u8.length; index += numBytesPerVoxel) {
			let offset = numBytesPerVoxel - 1;
			for (let x = 0; x < offset; x++) {
				const theByte = u8[index + x] ?? 0;
				u8[index + x] = u8[index + offset] ?? 0;
				u8[index + offset] = theByte;
				offset--;
			}
		}

		imgRaw = new Int32Array(u8);
	}

	const odata = new Uint8Array(
		headerBytes.length + (imgRaw.length * volume.hdr.numBitsPerVoxel) / 8
	);

	const contentBytes = new Uint8Array(imgRaw.buffer);
	odata.set(headerBytes);
	odata.set(contentBytes, headerBytes.length);

	let saveData = null;

	if (volume.name.endsWith('.mgz')) {
		saveData = fflate.gzipSync(odata, {
			filename: volume.name,
			mtime: Date.now(),
		});
	} else {
		saveData = odata;
	}

	return arrayBufferToBase64(saveData.buffer);
};

// const mghFooterToArray = (footer: INVImageFooter): Uint8Array => {
// 	const byteArray = new Uint8Array(20 + footer.tagsBytes.length);
// 	const view = new DataView(byteArray.buffer);

// 	view.setFloat32(0, footer.tr, false);
// 	view.setFloat32(4, footer.flipAngle, false);
// 	view.setFloat32(8, footer.te, false);
// 	view.setFloat32(12, footer.ti, false);
// 	view.setFloat32(16, footer.fov, false);

// 	byteArray.set(footer.tagsBytes, 5 * 4);

// 	console.log(byteArray);

// 	return byteArray;
// };

const mghHeaderToArray = (hdr: INVImageHeader): Uint8Array => {
	const byteArray = new Uint8Array(284);
	const view = new DataView(byteArray.buffer);

	let offset = 0;

	// version
	view.setInt32(offset, 1, hdr.littleEndian);
	offset += 4;

	// width
	view.setInt32(offset, hdr.dims[1], hdr.littleEndian);
	offset += 4;

	// height
	view.setInt32(offset, hdr.dims[2], hdr.littleEndian);
	offset += 4;

	// depth
	view.setInt32(offset, hdr.dims[3], hdr.littleEndian);
	offset += 4;

	// nframes
	view.setInt32(offset, hdr.dims[4], hdr.littleEndian);
	offset += 4;

	// mtype
	let mtype = 0;
	if (hdr.numBitsPerVoxel === 16) {
		mtype = 4;
	} else if (
		hdr.numBitsPerVoxel === 32 &&
		(hdr.datatypeCode === 8 || hdr.datatypeCode === 64)
	) {
		mtype = 1;
	} else if (hdr.numBitsPerVoxel === 32 && hdr.datatypeCode === 16) {
		mtype = 3;
	}

	view.setInt32(offset, mtype, hdr.littleEndian);
	offset += 10;

	// spacingX
	view.setFloat32(offset, 1, hdr.littleEndian);
	offset += 4;

	// spacingY
	view.setFloat32(offset, 1, hdr.littleEndian);
	offset += 4;

	// spacingZ
	view.setFloat32(offset, 1, hdr.littleEndian);
	offset += 4;

	// xr
	view.setFloat32(offset, -1, hdr.littleEndian);
	offset += 4;

	// xa
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// xs
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// yr
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// ya
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// ys
	view.setFloat32(offset, -1, hdr.littleEndian);
	offset += 4;

	// zr
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// za
	view.setFloat32(offset, 1, hdr.littleEndian);
	offset += 4;

	// zs
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// cr
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// ca
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// cs
	view.setFloat32(offset, 0, hdr.littleEndian);
	offset += 4;

	// // spacingX
	// view.setFloat32(offset, hdr.pixDims[1], hdr.littleEndian);
	// offset += 4;

	// // spacingY
	// view.setFloat32(offset, hdr.pixDims[2], hdr.littleEndian);
	// offset += 4;

	// // spacingZ
	// view.setFloat32(offset, hdr.pixDims[3], hdr.littleEndian);
	// offset += 4;

	// // xr
	// view.setFloat32(offset, hdr.rot44[0] / hdr.pixDims[1], hdr.littleEndian);
	// offset += 4;

	// // xa
	// view.setFloat32(offset, hdr.rot44[1] / hdr.pixDims[2], hdr.littleEndian);
	// offset += 4;

	// // xs
	// view.setFloat32(offset, hdr.rot44[2] / hdr.pixDims[3], hdr.littleEndian);
	// offset += 4;

	// // yr
	// view.setFloat32(offset, hdr.rot44[4] / hdr.pixDims[1], hdr.littleEndian);
	// offset += 4;

	// // ya
	// view.setFloat32(offset, hdr.rot44[5] / hdr.pixDims[2], hdr.littleEndian);
	// offset += 4;

	// // ys
	// view.setFloat32(offset, hdr.rot44[6] / hdr.pixDims[3], hdr.littleEndian);
	// offset += 4;

	// // zr
	// view.setFloat32(offset, hdr.rot44[8] / hdr.pixDims[1], hdr.littleEndian);
	// offset += 4;

	// // za
	// view.setFloat32(offset, hdr.rot44[9] / hdr.pixDims[2], hdr.littleEndian);
	// offset += 4;

	// // zs
	// view.setFloat32(offset, hdr.rot44[10] / hdr.pixDims[3], hdr.littleEndian);
	// offset += 4;

	return byteArray;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i] ?? 0);
	}

	return btoa(binary);
};
