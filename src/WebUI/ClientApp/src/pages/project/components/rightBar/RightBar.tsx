import { Comments } from '@/pages/project/components/rightBar/Comments';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { ReactElement } from 'react';

export const RightBar = ({
	projectState,
}: {
	projectState: ProjectState | undefined;
}): ReactElement => {
	const selectedPointSetFile = projectState?.files.cloudPointSets.find(
		(file) => file.isActive
	);

	return (
		<div
			style={{ width: '300px', maxWidth: '300px' }}
			className="h-full border"
		>
			{selectedPointSetFile !== undefined ? (
				<Comments pointSetFile={selectedPointSetFile} />
			) : (
				<span className="mt-8 flex justify-center text-xs text-gray-400">
					Nothing to show
				</span>
			)}
		</div>
	);
};
