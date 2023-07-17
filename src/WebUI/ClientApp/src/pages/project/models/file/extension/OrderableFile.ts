import type { ISelectableFile } from '@/pages/project/models/file/extension/SelectableFile';

export interface IOrderableFile extends ISelectableFile {
	readonly name: string;
	/**
	 * order the file is to sort with the other files of the same type
	 * undefined if a new file has no order yet
	 */
	readonly order: number | undefined;
	/**
	 * the file is shown in the diagram
	 */
	readonly isChecked: boolean;
}
