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

// State mapping for readable names
const STATE_NAMES = {
	'01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
	'08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
	'12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
	'18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
	'23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
	'28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
	'33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
	'37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
	'41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
	'46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
	'51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
};

// Helper function to send email notifications using AWS SES
async function sendStateChangeEmail(env, userEmail, userName, action, stateId, previousStates, newStates) {
	const stateName = STATE_NAMES[stateId] || stateId;
	const timestamp = new Date().toLocaleString();
	const previousCount = previousStates.length;
	const newCount = newStates.length;
	
	const subject = `Plate Chase - State ${action}: ${stateName}`;
	
	const body = `
Hello from Plate Chase!

${userName} (${userEmail}) has ${action.toLowerCase()} ${stateName} from their license plate collection.

Details:
- Action: ${action}
- State: ${stateName}
- Previous total: ${previousCount} states
- New total: ${newCount} states
- Timestamp: ${timestamp}

Keep up the great work spotting those license plates!

Best regards,
The Plate Chase Team
`;

	// Log the email details for debugging
	console.log(`📧 Email notification:`);
	console.log(`   To: ${env.NOTIFICATION_EMAIL}`);
	console.log(`   From: support@platechase.com`);
	console.log(`   Subject: ${subject}`);

	try {
		// Send email using AWS SES
		const sesResponse = await fetch('https://email.us-east-1.amazonaws.com', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
				'Authorization': `AWS4-HMAC-SHA256 Credential=${env.AWS_ACCESS_KEY_ID}/${new Date().toISOString().slice(0, 10)}/us-east-1/ses/aws4_request`
			},
			body: new URLSearchParams({
				Action: 'SendEmail',
				Source: 'support@platechase.com',
				Destination: `ToAddresses=${env.NOTIFICATION_EMAIL}`,
				Message: `Subject=${subject}&Body.Text=${encodeURIComponent(body)}`
			})
		});

		if (sesResponse.ok) {
			console.log(`✅ Email notification sent for ${action} of ${stateName} by ${userEmail}`);
		} else {
			console.error('❌ Failed to send email notification:', await sesResponse.text());
		}
	} catch (error) {
		console.error('❌ Failed to send email notification:', error);
	}
}

// Helper function to detect state changes
function detectStateChanges(previousStates, newStates) {
	const previousSet = new Set(previousStates);
	const newSet = new Set(newStates);
	
	const added = newStates.filter(state => !previousSet.has(state));
	const removed = previousStates.filter(state => !newSet.has(state));
	
	return { added, removed };
}

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
		const url = new URL(request.url);
		const { email, gameState } = await request.json();

		let gameData = await this.ctx.storage.get('gameData') || {};

		if (url.hostname === 'save-game') {
			gameData[email] = gameState;
			await this.ctx.storage.put('gameData', gameData);
			return new Response(JSON.stringify(gameData[email]), { headers: { 'Content-Type': 'application/json' } });
		} else if (url.hostname === 'get-game') {
			const userGameState = gameData[email] || {};
			return new Response(JSON.stringify(userGameState), { headers: { 'Content-Type': 'application/json' } });
		}

		return new Response('Method not allowed', { status: 405 });
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

