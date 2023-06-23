import {
	SurfaceClient,
	EditSurfaceCommand,
	CreateSurfacesCommand,
	CreateSurfaceDto,
	DeleteSurfaceCommand,
} from '@/generated/web-api-client';
import type {
	CreateSurfaceResponseDto,
	Unit,
} from '@/generated/web-api-client';
import type { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import type { LocalSurfaceFile } from '@/pages/project/models/file/LocalSurfaceFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiSurface = (): {
	create: (
		projectId: number,
		surfaces: LocalSurfaceFile[]
	) => Promise<CreateSurfaceResponseDto[]>;
	edit: (
		nextCloudSurfaces: readonly CloudSurfaceFile[],
		previousCloudSurfaces: readonly CloudSurfaceFile[] | undefined
	) => Promise<void>;
	remove: (surface: CloudSurfaceFile) => Promise<Unit>;
} => {
	const client = useRef(new SurfaceClient(getApiUrl()));

	const create = async (
		projectId: number,
		surfaces: LocalSurfaceFile[]
	): Promise<CreateSurfaceResponseDto[]> => {
		return await client.current.create(
			new CreateSurfacesCommand({
				projectId,
				surfaces: await Promise.all(
					surfaces.map(
						async (addedSurfaceFile) =>
							new CreateSurfaceDto({
								base64: await addedSurfaceFile.getBase64(),
								fileName: addedSurfaceFile.name,
								visible: addedSurfaceFile.isChecked,
								order: addedSurfaceFile.order,
								color: undefined,
								opacity: addedSurfaceFile.opacity,
							})
					)
				),
			})
		);
	};

	const edit = async (
		nextCloudSurfaces: readonly CloudSurfaceFile[],
		previousCloudSurfaces: readonly CloudSurfaceFile[] | undefined
	): Promise<void> => {
		for (const cloudSurface of nextCloudSurfaces) {
			if (
				previousCloudSurfaces?.find(
					(lastSurfaceFile) => lastSurfaceFile === cloudSurface
				) !== undefined
			)
				continue;

			await client.current.edit(
				new EditSurfaceCommand({
					id: cloudSurface.id,
					order: cloudSurface.order,
					opacity: cloudSurface.opacity,
					visible: cloudSurface.isChecked,
				})
			);
		}
	};

	const remove = async (surface: CloudSurfaceFile): Promise<Unit> => {
		return await client.current.delete(
			new DeleteSurfaceCommand({ id: surface.id })
		);
	};

	return { create, edit, remove };
};
