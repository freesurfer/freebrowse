import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { ReactElement } from 'react';

export const AddFileButton = ({
	acceptedExtensions,
	onFileSelected,
}: {
	acceptedExtensions: string[];
	onFileSelected: (file: File) => void;
}): ReactElement => {
	return (
		<label className="flex h-6 w-6 grow-0 cursor-pointer items-center justify-center rounded-md bg-blue-light p-2 text-white">
			<ArrowUpTrayIcon className="h-4 w-4 shrink-0"></ArrowUpTrayIcon>
			<input
				type="file"
				className="hidden"
				name="img" // to make it only choose one file
				// accept={acceptedExtensions.join(',')} // TODO bere enable
				onChange={(event) => {
					if (event.target.files?.[0] === undefined) return;
					onFileSelected(event.target.files[0]);
				}}
			/>
		</label>
	);
};
