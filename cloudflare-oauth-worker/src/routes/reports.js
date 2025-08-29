import { getEmailFromSessionToken, isAdmin, validateSession } from '../lib/auth.js';
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
	const gameDataResponse = await gameObj.fetch(new Request('https://get-all-games', {
		method: 'POST',
		body: JSON.stringify({ dummy: 'data' })
	}));
	const gameData = await gameDataResponse.json();
	console.log('📊 /reports - Retrieved game data:', gameData);
	
	// Handle null or undefined game data
	if (!gameData || !Array.isArray(gameData)) {
		return new Response(JSON.stringify({ 
			message: 'No game data available',
			monthYear: currentMonthYear,
			gameData: []
		}), { headers: { 'Content-Type': 'application/json' } });
	}
	
	// Check if user is admin
	const adminStatus = await isAdmin(email);
	
	// For admin users, also fetch ban status from User DO for each user
	let processedGameData = gameData;
	if (adminStatus) {
		// Fetch ban status for each user
		const usersWithBanStatus = await Promise.all(
			gameData.map(async (user) => {
				try {
					const userObjId = env.USER.idFromName(user.email);
					const userObj = env.USER.get(userObjId);
					const userResponse = await userObj.fetch(new Request('https://get-user'));
					const userData = await userResponse.json();
					
					return {
						...user,
						bannedAt: userData?.bannedAt || null
					};
				} catch (error) {
					console.error(`Error fetching ban status for ${user.email}:`, error);
					return {
						...user,
						bannedAt: null
					};
				}
			})
		);
		processedGameData = usersWithBanStatus;
	}
	
	// Anonymize email addresses for non-admin users
	if (!adminStatus) {
		processedGameData = processedGameData.map(user => ({
			...user,
			email: anonymizeEmail(user.email)
		}));
	}
	
	return new Response(JSON.stringify({ 
		message: adminStatus ? 'Authenticated as Admin' : 'Authenticated as User',
		monthYear: currentMonthYear,
		gameData: processedGameData
	}), { headers: { 'Content-Type': 'application/json' } });
}


