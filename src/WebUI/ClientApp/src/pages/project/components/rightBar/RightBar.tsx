import { BrushSettings } from '@/pages/project/components/rightBar/BrushSettings';
import { Comments } from '@/pages/project/components/rightBar/Comments';
import {
	type ProjectState,
	USER_MODE,
} from '@/pages/project/models/ProjectState';
import type { ReactElement, SetStateAction } from 'react';

export const RightBar = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: React.Dispatch<SetStateAction<ProjectState | undefined>>;
}): ReactElement => {
	const selectedPointSetFile = projectState?.files.pointSets.cloud.find(
		(file) => file.isActive
	);

	return (
		<div
			style={{ width: '300px', maxWidth: '300px' }}
			className="h-full border pl-1"
		>
			{projectState !== undefined &&
				projectState.userMode === USER_MODE.EDIT_VOXEL && (
					<BrushSettings
						projectState={projectState}
						setProjectState={setProjectState}
					/>
				)}
			{projectState !== undefined && selectedPointSetFile !== undefined && (
				<Comments
					pointSetFile={selectedPointSetFile}
					userName={projectState.user.name}
					setProjectState={setProjectState}
				/>
			)}
			{projectState === undefined ||
				(projectState.userMode !== USER_MODE.EDIT_VOXEL &&
					selectedPointSetFile === undefined && (
						<span className="mt-8 flex justify-center text-xs text-gray-400">
							Nothing to show
						</span>
					))}
		</div>
	);
};