function setCORSHeaders(response, env, request) {
	const newHeaders = new Headers(response.headers);
	const allowedOrigins = env.NODE_ENV === 'production' 
		? ['https://www.platechase.com', 'https://api.platechase.com'] 
		: ['http://localhost:3000'];
	const origin = request.headers.get('Origin');
	if (allowedOrigins.includes(origin)) {
		newHeaders.set('Access-Control-Allow-Origin', origin);
	}
	newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
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

		let response;

		if (url.pathname === '/sessions/new') {
			const code = url.searchParams.get('code');
			if (!code) {
				// Redirect to Google's OAuth consent screen
				return Response.redirect(
					`https://accounts.google.com/o/oauth2/auth?client_id=${env.GOOGLE_OAUTH_CLIENT_ID}&redirect_uri=${
						encodeURIComponent(
							env.NODE_ENV === 'production' 
								? 'https://api.platechase.com/sessions/new' 
								: url.origin + '/sessions/new'
						)
					}&response_type=code&scope=email profile`,
					302
				);
			}

			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					code,
					client_id: env.GOOGLE_OAUTH_CLIENT_ID,
					client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
					redirect_uri: env.NODE_ENV === 'production' 
						? 'https://api.platechase.com/sessions/new'
						: url.origin + '/sessions/new',
					grant_type: 'authorization_code',
				}),
			});

			const tokenData = await tokenResponse.json();
			if (!tokenResponse.ok) {
				console.error('Error exchanging code:', tokenData);
				return new Response('Failed to exchange code: ' + tokenData.error, { status: 400 });
			}

			// Fetch user info using the access token
			const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});

			const userInfo = await userInfoResponse.json();
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

			const redirectUrl = env.NODE_ENV === 'production' ? 'https://www.platechase.com' : 'http://localhost:3000';

			response = new Response(null, {
				status: 302,
				headers: {
					Location: redirectUrl,
					'Set-Cookie': `session=${sessionToken}; Path=/; ${env.NODE_ENV === 'production' ? 'Domain=.platechase.com; ' : ''}Max-Age=${60 * 60 * 24 * 365 * 10}; SameSite=Lax`
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
					if (request.method === 'GET') {
						const currentMonthYear = new Date().toLocaleString('default', { month: 'long' }) + '-' + new Date().getFullYear();
						const gameObjId = env.GAME.idFromName(currentMonthYear);
						const gameObj = env.GAME.get(gameObjId);

						const gameResponse = await gameObj.fetch(new Request('https://get-game', {
							method: 'POST',
							body: JSON.stringify({ email }),
						}));

						const gameData = await gameResponse.json();
						response = new Response(JSON.stringify(gameData), { headers: { 'Content-Type': 'application/json' } });
					} else if (request.method === 'PUT') {
						const gameState = await request.json();
						const currentMonthYear = new Date().toLocaleString('default', { month: 'long' }) + '-' + new Date().getFullYear();
						const gameObjId = env.GAME.idFromName(currentMonthYear);
						const gameObj = env.GAME.get(gameObjId);
						
						// Get previous game state to detect changes
						const previousGameResponse = await gameObj.fetch(new Request('https://get-game', {
							method: 'POST',
							body: JSON.stringify({ email }),
						}));
						const previousGameData = await previousGameResponse.json();
						const previousStates = previousGameData.visitedStates || [];
						const newStates = gameState.visitedStates || [];
						
						// Detect state changes
						const { added, removed } = detectStateChanges(previousStates, newStates);
						
						// Save the new game state
						const saveResponse = await gameObj.fetch(new Request('https://save-game', {
							method: 'POST',
							body: JSON.stringify({ email, gameState }),
						}));

						const savedGameState = await saveResponse.json();
						
						// Get user info for email notifications
						const userObjId = env.USER.idFromName(email);
						const userObj = env.USER.get(userObjId);
						const userResponse = await userObj.fetch(new Request('https://get-user'));
						const userData = await userResponse.json();
						const userName = userData.name || email;
						
						// Send email notifications for state changes
						for (const stateId of added) {
							await sendStateChangeEmail(env, email, userName, 'ADDED', stateId, previousStates, newStates);
						}
						
						for (const stateId of removed) {
							await sendStateChangeEmail(env, email, userName, 'REMOVED', stateId, previousStates, newStates);
						}
						
						response = new Response(JSON.stringify(savedGameState), { headers: { 'Content-Type': 'application/json' } });
					} else {
						response = new Response(JSON.stringify({ error: 'Unsupported request method' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
					}
				} else {
					response = new Response(JSON.stringify({ error: 'Invalid session token' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
				}
			}
		} else {
			response = new Response('Hello World!');
		}
		return setCORSHeaders(response, env, request);
	},
};
