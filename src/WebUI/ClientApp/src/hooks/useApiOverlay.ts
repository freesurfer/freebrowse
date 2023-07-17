import {
	CreateOverlayDto,
	CreateOverlaysCommand,
	DeleteOverlayCommand,
	EditOverlayCommand,
	OverlayClient,
} from '@/generated/web-api-client';
import type {
	CreateOverlayResponseDto,
	Unit,
} from '@/generated/web-api-client';
import type { CloudOverlayFile } from '@/pages/project/models/file/CloudOverlayFile';
import type { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiOverlay = (): {
	create: (
		surfaceId: number,
		overlayFile: LocalOverlayFile
	) => Promise<CreateOverlayResponseDto[]>;
	edit: (overlayFile: CloudOverlayFile) => Promise<number>;
	remove: (id: number) => Promise<Unit>;
} => {
	const client = useRef(new OverlayClient(getApiUrl()));

	const create = async (
		surfaceId: number,
		overlayFile: LocalOverlayFile
	): Promise<CreateOverlayResponseDto[]> => {
		return await client.current.create(
			new CreateOverlaysCommand({
				surfaceId,
				overlays: [
					new CreateOverlayDto({
						fileName: overlayFile.name,
						base64: await overlayFile.getBase64(),
						color: undefined,
						opacity: 100,
					}),
				],
			})
		);
	};

	const edit = async (overlayFile: CloudOverlayFile): Promise<number> => {
		return await client.current.edit(
			new EditOverlayCommand({
				id: overlayFile.id,
				selected: overlayFile.isActive,
			})
		);
	};

	const remove = async (id: number): Promise<Unit> => {
		return await client.current.delete(new DeleteOverlayCommand({ id }));
	};

	return { create, edit, remove };
};
