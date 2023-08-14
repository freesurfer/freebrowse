import { BrushSettings } from '@/pages/project/components/rightBar/BrushSettings';
import { Comments } from '@/pages/project/components/rightBar/Comments';
import {
	USER_MODE,
	type ProjectState,
} from '@/pages/project/models/ProjectState';
import { observer } from 'mobx-react-lite';
import { type ReactElement } from 'react';

export const RightBar = observer(
	({
		projectState,
	}: {
		projectState: ProjectState | undefined;
	}): ReactElement => {
		const selectedPointSetFile = projectState?.files?.pointSets.cloud.find(
			(file) => file.isActive
		);

		return (
			<div
				style={{ width: '300px', maxWidth: '300px' }}
				className="h-full border pl-1"
			>
				{projectState !== undefined &&
					projectState.userMode === USER_MODE.EDIT_VOXEL && (
						<BrushSettings projectState={projectState} />
					)}
				{projectState !== undefined && selectedPointSetFile !== undefined && (
					<Comments
						projectState={projectState}
						pointSetFile={selectedPointSetFile}
						userName={projectState.userName}
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
	}
);
