import { Checkbox } from '@/components/Checkbox';
import type { SurfaceDto, VolumeDto } from '@/generated/web-api-client';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';

export const OrderList = ({
	entries,
	activeFileName,
	setActiveFileName,
}: {
	entries: VolumeDto[] | SurfaceDto[] | undefined;
	activeFileName: string | undefined;
	setActiveFileName: (fileName: string | undefined) => void;
}): React.ReactElement => {
	return (
		<div className="flex flex-col mb-2">
			{entries?.map((entry) => {
				const isActive =
					activeFileName !== undefined && activeFileName === entry.fileName;
				return (
					<button
						key={entry.fileName}
						className={`flex text-start items-center rounded ${
							isActive ? 'bg-gray-500' : ''
						}`}
						onClick={() => setActiveFileName(entry.fileName)}
					>
						<Checkbox defaultState={true}></Checkbox>
						<span
							className={`grow cursor-default text-ellipsis overflow-hidden ${
								isActive ? 'text-white' : ''
							}`}
						>
							{entry.fileName}
						</span>
						<ArrowsUpDownIcon
							className={`w-5 shrink-0 text-gray-500 m-1 ${
								isActive ? 'text-white' : ''
							}`}
						></ArrowsUpDownIcon>
					</button>
				);
			})}
		</div>
	);
};
