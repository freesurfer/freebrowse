import type { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import type { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';

export type PointSetFile = CachePointSetFile | CloudPointSetFile;

export interface IPointSetCoordinates {
	x: number;
	y: number;
	z: number;
}

export interface IPointSetComment {
	edited?: boolean;
	prefilled: string[];
	text: string;
	timestamp: string;
	user: string;
}

export interface IPointSetStatistics {
	'additional stat': number;
}

export interface IPointSetPoint {
	comments: IPointSetComment[];
	coordinates: IPointSetCoordinates;
	legacy_stat?: 1;
	statistics?: IPointSetStatistics;
}

export interface IPointSetData {
	color: [number, number, number];
	data_type: 'fs_pointset';
	overall_quality?: string;
	points: IPointSetPoint[];
	qa_level?: number;
	version: number;
	vox2ras: 'scanner_ras';
}

export const hexToRgb = (hex: string): [number, number, number] => {
	const r = `0x${hex.at(1) ?? 0}${hex.at(2) ?? 0}`;
	const g = `0x${hex.at(3) ?? 0}${hex.at(4) ?? 0}`;
	const b = `0x${hex.at(5) ?? 0}${hex.at(6) ?? 0}`;
	return [Number(r), Number(g), Number(b)];
};

export const rgbToHex = (rgb: [number, number, number]): string => {
	const to = (color: number): string => color.toString(16).padStart(2, '0');
	return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`;
};

/**
 * class to maintain the state of the set point data
 */
export class PointSetData {
	public readonly data: IPointSetData;

	constructor(args: { color: string } | { pointSetData: PointSetData }) {
		if ('color' in args) {
			this.data = {
				color: hexToRgb(args.color),
				data_type: 'fs_pointset',
				points: [],
				version: 1,
				vox2ras: 'scanner_ras',
			};
			return;
		}

		if ('pointSetData' in args) {
			this.data = {
				...args.pointSetData.data,
			};
		}

		throw new Error('no valid argument to instantiate PointSetData');
	}
}

/**
 * interface to define, what all the point set file state classes need to contain
 */
export interface IPointSetFile {
	readonly type: FileType.POINT_SET;
}
