# PlateChase - License Plate Game

A React-based license plate game with Cloudflare OAuth worker backend.

## Development

### React App
```bash
npm start
```
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### Cloudflare Worker
```bash
cd cloudflare-oauth-worker
npx wrangler dev
```
Starts the local development server using Miniflare at `http://localhost:8787`.

## Deployment

### Deploy the Site
```bash
npm run deploy
```
This command:
1. Builds the React app
2. Injects necessary scripts
3. Deploys to GitHub Pages at www.platechase.com
4. Deploys the Cloudflare worker

### Manual Deployment

#### React App to GitHub Pages
```bash
npm run build
npm run predeploy
gh-pages -d build --cname www.platechase.com
```

#### Cloudflare Worker
```bash
cd cloudflare-oauth-worker
npx wrangler deploy
```

## Requirements

- Node.js 20.0.0 or higher
- npm
- GitHub Pages (for site deployment)
- Cloudflare account (for worker deployment)
