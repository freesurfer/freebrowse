module.exports = {
	collectCoverage: true,
	collectCoverageFrom: ['<rootDir>/src/**/*.tsx'],
	coverageDirectory: '<rootDir>/coverage',
	coverageReporters: ['html'],
	moduleFileExtensions: ['js', 'ts', 'tsx'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	transform: {
		'^.+\\.(tsx?)$': [
			'@swc/jest',
			{
				jsc: {
					transform: {
						react: {
							runtime: 'automatic',
						},
					},
				},
			},
		],
	},
	testEnvironment: 'jsdom',
};
