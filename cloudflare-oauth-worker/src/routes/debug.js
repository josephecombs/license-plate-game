import { getCurrentMonthYear } from '../lib/utils.js';
import { validateSession, isAdmin, getEmailFromSessionToken } from '../lib/auth.js';

/**
 * Debug and testing routes
 */

/**
 * Handle GET /debug-env - inspect environment variables
 */
export async function handleDebugEnv(request, env, context) {
	// Extract session token from cookie
	const cookieHeader = request.headers.get('Cookie');
	const sessionToken = cookieHeader ? 
		cookieHeader.split(';')
			.find(c => c.trim().startsWith('session='))
			?.split('=')[1] : null;

	// Validate session
	if (!sessionToken) {
		return new Response(JSON.stringify({ error: 'Unauthorized - No session cookie' }), { 
			status: 401, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	const sessionValidation = await validateSession(sessionToken, env);
	if (!sessionValidation.valid) {
		return new Response(JSON.stringify({ error: 'Unauthorized - Invalid session' }), { 
			status: 401, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	// Check admin privileges
	const adminStatus = await isAdmin(sessionValidation.email);
	if (!adminStatus) {
		return new Response(JSON.stringify({ error: 'Admin access required' }), { 
			status: 403, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	// Build environment debug info
	const environment = {};
	
	// Add all environment variables
	Object.keys(env).forEach(key => {
		if (key === 'CLIENT_SECRET' || key === 'AWS_SECRET_ACCESS_KEY' || key === 'AWS_ACCESS_KEY_ID') {
			environment[key] = '***'; // Mask sensitive values
		} else {
			environment[key] = env[key];
		}
	});

	return new Response(JSON.stringify({ environment }, null, 2), { 
		status: 200,
		headers: { 'Content-Type': 'application/json' } 
	});
}

/**
 * Handle GET/POST /debug-game - test game data storage
 */
export async function handleDebugGame(request, env, context) {
	// Extract session token from cookie
	const cookieHeader = request.headers.get('Cookie');
	const sessionToken = cookieHeader ? 
		cookieHeader.split(';')
			.find(c => c.trim().startsWith('session='))
			?.split('=')[1] : null;

	// Validate session
	if (!sessionToken) {
		return new Response(JSON.stringify({ error: 'Unauthorized - No session cookie' }), { 
			status: 401, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	const sessionValidation = await validateSession(sessionToken, env);
	if (!sessionValidation.valid) {
		return new Response(JSON.stringify({ error: 'Unauthorized - Invalid session' }), { 
			status: 401, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	// Check admin privileges
	const adminStatus = await isAdmin(sessionValidation.email);
	if (!adminStatus) {
		return new Response(JSON.stringify({ error: 'Admin access required' }), { 
			status: 403, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	const currentMonthYear = getCurrentMonthYear();
	console.log('🔍 /debug-game - Month/Year:', currentMonthYear);
	
	// Check if GAME object exists in env
	if (!env.GAME) {
		return new Response(JSON.stringify({ 
			error: 'GAME object not available in environment',
			availableKeys: Object.keys(env)
		}), { 
			status: 500, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}
	
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
			debug: {
				gamesNamespace: env.GAMES || 'NOT_SET',
				userSessionsNamespace: env.USER_SESSIONS || 'NOT_SET',
				timestamp: new Date().toISOString(),
				environment: 'development',
				version: '1.0.0',
				monthYear: currentMonthYear,
				allUsers: allUsers
			}
		}), { headers: { 'Content-Type': 'application/json' } });
	}
}
