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
								color: addedSurfaceFile.color,
							})
					)
				),
			})
		);
	};

	const edit = async (
		currentCloudSurfaces: readonly CloudSurfaceFile[],
		previousCloudSurfaces: readonly CloudSurfaceFile[] | undefined
	): Promise<void> => {
		const hasChanged = (
			current: CloudSurfaceFile,
			previous: CloudSurfaceFile | undefined
		): boolean => {
			if (previous === undefined) return true;
			if (previous === current) return false;
			if (
				previous.id === current.id &&
				previous.order === current.order &&
				previous.color === current.color &&
				previous.isChecked === current.isChecked
			)
				return false;
			return true;
		};

		for (const currentCloudSurface of currentCloudSurfaces) {
			const previousCloudSurface = previousCloudSurfaces?.find(
				(previousCloudSurface) =>
					previousCloudSurface.id === currentCloudSurface.id
			);

			if (!hasChanged(currentCloudSurface, previousCloudSurface)) continue;

			await client.current.edit(
				new EditSurfaceCommand({
					id: currentCloudSurface.id,
					order: currentCloudSurface.order,
					color: currentCloudSurface.color,
					visible: currentCloudSurface.isChecked,
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
