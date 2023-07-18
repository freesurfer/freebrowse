import { FileSettings } from '@/pages/project/components/leftBar/FileSettings';
import { LoadedFiles } from '@/pages/project/components/leftBar/LoadedFiles';
import { VoxelInfo } from '@/pages/project/components/leftBar/VoxelInfo';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { LocationData } from '@niivue/niivue';
import type { Dispatch, ReactElement } from 'react';

export const LeftBar = ({
	projectState,
	setProjectState,
	location,
}: {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
	location: LocationData | undefined;
}): ReactElement => {
	return (
		<div
			className="flex h-full flex-col overflow-y-auto overflow-x-hidden pt-2"
			style={{ width: '250px', minWidth: '250px' }}
		>
			<LoadedFiles
				projectState={projectState}
				setProjectState={setProjectState}
			></LoadedFiles>
			<FileSettings
				projectState={projectState}
				setProjectState={setProjectState}
			></FileSettings>
			<VoxelInfo location={location}></VoxelInfo>
		</div>
	);
};
