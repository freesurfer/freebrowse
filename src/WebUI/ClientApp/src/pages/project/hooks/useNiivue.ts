import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import { ViewSettings } from '@/pages/project/models/ViewSettings';
// import type { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import type { LocationData } from '@niivue/niivue';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useQueryParams, withDefault, NumberParam } from 'use-query-params';

/**
 * this hook is the react wrapper to maintain the state of the niivue library and provide all the handles needed to interact with that library
 */
export const useNiivue = (
	canvas: HTMLCanvasElement | null | undefined,
	projectState: ProjectState | undefined
): {
	location: LocationData | undefined;
	niivueWrapper: NiivueWrapper | undefined;
} => {
	/**
	 * the niivueWrapper instance is keeping the reference and the state of the niivue library
	 * it will only get initialized once per project
	 */
	const niivueWrapper = useRef<NiivueWrapper | undefined>();
	const [location, setLocation] = useState<LocationData | undefined>();
	const [deeplinkInitialized, setDeeplinkInitialized] =
		useState<boolean>(false);
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
	});

	const {
		sliceX,
		sliceY,
		sliceZ,
		zoom3d,
		zoom2d,
		zoom2dX,
		zoom2dY,
		zoom2dZ,
		rasX,
		rasY,
		rasZ,
		renderAzimuth,
		renderElevation,
	} = query;

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

		if (deeplinkInitialized || rasX === undefined) {
			niivueWrapper.current.next(projectState, undefined);
		} else {
			niivueWrapper.current.next(
				projectState,
				new ViewSettings(
					zoom2d,
					zoom2dX,
					zoom2dY,
					zoom2dZ,
					zoom3d,
					sliceX,
					sliceY,
					sliceZ,
					rasX,
					rasY,
					rasZ,
					renderAzimuth,
					renderElevation
				)
			);

			setDeeplinkInitialized(true);
		}
	}, [
		projectState,
		niivueWrapper,
		deeplinkInitialized,
		sliceX,
		sliceY,
		sliceZ,
		zoom3d,
		zoom2d,
		zoom2dX,
		zoom2dY,
		zoom2dZ,
		rasX,
		rasY,
		rasZ,
		renderAzimuth,
		renderElevation,
	]);

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
		niivueWrapper: niivueWrapper.current,
	};
};
