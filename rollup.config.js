import terser from '@rollup/plugin-terser';

export default {
	input: './game.js',
	output: {
		file: './dist/bundle.js',
		format: 'iife',
		name: 'Game',
		sourcemap: true,
	},
	plugins: [terser()],
};
