import { getEmailFromSessionToken, isAdmin } from '../lib/auth.js';
import { detectStateChanges } from '../lib/utils.js';
import { sendStateChangeEmail } from '../lib/email.js';
import { getCurrentMonthYear } from '../lib/utils.js';

/**
 * Game-related routes
 */

/**
 * Handle GET /game - retrieve user's game state
 */
export async function handleGetGame(request, env) {
	const sessionToken = request.headers.get('Authorization');
	if (!sessionToken) {
		return new Response(JSON.stringify({ error: 'No session token provided' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
	}

	const email = await getEmailFromSessionToken(sessionToken, env);
	if (!email) {
		return new Response(JSON.stringify({ error: 'Invalid session token' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
	}

	const currentMonthYear = getCurrentMonthYear();
	console.log('🎮 GET /game - Month/Year:', currentMonthYear);
	const gameObjId = env.GAME.idFromName(currentMonthYear);
	const gameObj = env.GAME.get(gameObjId);

	const gameResponse = await gameObj.fetch(new Request('https://get-game', {
		method: 'POST',
		body: JSON.stringify({ email }),
	}));

	const gameData = await gameResponse.json();
	console.log('🎮 GET /game - Retrieved data:', gameData);
	return new Response(JSON.stringify(gameData), { headers: { 'Content-Type': 'application/json' } });
}

/**
 * Handle PUT /game - update user's game state
 */
export async function handlePutGame(request, env) {
	const sessionToken = request.headers.get('Authorization');
	if (!sessionToken) {
		return new Response(JSON.stringify({ error: 'No session token provided' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
	}

	const email = await getEmailFromSessionToken(sessionToken, env);
	if (!email) {
		return new Response(JSON.stringify({ error: 'Invalid session token' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
	}

	const gameState = await request.json();
	const currentMonthYear = getCurrentMonthYear();
	console.log('🎮 PUT /game - Month/Year:', currentMonthYear);
	console.log('🎮 PUT /game - Game state to save:', gameState);
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
	
	return new Response(JSON.stringify(savedGameState), { headers: { 'Content-Type': 'application/json' } });
}
