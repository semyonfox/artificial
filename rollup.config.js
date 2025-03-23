// filepath: /home/semyon/Documents/GitHub/artificial/rollup.config.js
export default {
	input: './game.js', // Entry point
	output: {
		file: './dist/bundle.js', // Output file
		format: 'iife', // Immediately Invoked Function Expression
		name: 'Game', // Global variable name for the bundle
	},
};
