import { DialogFrame } from '@/pages/project/dialogs/DialogFrame';
import { createContext, useCallback, useState } from 'react';

export interface INewPointSetDialog {
	/**
	 * open the modal dialog
	 */
	readonly open: () => Promise<'success' | 'canceled'>;
}

export const NewPointSetDialogContext = createContext<INewPointSetDialog>({
	open: async () => {
		throw new Error('not initialized yet');
	},
});

export const NewPointSetDialog = ({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement => {
	const [handle, setHandle] = useState<{
		isOpen: boolean;
		done?: () => void;
		canceled?: () => void;
	}>({ isOpen: false });

	const openDialog = useCallback(async (): Promise<'success' | 'canceled'> => {
		return await new Promise<'success' | 'canceled'>((resolve) => {
			setHandle({
				isOpen: true,
				done: () => {
					setHandle({ isOpen: false });
					resolve('success');
				},
				canceled: () => {
					setHandle({ isOpen: false });
					resolve('canceled');
				},
			});
		});
	}, []);

	return (
		<>
			<NewPointSetDialogContext.Provider
				value={{
					open: openDialog,
				}}
			>
				{children}
			</NewPointSetDialogContext.Provider>
			<DialogFrame
				isOpen={handle.isOpen}
				onDone={() => handle.done?.()}
				onCancel={() => handle.canceled?.()}
				title="Load volumes & surfaces"
				doneButtonLabel="Create"
			>
				<>Content</>
			</DialogFrame>
		</>
	);
};
