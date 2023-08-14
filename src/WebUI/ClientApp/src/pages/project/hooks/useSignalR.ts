/**
 * This is an unused example, how async communication to the backend can be implemented
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
