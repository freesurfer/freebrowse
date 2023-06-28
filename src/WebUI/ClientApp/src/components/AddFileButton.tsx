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
		<label className="flex h-6 w-6 grow-0 cursor-pointer items-center justify-center rounded-md bg-primary p-2 text-white">
			<ArrowUpTrayIcon className="h-4 w-4 shrink-0"></ArrowUpTrayIcon>
			<input
				type="file"
				className="hidden"
				name="img" // to make it only choose one file
				accept={acceptedExtensions.join(',')}
				onChange={(event) => {
					const selectedFile = event?.target.files?.[0];
					if (selectedFile === undefined) return;
					onFileSelected(selectedFile);
					// revert value state, to enable the user to select the same file again
					// important after the user removed the overlay and wants to add it again
					event.target.value = '';
				}}
			/>
		</label>
	);
};
