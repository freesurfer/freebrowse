import { ProjectDto, VolumeResponseDto } from '@/generated/web-api-client';
import { useEffect, useState } from 'react';

export const useFetchProject = (
	projectId: string | undefined
): { project: ProjectDto | undefined } => {
	const [project, setProject] = useState<ProjectDto | undefined>();

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			/*
			const client = new WebApi.ProjectsClient(getApiUrl());
			if (projectId === undefined) {
				console.error('no project id given');
				return;
			}

			setProject(await client.getProject(Number(projectId)));
			*/

			/*
			possible file names:
			    "chris_MRA",
				"chris_PD",
				"chris_t1",
				"chris_t2",
				"CT_Abdo",
				"CT_AVM",
				"CT_Electrodes",
				"CT_Philips",
				"CT_pitch",
				"fmri_pitch",
				"Iguana",
				"mni152",
				"MR_Gd",
				"pcasl",
				"spm152",
				"spmMotor",
				"visiblehuman",
			*/

			setProject(
				new ProjectDto({
					id: 123,
					volumes: [
						new VolumeResponseDto({
							id: 1,
							fileName: 'mni152.nii.gz',
						}),
						new VolumeResponseDto({
							id: 2,
							fileName: 'Iguana.nii.gz',
						}),
						new VolumeResponseDto({
							id: 3,
							fileName: 'spm152.nii.gz',
						}),
						new VolumeResponseDto({
							id: 4,
							fileName: 'spmMotor.nii.gz',
						}),
						new VolumeResponseDto({
							id: 5,
							fileName: 'visiblehuman.nii.gz',
						}),
					],
					surfaces: [
						new VolumeResponseDto({
							id: 2,
							fileName: 'BrainMesh_ICBM152.lh.mz3',
						}),
					],
				})
			);
		};
		void fetchData();
	}, [projectId]);

	return { project };
};
