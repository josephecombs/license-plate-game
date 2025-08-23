/**
 * CORS handling utilities
 */

/**
 * Set CORS headers on a response based on environment and origin
 */
export function setCORSHeaders(response, env, request) {
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
