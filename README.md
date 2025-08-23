# PlateChase - License Plate Game

This project consists of two main components:

1. **Frontend React App** (root directory) - A GitHub Pages hosted React application
2. **Backend Cloudflare Worker** (`cloudflare-oauth-worker/` directory) - OAuth authentication and backend services using Cloudflare Workers and Durable Objects

## Local Development Setup

### Prerequisites
- Node.js 20.0.0 or higher
- npm
- Cloudflare account (for worker deployment)

### Step 1: Start the React Frontend
Open your first terminal tab and run:
```bash
npm start
```
This will start the React app at [http://localhost:3000](http://localhost:3000).

### Step 2: Start the Cloudflare Worker Backend
Open your second terminal tab and run:
```bash
cd cloudflare-oauth-worker
npx wrangler dev
```
This starts the local development server using Miniflare at `http://localhost:8787`.

## Project Structure

- **Root directory**: React frontend application
- **`cloudflare-oauth-worker/`**: Cloudflare Worker backend with OAuth and Durable Objects
- **`public/`**: Static assets and HTML files
- **`src/`**: React source code
- **`scripts/`**: Build and deployment utilities

## Deployment

### Frontend (GitHub Pages)
```bash
npm run deploy
```

### Backend (Cloudflare Worker)
```bash
cd cloudflare-oauth-worker
npx wrangler deploy
```
