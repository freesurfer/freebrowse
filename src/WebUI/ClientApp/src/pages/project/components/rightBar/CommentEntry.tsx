import { DropDownMenu } from '@/components/DropDownMenu';
import { humanizeTimeSpan } from '@/model/humanizeTimeSpan';
import { EditComment } from '@/pages/project/components/rightBar/EditComment';
import { NameIcon } from '@/pages/project/components/rightBar/NameIcon';
import {
	EllipsisHorizontalIcon,
	PencilIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { type ReactElement, useState, useEffect } from 'react';

const DURATION_UPDATE_INTERVAL = 5 * 1000;

export const CommentEntry = ({
	userName,
	timestamp,
	comment,
	setUserName,
	updateComment,
	deleteComment,
}: {
	userName: string;
	timestamp?: string;
	comment: string;
	setUserName?: (userName: string) => void;
	updateComment: (text: string) => void;
	deleteComment: () => void;
}): ReactElement => {
	const [editMode, setEditMode] = useState<boolean>(false);

	const computeDuration = (timestamp: string | undefined): string => {
		if (timestamp === undefined) return '';
		return humanizeTimeSpan(timestamp);
	};
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
				{setUserName === undefined ? (
					<span>{userName}</span>
				) : (
					<input
						type="text"
						className="grow"
						defaultValue={userName}
						onBlur={(event) => setUserName(event.target.value)}
					></input>
				)}
				{timestamp !== undefined ? (
					<span className="grow whitespace-nowrap text-xs text-gray-300">
						{time}
					</span>
				) : (
					<></>
				)}
				<DropDownMenu
					options={[
						{
							label: 'Edit',
							icon: (className) => <PencilIcon className={className} />,
							onClick: () => {
								setEditMode((editMode) => !editMode);
							},
						},
						{
							label: 'Delete',
							icon: (className) => <TrashIcon className={className} />,
							onClick: deleteComment,
						},
					]}
				>
					<EllipsisHorizontalIcon className="h-5 w-5" />
				</DropDownMenu>
			</div>

			{editMode ? (
				<EditComment
					onUpdate={(value) => {
						setEditMode(false);
						updateComment(value);
					}}
					defaultValue={comment}
				/>
			) : (
				<span>{comment}</span>
			)}
		</div>
	);
};
