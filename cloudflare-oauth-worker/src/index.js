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
		const url = new URL(request.url);
		if (url.pathname === '/sessions/new') {
			return new Response('<html><body><a href="https://accounts.google.com/o/oauth2/auth?client_id=' + env.GOOGLE_OAUTH_CLIENT_ID + '&redirect_uri=' + encodeURIComponent(url.origin + '/oauth2/callback') + '&response_type=code&scope=email profile">Login with Google</a></body></html>', {
				headers: { 'Content-Type': 'text/html' },
			});
		} else if (url.pathname === '/oauth2/callback') {
			const code = url.searchParams.get('code');
			if (!code) {
				return new Response('Missing code', { status: 400 });
			}

			// Exchange code for tokens
			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					code,
					client_id: env.GOOGLE_OAUTH_CLIENT_ID,
					client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
					redirect_uri: url.origin + '/oauth2/callback',
					grant_type: 'authorization_code',
				}),
			});

			const tokenData = await tokenResponse.json();
			if (!tokenResponse.ok) {
				return new Response('Failed to exchange code: ' + tokenData.error, { status: 400 });
			}

			// Fetch user info
			const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});

			const userInfo = await userInfoResponse.json();
			if (!userInfoResponse.ok) {
				return new Response('Failed to fetch user info', { status: 400 });
			}

			// Store user info in Durable Object
			const id = env.USER_SESSIONS.idFromName(userInfo.id);
			const obj = env.USER_SESSIONS.get(id);
			await obj.fetch(new Request('https://store', {
				method: 'POST',
				body: JSON.stringify(userInfo),
			}));

			return new Response('User info stored successfully');
		}
		return new Response('Hello World!');
	},
};
