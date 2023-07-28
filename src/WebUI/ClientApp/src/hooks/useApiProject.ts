import type { FileResponse } from '@/generated/web-api-client';
import {
	CreateProjectCommand,
	CreateProjectSurfaceDto,
	CreateProjectVolumeDto,
	EditProjectCommand,
	ProjectsClient,
} from '@/generated/web-api-client';
import type { useApiPointSet } from '@/hooks/useApiPointSet';
import { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { CloudSurfaceFile } from '@/pages/project/models/file/CloudSurfaceFile';
import { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import { getApiUrl } from '@/utils';
import { useRef } from 'react';

export const useApiProject = (): {
	get: (
		projectId: string,
		apiPointSet: ReturnType<typeof useApiPointSet>
	) => Promise<ProjectState>;
	create: (
		projectName: string | undefined,
		projectMeshThicknessOn2D: number | undefined,
		projectFiles: ProjectFiles,
		apiPointSet: ReturnType<typeof useApiPointSet>
	) => Promise<{
		projectId: number;
		projectFiles: ProjectFiles;
	}>;
	edit: (
		projectId: string,
		projectName: string | undefined,
		projectMeshThicknessOn2D: number | undefined
	) => Promise<{
		projectId: number;
	}>;
	download: (projectId: number) => Promise<FileResponse>;
} => {
	const projectClient = useRef(new ProjectsClient(getApiUrl()));

	const get = async (
		projectId: string,
		apiPointSet: ReturnType<typeof useApiPointSet>
	): Promise<ProjectState> => {
		if (projectId === undefined) {
			throw new Error('no project id given');
		}

		const backendState = await projectClient.current.getProject(
			Number(projectId)
		);

		if (backendState.id === undefined)
			throw new Error('no id given for project');
		if (backendState.name === undefined)
			throw new Error('no name given for project');

		const cloudVolumes =
			backendState.volumes?.map<CloudVolumeFile>((fileDto) =>
				CloudVolumeFile.fromDto(fileDto)
			) ?? [];

		const cloudSurfaces =
			backendState.surfaces?.map<CloudSurfaceFile>((fileDto) =>
				CloudSurfaceFile.fromDto(fileDto)
			) ?? [];

		const cloudPointSets = await Promise.all(
			backendState.pointSets?.map(
				async (fileDto) => await apiPointSet.get(fileDto)
			) ?? []
		);

		const files = new ProjectFiles({
			projectFiles: new ProjectFiles(),
			volumes: {
				cloud: cloudVolumes,
				local: [],
			},
			surfaces: {
				cloud: cloudSurfaces,
				local: [],
			},
			pointSets: {
				cloud: cloudPointSets,
				local: [],
				cache: [],
			},
		});

		return new ProjectState(
			{
				id: backendState.id,
				name: backendState.name,
				meshThicknessOn2D: backendState.meshThicknessOn2D,
				files,
			},
			true
		);
	};

	const create = async (
		projectName: string | undefined,
		projectMeshThicknessOn2D: number | undefined,
		projectFiles: ProjectFiles,
		apiPointSet: ReturnType<typeof useApiPointSet>
	): Promise<{
		projectId: number;
		projectFiles: ProjectFiles;
	}> => {
		const createProjectResponse = await projectClient.current.create(
			new CreateProjectCommand({
				name: projectName,
				meshThicknessOn2D: projectMeshThicknessOn2D,
				volumes: await Promise.all(
					projectFiles.volumes.local.map(
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
					projectFiles.surfaces.local.map(
						async (file) =>
							new CreateProjectSurfaceDto({
								base64: await file.getBase64(),
								fileName: file.name,
								visible: file.isChecked,
								order: file.order,
								color: file.color,
							})
					)
				),
			})
		);

		if (createProjectResponse.id === undefined)
			throw new Error('no project id received from backend');

		if (projectFiles.pointSets.local.length > 0) {
			await apiPointSet.create(
				createProjectResponse.id,
				projectFiles.pointSets.local
			);
		}

		return {
			projectId: createProjectResponse.id,
			projectFiles,
		};
	};

	const edit = async (
		projectId: string,
		projectName: string | undefined,
		projectMeshThicknessOn2D: number | undefined
	): Promise<{
		projectId: number;
	}> => {
		if (projectId === undefined) {
			throw new Error('no project id given');
		}

		const editProjectResponse = await projectClient.current.edit(
			new EditProjectCommand({
				id: Number(projectId),
				name: projectName,
				meshThicknessOn2D: projectMeshThicknessOn2D,
			})
		);

		if (editProjectResponse.id === undefined)
			throw new Error('no project id received from backend');
		return { projectId: editProjectResponse.id };
	};

	const download = async (projectId: number): Promise<FileResponse> => {
		if (projectId === undefined) {
			throw new Error('no project id given');
		}

		return await projectClient.current.download(projectId);
	};

	return { get, create, edit, download };
};
