import type {
	CreatePointSetResponseDto,
	EditPointResponseDto,
	GetProjectPointSetDto,
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
import type { LocalPointSetFile } from '@/pages/project/models/file/LocalPointSetFile';
import type { IPointSetData } from '@/pages/project/models/file/type/PointSetFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiPointSet = (): {
	get: (
		dto: CreatePointSetResponseDto | GetProjectPointSetDto,
		cacheFile?: LocalPointSetFile | CachePointSetFile
	) => Promise<CloudPointSetFile>;
	create: (
		projectId: number,
		pointSets: readonly (LocalPointSetFile | CachePointSetFile)[]
	) => Promise<CreatePointSetResponseDto[]>;
	edit: (file: CloudPointSetFile) => Promise<EditPointResponseDto>;
	remove: (pointSet: CloudPointSetFile) => Promise<Unit>;
} => {
	const client = useRef(new PointSetClient(getApiUrl()));

	const get = async (
		dto: CreatePointSetResponseDto | GetProjectPointSetDto,
		cacheFile?: LocalPointSetFile | CachePointSetFile
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
			return new CloudPointSetFile(
				dto.id,
				dto.fileName,
				dto.fileSize,
				data,
				cacheFile?.isActive ?? false,
				dto.visible ?? true,
				dto.order
			);
		} catch (error) {
			console.error(
				'something went wrong parsing the point set data json',
				error
			);
			throw error;
		}
	};

	const create = async (
		projectId: number,
		pointSets: readonly (LocalPointSetFile | CachePointSetFile)[]
	): Promise<CreatePointSetResponseDto[]> =>
		await Promise.all(
			pointSets.map(
				async (file) =>
					await client.current.create(
						new CreatePointSetCommand({
							projectId,
							fileName: file.name,
							base64: await file.getBase64(),
							order: file.order,
							visible: file.isChecked,
						})
					)
			)
		);

	const edit = async (file: CloudPointSetFile): Promise<EditPointResponseDto> =>
		await client.current.edit(
			new EditPointSetCommand({
				id: file.id,
				base64: file.getBase64(),
				order: file.order,
				opacity: file.progress,
				visible: file.isChecked,
			})
		);

	const remove = async (pointSet: CloudPointSetFile): Promise<Unit> =>
		await client.current.delete(new DeletePointSetCommand({ id: pointSet.id }));

	return { get, create, edit, remove };
};
