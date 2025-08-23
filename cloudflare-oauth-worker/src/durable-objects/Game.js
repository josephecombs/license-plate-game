import { DurableObject } from "cloudflare:workers";

/**
 * Game Durable Object for managing game state and user data
 */
export class Game extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
	}

	async fetch(request) {
		const url = new URL(request.url);
		let gameData = await this.ctx.storage.get('gameData') || {};
		
		console.log('🎮 Game Durable Object accessed:');
		console.log('   URL hostname:', url.hostname);
		console.log('   Current gameData:', gameData);
		console.log('   Storage keys:', await this.ctx.storage.list());

		if (url.hostname === 'save-game') {
			const { email, gameState } = await request.json();
			console.log('💾 Saving game data:');
			console.log('   Email:', email);
			console.log('   Game state:', gameState);
			gameData[email] = gameState;
			await this.ctx.storage.put('gameData', gameData);
			console.log('✅ Game data saved. Updated gameData:', gameData);
			return new Response(JSON.stringify(gameData[email]), { headers: { 'Content-Type': 'application/json' } });
		} else if (url.hostname === 'get-game') {
			const { email } = await request.json();
			console.log('📖 Retrieving game data for email:', email);
			const userGameState = gameData[email] || {};
			console.log('📖 Retrieved game state:', userGameState);
			return new Response(JSON.stringify(userGameState), { headers: { 'Content-Type': 'application/json' } });
		} else if (url.hostname === 'get-all-users') {
			// Return structured data with user emails and their game data
			const users = [];
			console.log('Current gameData:', gameData);
			for (const userEmail of Object.keys(gameData)) {
				users.push({
					email: userEmail,
					gameData: gameData[userEmail],
				});
			}
			return new Response(JSON.stringify(users), { headers: { 'Content-Type': 'application/json' } });
		} else if (url.hostname === 'ban-user') {
			// Ban user by setting bannedAt to current UTC time
			const { email } = await request.json();
			console.log('🚫 Banning user:', email);
			
			if (gameData[email]) {
				gameData[email].bannedAt = new Date().toISOString();
				await this.ctx.storage.put('gameData', gameData);
				console.log('✅ User banned:', email, 'at:', gameData[email].bannedAt);
				
				return new Response(JSON.stringify({ 
					success: true, 
					message: `User ${email} has been banned`,
					bannedAt: gameData[email].bannedAt
				}), { headers: { 'Content-Type': 'application/json' } });
			} else {
				return new Response(JSON.stringify({ error: 'User not found' }), { 
					status: 404, 
					headers: { 'Content-Type': 'application/json' } 
				});
			}
		} else if (url.hostname === 'unban-user') {
			// Unban user by setting bannedAt to undefined
			const { email } = await request.json();
			console.log('✅ Unbanning user:', email);
			
			if (gameData[email]) {
				gameData[email].bannedAt = undefined;
				await this.ctx.storage.put('gameData', gameData);
				console.log('✅ User unbanned:', email);
				
				return new Response(JSON.stringify({ 
					success: true, 
					message: `User ${email} has been unbanned`,
					bannedAt: gameData[email].bannedAt
				}), { headers: { 'Content-Type': 'application/json' } });
			} else {
				return new Response(JSON.stringify({ error: 'User not found' }), { 
					status: 404, 
					headers: { 'Content-Type': 'application/json' } 
				});
			}
		}

		return new Response('Method not allowed', { status: 405 });
	}
}
