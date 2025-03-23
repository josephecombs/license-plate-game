import { Miniflare } from 'miniflare';
import fs from 'fs';
import path from 'path';

describe('Durable Object User Creation', () => {
  let mf;

  beforeAll(() => {
    // Read the Worker code from index.js
    const script = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf-8');
    mf = new Miniflare({
      script, // Pass the code as "script"
      modules: true, // Set to true if using ES Modules
      durableObjects: {
        USER: 'User',
      },
      bindings: {
        GOOGLE_OAUTH_CLIENT_ID: 'test-client-id',
        GOOGLE_OAUTH_CLIENT_SECRET: 'test-client-secret',
      },
    });
  });

  afterAll(async () => {
    // Perform any necessary cleanup here
    await mf.dispose(); // Dispose of the Miniflare instance
  });

  test('Durable Object ID is consistent for the same email', async () => {
    const email = 'test@example.com';
    const ns = await mf.getDurableObjectNamespace('USER');
    const userObjId1 = ns.idFromName(email);
    const userObjId2 = ns.idFromName(email);

    expect(userObjId1.toString()).toEqual(userObjId2.toString());
  });

  test('Durable Object ID is unique for different emails', async () => {
    const email1 = 'test1@example.com';
    const email2 = 'test2@example.com';
    const ns = await mf.getDurableObjectNamespace('USER');
    const userObjId1 = ns.idFromName(email1);
    const userObjId2 = ns.idFromName(email2);

    expect(userObjId1.toString()).not.toEqual(userObjId2.toString());
  });
}); 