import { DropZone } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/DropZone';
import { LoadFileList } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/LoadFileList';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { ReactElement } from 'react';

export const MyComputerDialogTab = ({
	projectFiles,
	setProjectFiles,
	projectName,
	setProjectName,
	projectState,
}: {
	projectFiles: ProjectFiles;
	setProjectFiles: (projectFiles: ProjectFiles) => void;
	projectName: string | undefined;
	setProjectName: (projectName: string) => void;
	projectState: ProjectState | undefined;
}): ReactElement => {
	return (
		<div
			onDragEnter={(event) => event.preventDefault()}
			onDragOver={(event) => event.preventDefault()}
		>
			<div className="flex flex-col">
				<span className="text-xs text-gray-500">Project Name:</span>
				<input
					className="mt-1 w-64 rounded border border-gray-400 px-3 py-2 text-gray-500"
					type="text"
					value={projectName}
					onChange={(event) => setProjectName(event.target.value)}
					readOnly={projectState !== undefined}
				></input>
			</div>
			<DropZone
				className="mt-4 w-[34em]"
				onFileOpen={(newFiles) =>
					setProjectFiles(projectFiles.fromAddedLocalFiles(newFiles))
				}
			></DropZone>
			<LoadFileList
				className="mt-3"
				projectFiles={projectFiles}
				setProjectFiles={setProjectFiles}
			></LoadFileList>
		</div>
	);
};
