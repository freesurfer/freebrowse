import { BrainIcon } from '@/assets/BrainIcon';
import { EqualSplitViewIcon } from '@/assets/EqualSplitViewIcon';
import { NavigateIcon } from '@/assets/NavigateIcon';
import { SaveAllIcon } from '@/assets/SaveAllIcon';
import type { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { ToolButton } from '@/pages/project/components/topBar/ToolButton';
import { ToolButtonRadio } from '@/pages/project/components/topBar/ToolButtonRadio';
import { ToolButtonSelect } from '@/pages/project/components/topBar/ToolButtonSelect';
import { NewPointSetDialogContext } from '@/pages/project/dialogs/newPointSet/NewPointSetDialog';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { USER_MODE, ProjectState } from '@/pages/project/models/ProjectState';
import { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import {
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	CircleStackIcon,
	DocumentPlusIcon,
	PencilIcon,
	PencilSquareIcon,
	ShareIcon,
} from '@heroicons/react/24/outline';
import type { LocationData } from '@niivue/niivue';
import { type Dispatch, useCallback, useContext } from 'react';
import { Store } from 'react-notifications-component';
import { useNavigate } from 'react-router';

export const TopBar = ({
	projectState,
	location,
	niivueWrapper,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	location: LocationData | undefined;
	niivueWrapper: NiivueWrapper | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
}): React.ReactElement => {
	const { open } = useContext(NewPointSetDialogContext);
	const navigate = useNavigate();
	const { createProject } = useContext(OpenProjectDialogContext);

	const onGetStartedClick = useCallback(async (): Promise<void> => {
		const result = await createProject();
		if (result === 'canceled') return;
		navigate(`/project/${result.projectId}`);
	}, [createProject, navigate]);

	const createDeepLink = (
		projectState: ProjectState | undefined,
		location: LocationData | undefined,
		niivueWrapper: NiivueWrapper | undefined
	): string => {
		let deepLink = `${window.location.origin}${window.location.pathname}?`;

		if (location !== undefined && niivueWrapper !== undefined) {
			deepLink += `sliceX=${location.vox[0]}&sliceY=${location.vox[1]}&sliceZ=${location.vox[2]}&zoom2dX=${niivueWrapper.niivue.uiData.pan2Dxyzmm[0]}&zoom2dY=${niivueWrapper.niivue.uiData.pan2Dxyzmm[1]}&zoom2dZ=${niivueWrapper.niivue.uiData.pan2Dxyzmm[2]}&zoom2d=${niivueWrapper.niivue.uiData.pan2Dxyzmm[3]}&zoom3d=${niivueWrapper.niivue.scene.volScaleMultiplier}&rasX=${location.mm[0]}&rasY=${location.mm[1]}&rasZ=${location.mm[2]}&renderAzimuth=${niivueWrapper.niivue.scene.renderAzimuth}&renderElevation=${niivueWrapper.niivue.scene.renderElevation}`;
		}

		projectState?.files.volumes.forEach((volume) => {
			deepLink += `&volumes=${encodeURIComponent(
				volume.name.toString()
			)}&volumeOpacity=${volume.opacity.toString()}&volumeOrder=${
				volume.order ?? 0
			}&volumeVisible=${volume.isChecked.toString()}&volumeSelected=${volume.isActive.toString()}&volumeContrastMin=${
				volume.contrastMin
			}&volumeContrastMax=${volume.contrastMax.toString()}&volumeColormap=${
				volume.colorMap ?? 'Gray'
			}`;
		});

		projectState?.files.surfaces.forEach((surface) => {
			deepLink += `&surfaces=${encodeURIComponent(surface.name)}&surfaceOrder=${
				surface.order ?? 0
			}&surfaceVisible=${surface.isChecked.toString()}&surfaceSelected=${surface.isActive.toString()}`;
		});

		return deepLink;
	};

	const displayDeeplinkCopiedNotification = (): void => {
		Store.addNotification({
			message: 'link copied to clipboard',
			type: 'success',
			insert: 'top',
			container: 'top-right',
			animationIn: ['animate__animated', 'animate__fadeIn'],
			animationOut: ['animate__animated', 'animate__fadeOut'],
			dismiss: {
				duration: 1500,
				onScreen: true,
			},
		});
	};

	const openNewPointSetDialog = useCallback(() => {
		const execute = async (): Promise<void> => {
			const nextCount = projectState?.files.pointSets
				.filter((file) => file.name.startsWith(CachePointSetFile.DEFAULT_NAME))
				.map((file) =>
					Number(
						file.name.slice(CachePointSetFile.DEFAULT_NAME.length).split('.')[0]
					)
				)
				.sort()
				.reverse()[0];

			const result = await open(nextCount === undefined ? 1 : nextCount + 1);
			if (result === 'canceled') return;

			setProjectState((projectState) =>
				projectState?.fromFiles(
					projectState.files.fromNewPointSetFile(result.name, result.color)
				)
			);
		};

		void execute();
	}, [setProjectState, projectState, open]);

	return (
		<div className="flex items-baseline bg-font px-4">
			<ToolButtonSelect
				label="FreeBrowse"
				icon={(className) => <BrainIcon className={className} />}
				entries={[
					{
						label: 'Back to project space',
						icon: (className) => <ArrowUturnLeftIcon className={className} />,
						onClick: () => navigate('/'),
					},
					{
						label: 'Create new project',
						icon: (className) => <DocumentPlusIcon className={className} />,
						onClick: () => {
							void onGetStartedClick();
						},
					},
				]}
			></ToolButtonSelect>
			<ToolButtonRadio
				entries={[
					{
						label: 'Navigate',
						icon: (className) => <NavigateIcon className={className} />,
						value: USER_MODE.NAVIGATE,
						shortcut: 'M',
					},
					{
						label: 'Edit Voxel',
						icon: (className) => <PencilIcon className={className} />,
						value: USER_MODE.EDIT_VOXEL,
						shortcut: 'V',
					},
					{
						label: 'Edit Points',
						icon: (className) => <PencilSquareIcon className={className} />,
						value: USER_MODE.EDIT_POINTS,
						shortcut: 'P',
					},
				]}
				value={projectState?.userMode ?? USER_MODE.NAVIGATE}
				onChange={(value) =>
					setProjectState((projectState) => {
						if (projectState === undefined) return undefined;
						return new ProjectState({ projectState, userMode: value }, false);
					})
				}
			></ToolButtonRadio>
			<ToolButton
				label="Equal Split"
				icon={(className) => <EqualSplitViewIcon className={className} />}
				buttonProps={{
					onClick: () => alert('Not implemented yet - Equal Split'),
				}}
			></ToolButton>
			<ToolButton
				label="PointSet"
				icon={(className) => <CircleStackIcon className={className} />}
				buttonProps={{ onClick: openNewPointSetDialog }}
			></ToolButton>
			<ToolButton
				label="Save All"
				icon={(className) => <SaveAllIcon className={className} />}
				buttonProps={{ onClick: () => alert('Not implemented yet - Save All') }}
			></ToolButton>
			<ToolButton
				label="Undo"
				icon={(className) => <ArrowUturnLeftIcon className={className} />}
				buttonProps={{ onClick: () => alert('Not implemented yet - Undo') }}
			/>
			<ToolButton
				label="Redo"
				icon={(className) => <ArrowUturnRightIcon className={className} />}
				buttonProps={{ onClick: () => alert('Not implemented yet - Redo') }}
			/>
			<ToolButton
				label="Share"
				icon={(className) => <ShareIcon className={className} />}
				buttonProps={{
					onClick: () => {
						void navigator.clipboard
							.writeText(createDeepLink(projectState, location, niivueWrapper))
							.then(() => {
								displayDeeplinkCopiedNotification();
							});
					},
				}}
			/>
		</div>
	);
};
