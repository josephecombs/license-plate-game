/**
 * CORS handling utilities
 */

/**
 * Set CORS headers on a response based on environment and origin
 */
export function setCORSHeaders(response, env, request) {
	console.log('🔍 CORS DEBUG - Original response status:', response.status);
	console.log('🔍 CORS DEBUG - Original response statusText:', response.statusText);
	
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
	
	// Try to preserve the original response properties more explicitly
	const newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders
	});
	
	console.log('🔍 CORS DEBUG - New response status:', newResponse.status);
	console.log('🔍 CORS DEBUG - New response statusText:', newResponse.statusText);
	
	return newResponse;
}
