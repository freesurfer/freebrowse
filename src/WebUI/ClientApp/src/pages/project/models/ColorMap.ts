/**
 * developer wording
 * passed to the backend
 */
export enum COLOR_MAP_BACKEND {
	GRAY = 'Gray',
	HEAT = 'Heat',
	LOOKUP_TABLE = 'LookupTable',
}

/**
 * niivue wording
 */
export enum COLOR_MAP_NIIVUE {
	GRAY = 'Gray',
	HEAT = 'Hot',
	LOOKUP_TABLE = 'Lookuptable',
}

/**
 * user presented wording
 */
export enum COLOR_MAP_TRANSLATION {
	GRAY = 'Gray',
	HEAT = 'Heat',
	LOOKUP_TABLE = 'LookupTable',
}

export class ColorMap {
	private constructor(
		public readonly backend: COLOR_MAP_BACKEND,
		public readonly niivue: COLOR_MAP_NIIVUE,
		public readonly translation: COLOR_MAP_TRANSLATION
	) {}

	public static from(colorMap: COLOR_MAP_BACKEND): ColorMap {
		switch (colorMap) {
			case COLOR_MAP_BACKEND.GRAY:
				return new ColorMap(
					colorMap,
					COLOR_MAP_NIIVUE.GRAY,
					COLOR_MAP_TRANSLATION.GRAY
				);
			case COLOR_MAP_BACKEND.LOOKUP_TABLE:
				return new ColorMap(
					colorMap,
					COLOR_MAP_NIIVUE.LOOKUP_TABLE,
					COLOR_MAP_TRANSLATION.LOOKUP_TABLE
				);
			case COLOR_MAP_BACKEND.HEAT:
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
				return ColorMap.from(COLOR_MAP_BACKEND.GRAY);
			case COLOR_MAP_TRANSLATION.LOOKUP_TABLE:
				return ColorMap.from(COLOR_MAP_BACKEND.LOOKUP_TABLE);
			case COLOR_MAP_TRANSLATION.HEAT:
				return ColorMap.from(COLOR_MAP_BACKEND.HEAT);
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
			case COLOR_MAP_BACKEND.GRAY:
				return ColorMap.from(COLOR_MAP_BACKEND.GRAY);
			case COLOR_MAP_BACKEND.LOOKUP_TABLE:
				return ColorMap.from(COLOR_MAP_BACKEND.LOOKUP_TABLE);
			case COLOR_MAP_BACKEND.HEAT:
				return ColorMap.from(COLOR_MAP_BACKEND.HEAT);
			default:
				throw new Error(`there is no color map for ${colorMapBackend}`);
		}
	}
}
