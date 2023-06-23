import type { GetProjectDto } from '@/generated/web-api-client';
import {
	CreateProjectCommand,
	CreateProjectSurfaceDto,
	CreateProjectVolumeDto,
	ProjectsClient,
} from '@/generated/web-api-client';
import type { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiProject = (): {
	get: (projectId: string) => Promise<GetProjectDto>;
	create: (
		projectName: string | undefined,
		projectFiles: ProjectFiles
	) => Promise<{
		projectId: number;
		projectFiles: ProjectFiles;
	}>;
} => {
	const client = useRef(new ProjectsClient(getApiUrl()));

	const get = async (projectId: string): Promise<GetProjectDto> => {
		if (projectId === undefined) {
			throw new Error('no project id given');
		}

		return await client.current.getProject(Number(projectId));
	};

	const create = async (
		projectName: string | undefined,
		projectFiles: ProjectFiles
	): Promise<{
		projectId: number;
		projectFiles: ProjectFiles;
	}> => {
		const createProjectResponse = await client.current.create(
			new CreateProjectCommand({
				name: projectName,
				volumes: await Promise.all(
					projectFiles.localVolumes.map(
						async (file) =>
							new CreateProjectVolumeDto({
								base64: await file.getBase64(),
								fileName: file.name,
								visible: file.isChecked,
								order: file.order,
								colorMap: undefined,
								opacity: file.opacity,
								contrastMin: file.contrastMin,
								contrastMax: file.contrastMax,
							})
					)
				),
				surfaces: await Promise.all(
					projectFiles.localSurfaces.map(
						async (file) =>
							new CreateProjectSurfaceDto({
								base64: await file.getBase64(),
								fileName: file.name,
								visible: file.isChecked,
								order: file.order,
								color: undefined,
								opacity: file.opacity,
							})
					)
				),
			})
		);

		if (createProjectResponse.id === undefined)
			throw new Error('no project id received from backend');
		return {
			projectId: createProjectResponse.id,
			projectFiles,
		};
	};

	return { get, create };
};
