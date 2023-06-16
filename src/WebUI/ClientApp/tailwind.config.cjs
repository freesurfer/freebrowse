/** @type {import('tailwindcss').Config} */

export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				/**
				 * Primary Color
				 */
				primary: '#1aafd9',
				/**
				 * Secondary Color
				 */
				secondary: '#cfd8dc',
				/**
				 * White
				 */
				white: '#ffffff',
				/**
				 * Black
				 */
				black: '#000000',
				/**
				 * FontColor
				 */
				font: '#333333',
				/**
				 * Red
				 */
				red: '#dc2626',
				/**
				 * Green
				 */
				green: '#059669',
				/**
				 * Blue dark
				 */
				'blue-dark': '#2563eb',
				/**
				 * Blue light
				 */
				'blue-light': '#60a5fa',
				/**
				 * Gray
				 */
				gray: {
					100: '#F8F8F8',
					200: '#E0E0E0',
					DEFAULT: '#e5e7eb',
					300: '#C8C8C8',
					400: '#888888',
					500: '#707070',
					600: '#505050',
					700: '#383838',
					800: '#282828',
					900: '#101010',
				},
			},
		},
	},
	plugins: [],
};
