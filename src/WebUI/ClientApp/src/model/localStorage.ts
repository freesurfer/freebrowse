/**
 * helper file for accessing the local storage
 * to maintain the used keys in one place
 * and add type support supporting the developer to use the correct slots
 */

/**
 * all keys used for the local storage
 */
export enum LOCAL_STORAGE_KEY {
	LAST_USER_NAME = 'userName',
}

/**
 * setter method to put a value to the local storage
 */
export const set = (key: LOCAL_STORAGE_KEY, value: string): void => {
	localStorage.setItem(key, value);
};

/**
 * getter method to receive a written value from the local storage
 */
export const get = (key: LOCAL_STORAGE_KEY): string | undefined => {
	return localStorage.getItem(key) ?? undefined;
};
