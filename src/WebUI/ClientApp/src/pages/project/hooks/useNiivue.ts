import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { useQueueDebounced } from '@/pages/project/hooks/api/useQueueDebounced';
import {
	USER_MODE,
	type ProjectState,
} from '@/pages/project/models/ProjectState';
import { ViewSettings } from '@/pages/project/models/ViewSettings';
// import type { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import type { LocationData, UIData } from '@niivue/niivue';
import { useRef, useState, useEffect, useCallback, type Dispatch } from 'react';
import { Store } from 'react-notifications-component';
import { useQueryParams, withDefault, NumberParam } from 'use-query-params';

/**
 * this hook is the react wrapper to maintain the state of the niivue library and provide all the handles needed to interact with that library
 * LISTENS the projectState changes and PUSHES all updates to the niivue library
 */
export const useNiivue = (
	canvas: HTMLCanvasElement | null | undefined,
	projectState: ProjectState | undefined,
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>
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
		niivueWrapper.current = new NiivueWrapper(canvas, (location) => {
			if (location !== undefined)
				setProjectState((projectState) =>
					projectState?.from({
						crosshairPosition: {
							x: location?.mm[0],
							y: location?.mm[1],
							z: location?.mm[2],
						},
					})
				);
			setLocation(location);
		});
		return () => {
			niivueWrapper.current = undefined;
		};
	}, [canvas]);

	const onMouseUp = useCallback(
		(uiData: UIData): void => {
			setProjectState((projectState) => {
				if (projectState === undefined) return projectState;
				if (niivueWrapper.current === undefined) return projectState;

				const file = projectState.files.pointSets.find((file) => file.isActive);
				if (file === undefined) {
					Store.addNotification({
						message: 'you need to select a point set to add points',
						type: 'warning',
						insert: 'top',
						container: 'top-right',
						animationIn: ['animate__animated', 'animate__fadeIn'],
						animationOut: ['animate__animated', 'animate__fadeOut'],
						dismiss: {
							duration: 1500,
							onScreen: true,
						},
					});
					return projectState;
				}
				if (!file.isChecked) {
					Store.addNotification({
						message: 'the selected file needs to be visible to add points',
						type: 'warning',
						insert: 'top',
						container: 'top-right',
						animationIn: ['animate__animated', 'animate__fadeIn'],
						animationOut: ['animate__animated', 'animate__fadeOut'],
						dismiss: {
							duration: 1500,
							onScreen: true,
						},
					});
					return projectState;
				}
				if (!('data' in file) || file.data === undefined) return projectState;

				if (uiData.fracPos[0] < 0) return projectState; // not on volume
				if (uiData.mouseButtonCenterDown) return projectState;

				const position = niivueWrapper.current.coordinatesFromMouse(
					uiData.fracPos
				);

				return projectState.fromFileUpdate(
					file,
					{
						data: {
							...file.data,
							points: [
								...file.data.points,
								{
									coordinates: {
										x: position[0],
										y: position[1],
										z: position[2],
									},
									comments: [
										{
											text: 'name',
											prefilled: ['true'],
											timestamp: '1234',
											user: 'me',
										},
									],
									legacy_stat: 1,
								},
							],
						},
					},
					true
				);
			});
		},
		[setProjectState, niivueWrapper]
	);

	useEffect(() => {
		if (projectState?.userMode !== USER_MODE.EDIT_POINTS) return;

		niivueWrapper.current?.setOnMouseUp(onMouseUp);

		return () =>
			niivueWrapper.current?.setOnMouseUp(() => {
				/* do nothing */
			});
	}, [projectState, onMouseUp]);

	useQueueDebounced(
		projectState,
		false,
		useCallback(
			async (previousState, nextState) => {
				if (
					niivueWrapper === undefined ||
					niivueWrapper.current === undefined ||
					niivueWrapper.current === null
				)
					return;

				if (deeplinkInitialized || rasX === undefined) {
					// TODO Bere do not use projectChangeDetection class, pass two states and create a helper function for each iteration
					await niivueWrapper.current.next(previousState, nextState, undefined);
				} else {
					await niivueWrapper.current.next(
						previousState,
						nextState,
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
			},
			[
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
			]
		)
	);

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
