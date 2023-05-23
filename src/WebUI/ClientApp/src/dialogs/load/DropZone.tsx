import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export const DropZone = ({
	className,
	onFileOpen,
}: {
	className?: string;
	onFileOpen: (files: File[]) => void;
}): React.ReactElement => {
	const onDrop = useCallback(
		(acceptedFiles: File[]) => onFileOpen(acceptedFiles),
		[onFileOpen]
	);
	const { getRootProps, getInputProps } = useDropzone({ onDrop });

	return (
		<div
			{...getRootProps()}
			className={`flex flex-row items-center p-6 border border-dashed border-gray-400 text-sm font-bold text-gray-500 justify-center cursor-default ${
				className ?? ''
			}`}
		>
			<input {...getInputProps()}></input>
			<CloudArrowUpIcon className="w-8"></CloudArrowUpIcon>
			<span className="ml-2">
				Drop files to attach, or{' '}
				<span className="underline cursor-pointer text-gray-500">browse</span>
			</span>
		</div>
	);
};
