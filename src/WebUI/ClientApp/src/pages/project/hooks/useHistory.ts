import {
	ProjectFiles,
	type IPointSets,
} from '@/pages/project/models/ProjectFiles';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { type Dispatch, useState, useEffect, useCallback } from 'react';

interface IHistory {
	past: IPointSets[];
	present: IPointSets | undefined;
	future: IPointSets[];
}

/**
 * keep the state history of parts the user will be able to revert to
 */
export const useHistory = (
	projectState: ProjectState | undefined,
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>
): {
	wayPointUndo: () => void;
	wayPointRedo: () => void;
} => {
	const [history, setHistory] = useState<IHistory>({
		past: [],
		present: undefined,
		future: [],
	});
	const [previousProjectState, setPreviousProjectState] = useState<
		ProjectState | undefined
	>(undefined);

	const pointHasBeenRemovedOrAdded = (
		next: IPointSets,
		prev: IPointSets | undefined
	): boolean => {
		if (
			prev === undefined ||
			next.cache.length !== prev.cache.length ||
			next.local.length !== prev.local.length ||
			next.cloud.length !== prev.cloud.length
		)
			return true;

		for (const nextFile of [...next.cache, ...next.cloud, ...next.local]) {
			// get matching file from previous state
			const prevFile = [...prev.cache, ...prev.cloud, ...prev.local].find(
				(prevFile) => nextFile.name === prevFile.name
			);
			if (prevFile === undefined) return true;

			// if previous file has no data
			if (!('data' in prevFile)) {
				if (!('data' in nextFile)) continue;
				if (nextFile.data.points.length > 0) return true;
				continue;
			}

			// if next file has no data
			if (!('data' in nextFile)) {
				if (prevFile.data.points.length > 0) return true;
				continue;
			}

			// if the there are different points
			if (prevFile.data.points.length !== nextFile.data.points.length)
				return true;

			// compare the points
			for (let i = 0; i < prevFile.data.points.length; i++) {
				if (prevFile.data.points[i] === nextFile.data.points[i]) continue;
				return true;
			}
		}

		return false;
	};

	useEffect(() => {
		console.log('BERE', history);
	}, [history]);

	useEffect(() => {
		if (projectState === undefined) return;
		if (projectState === previousProjectState) return;
		setPreviousProjectState(projectState);

		if (projectState.files.pointSets === previousProjectState?.files.pointSets)
			return;

		const state = projectState.files.pointSets;

		setHistory((prevHistory): IHistory => {
			// if there was not any state tracked yet -> set initial state
			if (prevHistory.present === undefined)
				return {
					past: [],
					present: state,
					future: [],
				};

			// found in present -> do nothing
			if (state === prevHistory.present) return prevHistory;

			// found in past -> move past states to future
			const pastIndex = prevHistory.past.indexOf(state);
			if (pastIndex >= 0)
				return {
					past: prevHistory.past.filter((_, index) => index < pastIndex),
					present: state,
					future: [
						...prevHistory.future,
						...prevHistory.past.filter((_, index) => index > pastIndex),
					],
				};

			// found in future -> move future states to the past until the present state is the present state
			const futureIndex = prevHistory.future.indexOf(state);
			if (futureIndex >= 0)
				return {
					past: [
						...prevHistory.past,
						...prevHistory.future.filter((_, index) => index < pastIndex),
					],
					present: state,
					future: prevHistory.future.filter((_, index) => index > pastIndex),
				};

			if (
				pointHasBeenRemovedOrAdded(
					projectState.files.pointSets,
					previousProjectState?.files.pointSets
				)
			) {
				console.info('useHistory - waypoint added or removed');
				return {
					past: [...prevHistory.past, prevHistory.present],
					present: state,
					// drop the future state here
					future: [],
				};
			}

			console.info('useHistory - update state without changing history');
			return {
				past: [...prevHistory.past],
				present: state,
				future: [...prevHistory.future],
			};
		});
	}, [projectState, setPreviousProjectState, previousProjectState, setHistory]);

	const wayPointUndo = useCallback(() => {
		// no previous step to step back to
		if (history.past.length === 0) return;

		const stepBackState = history.past.slice(-1)[0];
		if (stepBackState === undefined)
			// can not happen - just for types
			return;

		setHistory((prevHistory) => ({
			past: prevHistory.past.filter((pastState) => pastState !== stepBackState),
			present: stepBackState,
			future:
				prevHistory.present === undefined
					? prevHistory.future
					: [prevHistory.present, ...prevHistory.future],
		}));

		setProjectState((projectState) =>
			projectState?.fromFiles(
				new ProjectFiles({
					projectFiles: projectState.files,
					pointSets: stepBackState,
				})
			)
		);
		console.info('BERE apply history step');
	}, [history, setProjectState]);

	const wayPointRedo = useCallback(() => {
		// no next step to step forward to
		if (history.future.length === 0) return;

		const stepForwardState = history.future.slice(0, 1)[0];
		if (stepForwardState === undefined)
			// can not happen - just for types
			return;

		setHistory((prevHistory) => ({
			past:
				prevHistory.present === undefined
					? prevHistory.past
					: [...prevHistory.past, prevHistory.present],
			present: stepForwardState,
			future: prevHistory.future.filter(
				(futureState) => futureState !== stepForwardState
			),
		}));

		setProjectState((projectState) =>
			projectState?.fromFiles(
				new ProjectFiles({
					projectFiles: projectState.files,
					pointSets: stepForwardState,
				})
			)
		);
		console.info('BERE apply history step');
	}, [history, setProjectState]);

	return {
		wayPointUndo,
		wayPointRedo,
	};
};
