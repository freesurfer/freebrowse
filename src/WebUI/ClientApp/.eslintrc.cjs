module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	plugins: ['react-refresh', 'jsx-a11y', 'react', 'prettier'],
	extends: [
		'eslint:recommended',
		'standard-with-typescript',
		'plugin:react/recommended',
		'plugin:react/jsx-runtime',
		'plugin:react-hooks/recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:jsx-a11y/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['tsconfig.json'],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	rules: {
		'react-refresh/only-export-components': 'warn',
		'@typescript-eslint/no-confusing-void-expression': [
			'error',
			{
				ignoreArrowShorthand: true,
			},
		],
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/array-type': [
			'error',
			{
				default: 'array',
			},
		],
		'prettier/prettier': 'warn',
		'no-unreachable': 'warn',
		'no-fallthrough': 'warn',
		'func-style': ['off', 'expression', { allowArrowFunctions: true }],
		'class-methods-use-this': 'warn',
		'no-use-before-define': 'error',
		'lines-between-class-members': 'warn',
		'no-return-assign': ['error', 'always'],
	},
};
