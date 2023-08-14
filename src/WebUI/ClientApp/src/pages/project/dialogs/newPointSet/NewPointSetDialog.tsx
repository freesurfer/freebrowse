import { ColorPicker } from '@/components/ColorPicker';
import { isValidColor } from '@/pages/project/dialogs/ColorHelper';
import { DialogFrame } from '@/pages/project/dialogs/DialogFrame';
import { TextInputRow } from '@/pages/project/dialogs/components/TextInputRow';
import { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import { CircleStackIcon } from '@heroicons/react/24/outline';
import { createContext, useCallback, useState } from 'react';
import type { ReactElement } from 'react';

const DEFAULT_COLOR = '#ffffff';

interface INewPointSetDialogOpenResult {
	color: string;
	name: string;
}

export interface INewPointSetDialog {
	/**
	 * open the modal dialog
	 * @param nextCount the number the new file name should get, if the user is not adapting the file name
	 */
	readonly open: (
		nextCount: number
	) => Promise<INewPointSetDialogOpenResult | 'canceled'>;
}

export const NewPointSetDialogContext = createContext<INewPointSetDialog>({
	open: async (nextCount: number) => {
		throw new Error('not initialized yet');
	},
});

export const NewPointSetDialog = ({
	children,
}: {
	children: ReactElement;
}): ReactElement => {
	const [name, setName] = useState<string>(CachePointSetFile.DEFAULT_NAME);
	const [color, setColor] = useState<string>(DEFAULT_COLOR);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const [handle, setHandle] = useState<{
		done?: (color: string | undefined, name: string) => void;
		canceled?: () => void;
	}>({});

	const openDialog = useCallback(
		async (
			nextCount: number
		): Promise<INewPointSetDialogOpenResult | 'canceled'> => {
			return await new Promise<INewPointSetDialogOpenResult | 'canceled'>(
				(resolve) => {
					setIsOpen(true);
					setHandle({
						done: (color: string | undefined, name: string) => {
							setIsOpen(false);
							setColor(DEFAULT_COLOR);
							setName(CachePointSetFile.DEFAULT_NAME);
							resolve({
								color:
									color !== undefined && isValidColor(color)
										? color
										: DEFAULT_COLOR,
								name:
									name !== CachePointSetFile.DEFAULT_NAME
										? `${name}.json`
										: `${CachePointSetFile.DEFAULT_NAME} ${nextCount}.json`,
							});
						},
						canceled: () => {
							setIsOpen(false);
							setColor(DEFAULT_COLOR);
							setName(CachePointSetFile.DEFAULT_NAME);
							resolve('canceled');
						},
					});
				}
			);
		},
		[setIsOpen, setHandle]
	);

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
				isOpen={isOpen}
				onDone={() => handle.done?.(color, name)}
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
						onChange={(name) => setName(name)}
						value={name}
					/>
					<ColorPicker
						className="mt-4 text-gray-500"
						label="Color:"
						value={color}
						onChange={(color) => setColor(color)}
					/>
				</div>
			</DialogFrame>
		</>
	);
};
