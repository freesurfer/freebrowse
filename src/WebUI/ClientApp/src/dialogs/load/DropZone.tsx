import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

export const DropZone = ({
	className,
}: {
	className?: string;
}): React.ReactElement => {
	return (
		<div
			className={`flex flex-row items-center p-6 border border-dashed border-gray-400 text-sm font-bold text-gray-500 justify-center cursor-default ${
				className ?? ''
			}`}
		>
			<CloudArrowUpIcon className="w-8"></CloudArrowUpIcon>
			<span className="ml-2">
				Drop files to attach, or{' '}
				<label className="underline cursor-pointer text-gray-400">
					<input className="hidden" type="file"></input>
					browse
				</label>
			</span>
		</div>
	);
};
