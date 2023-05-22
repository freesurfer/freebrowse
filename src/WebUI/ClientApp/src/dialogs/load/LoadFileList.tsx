import { ProgressBar } from '@/dialogs/load/ProgressBar';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';

const options = [
	{ value: 'grayscale', label: 'Grayscale' },
	{ value: 'lookupTable', label: 'Lookup Table' },
];

export const LoadFileList = ({
	className,
}: {
	className?: string;
}): React.ReactElement => {
	const files: {
		fileName: string;
		size: string;
		progress: number;
		selection?: 'grayscale' | 'lookupTable';
	}[] = [
		{
			fileName: 'brainmask.mgz',
			size: '17.4 MB',
			progress: 100,
			selection: 'grayscale',
		},
		{
			fileName: 'aseg.mgz',
			size: '69.2 MB',
			progress: 30,
			selection: 'lookupTable',
		},
		{
			fileName: 'lh.pial',
			size: '130.8 MB',
			progress: 30,
		},
	];

	return (
		<div className={className}>
			{files.map((file) => (
				<div key={file.fileName} className="flex gap-3 pb-3 pt-3 border-b">
					<div>
						<div className="flex justify-between text-xs text-gray-500">
							<span>{file.fileName}</span>
							<span>{file.size}</span>
						</div>
						<ProgressBar
							className="mt-1 w-60"
							progress={file.progress}
						></ProgressBar>
					</div>
					<button>
						<XMarkIcon className="w-6 text-gray-600"></XMarkIcon>
					</button>
					{file.selection !== undefined ? (
						<>
							<Select
								className="w-40"
								options={options}
								classNames={{
									indicatorSeparator: () => 'hidden',
									singleValue: () => 'text-xs',
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
