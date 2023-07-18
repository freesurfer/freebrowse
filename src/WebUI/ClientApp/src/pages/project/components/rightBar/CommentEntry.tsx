import { humanizeTimeSpan } from '@/model/humanizeTimeSpan';
import { NameIcon } from '@/pages/project/components/rightBar/NameIcon';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { type ReactElement, useState } from 'react';

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
	const [value, setValue] = useState<string>(userName);

	return (
		<div className="my-1 flex flex-col gap-1">
			<div className="flex items-center gap-1">
				<NameIcon userName={userName} size="small" />
				<input
					type="text"
					style={{ width: `${value.length}ch` }}
					defaultValue={userName}
					onChange={(event) => setValue(event.target.value)}
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
