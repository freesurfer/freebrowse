import { humanizeTimeSpan } from '@/model/humanizeTimeSpan';
import { NameIcon } from '@/pages/project/components/rightBar/NameIcon';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { type ReactElement } from 'react';

export const CommentEntry = ({
	userName,
	timestamp,
	comment,
	setUserName,
}: {
	userName: string;
	timestamp?: string;
	comment: string;
	setUserName: (userName: string) => void;
}): ReactElement => {
	return (
		<div className="my-1 flex flex-col gap-1">
			<div className="flex items-center gap-1">
				<NameIcon userName={userName} size="small" />
				<input
					type="text"
					style={{ width: `${userName.length}ch` }}
					defaultValue={userName}
					onBlur={(event) => setUserName(event.target.value)}
				></input>
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
