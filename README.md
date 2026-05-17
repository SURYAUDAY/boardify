# Boardify

Real-time collaborative whiteboard with AI-powered features.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Zustand
- **Backend:** Node.js + Express + TypeScript + MongoDB + Socket.io
- **AI:** OpenAI GPT-4o (diagram generation, summarisation, OCR)

## Setup

1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Fill in environment variables:
   - `server/.env` — MongoDB URI, JWT secret, OpenAI API key
   - `client/.env` — Server URL (defaults to http://localhost:3001)

3. Seed the database:
   ```bash
   cd server && npm run seed
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

   - Client: http://localhost:5173
   - Server: http://localhost:3001

## Demo Credentials

- `demo@whiteboard.app` / `Demo123!`
- `collab@whiteboard.app` / `Collab123!`

## Testing

```bash
npm test
```
