export class UserSession {
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }

    async fetch(request) {
        if (request.method === 'POST') {
            const userInfo = await request.json();
            await this.state.storage.put('userInfo', userInfo);
            return new Response('User info stored');
        } else if (request.method === 'GET') {
            const userInfo = await this.state.storage.get('userInfo');
            return new Response(JSON.stringify(userInfo), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return new Response('Method not allowed', { status: 405 });
    }
} 