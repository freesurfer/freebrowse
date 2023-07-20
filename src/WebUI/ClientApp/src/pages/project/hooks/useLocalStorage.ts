import { LOCAL_STORAGE_KEY, get, set } from '@/model/localstorage';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { useEffect, useState } from 'react';

/**
 * helper to transport all important information from the local storage into the project state
 */
export interface ILocalStorage {
	userName: string | undefined;
}

/**
 * custom hook to connect the project state to the local storage
 */
export const useLocalStorage = (
	projectState: ProjectState | undefined
): ILocalStorage | undefined => {
	const [localStorage] = useState<ILocalStorage>({
		userName: get(LOCAL_STORAGE_KEY.LAST_USER_NAME),
	});

	useEffect(() => {
		if (projectState === undefined) return;
		if (projectState.user.name === undefined) return;
		if (projectState.user.name === localStorage.userName) return;
		set(LOCAL_STORAGE_KEY.LAST_USER_NAME, projectState.user.name);
	}, [projectState, localStorage]);

	return localStorage;
};
