import { getEmailFromSessionToken, isAdmin } from '../lib/auth.js';

/**
 * User management routes
 */

/**
 * Handle PUT /users/ban - ban a user
 */
export async function handleBanUser(request, env) {
	const sessionToken = request.headers.get('Authorization');
	if (!sessionToken) {
		return new Response(JSON.stringify({ error: 'No session token provided' }), { 
			status: 401, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	const email = await getEmailFromSessionToken(sessionToken, env);
	if (!email) {
		return new Response(JSON.stringify({ error: 'Invalid session token' }), { 
			status: 403, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	// Check if user is admin
	if (!isAdmin(email)) {
		return new Response(JSON.stringify({ error: 'Admin access required' }), { 
			status: 403, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	const { email: userEmail } = await request.json();
	if (!userEmail) {
		return new Response(JSON.stringify({ error: 'Email is required' }), { 
			status: 400, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	// Ban the user by calling the User Durable Object
	const userObjId = env.USER.idFromName(userEmail);
	const userObj = env.USER.get(userObjId);

	const banResponse = await userObj.fetch(new Request('https://ban-user', {
		method: 'POST',
	}));

	const banResult = await banResponse.json();
	
	if (banResult.success) {
		return new Response(JSON.stringify(banResult), { 
			headers: { 'Content-Type': 'application/json' } 
		});
	} else {
		return new Response(JSON.stringify({ error: 'Failed to ban user' }), { 
			status: 500, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}
}

/**
 * Handle PUT /users/unban - unban a user
 */
export async function handleUnbanUser(request, env) {
	const sessionToken = request.headers.get('Authorization');
	if (!sessionToken) {
		return new Response(JSON.stringify({ error: 'No session token provided' }), { 
			status: 401, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	const email = await getEmailFromSessionToken(sessionToken, env);
	if (!email) {
		return new Response(JSON.stringify({ error: 'Invalid session token' }), { 
			status: 403, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	// Check if user is admin
	if (!isAdmin(email)) {
		return new Response(JSON.stringify({ error: 'Admin access required' }), { 
			status: 403, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	const { email: userEmail } = await request.json();
	if (!userEmail) {
		return new Response(JSON.stringify({ error: 'Email is required' }), { 
			status: 400, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}

	// Unban the user by calling the User Durable Object
	const userObjId = env.USER.idFromName(userEmail);
	const userObj = env.USER.get(userObjId);

	const unbanResponse = await userObj.fetch(new Request('https://unban-user', {
		method: 'POST',
	}));

	const unbanResult = await unbanResponse.json();
	
	if (unbanResult.success) {
		return new Response(JSON.stringify(unbanResult), { 
			headers: { 'Content-Type': 'application/json' } 
		});
	} else {
		return new Response(JSON.stringify({ error: 'Failed to unban user' }), { 
			status: 500, 
			headers: { 'Content-Type': 'application/json' } 
		});
	}
}
