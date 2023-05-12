/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@niivue/niivue' {
	export class Log {
		constructor(logLevel: any);
		LOGGING_ON: boolean;
		LOGGING_OFF: boolean;
		LOG_PREFIX: string;
		logLevel: any;
		getTimeStamp(): string;
		debug(...args: any[]): void;
		info(...args: any[]): void;
		warn(...args: any[]): void;
		error(...args: any[]): void;
		setLogLevel(logLevel: any): void;
	}
}
