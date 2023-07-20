import type { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { useApi } from '@/pages/project/hooks/useApi';
import { useNiivue } from '@/pages/project/hooks/useNiivue';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { LocationData } from '@niivue/niivue';
import type { Dispatch } from 'react';
import { useEffect, useState } from 'react';
import { useQueryParams, withDefault, ArrayParam } from 'use-query-params';

/**
 * this is a custom hook, to handle all the project related states and actions
 * - upload data on state change
 * - update niivue state on state change
 * - provide action callbacks to trigger state changes
 */
export const useProject = (
	projectId: string | undefined,
	canvas: HTMLCanvasElement | null | undefined
): {
	projectState: ProjectState | undefined;
	setProjectState: Dispatch<React.SetStateAction<ProjectState | undefined>>;
	location: LocationData | undefined;
	niivueWrapper: NiivueWrapper | undefined;
} => {
	const [projectState, setProjectState] = useState<ProjectState>();

	const [query] = useQueryParams({
		userMode: withDefault(ArrayParam, []),
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
		pointSetOpacity: withDefault(ArrayParam, []),
		pointSetOrder: withDefault(ArrayParam, []),
		pointSetVisible: withDefault(ArrayParam, []),
		pointSetSelected: withDefault(ArrayParam, []),
	});

	const {
		volumes,
		volumeOpacity,
		volumeOrder,
		volumeVisible,
		volumeSelected,
		volumeContrastMin,
		volumeContrastMax,
		volumeColormap,
		surfaces,
		surfaceOpacity,
		surfaceOrder,
		surfaceVisible,
		surfaceSelected,
		pointSets,
		pointSetOpacity,
		pointSetOrder,
		pointSetVisible,
		pointSetSelected,
	} = query;

	const { initialState } = useApi(projectId, setProjectState, projectState);
	useEffect(() => {
		if (initialState === undefined) return;

		if (volumes.length > 0 || surfaces.length > 0) {
			setProjectState(
				initialState.fromQuery(
					volumes,
					volumeOpacity,
					volumeOrder,
					volumeSelected,
					volumeVisible,
					volumeContrastMin,
					volumeContrastMax,
					volumeColormap,
					surfaces,
					surfaceOpacity,
					surfaceOrder,
					surfaceVisible,
					surfaceSelected,
					pointSets,
					pointSetOpacity,
					pointSetOrder,
					pointSetVisible,
					pointSetSelected
				)
			);
		} else {
			setProjectState(initialState);
		}
	}, [initialState]); // eslint-disable-line react-hooks/exhaustive-deps

	const { location, niivueWrapper } = useNiivue(
		canvas,
		projectState,
		setProjectState
	);

	return { projectState, setProjectState, location, niivueWrapper };
};
