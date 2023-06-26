import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import type { ProjectState } from '@/pages/project/models/ProjectState';
// import type { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import type { LocationData } from '@niivue/niivue';
import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * this hook is the react wrapper to maintain the state of the niivue library and provide all the handles needed to interact with that library
 */
export const useNiivue = (
	canvas: HTMLCanvasElement | null | undefined,
	projectState: ProjectState | undefined
): { location: LocationData | undefined } => {
	/**
	 * the niivueWrapper instance is keeping the reference and the state of the niivue library
	 * it will only get initialized once per project
	 */
	const niivueWrapper = useRef<NiivueWrapper | undefined>();
	const [location, setLocation] = useState<LocationData | undefined>();

	/**
	 * TODO: Move this to a custom hook and remove hardcoded values
	 */
	// const [connection, setConnection] = useState<null | HubConnection>(null);

	// useEffect(() => {
	// 	const connect = new HubConnectionBuilder()
	// 		.withUrl('https://localhost:5001/PointSetsHub', {
	// 			skipNegotiation: true,
	// 			transport: 1,
	// 		})
	// 		.withAutomaticReconnect()
	// 		.build();

	// 	setConnection(connect);
	// }, []);

	// useEffect(async () => {
	// 	if (connection !== null) {
	// 		connection
	// 			.start()
	// 			.then(() => {
	// 				connection.on('PointSetUpdate', (message) => {
	// 					console.log(message);
	// 				});
	// 			})
	// 			.catch((error) => console.log(error))
	// 			.then(() => connection.invoke('JoinGroup', '4'))
	// 			.catch((error) => console.log(error));
	// 	}
	// }, [connection]);

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
		niivueWrapper.current.next(projectState);
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
