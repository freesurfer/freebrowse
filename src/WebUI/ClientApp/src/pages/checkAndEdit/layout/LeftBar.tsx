import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export const LeftBar = (): React.ReactElement => {
	return (
		<div className="bg-gray-100 w-[16rem] p-4 border border-gray-500 flex items-start justify-center">
			<button className="bg-gray-500 text-white font-bold px-4 py-2 rounded-md flex gap-2">
				<ArrowUpTrayIcon className="h-6 w-6 shrink-0"></ArrowUpTrayIcon>
				<span>Load files</span>
			</button>
		</div>
	);
};
