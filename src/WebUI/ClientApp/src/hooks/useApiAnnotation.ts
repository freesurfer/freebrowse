import {
	CreateAnnotationDto,
	CreateAnnotationsCommand,
	DeleteAnnotationCommand,
	EditAnnotationCommand,
	AnnotationClient,
} from '@/generated/web-api-client';
import type {
	CreateAnnotationResponseDto,
	Unit,
} from '@/generated/web-api-client';
import type { CloudAnnotationFile } from '@/pages/project/models/file/CloudAnnotationFile';
import type { LocalAnnotationFile } from '@/pages/project/models/file/LocalAnnotationFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiAnnotation = (): {
	create: (
		surfaceId: number,
		annotationFile: LocalAnnotationFile
	) => Promise<CreateAnnotationResponseDto[]>;
	edit: (annotationFile: CloudAnnotationFile) => Promise<number>;
	remove: (id: number) => Promise<Unit>;
} => {
	const client = useRef(new AnnotationClient(getApiUrl()));

	const create = async (
		surfaceId: number,
		annotationFile: LocalAnnotationFile
	): Promise<CreateAnnotationResponseDto[]> => {
		return await client.current.create(
			new CreateAnnotationsCommand({
				surfaceId,
				annotations: [
					new CreateAnnotationDto({
						fileName: annotationFile.name,
						base64: await annotationFile.getBase64(),
						color: undefined,
						selected: annotationFile.isActive,
					}),
				],
			})
		);
	};

	const edit = async (annotationFile: CloudAnnotationFile): Promise<number> => {
		return await client.current.edit(
			new EditAnnotationCommand({
				id: annotationFile.id,
				selected: annotationFile.isActive,
			})
		);
	};

	const remove = async (id: number): Promise<Unit> => {
		return await client.current.delete(new DeleteAnnotationCommand({ id }));
	};

	return { create, edit, remove };
};
