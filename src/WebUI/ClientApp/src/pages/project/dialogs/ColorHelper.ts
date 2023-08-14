export const isValidColor = (color: string): boolean =>
	/^#[0-9A-F]{6}$/i.test(color);
