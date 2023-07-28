import { BrainIcon } from '@/assets/BrainIcon';
import { EqualSplitViewIcon } from '@/assets/EqualSplitViewIcon';
import { NavigateIcon } from '@/assets/NavigateIcon';
import { SaveAllIcon } from '@/assets/SaveAllIcon';
import { useApiProject } from '@/hooks/useApiProject';
import { useApiVolume } from '@/hooks/useApiVolume';
import type { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { ToolButton } from '@/pages/project/components/topBar/ToolButton';
import { ToolButtonRadio } from '@/pages/project/components/topBar/ToolButtonRadio';
import { ToolButtonSelect } from '@/pages/project/components/topBar/ToolButtonSelect';
import { DownloadFilesDialogContext } from '@/pages/project/dialogs/downloadFiles/DownloadFilesDialog';
import { OpenProjectDialogContext } from '@/pages/project/dialogs/openProject/OpenProjectDialog';
import { USER_MODE, ProjectState } from '@/pages/project/models/ProjectState';
import type { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { convertVolumeToBase64 } from '@/pages/project/models/file/ProjectFileHelper';
import {
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	DocumentPlusIcon,
	PencilIcon,
	PencilSquareIcon,
	ArrowDownTrayIcon,
	BookmarkSquareIcon,
	ShareIcon,
} from '@heroicons/react/24/outline';
import type { LocationData, NVImage } from '@niivue/niivue';
import { saveAs } from 'file-saver';
import {
	type Dispatch,
	type ReactElement,
	useCallback,
	useContext,
	useEffect,
} from 'react';
import { Store } from 'react-notifications-component';
import { useNavigate } from 'react-router';

export const TopBar = ({
	projectState,
	setProjectState,
	location,
	niivueWrapper,
	wayPointUndo,
	wayPointRedo,
}: {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>;
	location: LocationData | undefined;
	niivueWrapper: NiivueWrapper | undefined;
	wayPointUndo: () => void;
	wayPointRedo: () => void;
}): ReactElement => {
	const apiProject = useApiProject();
	const navigate = useNavigate();
	const { createProject } = useContext(OpenProjectDialogContext);
	const apiVolume = useApiVolume();
	const { download } = useContext(DownloadFilesDialogContext);

	const onDownloadClick = async (): Promise<void> => {
		if (projectState === undefined) return;
		if (niivueWrapper === undefined) return;

		const changedVolumes = getChangedVolumes(projectState, niivueWrapper);

		let result;
		if (changedVolumes.length > 0) {
			result = await download(projectState.id, changedVolumes);

			if (result === 'canceled') return;

			setProjectState((projectState) =>
				projectState?.fromFiles(
					projectState.files.fromAdaptedVolumes(
						projectState.files.volumes.cloud.map((volume) =>
							volume.from({ hasChanges: false })
						)
					)
				)
			);
		} else {
			result = await apiProject.download(projectState.id);
		}

		saveAs(
			result.data,
			`${projectState.name ?? 'FreeBrowse - Project Files'}.zip`
		);
	};

	const onSaveClick = useCallback(async (): Promise<void> => {
		if (projectState === undefined) return;
		if (niivueWrapper === undefined) return;

		const changedVolumes = getChangedVolumes(projectState, niivueWrapper);

		if (changedVolumes.length > 0) {
			const volumesWithBase64 = await Promise.all(
				changedVolumes.map(async (v) =>
					v.niivueVolume === undefined
						? v.cloudVolume
						: v.cloudVolume.from({
								base64: await convertVolumeToBase64(v.niivueVolume),
						  })
				)
			);

			try {
				await apiVolume.edit(
					volumesWithBase64,
					changedVolumes.map((v) => v.cloudVolume)
				);

				setProjectState((projectState) =>
					projectState?.fromFiles(
						projectState.files.fromAdaptedVolumes(
							projectState.files.volumes.cloud.map((volume) =>
								volume.from({ hasChanges: false })
							)
						)
					)
				);

				Store.addNotification({
					message: 'volume edits saved',
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
			} catch (error) {
				console.error('something went wrong', error);
			}
		}
	}, [projectState, setProjectState, niivueWrapper, apiVolume]);

	const getChangedVolumes = (
		projectState: ProjectState,
		niivueWrapper: NiivueWrapper
	): {
		cloudVolume: CloudVolumeFile;
		niivueVolume: NVImage | undefined;
	}[] => {
		return projectState.files.volumes.cloud
			.map((v) => {
				return {
					cloudVolume: v,
					niivueVolume: niivueWrapper.getCachedVolume(v.name),
				};
			})
			.filter((v) => v.cloudVolume.hasChanges && v.niivueVolume !== undefined);
	};

	const onGetStartedClick = useCallback(async (): Promise<void> => {
		const result = await createProject();
		if (result === 'canceled') return;
		navigate(`/project/${result.projectId}`);
	}, [createProject, navigate]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent): void => {
			if (e.ctrlKey && e.key === 's') {
				e.preventDefault();
				void onSaveClick();
			}
		};

		const handleBrowserClose = (e: BeforeUnloadEvent): void => {
			if (projectState === undefined) return;
			if (niivueWrapper === undefined) return;

			const changedVolumes = getChangedVolumes(projectState, niivueWrapper);
			if (changedVolumes.length > 0) {
				e.preventDefault();
				e.returnValue = '';
			}
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
	}, [projectState, niivueWrapper, onSaveClick]);

	const createDeepLink = (
		projectState: ProjectState | undefined,
		location: LocationData | undefined,
		niivueWrapper: NiivueWrapper | undefined
	): string => {
		let deepLink = `${window.location.origin}${window.location.pathname}?`;

		if (location !== undefined && niivueWrapper !== undefined) {
			deepLink += `sliceX=${location.vox[0]}&sliceY=${location.vox[1]}&sliceZ=${location.vox[2]}&zoom2dX=${niivueWrapper.niivue.uiData.pan2Dxyzmm[0]}&zoom2dY=${niivueWrapper.niivue.uiData.pan2Dxyzmm[1]}&zoom2dZ=${niivueWrapper.niivue.uiData.pan2Dxyzmm[2]}&zoom2d=${niivueWrapper.niivue.uiData.pan2Dxyzmm[3]}&zoom3d=${niivueWrapper.niivue.scene.volScaleMultiplier}&rasX=${location.mm[0]}&rasY=${location.mm[1]}&rasZ=${location.mm[2]}&renderAzimuth=${niivueWrapper.niivue.scene.renderAzimuth}&renderElevation=${niivueWrapper.niivue.scene.renderElevation}`;
		}

		[
			...(projectState?.files.volumes.cloud ?? []),
			...(projectState?.files.volumes.local ?? []),
		].forEach((volume) => {
			deepLink += `&volumes=${encodeURIComponent(
				volume.name.toString()
			)}&volumeOpacity=${volume.opacity.toString()}&volumeOrder=${
				volume.order ?? 0
			}&volumeVisible=${volume.isChecked.toString()}&volumeSelected=${volume.isActive.toString()}&volumeContrastMin=${
				volume.contrastMin
			}&volumeContrastMax=${volume.contrastMax.toString()}&volumeColormap=${
				volume.colorMap.backend
			}`;
		});

		[
			...(projectState?.files.surfaces.cloud ?? []),
			...(projectState?.files.surfaces.local ?? []),
		].forEach((surface) => {
			deepLink += `&surfaces=${encodeURIComponent(surface.name)}&surfaceOrder=${
				surface.order ?? 0
			}&surfaceVisible=${surface.isChecked.toString()}&surfaceSelected=${surface.isActive.toString()}`;
		});

		[
			...(projectState?.files.pointSets.cache ?? []),
			...(projectState?.files.pointSets.cloud ?? []),
			...(projectState?.files.pointSets.local ?? []),
		].forEach((pointSet) => {
			deepLink += `&pointSets=${encodeURIComponent(
				pointSet.name
			)}&pointSetOrder=${
				pointSet.order ?? 0
			}&pointSetVisible=${pointSet.isChecked.toString()}&pointSetSelected=${pointSet.isActive.toString()}`;
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

	const onClickUndo = useCallback(() => {
		if (projectState?.userMode === USER_MODE.EDIT_POINTS) {
			wayPointUndo();
			return;
		}

		if (projectState?.userMode === USER_MODE.EDIT_VOXEL) {
			niivueWrapper?.niivue.undoLastVoxelEdit();
		}

		console.warn('no action defined for undo on other user modes');
	}, [projectState, niivueWrapper, wayPointUndo]);

	const onClickRedo = useCallback(() => {
		if (projectState?.userMode === USER_MODE.EDIT_POINTS) {
			wayPointRedo();
			return;
		}

		if (projectState?.userMode === USER_MODE.EDIT_VOXEL) {
			niivueWrapper?.niivue.redoLastVoxelEditUndo();
		}

		console.warn('no action defined for undo on other user modes');
	}, [projectState, niivueWrapper, wayPointRedo]);

	const onShareClick = useCallback(async () => {
		await navigator.clipboard.writeText(
			createDeepLink(projectState, location, niivueWrapper)
		);
		displayDeeplinkCopiedNotification();
	}, [projectState, location, niivueWrapper]);

	return (
		<div className="flex items-baseline bg-font px-4 [&>*:nth-child(7)]:ml-auto">
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
				label="Save All"
				icon={(className) => <SaveAllIcon className={className} />}
				buttonProps={{ onClick: () => alert('Not implemented yet - Save All') }}
			></ToolButton>
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
		</div>
	);
};
