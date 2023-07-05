import { DialogFrame } from '@/pages/project/dialogs/DialogFrame';
import { ColorPickerRow } from '@/pages/project/dialogs/components/ColorPickerRow';
import { TextInputRow } from '@/pages/project/dialogs/components/TextInputRow';
import { CircleStackIcon } from '@heroicons/react/24/outline';
import { createContext, useCallback, useState } from 'react';

const DEFAULT_COLOR = '#ffffff';
const DEFAULT_NAME = 'New Point Set';

interface INewPointSetDialogOpenResult {
	color: string;
	name: string;
}

export interface INewPointSetDialog {
	/**
	 * open the modal dialog
	 */
	readonly open: () => Promise<INewPointSetDialogOpenResult | 'canceled'>;
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
		done?: (color: string | undefined, name: string | undefined) => void;
		canceled?: () => void;
		color?: string;
		name?: string;
	}>({ isOpen: false });

	const openDialog = useCallback(async (): Promise<
		INewPointSetDialogOpenResult | 'canceled'
	> => {
		return await new Promise<INewPointSetDialogOpenResult | 'canceled'>(
			(resolve) => {
				setHandle({
					isOpen: true,
					done: (color: string | undefined, name: string | undefined) => {
						setHandle({ isOpen: false });
						resolve({
							color: color ?? DEFAULT_COLOR,
							name: name ?? DEFAULT_NAME,
						});
					},
					canceled: () => {
						setHandle({ isOpen: false });
						resolve('canceled');
					},
				});
			}
		);
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
				onDone={() => handle.done?.(handle.color, handle.name)}
				onCancel={() => handle.canceled?.()}
				title="New Point Set"
				doneButtonLabel="Create"
				icon={
					<CircleStackIcon className="h-8 w-8 shrink-0 text-gray-500"></CircleStackIcon>
				}
			>
				<div className="px-5">
					<TextInputRow
						label="Enter the name of the new point set:"
						onChange={(name) => setHandle((handle) => ({ ...handle, name }))}
						defaultValue={DEFAULT_NAME}
					/>
					<ColorPickerRow
						className="mt-4"
						label="Color:"
						onChange={(color) => setHandle((handle) => ({ ...handle, color }))}
					/>
				</div>
			</DialogFrame>
		</>
	);
};
