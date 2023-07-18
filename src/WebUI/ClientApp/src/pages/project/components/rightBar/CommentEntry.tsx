import { humanizeTimeSpan } from '@/model/humanizeTimeSpan';
import { NameIcon } from '@/pages/project/components/rightBar/NameIcon';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';

export const CommentEntry = ({
	userName,
	timestamp,
	comment,
}: {
	userName: string;
	timestamp?: string;
	comment: string;
}): ReactElement => {
	return (
		<div className="my-1 flex flex-col gap-1">
			<div className="flex items-center gap-1">
				<NameIcon userName={userName} size="small" />
				<span className="overflow-hidden text-ellipsis whitespace-nowrap">
					{userName}
				</span>
				<span className="grow whitespace-nowrap text-xs text-gray-300">
					{timestamp !== undefined ? humanizeTimeSpan(timestamp) : ''}
				</span>
				<button className="flex">
					<EllipsisHorizontalIcon className="h-5 w-5" />
				</button>
			</div>
			<span>{comment}</span>
		</div>
	);
};
