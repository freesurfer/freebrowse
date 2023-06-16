import { DropZone } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/DropZone';
import { LoadFileList } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/LoadFileList';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';

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
}): React.ReactElement => {
	return (
		<div
			onDragEnter={(event) => event.preventDefault()}
			onDragOver={(event) => event.preventDefault()}
		>
			<div className="flex flex-col">
				<span className="text-gray-500 text-xs">Project Name:</span>
				<input
					className="border-gray-400 text-gray-500 mt-1 w-64 rounded border px-3 py-2"
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
