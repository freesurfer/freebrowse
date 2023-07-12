import type {
	CreatePointSetResponseDto,
	Unit,
} from '@/generated/web-api-client';
import {
	PointSetClient,
	DeletePointSetCommand,
	CreatePointSetCommand,
} from '@/generated/web-api-client';
import type { CachePointSetFile } from '@/pages/project/models/file/CachePointSetFile';
import type { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiPointSet = (): {
	create: (
		projectId: number,
		pointSets: readonly CachePointSetFile[]
	) => Promise<CreatePointSetResponseDto[]>;
	remove: (pointSet: CloudPointSetFile) => Promise<Unit>;
} => {
	const client = useRef(new PointSetClient(getApiUrl()));

	const create = async (
		projectId: number,
		pointSets: readonly CachePointSetFile[]
	): Promise<CreatePointSetResponseDto[]> => {
		return await Promise.all(
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
	};

	const remove = async (pointSet: CloudPointSetFile): Promise<Unit> => {
		return await client.current.delete(
			new DeletePointSetCommand({ id: pointSet.id })
		);
	};

	return { create, remove };
};
