import { AddFileButton } from '@/components/AddFileButton';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import type { ReactElement } from 'react';

/**
 * component for choosing a file to upload and choose from the already uploaded files
 */
export const FileSelection = ({
	title,
	className,
}: {
	title: string;
	className?: string;
}): ReactElement => {
	return (
		<div className={`flex flex-col gap-1 ${className ?? ''}`}>
			<div className="flex items-center gap-1">
				<span className="grow">{title}</span>
				<Select></Select>
				<AddFileButton
					acceptedExtensions={['.thickness', '.curv']}
					onFileSelected={(file) => alert(file.name)}
				></AddFileButton>
			</div>
			<div className="flex justify-between">
				<Button
					icon="settings"
					title="Configure"
					onClick={() => console.log('open overlay settings')}
				></Button>
				<Button
					icon="remove"
					title="Remove"
					onClick={() => alert('remove')}
				></Button>
			</div>
		</div>
	);
};
