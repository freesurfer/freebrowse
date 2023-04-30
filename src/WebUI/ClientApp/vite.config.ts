import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { getHttpsConfig } from "./scripts/getHttpsConfig";

// https://vitejs.dev/config/
export default ({ mode }) => {
	// load vite environment variables in node context
	// https://stackoverflow.com/a/66389044
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return defineConfig({
		plugins: [react()],

		server: {
			port: parseInt(process.env.VITE_PORT),
			https: getHttpsConfig(),
		},
	});
};
