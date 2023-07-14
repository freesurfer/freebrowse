import type {
	CreatePointSetResponseDto,
	EditPointResponseDto,
	Unit,
} from '@/generated/web-api-client';
import {
	PointSetClient,
	DeletePointSetCommand,
	CreatePointSetCommand,
	EditPointSetCommand,
} from '@/generated/web-api-client';
import type { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import type { IPointSetData } from '@/pages/project/models/file/type/PointSetFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiPointSet = (): {
	get: (dto: CreatePointSetResponseDto) => Promise<CloudPointSetFile>;
	create: (
		projectId: number,
		pointSets: readonly CachePointSetFile[]
	) => Promise<CreatePointSetResponseDto[]>;
	edit: (file: CloudPointSetFile) => Promise<EditPointResponseDto>;
	remove: (pointSet: CloudPointSetFile) => Promise<Unit>;
} => {
	const client = useRef(new PointSetClient(getApiUrl()));

	const get = async (
		dto: CreatePointSetResponseDto
	): Promise<CloudPointSetFile> => {
		if (dto.id === undefined)
			throw new Error('each point set file needs to have an id');
		if (dto.fileName === undefined)
			throw new Error('each point set file needs to have a name');
		if (dto.fileSize === undefined)
			throw new Error('each point set file needs to have a size');

		const pointSetResponse = await client.current.get(dto.id);
		try {
			const data: IPointSetData = JSON.parse(
				await pointSetResponse.data.text()
			);
			return new CloudPointSetFile(dto.id, dto.fileName, dto.fileSize, data);
		} catch (error) {
			console.warn(
				'something went wrong parsing the point set data json',
				error
			);
			return new CloudPointSetFile(dto.id, dto.fileName, dto.fileSize);
		}
	};

	const create = async (
		projectId: number,
		pointSets: readonly CachePointSetFile[]
	): Promise<CreatePointSetResponseDto[]> =>
		await Promise.all(
			pointSets.map(
				async (addedPointSetFile) =>
					await client.current.create(
						new CreatePointSetCommand({
							projectId,
							fileName: addedPointSetFile.name,
							base64: addedPointSetFile.getBase64(),
						})
					)
			)
		);

	const edit = async (file: CloudPointSetFile): Promise<EditPointResponseDto> =>
		await client.current.edit(
			new EditPointSetCommand({
				id: file.id,
				base64: file.getBase64(),
			})
		);

	const remove = async (pointSet: CloudPointSetFile): Promise<Unit> =>
		await client.current.delete(new DeletePointSetCommand({ id: pointSet.id }));

	return { get, create, edit, remove };
};
