/** @type {import('tailwindcss').Config} */

export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {},
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
			front: '#333333',
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
			 * Gray (Cool)
			 */
			gray: '#e5e7eb',
		},
	},
	plugins: [],
};
