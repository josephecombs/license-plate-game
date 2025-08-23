import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.jsonc' },
			},
		},
		setupFiles: ['test/setup/ses.mock.js', 'test/setup/mute-console.js'],
		restoreMocks: true,
		mockReset: true,
		// optional: completely silence console during tests
		// silent: true,
	},
});
