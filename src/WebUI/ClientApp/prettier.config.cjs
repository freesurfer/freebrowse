const pluginSortImports = require('@trivago/prettier-plugin-sort-imports');
const pluginTailwindcss = require('prettier-plugin-tailwindcss');

/**
 * this magic is needed to be able to use more than one prettier plugin at the same time
 * https://github.com/tailwindlabs/prettier-plugin-tailwindcss/issues/31#issuecomment-1195411734
 */

/** @type {import("prettier").Parser}  */
const myParser = {
	...pluginSortImports.parsers.typescript,
	parse: pluginTailwindcss.parsers.typescript.parse,
};

/** @type {import("prettier").Plugin}  */
const myPlugin = {
	parsers: {
		typescript: myParser,
	},
};

module.exports = {
	plugins: [myPlugin],

	// your settings
	singleQuote: true,
	endOfLine: 'auto',
};
