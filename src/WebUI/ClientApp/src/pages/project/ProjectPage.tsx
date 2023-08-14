import { MainView } from '@/pages/project/components/MainView';
import { LeftBar } from '@/pages/project/components/leftBar/LeftBar';
import { RightBar } from '@/pages/project/components/rightBar/RightBar';
import { TopBar } from '@/pages/project/components/topBar/TopBar';
import { ProjectState } from '@/pages/project/models/ProjectState';
import { useEffect, type ReactElement, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
	ArrayParam,
	NumberParam,
	useQueryParams,
	withDefault,
} from 'use-query-params';

export const ProjectPage = (): ReactElement => {
	const { projectId } = useParams();

	const [query] = useQueryParams({
		sliceX: withDefault(NumberParam, undefined),
		sliceY: withDefault(NumberParam, undefined),
		sliceZ: withDefault(NumberParam, undefined),
		zoom3d: withDefault(NumberParam, undefined),
		zoom2d: withDefault(NumberParam, undefined),
		zoom2dX: withDefault(NumberParam, undefined),
		zoom2dY: withDefault(NumberParam, undefined),
		zoom2dZ: withDefault(NumberParam, undefined),
		rasX: withDefault(NumberParam, undefined),
		rasY: withDefault(NumberParam, undefined),
		rasZ: withDefault(NumberParam, undefined),
		renderAzimuth: withDefault(NumberParam, undefined),
		renderElevation: withDefault(NumberParam, undefined),
		userMode: withDefault(NumberParam, undefined),
		volumes: withDefault(ArrayParam, []),
		volumeOpacity: withDefault(ArrayParam, []),
		volumeOrder: withDefault(ArrayParam, []),
		volumeVisible: withDefault(ArrayParam, []),
		volumeSelected: withDefault(ArrayParam, []),
		volumeContrastMin: withDefault(ArrayParam, []),
		volumeContrastMax: withDefault(ArrayParam, []),
		volumeColormap: withDefault(ArrayParam, []),
		surfaces: withDefault(ArrayParam, []),
		surfaceOpacity: withDefault(ArrayParam, []),
		surfaceOrder: withDefault(ArrayParam, []),
		surfaceVisible: withDefault(ArrayParam, []),
		surfaceSelected: withDefault(ArrayParam, []),
		pointSets: withDefault(ArrayParam, []),
		pointSetOrder: withDefault(ArrayParam, []),
		pointSetVisible: withDefault(ArrayParam, []),
		pointSetSelected: withDefault(ArrayParam, []),
	});

	if (projectId === undefined)
		throw new Error('can not build page without project id');

	const projectState = useMemo(
		() => new ProjectState(parseInt(projectId), query),
		[projectId, query]
	);

	useEffect(() => {
		document.addEventListener(
			'keydown',
			projectState.eventHandler.handleKeyDown
		);
		document.addEventListener('keyup', projectState.eventHandler.handleKeyUp);
		document.addEventListener(
			'mousemove',
			projectState.eventHandler.handleMouseMove
		);
		return () => {
			document.removeEventListener(
				'keydown',
				projectState.eventHandler.handleKeyDown
			);
			document.removeEventListener(
				'keyup',
				projectState.eventHandler.handleKeyUp
			);
			document.removeEventListener(
				'mousemove',
				projectState.eventHandler.handleMouseMove
			);
		};
	}, [projectState]);

	return (
		<div className="flex h-full flex-col text-font">
			<TopBar projectState={projectState}></TopBar>
			<div
				className="border-5 flex h-full flex-row border-red"
				style={{
					height: 'calc(100% - 80px)',
				}}
			>
				<LeftBar projectState={projectState}></LeftBar>
				<MainView projectState={projectState}></MainView>
				<RightBar projectState={projectState}></RightBar>
			</div>
		</div>
	);
};
