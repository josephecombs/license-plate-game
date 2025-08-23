import { getCurrentMonthYear } from '../lib/utils.js';

/**
 * Debug and testing routes
 */

/**
 * Handle GET /debug-env - inspect environment variables
 */
export function handleDebugEnv(env) {
	const envDebug = {
		allKeys: Object.keys(env),
		awsAccessKey: env.AWS_ACCESS_KEY_ID ? env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET',
		awsSecretKey: env.AWS_SECRET_ACCESS_KEY ? env.AWS_SECRET_ACCESS_KEY.substring(0, 8) + '...' : 'NOT SET',
		notificationEmail: env.NOTIFICATION_EMAIL || 'NOT SET'
	};
	return new Response(JSON.stringify(envDebug, null, 2), { 
		headers: { 'Content-Type': 'application/json' } 
	});
}

/**
 * Handle GET/POST /debug-game - test game data storage
 */
export async function handleDebugGame(request, env) {
	const currentMonthYear = getCurrentMonthYear();
	console.log('🔍 /debug-game - Month/Year:', currentMonthYear);
	
	const gameObjId = env.GAME.idFromName(currentMonthYear);
	const gameObj = env.GAME.get(gameObjId);
	
	if (request.method === 'POST') {
		// Save test data
		const testData = { email: 'test@example.com', gameState: { visitedStates: ['01', '02'], test: true } };
		console.log('🔍 /debug-game - Saving test data:', testData);
		
		const saveResponse = await gameObj.fetch(new Request('https://save-game', {
			method: 'POST',
			body: JSON.stringify(testData),
		}));
		
		const savedData = await saveResponse.json();
		console.log('🔍 /debug-game - Save response:', savedData);
		
		return new Response(JSON.stringify({ 
			message: 'Test data saved',
			savedData: savedData,
			monthYear: currentMonthYear
		}), { headers: { 'Content-Type': 'application/json' } });
	} else {
		// Get all data
		const allUsersResponse = await gameObj.fetch(new Request('https://get-all-users', {
			method: 'POST',
			body: JSON.stringify({ dummy: 'data' })
		}));
		const allUsers = await allUsersResponse.json();
		
		return new Response(JSON.stringify({ 
			message: 'Debug game data',
			allUsers: allUsers,
			monthYear: currentMonthYear
		}), { headers: { 'Content-Type': 'application/json' } });
	}
}
