import type { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import type { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import type { LocalPointSetFile } from '@/pages/project/models/file/LocalPointSetFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';

export type PointSetFile =
	| LocalPointSetFile
	| CachePointSetFile
	| CloudPointSetFile;

export interface IPointSetCoordinates {
	x: number;
	y: number;
	z: number;
}

export interface IPointSetComment {
	edited?: boolean;
	prefilled?: string[];
	text: string;
	timestamp: string;
	user: string;
}

export interface IPointSetStatistics {
	'additional stat': number;
}

export interface IPointSetWaypoint {
	comments?: IPointSetComment[];
	coordinates: IPointSetCoordinates;
	legacy_stat?: 1;
	statistics?: IPointSetStatistics;
}

export interface IPointSetData {
	color: [number, number, number];
	data_type: 'fs_pointset';
	overall_quality?: string;
	points: IPointSetWaypoint[];
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
 * interface to define, what all the point set file state classes need to contain
 */
export interface IPointSetFile {
	readonly type: FileType.POINT_SET;

	/**
	 * the from the user temporally selected way point
	 */
	selectedWayPoint: number;

	/**
	 * object containing all the information needed for the ui and persisted in the backend
	 */
	data: IPointSetData | undefined;

	setSelectedWayPoint: (selectedWayPoint: number) => void;
	setData: (data: IPointSetData) => void;
	addWaypoint: (waypoint: IPointSetWaypoint, logHistory?: boolean) => void;
	removeWaypoint: (waypoint: IPointSetWaypoint, logHistory?: boolean) => void;
}
