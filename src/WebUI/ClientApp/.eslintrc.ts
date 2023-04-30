module.exports = {
	env: { browser: true, es2020: true },
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:react/jsx-runtime',
		'plugin:react-hooks/recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:jsx-a11y/recommended',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
	plugins: ['react-refresh', 'jsx-a11y'],
	settings: {
		react: {
			version: 'detect',
		},
	},
	rules: {
		'react-refresh/only-export-components': 'warn',
		'jsx-a11y/rule-name': 2,
	},
};
