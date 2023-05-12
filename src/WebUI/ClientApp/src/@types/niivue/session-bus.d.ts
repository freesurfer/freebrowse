/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/ban-types */
declare module '@niivue/niivue' {
	/**
	 * @class SessionUser
	 * @type SessionUser
	 * @description SessionUser specifies display name, user id and user key
	 * @param {string} displayName
	 * @param {string} userId
	 * @param {string} userKey Used to protect user properties
	 * @param {Map} userProperties
	 */
	export class SessionUser {
		/**
		 * @class SessionUser
		 * @type SessionUser
		 * @description SessionUser specifies display name, user id and user key
		 * @param {string} displayName
		 * @param {string} userId
		 * @param {string} userKey Used to protect user properties
		 * @param {Map} userProperties
		 */
		constructor(
			displayName?: string,
			userId?: string,
			userKey?: string,
			userProperties?: Map<any, any>
		);
		id: any;
		displayName: any;
		key: any;
		properties: any;
	}
	/**
	 * @class SessionBus
	 * @type SessionBus
	 * @description SessionBus is for synchronizing both remote and local instances
	 * @constructor
	 * @param {string} name
	 * @param {SessionUser} user
	 * @param {function} onMessageCallback  call back for new messages
	 * @param {string} serverURL
	 */
	export class SessionBus {
		/**
		 * @class SessionBus
		 * @type SessionBus
		 * @description SessionBus is for synchronizing both remote and local instances
		 * @constructor
		 * @param {string} name
		 * @param {SessionUser} user
		 * @param {function} onMessageCallback  call back for new messages
		 * @param {string} serverURL
		 */
		constructor(
			name: string,
			user: SessionUser,
			onMessageCallback: Function,
			serverURL?: string,
			sessionKey?: string
		);
		userList: any;
		user: any;
		onMessageCallBack: any;
		isConnectedToServer: any;
		isController: any;
		sessionScene: any;
		sessionKey: any;
		sessionName: any;
		sessionSceneName: any;
		serverConnection$: any;
		userQueueName: any;
		userListName: any;
		sendSessionMessage(message: any): void;
		connectToServer(serverURL: any, sessionName: any): void;
		subscribeToServer(): void;
		sendLocalMessage(message: any): void;
		localStorageEventListener(e: any): void;
	}
}
