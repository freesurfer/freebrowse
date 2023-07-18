import { Collapse } from '@/components/Collapse';
import { AddComment } from '@/pages/project/components/rightBar/AddComment';
import { CommentEntry } from '@/pages/project/components/rightBar/CommentEntry';
import type { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import type { ReactElement } from 'react';

export const Comments = ({
	pointSetFile,
}: {
	pointSetFile: CloudPointSetFile | undefined;
}): ReactElement => {
	const userName = 'Anonymus User';
	return (
		<Collapse
			className="border-b border-gray py-2 text-xs"
			title={<span className="text-xs font-semibold">Comments</span>}
		>
			<>
				<div className="mt-2 flex flex-col pl-1">
					<span className="grow border-b">Overall: {pointSetFile?.name}</span>
					<div className="mt-1 flex flex-col pr-4">
						{pointSetFile?.data.overall_quality !== undefined ? (
							<CommentEntry
								userName="anonymous"
								comment={pointSetFile?.data.overall_quality}
							/>
						) : (
							<AddComment userName={userName} />
						)}
					</div>
				</div>

				<div className="mt-5 flex flex-col pl-1">
					<span className="grow border-b">{pointSetFile?.name}: Point #3</span>
					<div className="mt-1 flex flex-col pr-4">
						{pointSetFile?.data.points[0]?.comments?.map((comment, index) => (
							<CommentEntry
								key={index}
								userName={comment.user}
								timestamp={comment.timestamp}
								comment={comment.text}
							/>
						))}
						<AddComment userName={userName} />
					</div>
				</div>
			</>
		</Collapse>
	);
};
