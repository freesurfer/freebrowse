import { DropZone } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/DropZone';
import { LoadFileList } from '@/pages/project/dialogs/openProject/tabs/my-computer/components/LoadFileList';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import { EventHandler } from '@/pages/project/models/handlers/EventHandler';
import { observer } from 'mobx-react-lite';
import type { ReactElement } from 'react';

export const MyComputerDialogTab = observer(
	({ projectState }: { projectState: ProjectState }): ReactElement => {
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
						value={projectState.name}
						onChange={(event) => projectState.setName(event.target.value)}
						readOnly={projectState.id !== undefined}
						{...EventHandler.onKeyGate()}
					></input>
				</div>
				<DropZone
					className="mt-4 w-[34em]"
					onFileOpen={(newFiles) => {
						void projectState.files?.addLocalFiles(newFiles, projectState.id);
					}}
				></DropZone>
				<LoadFileList
					className="mt-3"
					projectFiles={projectState.files}
				></LoadFileList>
			</div>
		);
	}
);
