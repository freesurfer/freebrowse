/** @type {import('tailwindcss').Config} */

export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {},
		colors: {
			/**
			 * Primary Color
			 */
			pc: '#1aafd9',
			/**
			 * Secondary Color
			 */
			sc: '#cfd8dc',
			/**
			 * White
			 */
			w: '#ffffff',
			/**
			 * Black
			 */
			b: '#000000',
			/**
			 * FontColor
			 */
			fc: '#333333',
			/**
			 * Red
			 */
			r: '#dc2626',
			/**
			 * Green
			 */
			g: '#059669',
			/**
			 * Blue dark
			 */
			bd: '#2563eb',
			/**
			 * Blue light
			 */
			bl: '#2563eb',
			/**
			 * Gray (Cool)
			 */
			gc: '#e5e7eb',
		},
	},
	plugins: [],
};
