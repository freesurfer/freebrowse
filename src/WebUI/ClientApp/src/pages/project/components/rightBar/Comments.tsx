import { Collapse } from '@/components/Collapse';
import { AddComment } from '@/pages/project/components/rightBar/AddComment';
import { CommentEntry } from '@/pages/project/components/rightBar/CommentEntry';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { ReactElement } from 'react';

export const Comments = ({
	projectState,
}: {
	projectState: ProjectState | undefined;
}): ReactElement => {
	return (
		<Collapse
			className="border-b border-gray py-2 text-xs"
			title={<span className="text-xs font-semibold">Comments</span>}
		>
			<div>
				<CommentEntry />
				<AddComment />
			</div>
		</Collapse>
	);
};
