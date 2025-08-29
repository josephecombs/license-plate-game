import { DurableObject } from "cloudflare:workers";

/**
 * User Durable Object for storing user information
 */
export class User extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
	}

	async fetch(request) {
		const url = new URL(request.url);
		if (url.hostname === 'store-user' && request.method === 'POST') {
			const data = await request.json();
			// Initialize user with bannedAt set to null by default
			const userInfo = {
				...data.userInfo,
				bannedAt: null
			};
			await this.ctx.storage.put('user', userInfo);
			return new Response('User stored successfully');
		} else if (url.hostname === 'get-user' && request.method === 'GET') {
			const userData = await this.ctx.storage.get('user');
			return new Response(JSON.stringify(userData), { headers: { 'Content-Type': 'application/json' } });
		} else if (url.hostname === 'ban-user' && request.method === 'POST') {
			// Ban user by setting bannedAt to current Unix epoch time
			const userData = await this.ctx.storage.get('user');
			if (userData) {
				userData.bannedAt = Math.floor(Date.now() / 1000); // Unix epoch time
				await this.ctx.storage.put('user', userData);
				return new Response(JSON.stringify({ 
					success: true, 
					message: 'User banned successfully',
					bannedAt: userData.bannedAt
				}), { headers: { 'Content-Type': 'application/json' } });
			} else {
				return new Response(JSON.stringify({ error: 'User not found' }), { 
					status: 404, 
					headers: { 'Content-Type': 'application/json' } 
				});
			}
		} else if (url.hostname === 'unban-user' && request.method === 'POST') {
			// Unban user by setting bannedAt to null
			const userData = await this.ctx.storage.get('user');
			if (userData) {
				userData.bannedAt = null;
				await this.ctx.storage.put('user', userData);
				return new Response(JSON.stringify({ 
					success: true, 
					message: 'User unbanned successfully',
					bannedAt: userData.bannedAt
				}), { headers: { 'Content-Type': 'application/json' } });
			} else {
				return new Response(JSON.stringify({ error: 'User not found' }), { 
					status: 404, 
					headers: { 'Content-Type': 'application/json' } 
				});
			}
		}

		return new Response('Not found', { status: 404 });
	}
}
