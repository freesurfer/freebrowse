import 'vite/client';

interface ImportMetaEnv {
	readonly VITE_PORT: number;
	readonly VITE_HTTPS: boolean;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
