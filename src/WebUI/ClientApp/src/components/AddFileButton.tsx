import { PlusIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';

const ICON_SIZE = 1;

export const AddFileButton = ({
	acceptedExtensions,
	onFileSelected,
}: {
	acceptedExtensions: string[];
	onFileSelected: (file: File) => void;
}): ReactElement => {
	const iconStyle = { width: `${ICON_SIZE}rem`, height: `${ICON_SIZE}rem` };

	return (
		<label className="flex cursor-pointer rounded-[0.25rem] border border-blue-light p-0.5 text-blue-light">
			<PlusIcon style={iconStyle}></PlusIcon>
			<input
				type="file"
				className="hidden"
				name="img" // to make it only choose one file
				accept={acceptedExtensions.join(',')}
				onChange={(event) => {
					if (event.target.files?.[0] === undefined) return;
					onFileSelected(event.target.files[0]);
				}}
			/>
		</label>
	);
};
