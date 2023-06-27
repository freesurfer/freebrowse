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
		volumes: withDefault(ArrayParam, []),
		volumeOpacity: withDefault<number[]>(ArrayParam, []),
		volumeOrder: withDefault<number[]>(ArrayParam, []),
		volumeVisible: withDefault<boolean[]>(ArrayParam, [] as boolean[]),
		volumeSelected: withDefault<boolean[]>(ArrayParam, [] as boolean[]),
		volumeContrastMin: withDefault<number[]>(ArrayParam, []),
		volumeContrastMax: withDefault<number[]>(ArrayParam, []),
		surfaces: withDefault(ArrayParam, []),
		surfacesOpacity: withDefault<number[]>(ArrayParam, []),
		surfacesOrder: withDefault<number[]>(ArrayParam, []),
		surfacesVisible: withDefault<boolean[]>(ArrayParam, [] as boolean[]),
		surfacesSelected: withDefault<boolean[]>(ArrayParam, [] as boolean[]),
	});

	const {
		volumes,
		volumeOpacity,
		volumeOrder,
		volumeVisible,
		volumeSelected,
		volumeContrastMin,
		volumeContrastMax,
		surfaces,
		surfacesOpacity,
		surfacesOrder,
		surfacesVisible,
		surfacesSelected,
	} = query;

	const { initialState } = useApi(projectId, projectState);

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
					surfaces,
					surfacesOpacity,
					surfacesOrder,
					surfacesVisible,
					surfacesSelected
				)
			);
		} else {
			setProjectState(initialState);
		}
	}, [initialState]); // eslint-disable-line react-hooks/exhaustive-deps

	const { location, niivueWrapper } = useNiivue(canvas, projectState);

	return { projectState, setProjectState, location, niivueWrapper };
};
