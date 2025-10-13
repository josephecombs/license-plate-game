import { v4 as uuidv4 } from 'uuid';

/**
 * OAuth and session management routes
 */

/**
 * Handle OAuth flow - redirect to Google or process callback
 */
export async function handleOAuth(request, env, url) {
	// Get the code from the URL parameters
	const code = url.searchParams.get('code');
	
	console.log('🔐 OAuth Debug - URL parsing:');
	console.log('  Full URL:', url.toString());
	console.log('  Search params:', url.search);
	console.log('  Code param:', code);
	console.log('  All search params:');
	for (const [key, value] of url.searchParams.entries()) {
		console.log(`    ${key}: ${value}`);
	}
	
	if (!code) {
		// Redirect to Google's OAuth consent screen
		const redirectUri = env.NODE_ENV === 'production' 
			? 'https://api.platechase.com/sessions/new' 
			: url.origin + '/sessions/new';
		console.log('🔄 No code found - redirecting to Google OAuth with redirect_uri:', redirectUri);
		return Response.redirect(
			`https://accounts.google.com/o/oauth2/auth?client_id=${env.GOOGLE_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email profile`,
			302
		);
	}

	console.log('🔄 Code found, proceeding with token exchange...');
	
	const redirectUri = env.NODE_ENV === 'production' 
		? 'https://api.platechase.com/sessions/new'
		: url.origin + '/sessions/new';
	
	console.log('🔄 Token exchange details:');
	console.log('  Code length:', code.length);
	console.log('  Code preview:', code.substring(0, 50) + '...');
	console.log('  Redirect URI:', redirectUri);
	console.log('  Client ID:', env.GOOGLE_OAUTH_CLIENT_ID);
	console.log('  Client Secret length:', env.GOOGLE_OAUTH_CLIENT_SECRET ? env.GOOGLE_OAUTH_CLIENT_SECRET.length : 'undefined');
	
	const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: env.GOOGLE_OAUTH_CLIENT_ID,
			client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code',
		}),
	});

	console.log('🔑 Token exchange response:');
	console.log('  Status:', tokenResponse.status);
	console.log('  Status text:', tokenResponse.statusText);
	try {
		console.log('  Headers:', Object.fromEntries(tokenResponse.headers.entries()));
	} catch (error) {
		console.log('  Headers: [unavailable]');
	}

	const tokenData = await tokenResponse.json();
	console.log('🔑 Token response data:', tokenData);
	
	if (!tokenResponse.ok) {
		console.error('❌ Token exchange failed:', tokenData);
		return new Response('Failed to exchange code: ' + tokenData.error, { status: 400 });
	}

	console.log('✅ Token exchange successful, fetching user info...');

	// Fetch user info using the access token
	const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${tokenData.access_token}` },
	});

	console.log('👤 User info response status:', userInfoResponse.status);

	const userInfo = await userInfoResponse.json();
	console.log('👤 User info:', userInfo);
	
	if (!userInfoResponse.ok) {
		console.error('❌ Failed to fetch user info:', userInfo);
		return new Response('Failed to fetch user info', { status: 500 });
	}

	console.log('✅ User info fetched successfully, creating user session...');

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
	
	console.log('🔄 Final redirect details:');
	console.log('  Node env:', env.NODE_ENV);
	console.log('  Redirect URL:', redirectUrl);
	console.log('  Session token:', sessionToken ? sessionToken.substring(0, 10) + '...' : null);
	console.log('  User ID:', userId);

	return new Response(null, {
		status: 302,
		headers: {
			Location: redirectUrl,
			'Set-Cookie': `session=${sessionToken}; Path=/; ${env.NODE_ENV === 'production' ? 'Domain=.platechase.com; ' : ''}Max-Age=${60 * 60 * 24 * 365 * 10}; SameSite=Lax`
		}
	});
}

/**
 * Handle Facebook OAuth flow - redirect to Facebook or process callback
 */
export async function handleFacebookOAuth(request, env, url) {
	// Get the code from the URL parameters
	const code = url.searchParams.get('code');
	
	console.log('🔐 Facebook OAuth Debug - URL parsing:');
	console.log('  Full URL:', url.toString());
	console.log('  Search params:', url.search);
	console.log('  Code param:', code);
	console.log('  All search params:');
	for (const [key, value] of url.searchParams.entries()) {
		console.log(`    ${key}: ${value}`);
	}
	
	if (!code) {
		// Redirect to Facebook's OAuth consent screen
		const redirectUri = env.NODE_ENV === 'production' 
			? 'https://api.platechase.com/sessions/facebook' 
			: url.origin + '/sessions/facebook';
		console.log('🔄 No code found - redirecting to Facebook OAuth with redirect_uri:', redirectUri);
		return Response.redirect(
			`https://www.facebook.com/v24.0/dialog/oauth?client_id=${env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email,public_profile`,
			302
		);
	}

	console.log('🔄 Code found, proceeding with Facebook token exchange...');
	
	const redirectUri = env.NODE_ENV === 'production' 
		? 'https://api.platechase.com/sessions/facebook'
		: url.origin + '/sessions/facebook';
	
	console.log('🔄 Facebook token exchange details:');
	console.log('  Code length:', code.length);
	console.log('  Code preview:', code.substring(0, 50) + '...');
	console.log('  Redirect URI:', redirectUri);
	console.log('  Facebook App ID:', env.FACEBOOK_APP_ID);
	console.log('  Facebook App Secret length:', env.FACEBOOK_APP_SECRET ? env.FACEBOOK_APP_SECRET.length : 'undefined');
	
	const tokenResponse = await fetch('https://graph.facebook.com/v24.0/oauth/access_token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: env.FACEBOOK_APP_ID,
			client_secret: env.FACEBOOK_APP_SECRET,
			redirect_uri: redirectUri,
		}),
	});

	console.log('🔑 Facebook token exchange response:');
	console.log('  Status:', tokenResponse.status);
	console.log('  Status text:', tokenResponse.statusText);
	try {
		console.log('  Headers:', Object.fromEntries(tokenResponse.headers.entries()));
	} catch (error) {
		console.log('  Headers: [unavailable]');
	}

	const tokenData = await tokenResponse.json();
	console.log('🔑 Facebook token response data:', tokenData);
	
	if (!tokenResponse.ok) {
		console.error('❌ Facebook token exchange failed:', tokenData);
		return new Response('Failed to exchange code: ' + tokenData.error, { status: 400 });
	}

	console.log('✅ Facebook token exchange successful, fetching user info...');

	// Fetch user info using the access token
	const userInfoResponse = await fetch(`https://graph.facebook.com/v24.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`);

	console.log('👤 Facebook user info response status:', userInfoResponse.status);

	const userInfo = await userInfoResponse.json();
	console.log('👤 Facebook user info:', userInfo);
	
	if (!userInfoResponse.ok) {
		console.error('❌ Failed to fetch Facebook user info:', userInfo);
		return new Response('Failed to fetch user info', { status: 500 });
	}

	console.log('✅ Facebook user info fetched successfully, creating user session...');

	// Transform Facebook user info to match Google format
	const transformedUserInfo = {
		email: userInfo.email,
		name: userInfo.name,
		picture: userInfo.picture?.data?.url,
		id: userInfo.id
	};

	const userId = transformedUserInfo.email;
	const userObjId = env.USER.idFromName(userId);
	const userObj = env.USER.get(userObjId);
	await userObj.fetch(new Request('https://store-user', {
		method: 'POST',
		body: JSON.stringify({ userInfo: transformedUserInfo }),
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
	
	console.log('🔄 Final redirect details:');
	console.log('  Node env:', env.NODE_ENV);
	console.log('  Redirect URL:', redirectUrl);
	console.log('  Session token:', sessionToken ? sessionToken.substring(0, 10) + '...' : null);
	console.log('  User ID:', userId);

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
