module.exports = {
	'*.{js,jsx,ts,tsx}': [
		'eslint --max-warnings=0',
		'jest --passWithNoTests --coverage false',
	],
	'*.{js,jsx,ts,tsx,json,css,js}': ['prettier --write'],
};
