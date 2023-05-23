import type { FileLoadMetadata } from '@/dialogs/load/LoadDialog';
import { ProgressBar } from '@/dialogs/load/ProgressBar';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';

const options = [
	{ value: 'grayscale', label: 'Grayscale' },
	{ value: 'lookupTable', label: 'Lookup Table' },
];

export const LoadFileList = ({
	className,
	files,
	updateFiles,
}: {
	className?: string;
	files: FileLoadMetadata[];
	updateFiles: (files: FileLoadMetadata[]) => void;
}): React.ReactElement => {
	return (
		<div className={className}>
			{files.map((file) => (
				<div key={file.file.name} className="flex gap-3 pb-3 pt-3 border-b">
					<div>
						<div className="flex justify-between text-xs text-gray-500">
							<span>{file.file.name}</span>
							<span>{`${
								file !== undefined
									? Math.floor(file.file.size / 10000) / 100
									: ''
							} MB`}</span>
						</div>
						<ProgressBar
							className="mt-1 w-60"
							progress={file.progress}
						></ProgressBar>
					</div>
					<button
						onClick={() =>
							updateFiles(files.filter((filterFile) => filterFile !== file))
						}
					>
						<XMarkIcon className="w-6 text-gray-600"></XMarkIcon>
					</button>
					{file.selection !== undefined ? (
						<>
							<Select
								className="w-40 min-w-[10rem]"
								options={options}
								classNames={{
									indicatorSeparator: () => 'hidden',
									singleValue: () => 'text-xs',
									menu: () => 'text-xs',
								}}
								value={options.find(
									(option) => option.value === file.selection
								)}
							/>
							<div className="flex items-center text-xs text-gray-500 gap-1">
								<label className="cursor-pointer text-gray-500">
									<input type="checkbox" className="hidden"></input>
									<CheckIcon className="w-5 p-0.5 text-white bg-gray-500 rounded-[3px]"></CheckIcon>
								</label>
								<span className="whitespace-nowrap">Resample to RAS</span>
							</div>
						</>
					) : (
						<></>
					)}
				</div>
			))}
		</div>
	);
};
