export interface ISelectableFile {
	/**
	 * the file is selected
	 */
	isActive: boolean;

	setIsActive: (isActive: boolean) => void;
}
