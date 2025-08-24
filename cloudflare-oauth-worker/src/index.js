/**
 * Main Cloudflare Worker entry point
 * 
 * This file now serves as a router/dispatcher that delegates to specialized modules
 */

// Import Durable Object classes
export { User } from './durable-objects/User.js';
export { Game } from './durable-objects/Game.js';
export { UserSession } from './userSession.js';

// Import route handlers
import { handleOAuth, handleSessionValidation } from './routes/auth.js';
import { handleGetGame, handlePutGame } from './routes/game.js';
import { handleBanUser, handleUnbanUser } from './routes/users.js';
import { handleReports } from './routes/reports.js';
import { handleDebugEnv, handleDebugGame } from './routes/debug.js';

// Import utilities
import { setCORSHeaders } from './lib/cors.js';

// Log environment variables on first request
let envLogged = false;

export default {
	async fetch(request, env, ctx) {
		// Log all environment variables on first request
		if (!envLogged) {
			console.log('🚀 SERVER START - All environment variables:');
			console.log('🔑 AWS_ACCESS_KEY_ID:', env.AWS_ACCESS_KEY_ID);
			console.log('🔑 AWS_SECRET_ACCESS_KEY:', env.AWS_SECRET_ACCESS_KEY);
			console.log('📧 NOTIFICATION_EMAIL:', env.NOTIFICATION_EMAIL);
			console.log('🔍 All env keys:', Object.keys(env));
			console.log('🔍 All env values:', Object.keys(env).map(key => `${key}: ${env[key]}`));
			console.log('🔍 Type of AWS_ACCESS_KEY_ID:', typeof env.AWS_ACCESS_KEY_ID);
			console.log('🔍 Length of AWS_ACCESS_KEY_ID:', env.AWS_ACCESS_KEY_ID ? env.AWS_ACCESS_KEY_ID.length : 'undefined');
			envLogged = true;
		}

		const url = new URL(request.url);
		let response;

		// Route requests to appropriate handlers
		if (url.pathname === '/sessions/new') {
			response = await handleOAuth(request, env, url);
		} else if (url.pathname === '/validate-session') {
			response = await handleSessionValidation(request, env);
		} else if (url.pathname === '/game') {
			if (request.method === 'GET') {
				response = await handleGetGame(request, env);
			} else if (request.method === 'PUT') {
				response = await handlePutGame(request, env);
			} else {
				response = new Response(JSON.stringify({ error: 'Unsupported request method' }), { 
					status: 405, 
					headers: { 'Content-Type': 'application/json' } 
				});
			}
		} else if (url.pathname === '/users/ban') {
			if (request.method === 'PUT') {
				response = await handleBanUser(request, env);
			} else {
				response = new Response(JSON.stringify({ error: 'Method not allowed' }), { 
					status: 405, 
					headers: { 'Content-Type': 'application/json' } 
				});
			}
		} else if (url.pathname === '/users/unban') {
			if (request.method === 'PUT') {
				response = await handleUnbanUser(request, env);
			} else {
				response = new Response(JSON.stringify({ error: 'Method not allowed' }), { 
					status: 405, 
					headers: { 'Content-Type': 'application/json' } 
				});
			}
		} else if (url.pathname === '/reports') {
			response = await handleReports(request, env);
		} else if (url.pathname === '/debug-env') {
			response = await handleDebugEnv(request, env, ctx);
		} else if (url.pathname === '/debug-game') {
			response = await handleDebugGame(request, env, ctx);
		} else {
			response = new Response(JSON.stringify({ error: 'Not found' }), { 
				status: 404, 
				headers: { 'Content-Type': 'application/json' } 
			});
		}

		// Apply CORS headers and return response
		return setCORSHeaders(response, env, request);
	},
};
