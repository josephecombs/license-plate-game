## Starting Wrangler

To start the Cloudflare Worker using Wrangler, ensure you are in the root directory of the project. Use the following command:

```bash
 wrangler dev cloudflare-oauth-worker/src/index.js
```

This will start the local development server using Miniflare, allowing you to test your Worker locally at `http://localhost:8787`.

Make sure that your `wrangler.jsonc` is correctly configured with the appropriate entry-point and other necessary settings. 