import { useApi } from '@/pages/project/hooks/useApi';
import { useNiivue } from '@/pages/project/hooks/useNiivue';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { LocationData } from '@niivue/niivue';
import type { Dispatch } from 'react';
import { useEffect, useState } from 'react';

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
} => {
	const [projectState, setProjectState] = useState<ProjectState>();

	const { initialState } = useApi(projectId, projectState);
	useEffect(() => {
		setProjectState(initialState);
	}, [initialState]);

	const { location } = useNiivue(canvas, projectState);

	return { projectState, setProjectState, location };
};
