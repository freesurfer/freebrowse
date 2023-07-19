import { humanizeTimeSpan } from '@/model/humanizeTimeSpan';
import { NameIcon } from '@/pages/project/components/rightBar/NameIcon';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { type ReactElement, useState, useEffect } from 'react';

const DURATION_UPDATE_INTERVAL = 5 * 1000;

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
	const computeDuration = (timestamp: string | undefined): string => {
		if (timestamp === undefined) {
			return '';
		}
		return humanizeTimeSpan(timestamp);
	};

	const [value, setValue] = useState<string>(userName);
	const [time, setTime] = useState<string | ''>(computeDuration(timestamp));

	useEffect(() => {
		setTime(computeDuration(timestamp));
		const intervalHandle = setInterval(
			() => setTime(computeDuration(timestamp)),
			DURATION_UPDATE_INTERVAL
		);
		return () => clearInterval(intervalHandle);
	}, [timestamp, setTime]);

	return (
		<div className="my-1 flex flex-col gap-1">
			<div className="flex items-center gap-1">
				<NameIcon userName={userName} size="small" />
				<input
					type="text"
					style={{ width: `${value.length + 1}ch` }}
					defaultValue={userName}
					onChange={(event) => setValue(event.target.value)}
					onBlur={(event) => setUserName(event.target.value)}
				></input>
				<span className="grow whitespace-nowrap text-xs text-gray-300">
					{time}
				</span>
				<button className="flex">
					<EllipsisHorizontalIcon className="h-5 w-5" />
				</button>
			</div>
			<span>{comment}</span>
		</div>
	);
};
