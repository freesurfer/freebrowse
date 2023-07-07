/**
 * files that can appear in the project create/edit dialog need to have some properties defined here
 */
export interface IManageableFile {
	readonly size: number;
	readonly progress: number;
}
