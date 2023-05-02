import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { getHttpsConfig } from './scripts/getHttpsConfig';

// https://vitejs.dev/config/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mode }: { mode: any }): any => {
	// load vite environment variables in node context
	// https://stackoverflow.com/a/66389044
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return defineConfig({
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
		plugins: [react()],
		server: {
			port: parseInt(process.env.VITE_PORT),
			https: getHttpsConfig(),
		},
	});
};
