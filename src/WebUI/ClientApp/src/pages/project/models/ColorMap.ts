/**
 * developer wording
 * passed to the backend
 */
export enum COLOR_MAP {
	GRAY = 'gray',
	HEAT = 'heat',
	LOOKUP_TABLE = 'LookupTable',
}

/**
 * niivue wording
 */
export enum COLOR_MAP_NIIVUE {
	GRAY = 'gray',
	LOOKUP_TABLE = 'LookupTable',
	HEAT = 'Hot',
}

/**
 * user presented wording
 */
export enum COLOR_MAP_TRANSLATION {
	GRAY = 'Gray',
	LOOKUP_TABLE = 'LookupTable',
	HEAT = 'Heat',
}

export class ColorMap {
	private constructor(
		public readonly developer: COLOR_MAP,
		public readonly niivue: COLOR_MAP_NIIVUE,
		public readonly translation: COLOR_MAP_TRANSLATION
	) {}

	public static from(colorMap: COLOR_MAP): ColorMap {
		switch (colorMap) {
			case COLOR_MAP.GRAY:
				return new ColorMap(
					colorMap,
					COLOR_MAP_NIIVUE.GRAY,
					COLOR_MAP_TRANSLATION.GRAY
				);
			case COLOR_MAP.LOOKUP_TABLE:
				return new ColorMap(
					colorMap,
					COLOR_MAP_NIIVUE.LOOKUP_TABLE,
					COLOR_MAP_TRANSLATION.LOOKUP_TABLE
				);
			case COLOR_MAP.HEAT:
				return new ColorMap(
					colorMap,
					COLOR_MAP_NIIVUE.HEAT,
					COLOR_MAP_TRANSLATION.HEAT
				);
		}
	}

	static fromTranslation(
		colorMapTranslation: string | undefined
	): ColorMap | undefined {
		switch (colorMapTranslation) {
			case undefined:
				return undefined;
			case COLOR_MAP_TRANSLATION.GRAY:
				return ColorMap.from(COLOR_MAP.GRAY);
			case COLOR_MAP_TRANSLATION.LOOKUP_TABLE:
				return ColorMap.from(COLOR_MAP.LOOKUP_TABLE);
			case COLOR_MAP_TRANSLATION.HEAT:
				return ColorMap.from(COLOR_MAP.HEAT);
			default:
				throw new Error(`there is no color map for ${colorMapTranslation}`);
		}
	}

	static fromBackend(
		colorMapBackend: string | undefined | null
	): ColorMap | undefined {
		switch (colorMapBackend) {
			case undefined:
			case null:
				return undefined;
			case COLOR_MAP.GRAY:
				return ColorMap.from(COLOR_MAP.GRAY);
			case COLOR_MAP.LOOKUP_TABLE:
				return ColorMap.from(COLOR_MAP.LOOKUP_TABLE);
			case COLOR_MAP.HEAT:
				return ColorMap.from(COLOR_MAP.HEAT);
			default:
				throw new Error(`there is no color map for ${colorMapBackend}`);
		}
	}
}
