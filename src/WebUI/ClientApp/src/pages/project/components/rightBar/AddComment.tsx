import { NameIcon } from '@/pages/project/components/rightBar/NameIcon';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { useState, type ReactElement, useCallback } from 'react';

export const AddComment = ({
	userName,
	onAdd,
}: {
	userName: string;
	onAdd: (message: string) => void;
}): ReactElement => {
	const [message, setMessage] = useState<string | ''>('');

	const addComment = useCallback(
		(message: string | undefined) => {
			if (message === undefined) return;
			setMessage('');
			onAdd(message);
		},
		[setMessage, onAdd]
	);

	return (
		<div className="mt-1 flex flex-row gap-1">
			<NameIcon userName={userName} size={'big'} />
			<div className="flex grow justify-center overflow-hidden rounded border-[1.5px]">
				<input
					type="text"
					placeholder="Add a comment"
					className="grow pl-1 text-xs"
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					onKeyDown={(event) => event.code === 'Enter' && addComment(message)}
				/>
				<button onClick={() => addComment(message)}>
					<ArrowUpCircleIcon className="h-full px-1 py-1 text-gray-500" />
				</button>
			</div>
		</div>
	);
};
