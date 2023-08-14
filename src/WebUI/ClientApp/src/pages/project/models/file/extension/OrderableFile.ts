import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';

export interface IOrderableFile extends ISelectableFile {
	name: string;
	/**
	 * order the file is to sort with the other files of the same type
	 * undefined if a new file has no order yet
	 */
	order: number | undefined;
	/**
	 * the id of the place inside the niivue library starting with 0
	 */
	niivueOrderIndex: number | undefined;
	/**
	 * the file is shown in the diagram
	 */
	isChecked: boolean;

	setOrder: (order: number) => void;
	setNiivueOrderIndex: (niivueOrderIndex: number) => void;
	setIsChecked: (isChecked: boolean) => void;
}
