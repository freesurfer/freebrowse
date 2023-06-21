import { Button } from '@/components/Button';
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
				<select className="h-6 max-w-[8.5em] grow-[999] rounded-[0.25rem] border">
					<option value="1">Test 1</option>
					<option value="2">Test 2</option>
				</select>
				<Button icon="plus"></Button>
			</div>
			<div className="flex justify-between">
				<Button icon="settings" title="Configure"></Button>
				<Button icon="remove" title="Remove"></Button>
			</div>
		</div>
	);
};
