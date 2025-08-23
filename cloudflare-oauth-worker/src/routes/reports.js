import { getEmailFromSessionToken, isAdmin } from '../lib/auth.js';
import { anonymizeEmail } from '../lib/utils.js';
import { getCurrentMonthYear } from '../lib/utils.js';

/**
 * Reports and data retrieval routes
 */

/**
 * Handle GET /reports - admin gets full data, others get anonymized data
 */
export async function handleReports(request, env) {
	const sessionToken = request.headers.get('Authorization');
	if (!sessionToken) {
		return new Response(JSON.stringify({ error: 'No session token provided' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
	}

	const email = await getEmailFromSessionToken(sessionToken, env);
	if (!email) {
		return new Response(JSON.stringify({ error: 'Invalid session token' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
	}

	// Get all game data from current month
	const currentMonthYear = getCurrentMonthYear();
	console.log('📊 /reports - Month/Year:', currentMonthYear);
	const gameObjId = env.GAME.idFromName(currentMonthYear);
	const gameObj = env.GAME.get(gameObjId);
	
	// Get the full game data directly
	const gameDataResponse = await gameObj.fetch(new Request('https://get-all-users', {
		method: 'POST',
		body: JSON.stringify({ dummy: 'data' })
	}));
	const gameData = await gameDataResponse.json();
	console.log('📊 /reports - Retrieved game data:', gameData);
	
	// Check if user is admin
	const adminStatus = isAdmin(email);
	
	// Anonymize email addresses for non-admin users
	const processedGameData = adminStatus ? gameData : gameData.map(user => ({
		...user,
		email: anonymizeEmail(user.email)
	}));
	
	return new Response(JSON.stringify({ 
		message: adminStatus ? 'Authenticated as Admin' : 'Authenticated as User',
		monthYear: currentMonthYear,
		gameData: processedGameData
	}), { headers: { 'Content-Type': 'application/json' } });
}
