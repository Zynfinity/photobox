import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	server: {
		proxy: {
			// Semua request /api/* di-forward ke backend Fastify
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			},
			// Static file uploads yang disajikan backend
			'/uploads': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			}
		}
	}
});
