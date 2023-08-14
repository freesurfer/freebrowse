import { Checkbox } from '@/components/Checkbox';
import { ColorPicker } from '@/components/ColorPicker';
import { Slider } from '@/components/Slider';
import { useProjectSettingsDialogState } from '@/pages/project/dialogs/projectSettings/hooks/useProjectSettingsDialogState';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import {
	rgbToHex,
	hexToRgb,
} from '@/pages/project/models/file/type/PointSetFile';
import { XMarkIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';
import { createContext, useState, useEffect } from 'react';
import Modal from 'react-modal';

export interface IProjectSettingsDialog {
	/**
	 * open the modal dialog
	 */
	readonly openSettings: (projectState: ProjectState) => Promise<'closed'>;
}

export const ProjectSettingsDialogContext =
	createContext<IProjectSettingsDialog>({
		openSettings: async (projectState: ProjectState) => {
			throw new Error('not initialized yet');
		},
	});

const customStyles = {
	overlay: {
		zIndex: 1,
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
		padding: '10px',
		width: '30%',
		maxHeight: '100vh',
		maxWidth: '100vw',
	},
};

export const ProjectSettingsDialog = ({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement => {
	const { context, isOpen, close, projectState } =
		useProjectSettingsDialogState();
	const [crosshairWidth, setCrosshairWidth] = useState(
		(projectState?.crosshairWidth ?? 0) * 10
	);
	const [showCrosshair, setShowCrosshair] = useState(
		projectState?.showCrosshair ?? true
	);
	const [crosshairColor, setCrosshairColor] = useState(
		projectState?.crosshairColor !== undefined &&
			projectState?.crosshairColor.length === 3
			? rgbToHex([
					projectState?.crosshairColor[0] ?? 255,
					projectState?.crosshairColor[1] ?? 0,
					projectState?.crosshairColor[2] ?? 0,
			  ])
			: '#ff0000'
	);

	useEffect(() => {
		setCrosshairWidth((projectState?.crosshairWidth ?? 0) * 10);
		setShowCrosshair(projectState?.showCrosshair ?? true);
		setCrosshairColor(
			projectState?.crosshairColor !== undefined &&
				projectState?.crosshairColor.length === 3
				? rgbToHex([
						projectState?.crosshairColor[0] ?? 255,
						projectState?.crosshairColor[1] ?? 0,
						projectState?.crosshairColor[2] ?? 0,
				  ])
				: '#ff0000'
		);
	}, [projectState]);

	return (
		<>
			<ProjectSettingsDialogContext.Provider value={context}>
				{children}
			</ProjectSettingsDialogContext.Provider>
			<Modal isOpen={isOpen} style={customStyles} contentLabel="Settings">
				<div className="border-b border-gray py-2 text-xs">
					<div className="m-4 flex items-center gap-4">
						<Cog8ToothIcon className="h-8 w-8" />{' '}
						<h1 className="text-2xl font-semibold">Settings</h1>{' '}
					</div>
					<button
						onClick={close}
						className="absolute right-0 top-0 p-2 text-gray-600"
					>
						<XMarkIcon className="h-6 w-6 shrink-0"></XMarkIcon>
					</button>
					<div className="mt-2 pl-1">
						<h1 className="text-l font-semibold">Crosshair:</h1>
						<ColorPicker
							className="mt-2"
							grow={true}
							label="Color:"
							value={crosshairColor}
							onChange={(value) => {
								const newColor = [...hexToRgb(value)];
								if (projectState?.crosshairColor !== undefined) {
									projectState.setCrosshairColor(newColor);
								}
								setCrosshairColor(value);
							}}
						/>
						<Slider
							className="mt-2"
							label="Width:"
							value={crosshairWidth}
							unit=""
							min={1}
							max={20}
							onChange={(value) => {
								const newValue = value * 0.1;
								projectState?.setCrosshairWidth(newValue);
								setCrosshairWidth(value);
							}}
						></Slider>
						<div className="mt-2 flex">
							<span>Show Crosshair(H):</span>
							<Checkbox
								value={showCrosshair}
								onChange={(value) => {
									projectState?.setShowCrosshair(value);
									setShowCrosshair(value); // Update the local state
								}}
							></Checkbox>
						</div>
					</div>
				</div>
			</Modal>
		</>
	);
};
