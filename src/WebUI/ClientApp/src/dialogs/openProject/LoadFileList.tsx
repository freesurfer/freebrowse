import { Checkbox } from '@/components/Checkbox';
import type { FileLoadMetadata } from '@/dialogs/openProject/OpenProjectDialog';
import { ProgressBar } from '@/dialogs/openProject/ProgressBar';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
	files: Record<string, FileLoadMetadata>;
	updateFiles: (files: Record<string, FileLoadMetadata>) => void;
}): React.ReactElement => {
	return (
		<div className={className}>
			{Object.keys(files).map((fileName) => {
				const fileMeta = files[fileName];
				if (fileMeta === undefined) return <></>;
				return (
					<div key={fileName} className="flex gap-3 pb-3 pt-3 border-b">
						<div>
							<div className="flex justify-between text-xs text-gray-500">
								<span>{fileName}</span>
								<span>{`${
									Math.floor(fileMeta.file.size / 10000) / 100
								} MB`}</span>
							</div>
							<ProgressBar
								className="mt-1 w-60"
								progress={fileMeta.progress}
							></ProgressBar>
						</div>
						<button
							onClick={() =>
								updateFiles(
									Object.keys(files).reduce((result, innerFileName) => {
										if (innerFileName === fileName) return result;
										return {
											...result,
											[innerFileName]: files[innerFileName],
										};
									}, {})
								)
							}
						>
							<XMarkIcon className="w-6 text-gray-600"></XMarkIcon>
						</button>
						{fileMeta.selection !== undefined ? (
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
										(option) => option.value === fileMeta.selection
									)}
								/>
								<div className="flex items-center text-xs text-gray-500 gap-1">
									<Checkbox></Checkbox>
									<span className="whitespace-nowrap">Resample to RAS</span>
								</div>
							</>
						) : (
							<></>
						)}
					</div>
				);
			})}
		</div>
	);
};
