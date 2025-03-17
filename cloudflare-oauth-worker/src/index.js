/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// Define the UserSession class
export class UserSession {
	constructor(state, env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request) {
		// Handle requests to manage user sessions
		return new Response('User session handling');
	}
}

// Export the default fetch handler
export default {
	async fetch(request, env, ctx) {
		return new Response('Hello World!');
	},
};
