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
		nextCloudVolumes: readonly CloudVolumeFile[],
		previousCloudVolumes: readonly CloudVolumeFile[] | undefined
	): Promise<void> => {
		for (const cloudVolume of nextCloudVolumes) {
			if (
				previousCloudVolumes?.find(
					(lastVolumeFile) => lastVolumeFile === cloudVolume
				) !== undefined
			)
				continue;

			await client.current.edit(
				new EditVolumeCommand({
					id: cloudVolume.id,
					order: cloudVolume.order,
					contrastMin: cloudVolume.contrastMin,
					contrastMax: cloudVolume.contrastMax,
					opacity: cloudVolume.opacity,
					visible: cloudVolume.isChecked,
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
