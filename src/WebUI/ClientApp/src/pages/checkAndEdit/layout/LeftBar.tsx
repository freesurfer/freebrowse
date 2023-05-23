import {
	LOAD_DIALOG_ERROR,
	LoadDialogContext,
} from '@/dialogs/load/LoadDialog';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { Niivue } from '@niivue/niivue';
import { useContext } from 'react';

export const LeftBar = ({ niivue }: { niivue: Niivue }): React.ReactElement => {
	const { editProject } = useContext(LoadDialogContext);

	const loadFiles = async (): Promise<void> => {
		try {
			await editProject();
		} catch (error) {
			if (error === LOAD_DIALOG_ERROR.DIALOG_OPENED_ALREADY) return;
			console.error('something went wrong opening files', error);
		}
	};

	return (
		<div className="bg-gray-100 w-[16rem] p-4 border border-gray-500 flex items-start justify-center">
			<button
				onClick={() => {
					void loadFiles();
				}}
				className="bg-gray-500 text-white font-bold px-4 py-2 rounded-md flex gap-2"
			>
				<ArrowUpTrayIcon className="h-6 w-6 shrink-0"></ArrowUpTrayIcon>
				<span>Load files</span>
			</button>
		</div>
	);
};
