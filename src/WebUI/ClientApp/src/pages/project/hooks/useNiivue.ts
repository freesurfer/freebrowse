import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { LocationData } from '@niivue/niivue';
import { useRef, useState, useEffect, useCallback } from 'react';

export const useNiivue = (
	canvas: HTMLCanvasElement | null | undefined,
	projectState: ProjectState | undefined
): { location: LocationData | undefined } => {
	// we should use a reference here, since the Niivue library is not immutable
	// this could lead to confusions, if the state of the library changes, without rerendering is getting triggered
	const niivueWrapper = useRef<NiivueWrapper | undefined>();
	const [location, setLocation] = useState<LocationData | undefined>();

	useEffect(() => {
		if (canvas === undefined || canvas === null) return;
		niivueWrapper.current = new NiivueWrapper(canvas, setLocation);
		return () => {
			niivueWrapper.current = undefined;
		};
	}, [canvas]);

	useEffect(() => {
		if (
			projectState === undefined ||
			niivueWrapper === undefined ||
			niivueWrapper.current === undefined ||
			niivueWrapper.current === null
		)
			return;
		niivueWrapper.current.loadDataAsync(projectState.files);
	}, [projectState, niivueWrapper]);

	const handleKeyDown = useCallback((event: KeyboardEvent) => {
		if (niivueWrapper.current === undefined) return;
		niivueWrapper.current.handleKeyDown(event);
	}, []);

	const handleKeyUp = useCallback((event: KeyboardEvent) => {
		if (niivueWrapper.current === undefined) return;
		niivueWrapper.current.handleKeyUp(event);
	}, []);

	const handleMouseMove = useCallback((event: MouseEvent) => {
		if (niivueWrapper.current === undefined) return;
		niivueWrapper.current.handleMouseMove(event);
	}, []);

	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);
		document.addEventListener('mousemove', handleMouseMove);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('mousemove', handleMouseMove);
		};
	}, [handleKeyDown, handleKeyUp, handleMouseMove]);

	return {
		location,
	};
};
