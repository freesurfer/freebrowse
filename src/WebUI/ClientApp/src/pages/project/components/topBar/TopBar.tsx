import { BrainIcon } from '@/assets/BrainIcon';
import { EqualSplitViewIcon } from '@/assets/EqualSplitViewIcon';
import { NavigateIcon } from '@/assets/NavigateIcon';
import { ToolButton } from '@/pages/project/components/topBar/ToolButton';
import { ToolButtonRadio } from '@/pages/project/components/topBar/ToolButtonRadio';
import { ToolButtonSelect } from '@/pages/project/components/topBar/ToolButtonSelect';
import { DownloadFilesDialogContext } from '@/pages/project/dialogs/downloadFiles/DownloadFilesDialog';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { ProjectSettingsDialogContext } from '@/pages/project/dialogs/projectSettings/ProjectSettingsDialog';
import {
	type ProjectState,
	USER_MODE,
	SLICE_TYPE,
} from '@/pages/project/models/ProjectState';
import { DeepLinkHandler } from '@/pages/project/models/handlers/DeepLinkHandler';
import { EventHandler } from '@/pages/project/models/handlers/EventHandler';
import {
	ArrowDownTrayIcon,
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	ArrowsPointingOutIcon,
	BookmarkSquareIcon,
	CubeIcon,
	DocumentPlusIcon,
	PencilIcon,
	PencilSquareIcon,
	ShareIcon,
	Cog8ToothIcon,
} from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import { type ReactElement, useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';

export const TopBar = observer(
	({
		projectState,
	}: {
		projectState: ProjectState | undefined;
	}): ReactElement => {
		const navigate = useNavigate();
		const { createProject } = useContext(OpenProjectDialogContext);
		const { download } = useContext(DownloadFilesDialogContext);
		const { openSettings } = useContext(ProjectSettingsDialogContext);

		const onDownloadClick = useCallback(async (): Promise<void> => {
			if (projectState?.id === undefined) return;
			const changedVolumes =
				projectState.downloadFilesHandler.getChangedVolumes();

			if (changedVolumes.length > 0) {
				const { data } = await projectState.apiGetDownload();
				projectState.downloadFilesHandler.saveDownloadedAsFile(data);
				return;
			}

			const result = await download(projectState, changedVolumes);
			if (result === 'canceled') return;
			projectState.files?.volumes.cloud.forEach((file) =>
				file.setHasChanges(false)
			);
			projectState.downloadFilesHandler.saveDownloadedAsFile(result.data);
		}, [projectState, download]);

		const onSaveClick = useCallback(async (): Promise<void> => {
			await projectState?.downloadFilesHandler.onSaveClick();
		}, [projectState]);

		const onGetStartedClick = useCallback(async (): Promise<void> => {
			const result = await createProject();
			if (result === 'canceled') return;
			if (result.id === undefined) return;
			navigate(`/project/${result.id}`);
		}, [createProject, navigate]);

		const onProjectSettingsClick = useCallback(async (): Promise<void> => {
			if (projectState !== undefined) {
				await openSettings(projectState);
			}
		}, [openSettings, projectState]); // Make sure to include projectState in the dependencies array

		useEffect(() => {
			const onKeyDown = (e: KeyboardEvent): void => {
				if (EventHandler.controlPressed(e) && e.key === 's') {
					e.preventDefault();
					void onSaveClick();
				}
			};

			const handleBrowserClose = (event: BeforeUnloadEvent): void => {
				if (projectState === undefined) return;

				const changedVolumes =
					projectState.downloadFilesHandler.getChangedVolumes();
				if (changedVolumes.length === 0) return;
				event.preventDefault();
				event.returnValue = '';
			};

			window.addEventListener('beforeunload', handleBrowserClose, {
				capture: true,
			});
			window.addEventListener('keydown', onKeyDown);

			return () => {
				window.removeEventListener('beforeunload', handleBrowserClose, {
					capture: true,
				});
				window.removeEventListener('keydown', onKeyDown);
			};
		}, [projectState, onSaveClick]);

		const onClickUndo = useCallback(() => {
			projectState?.historyHandler.undo();
		}, [projectState]);

		const onClickRedo = useCallback(() => {
			projectState?.historyHandler.redo();
		}, [projectState]);

		const onShareClick = useCallback(async () => {
			if (projectState === undefined) return;
			await navigator.clipboard.writeText(
				projectState?.deepLinkHandler.createDeepLink()
			);
			DeepLinkHandler.displayDeeplinkCopiedNotification();
		}, [projectState]);

		return (
			<div className="flex h-20 items-baseline bg-font px-4 [&>*:nth-child(6)]:ml-auto">
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
					onChange={(value) => projectState?.setUserMode(value)}
				></ToolButtonRadio>
				<ToolButtonRadio
					entries={[
						{
							label: 'Axial',
							icon: (className) => (
								<ArrowsPointingOutIcon className={className} />
							),
							value: SLICE_TYPE.AXIAL,
							shortcut: '1',
						},
						{
							label: 'Coronal',
							icon: (className) => (
								<ArrowsPointingOutIcon className={className} />
							),
							value: SLICE_TYPE.CORONAL,
							shortcut: '2',
						},
						{
							label: 'Sagittal',
							icon: (className) => (
								<ArrowsPointingOutIcon className={className} />
							),
							value: SLICE_TYPE.SAGITTAL,
							shortcut: '3',
						},
						{
							label: '3D Render',
							icon: (className) => <CubeIcon className={className} />,
							value: SLICE_TYPE.RENDER,
							shortcut: '4',
						},
						{
							label: 'Equal Split',
							icon: (className) => <EqualSplitViewIcon className={className} />,
							value: SLICE_TYPE.MULTIPLANAR,
							shortcut: '5',
						},
					]}
					value={projectState?.sliceType ?? SLICE_TYPE.MULTIPLANAR}
					onChange={(value) => projectState?.setSliceType(value)}
				></ToolButtonRadio>
				<ToolButton
					label="Undo"
					icon={(className) => <ArrowUturnLeftIcon className={className} />}
					buttonProps={{ onClick: onClickUndo }}
				/>
				<ToolButton
					label="Redo"
					icon={(className) => <ArrowUturnRightIcon className={className} />}
					buttonProps={{ onClick: onClickRedo }}
				/>
				<ToolButton
					label="Save"
					buttonProps={{
						onClick: () => {
							void onSaveClick();
						},
					}}
					icon={(className) => <BookmarkSquareIcon className={className} />}
				/>
				<ToolButton
					label="Download"
					buttonProps={{
						onClick: () => {
							void onDownloadClick();
						},
					}}
					icon={(className) => <ArrowDownTrayIcon className={className} />}
				/>
				<ToolButton
					label="Share"
					icon={(className) => <ShareIcon className={className} />}
					buttonProps={{
						onClick: () => {
							void onShareClick();
						},
					}}
				/>
				<ToolButton
					label="Settings"
					icon={(className) => <Cog8ToothIcon className={className} />}
					buttonProps={{
						onClick: () => {
							void onProjectSettingsClick();
						},
					}}
				/>
			</div>
		);
	}
);
