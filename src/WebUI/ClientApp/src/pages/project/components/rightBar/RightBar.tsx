import { Comments } from '@/pages/project/components/rightBar/Comments';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { ReactElement } from 'react';

export const RightBar = ({
	projectState,
}: {
	projectState: ProjectState | undefined;
}): ReactElement => {
	return (
		<div style={{ width: '300px' }} className="h-full border">
			<Comments projectState={projectState} />
		</div>
	);
};
