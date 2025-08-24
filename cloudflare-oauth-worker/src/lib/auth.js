import { DurableObject } from "cloudflare:workers";

/**
 * Authentication and session management utilities
 */

/**
 * Get email from session token by querying the UserSession Durable Object
 */
export async function getEmailFromSessionToken(sessionToken, env) {
	const userSessionId = env.USER_SESSIONS.idFromName(sessionToken);
	const userSessionObj = env.USER_SESSIONS.get(userSessionId);
	const sessionResponse = await userSessionObj.fetch(new Request('https://get-user-session'));
	const sessionData = await sessionResponse.json();
	
	// Handle null or undefined session data
	if (!sessionData) {
		return null;
	}
	
	// Return null if email is missing or undefined
	return sessionData.email || null;
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(email) {
	return email === 'joseph.e.combs@gmail.com';
}

/**
 * Validate session token and return user data if valid
 */
export async function validateSession(sessionToken, env) {
	if (!sessionToken) {
		return { valid: false, error: 'No session token provided' };
	}

	const email = await getEmailFromSessionToken(sessionToken, env);
	if (!email) {
		return { valid: false, error: 'Invalid session token' };
	}

	const userObjId = env.USER.idFromName(email);
	const userObj = env.USER.get(userObjId);
	const userResponse = await userObj.fetch(new Request('https://get-user'));
	const userData = await userResponse.json();

	return { valid: true, user: userData, email };
}
