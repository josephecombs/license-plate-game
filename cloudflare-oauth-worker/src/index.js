/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { DurableObject } from "cloudflare:workers";
import { v4 as uuidv4 } from 'uuid';

// Define the User Durable Object
export class User extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
	}

	async fetch(request) {
		const url = new URL(request.url);
		if (url.hostname === 'store-user' && request.method === 'POST') {
			const data = await request.json();
			await this.ctx.storage.put('user', data.userInfo);
			return new Response('User stored successfully');
		} else if (url.hostname === 'get-user' && request.method === 'GET') {
			const userData = await this.ctx.storage.get('user');
			return new Response(JSON.stringify(userData), { headers: { 'Content-Type': 'application/json' } });
		}

		return new Response('Not found', { status: 404 });
	}
}

// Define the Game Durable Object
export class Game extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
	}

	async fetch(request) {
		// Handle game state management
		return new Response('Game state handling');
	}
}

// Define the UserSession Durable Object
export class UserSession extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
	}

	// this is a class that is essentially a uuid key
	// and a value which is the email address of the user

	async fetch(request) {
		const url = new URL(request.url);
		if (url.hostname === 'store-session' && request.method === 'POST') {
			const data = await request.json();
			await this.ctx.storage.put('email', data['email']);
			return new Response('token-email pair stored successfully');
		} else if (url.hostname === 'get-user-session' && request.method === 'GET') {
			const sessionData = await this.ctx.storage.get('email');
			return new Response(JSON.stringify({email: sessionData}), { headers: { 'Content-Type': 'application/json' } });
		}

		return new Response('Not found', { status: 404 });
	}
}

function setCORSHeaders(response) {
	const newHeaders = new Headers(response.headers);
	newHeaders.set('Access-Control-Allow-Origin', 'http://localhost:3000');
	newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	return new Response(response.body, {
		...response,
		headers: newHeaders
	});
}

async function getEmailFromSessionToken(sessionToken, env) {
	const userSessionId = env.USER_SESSIONS.idFromName(sessionToken);
	const userSessionObj = env.USER_SESSIONS.get(userSessionId);
	const sessionResponse = await userSessionObj.fetch(new Request('https://get-user-session'));
	const sessionData = await sessionResponse.json();
	return sessionData.email;
}

// Update OAuth flow to store user info in User Durable Object
export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		console.log('Received request at:', url.pathname);
		let response;

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

			const userId = userInfo.email;
			const userObjId = env.USER.idFromName(userId);
			const userObj = env.USER.get(userObjId);
			await userObj.fetch(new Request('https://store-user', {
				method: 'POST',
				body: JSON.stringify({ userInfo }),
			}));

			// Generate a session token
			const sessionToken = uuidv4();

			const sessionObjId = env.USER_SESSIONS.idFromName(sessionToken);
			const sessionObj = env.USER_SESSIONS.get(sessionObjId);

			// Store sessionToken securely associated with userId in Durable Object
			await sessionObj.fetch(new Request('https://store-session', {
				method: 'POST',
				body: JSON.stringify({ 'email': userId }),
			}));

			response = new Response(null, {
				status: 302,
				headers: {
					Location: 'http://localhost:3000',
					'Set-Cookie': `session=${sessionToken}; Path=/; Max-Age=${60 * 60 * 24 * 365 * 10}; SameSite=Lax`
				}
			});

			//// maybe don't need to setCORSHeaders?
			return response;
			// const id = env.USER_SESSIONS.idFromName('unique-session-id');
			// const obj = env.USER_SESSIONS.get(id);
			// const state = await obj.fetch(new Request('https://state'));

			// const userSession = new UserSession(state, env);
			// const state = await userSession.state.storage.list();
			// const id = env.USER_SESSIONS.idFromName('unique-session-id');
			// const obj = env.USER_SESSIONS.get(id);
			// const state = await obj.fetch(new Request('https://state'));
			// response = new Response(JSON.stringify(Object.keys(env.USER_SESSIONS)), { headers: { 'Content-Type': 'application/json' } });
			// return new Response(JSON.stringify(ctx.state), { headers: { 'Content-Type': 'application/json' } });
		} else if (url.pathname === '/validate-session') {
			const sessionToken = await request.text();

			console.log('sessionToken');
			console.log(sessionToken);


			if (!sessionToken) {
				return new Response(JSON.stringify({ valid: false }), { status: 400, headers: { 'Content-Type': 'application/json' } });
			}

			// Retrieve user session from Durable Object
			const userSessionId = env.USER_SESSIONS.idFromName(sessionToken);
			const userSessionObj = env.USER_SESSIONS.get(userSessionId);
			
			const sessionResponse = await userSessionObj.fetch(new Request('https://get-user-session'));

			const sessionData = await sessionResponse.json();

			if (sessionData && sessionData.email) {
				const userObjId = env.USER.idFromName(sessionData.email);
				const userObj = env.USER.get(userObjId);
				const userResponse = await userObj.fetch(new Request('https://get-user'));
				const userData = await userResponse.json();

				response = new Response(JSON.stringify({ valid: true, user: userData }), { headers: { 'Content-Type': 'application/json' } });
			} else {
				response = new Response(JSON.stringify({ valid: false }), { headers: { 'Content-Type': 'application/json' } });
			}
		} else if (url.pathname === '/game') {
			// need to verify this route actually works
			// eventually this should be made generic
			const sessionToken = request.headers.get('Authorization');
			if (!sessionToken) {
				response = new Response(JSON.stringify({ error: 'No session token provided' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
			} else {
				const email = await getEmailFromSessionToken(sessionToken, env);
				if (email) {
					const gameObjId = env.GAME.idFromName('game-state');
					const gameObj = env.GAME.get(gameObjId);
					const gameResponse = await gameObj.fetch(request);
					response = gameResponse;
				} else {
					response = new Response(JSON.stringify({ error: 'Invalid session token' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
				}
			}
		} else {
			response = new Response('Hello World!');
		}
		return setCORSHeaders(response);
	},
};
