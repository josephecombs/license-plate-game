import { v4 as uuidv4 } from 'uuid';

/**
 * OAuth and session management routes
 */

/**
 * Handle OAuth flow - redirect to Google or process callback
 */
export async function handleOAuth(request, env, url) {
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

	return new Response(null, {
		status: 302,
		headers: {
			Location: redirectUrl,
			'Set-Cookie': `session=${sessionToken}; Path=/; ${env.NODE_ENV === 'production' ? 'Domain=.platechase.com; ' : ''}Max-Age=${60 * 60 * 24 * 365 * 10}; SameSite=Lax`
		}
	});
}

/**
 * Handle session validation
 */
export async function handleSessionValidation(request, env) {
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

		return new Response(JSON.stringify({ valid: true, user: userData }), { headers: { 'Content-Type': 'application/json' } });
	} else {
		return new Response(JSON.stringify({ valid: false }), { headers: { 'Content-Type': 'application/json' } });
	}
}
