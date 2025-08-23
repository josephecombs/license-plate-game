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
			await this.ctx.storage.put('user', data.userInfo);
			return new Response('User stored successfully');
		} else if (url.hostname === 'get-user' && request.method === 'GET') {
			const userData = await this.ctx.storage.get('user');
			return new Response(JSON.stringify(userData), { headers: { 'Content-Type': 'application/json' } });
		}

		return new Response('Not found', { status: 404 });
	}
}
