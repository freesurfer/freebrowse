import { NameIcon } from '@/pages/project/components/rightBar/NameIcon';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';

export const AddComment = ({
	userName,
}: {
	userName: string;
}): ReactElement => {
	return (
		<div className="mt-1 flex flex-row gap-1">
			<NameIcon userName={userName} size={'big'} />
			<div className="flex grow justify-center overflow-hidden rounded border-[1.5px]">
				<input
					type="text"
					placeholder="Add a comment"
					className="grow pl-1 text-xs"
				/>
				<button>
					<ArrowUpCircleIcon className="h-full px-1 py-1 text-gray-500" />
				</button>
			</div>
		</div>
	);
};
