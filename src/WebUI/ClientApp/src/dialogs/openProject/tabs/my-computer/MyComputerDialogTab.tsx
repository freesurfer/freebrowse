import type { ProjectFiles } from '@/dialogs/openProject/models/ProjectFiles';
import { DropZone } from '@/dialogs/openProject/tabs/my-computer/components/DropZone';
import { LoadFileList } from '@/dialogs/openProject/tabs/my-computer/components/LoadFileList';
import type { ProjectDto } from '@/generated/web-api-client';

export const MyComputerDialogTab = ({
	projectFiles,
	setProjectFiles,
	projectName,
	setProjectName,
	projectDto,
}: {
	projectFiles: ProjectFiles;
	setProjectFiles: (projectFiles: ProjectFiles) => void;
	projectName: string | undefined;
	setProjectName: (projectName: string) => void;
	projectDto: ProjectDto | undefined;
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
					readOnly={projectDto !== undefined}
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
