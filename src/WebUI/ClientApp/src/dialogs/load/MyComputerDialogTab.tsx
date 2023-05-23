import { DropZone } from '@/dialogs/load/DropZone';
import type { FileLoadMetadata } from '@/dialogs/load/LoadDialog';
import { LoadFileList } from '@/dialogs/load/LoadFileList';

export const MyComputerDialogTab = ({
	files,
	updateFiles,
	projectName,
	setProjectName,
	isNewProject,
}: {
	files: Record<string, FileLoadMetadata>;
	updateFiles: (files: Record<string, FileLoadMetadata>) => void;
	projectName: string;
	setProjectName: (projectName: string) => void;
	isNewProject: boolean;
}): React.ReactElement => {
	return (
		<div
			onDragEnter={(event) => event.preventDefault()}
			onDragOver={(event) => event.preventDefault()}
		>
			<div className="flex flex-col">
				<span className="text-xs text-gray-500">Project Name:</span>
				<input
					className="w-64 mt-1 border rounded border-gray-400 text-gray-500 px-3 py-2"
					type="text"
					value={projectName}
					onChange={(event) => setProjectName(event.target.value)}
					readOnly={!isNewProject}
				></input>
			</div>
			<DropZone
				className="mt-4 w-[34em]"
				onFileOpen={(newFiles) => {
					updateFiles(
						newFiles.reduce((result, newFile) => {
							return {
								...result,
								[newFile.name]: {
									file: newFile,
									progress: 100,
								},
							};
						}, files)
					);
				}}
			></DropZone>
			<LoadFileList
				className="mt-3"
				files={files}
				updateFiles={(files) => updateFiles(files)}
			></LoadFileList>
		</div>
	);
};
