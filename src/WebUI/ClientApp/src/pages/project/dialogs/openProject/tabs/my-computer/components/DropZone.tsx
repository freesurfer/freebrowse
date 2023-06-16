import { FileType, ProjectFileBase } from '@/pages/project/models/ProjectFile';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileError } from 'react-dropzone';

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

	const validator = (file: File): null | FileError => {
		if (file.name === undefined)
			return {
				code: 'not-file-name',
				message: 'There is no name given with the file to validate with',
			};

		if (ProjectFileBase.typeFromFileExtension(file.name) !== FileType.UNKNOWN)
			return null;

		return {
			code: 'type-not-supported',
			message: 'The file type is not supported',
		};
	};

	const { getRootProps, getInputProps } = useDropzone({ onDrop, validator });

	return (
		<div
			{...getRootProps()}
			className={`border-gray-400 text-gray-500 flex cursor-default flex-row items-center justify-center border border-dashed p-6 text-sm font-bold ${
				className ?? ''
			}`}
		>
			<input {...getInputProps()}></input>
			<CloudArrowUpIcon className="w-8"></CloudArrowUpIcon>
			<span className="ml-2">
				Drop files to attach, or{' '}
				<span className="text-gray-500 cursor-pointer underline">browse</span>
			</span>
		</div>
	);
};
