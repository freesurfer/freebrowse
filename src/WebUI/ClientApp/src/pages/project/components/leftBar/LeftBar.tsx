import { FileSettings } from '@/pages/project/components/leftBar/FileSettings';
import { LoadedFiles } from '@/pages/project/components/leftBar/LoadedFiles';
import { VoxelInfo } from '@/pages/project/components/leftBar/VoxelInfo';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { Dispatch } from 'react';

export const LeftBar = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): React.ReactElement => {
	return (
		<div
			className="flex h-full flex-col overflow-y-auto overflow-x-hidden pt-2"
			style={{ width: '250px', minWidth: '250px' }}
		>
			<LoadedFiles
				projectState={projectState}
				setProjectState={setProjectState}
			></LoadedFiles>
			<FileSettings projectState={projectState}></FileSettings>
			<VoxelInfo></VoxelInfo>
		</div>
	);
};
