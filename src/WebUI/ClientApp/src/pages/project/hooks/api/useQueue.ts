import type { ProjectState } from '@/pages/project/models/ProjectState';
import { useEffect, useState } from 'react';

/**
 * hook to queue all the state changes to have not post the same request twice because of race conditions
 */
export const useQueue = (
	projectState: ProjectState | undefined,
	onlyUploaded: boolean,
	next: (
		previousState: ProjectState | undefined,
		nextState: ProjectState
	) => Promise<void>
): void => {
	const [previousState, setPreviousState] = useState<
		ProjectState | undefined
	>();
	const [nextState, setNextState] = useState<ProjectState | undefined>();
	const [isRunning, setIsRunning] = useState<boolean>(false);

	useEffect(() => {
		if (projectState === undefined) return;
		if (!onlyUploaded || projectState.upload) setNextState(projectState);
	}, [projectState, onlyUploaded]);

	useEffect(() => {
		const executeQueue = async (): Promise<void> => {
			if (nextState === undefined) return;
			if (nextState === previousState) {
				setNextState(undefined);
				return;
			}
			if (isRunning) return;
			setIsRunning(true);

			setPreviousState(nextState);
			setNextState(undefined);

			await next(previousState, nextState);
			setIsRunning(false);
		};

		void executeQueue();
	}, [isRunning, setIsRunning, next, previousState, nextState, setNextState]);
};
