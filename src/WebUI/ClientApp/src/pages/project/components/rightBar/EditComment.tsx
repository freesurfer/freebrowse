import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { useState, type ReactElement, useRef, useEffect } from 'react';

export const EditComment = ({
	onUpdate,
	defaultValue,
}: {
	onUpdate: (message: string) => void;
	defaultValue: string;
}): ReactElement => {
	const [message, setMessage] = useState<string>(defaultValue);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.select();
	}, []);

	return (
		<div className="flex flex-row gap-1">
			<div className="flex grow justify-center overflow-hidden rounded border-[1.5px]">
				<input
					ref={inputRef}
					type="text"
					placeholder="Edit the comment"
					className="grow pl-1 text-xs"
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					onKeyDown={(event) => event.code === 'Enter' && onUpdate(message)}
				/>
				<button onClick={() => onUpdate(message)}>
					<ArrowUpCircleIcon className="h-5 w-5 shrink-0 px-1 py-1 text-gray-500" />
				</button>
			</div>
		</div>
	);
};
