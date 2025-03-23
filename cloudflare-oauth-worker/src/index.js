/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { v4 as uuidv4 } from 'uuid';

// Define the User Durable Object
export class User {
	constructor(state, env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request) {
		const userData = await this.state.storage.get('user');
		return new Response(JSON.stringify(userData), { headers: { 'Content-Type': 'application/json' } });
	}
}

// Define the Game Durable Object
export class Game {
	constructor(state, env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request) {
		// Handle game state management
		return new Response('Game state handling');
	}
}

// Define the UserSession Durable Object
export class UserSession {
	constructor(state, env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request) {
		// Handle game state management
		return new Response('UserSession state handling');
	}
}

// Update OAuth flow to store user info in User Durable Object
export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		console.log('Received request at:', url.pathname);
		if (url.pathname === '/sessions/new') {
			const code = url.searchParams.get('code');
			if (!code) {
				// Redirect to Google's OAuth consent screen
				return Response.redirect(
					`https://accounts.google.com/o/oauth2/auth?client_id=${env.GOOGLE_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(url.origin + '/sessions/new')}&response_type=code&scope=email profile`,
					302
				);
			}

			console.log('Authorization code:', code);

			// Exchange code for tokens

			console.log('Client ID:', env.GOOGLE_OAUTH_CLIENT_ID);
			console.log('Client Secret:', env.GOOGLE_OAUTH_CLIENT_SECRET);

			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					code,
					client_id: env.GOOGLE_OAUTH_CLIENT_ID,
					client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
					redirect_uri: url.origin + '/sessions/new',
					grant_type: 'authorization_code',
				}),
			});

			const tokenData = await tokenResponse.json();
			console.log('Token data:', tokenData);
			if (!tokenResponse.ok) {
				console.error('Error exchanging code:', tokenData);
				return new Response('Failed to exchange code: ' + tokenData.error, { status: 400 });
			}

			// Fetch user info using the access token
			const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});

			const userInfo = await userInfoResponse.json();
			console.log('User info:', userInfo);
			if (!userInfoResponse.ok) {
				return new Response('Failed to fetch user info', { status: 500 });
			}

			debugger;
			const userId = userInfo.email;
			const userObjId = env.USER.idFromName(userId);
			const userObj = env.USER.get(userObjId);
			await userObj.fetch(new Request('https://store-user', {
				method: 'POST',
				body: JSON.stringify({ tokens: tokenData, userInfo }),
			}));

			// Generate a session token
			const sessionToken = uuidv4();

			// Store sessionToken securely associated with userId in Durable Object
			await userObj.fetch(new Request('https://store-session', {
				method: 'POST',
				body: JSON.stringify({ sessionToken, userId }),
			}));

			const response = new Response(null, {
				status: 302,
				headers: {
					Location: 'http://localhost:3000',
					'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; Path=/; SameSite=Lax`
				}
			});

			return response;
		} else if (url.pathname === '/debug/state') {
			// const id = env.USER_SESSIONS.idFromName('unique-session-id');
			// const obj = env.USER_SESSIONS.get(id);
			// const state = await obj.fetch(new Request('https://state'));

			// const userSession = new UserSession(state, env);
			// const state = await userSession.state.storage.list();
			// const id = env.USER_SESSIONS.idFromName('unique-session-id');
			// const obj = env.USER_SESSIONS.get(id);
			// const state = await obj.fetch(new Request('https://state'));
			debugger;
			return new Response(JSON.stringify(Object.keys(env.USER_SESSIONS)), { headers: { 'Content-Type': 'application/json' } });
			// return new Response(JSON.stringify(ctx.state), { headers: { 'Content-Type': 'application/json' } });
		}
		return new Response('Hello World!');
	},
};
