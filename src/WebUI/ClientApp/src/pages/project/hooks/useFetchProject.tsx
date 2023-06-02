import type { ProjectDto } from '@/generated/web-api-client';
import { ProjectsClient } from '@/generated/web-api-client';
import { getApiUrl } from '@/utils';
import { useEffect, useState } from 'react';

export const useFetchProject = (
	projectId: string | undefined
): { project: ProjectDto | undefined } => {
	const [project, setProject] = useState<ProjectDto | undefined>();

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			const client = new ProjectsClient(getApiUrl());
			if (projectId === undefined) {
				console.error('no project id given');
				return;
			}

			setProject(await client.getProject(Number(projectId)));
		};
		void fetchData();
	}, [projectId]);

	return { project };
};
