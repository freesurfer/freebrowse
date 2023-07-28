import type { CreateVolumeResponseDto, Unit } from '@/generated/web-api-client';
import {
	EditVolumeCommand,
	CreateVolumeDto,
	CreateVolumesCommand,
	VolumeClient,
	DeleteVolumeCommand,
} from '@/generated/web-api-client';
import type { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import type { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiVolume = (): {
	create: (
		projectId: number,
		volumes: LocalVolumeFile[]
	) => Promise<CreateVolumeResponseDto[]>;
	edit: (
		nextCloudVolumes: readonly CloudVolumeFile[],
		previousCloudVolumes: readonly CloudVolumeFile[] | undefined
	) => Promise<void>;
	remove: (volume: CloudVolumeFile) => Promise<Unit>;
} => {
	const client = useRef(new VolumeClient(getApiUrl()));

	const create = async (
		projectId: number,
		volumes: LocalVolumeFile[]
	): Promise<CreateVolumeResponseDto[]> => {
		return await client.current.create(
			new CreateVolumesCommand({
				projectId,
				volumes: await Promise.all(
					volumes.map(
						async (addedVolumeFile) =>
							new CreateVolumeDto({
								base64: await addedVolumeFile.getBase64(),
								fileName: addedVolumeFile.name,
								visible: addedVolumeFile.isChecked,
								order: addedVolumeFile.order,
								colorMap: undefined,
								opacity: addedVolumeFile.opacity,
								contrastMin: addedVolumeFile.contrastMin,
								contrastMax: addedVolumeFile.contrastMax,
							})
					)
				),
			})
		);
	};

	const edit = async (
		currentCloudVolumes: readonly CloudVolumeFile[],
		previousCloudVolumes: readonly CloudVolumeFile[] | undefined
	): Promise<void> => {
		const hasChanged = (
			current: CloudVolumeFile,
			previous: CloudVolumeFile | undefined
		): boolean => {
			if (previous === undefined) return true;
			if (previous === current) return false;
			if (
				previous.id === current.id &&
				previous.order === current.order &&
				previous.contrastMin === current.contrastMin &&
				previous.contrastMax === current.contrastMax &&
				previous.colorMap === current.colorMap &&
				previous.opacity === current.opacity &&
				previous.isChecked === current.isChecked
			)
				return false;
			return true;
		};

		for (const currentCloudVolume of currentCloudVolumes) {
			const previousCloudVolume = previousCloudVolumes?.find(
				(previousCloudVolume) =>
					previousCloudVolume.id === currentCloudVolume.id
			);
			if (
				!hasChanged(currentCloudVolume, previousCloudVolume) &&
				!currentCloudVolume.hasChanges
			)
				continue;

			await client.current.edit(
				new EditVolumeCommand({
					id: currentCloudVolume.id,
					order: currentCloudVolume.order,
					contrastMin: currentCloudVolume.contrastMin,
					contrastMax: currentCloudVolume.contrastMax,
					colorMap: currentCloudVolume.colorMap.backend,
					opacity: currentCloudVolume.opacity,
					visible: currentCloudVolume.isChecked,
					base64: currentCloudVolume.hasChanges
						? currentCloudVolume.base64
						: undefined,
				})
			);
		}
	};

	const remove = async (volume: CloudVolumeFile): Promise<Unit> => {
		return await client.current.delete(
			new DeleteVolumeCommand({ id: volume.id })
		);
	};

	return { create, edit, remove };
};
