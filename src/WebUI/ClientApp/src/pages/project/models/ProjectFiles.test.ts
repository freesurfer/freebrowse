import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import type { NVImage, NVMesh } from '@niivue/niivue';

jest.mock('@/utils');

describe('ProjectFiles', () => {
	it('file updates', () => {
		const FILE_NAME_VOLUME_1 = 'Volume1.img';
		const FILE_NAME_SURFACE_1 = 'Surface1.img';

		const cloudVolumes = [
			new CloudVolumeFile(
				1,
				FILE_NAME_VOLUME_1,
				20,
				true,
				true,
				0,
				1,
				'gray',
				0,
				1
			),
		];
		const cloudSurfaces = [
			new CloudSurfaceFile(2, FILE_NAME_SURFACE_1, 20, true, true, 0, 1),
		];

		const projectFiles = new ProjectFiles({
			cloudVolumes,
			cloudSurfaces,
			localVolumes: [],
			localSurfaces: [],
			volumes: [...cloudVolumes],
			surfaces: [...cloudSurfaces],
			all: [...cloudVolumes, ...cloudSurfaces],
		});

		expect(
			NiivueWrapper.isRemovedOrAdded(
				projectFiles,
				[{ name: FILE_NAME_VOLUME_1 } as unknown as NVImage],
				[{ name: FILE_NAME_SURFACE_1 } as unknown as NVMesh]
			)
		).toBeFalsy();

		expect(
			NiivueWrapper.isRemovedOrAdded(
				projectFiles,
				[{ name: FILE_NAME_SURFACE_1 } as unknown as NVImage],
				[{ name: FILE_NAME_VOLUME_1 } as unknown as NVMesh]
			)
		).toBeTruthy();

		expect(
			NiivueWrapper.isRemovedOrAdded(
				projectFiles,
				[{ name: FILE_NAME_VOLUME_1 } as unknown as NVImage],
				[]
			)
		).toBeTruthy();

		expect(
			NiivueWrapper.isRemovedOrAdded(
				projectFiles,
				[],
				[{ name: FILE_NAME_VOLUME_1 } as unknown as NVMesh]
			)
		).toBeTruthy();
	});
});
