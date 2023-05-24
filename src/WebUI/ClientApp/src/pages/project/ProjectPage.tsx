import * as WebApi from '@/generated/web-api-client';
import { MainView } from '@/pages/project/center/MainView';
import { LeftBar } from '@/pages/project/leftBar/LeftBar';
import { RightBar } from '@/pages/project/rightBar/RightBar';
import { TopBar } from '@/pages/project/topBar/TopBar';
import { getApiUrl } from '@/utils';
import { Niivue } from '@niivue/niivue';
import { createContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

interface IProjectContext {
	niivue: Niivue | undefined;
	project: WebApi.ProjectDto | undefined;
	/**
	 * file name of selected file
	 */
	selectedFile: string | undefined;
	setSelectedFile: (fileName: string | undefined) => void;
}

export const ProjectContext = createContext<IProjectContext>({
	niivue: undefined,
	project: undefined,
	selectedFile: undefined,
	setSelectedFile: (fileName: string | undefined): void => {
		throw new Error('method not initialized yet');
	},
});

export const ProjectPage = (): React.ReactElement => {
	const { projectId } = useParams();
	const [project, setProject] = useState<WebApi.ProjectDto | undefined>();
	const [selectedFile, setSelectedFile] = useState<string | undefined>();

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

			setProject(
				new WebApi.ProjectDto({
					id: 123,
					volumes: [
						new WebApi.VolumeResponseDto({
							id: 1,
							fileName: 'test1.mri',
						}),
						new WebApi.VolumeResponseDto({
							id: 2,
							fileName: 'test2.mri',
						}),
						new WebApi.VolumeResponseDto({
							id: 3,
							fileName: 'test3.mri',
						}),
					],
					surfaces: [
						new WebApi.VolumeResponseDto({
							id: 2,
							fileName: 'test2.gz',
						}),
					],
				})
			);
		};
		void fetchData();
	}, [projectId]);

	const niivue = useRef<Niivue>(new Niivue());

	return (
		<ProjectContext.Provider
			value={{ project, niivue: niivue.current, selectedFile, setSelectedFile }}
		>
			<div className="flex flex-col h-full">
				<TopBar></TopBar>
				<div className="flex flex-row h-full">
					<LeftBar></LeftBar>
					<MainView></MainView>
					<RightBar></RightBar>
				</div>
			</div>
		</ProjectContext.Provider>
	);
};
