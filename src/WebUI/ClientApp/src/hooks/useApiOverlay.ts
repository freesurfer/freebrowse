import {
	CreateOverlayDto,
	CreateOverlaysCommand,
	DeleteOverlayCommand,
	OverlayClient,
} from '@/generated/web-api-client';
import type { Unit } from '@/generated/web-api-client';
import type { LocalOverlayFile } from '@/pages/project/models/file/LocalOverlayFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiOverlay = (): {
	create: (surfaceId: number, overlayFile: LocalOverlayFile) => Promise<void>;
	remove: (id: number) => Promise<Unit>;
} => {
	const client = useRef(new OverlayClient(getApiUrl()));

	const create = async (
		surfaceId: number,
		overlayFile: LocalOverlayFile
	): Promise<void> => {
		await client.current.create(
			new CreateOverlaysCommand({
				surfaceId,
				overlays: [
					new CreateOverlayDto({
						fileName: overlayFile.name,
						base64: await overlayFile.getBase64(),
						color: undefined,
						opacity: 100,
						visible: true,
					}),
				],
			})
		);
	};

	const remove = async (id: number): Promise<Unit> => {
		return await client.current.delete(new DeleteOverlayCommand({ id }));
	};

	return { create, remove };
};
