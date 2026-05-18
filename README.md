# Boardify

**A real-time collaborative whiteboard with AI-powered drawing, summarisation, and handwriting OCR.**

[![Live Demo](https://img.shields.io/badge/Live-boardify--xi.vercel.app-6366F1?style=flat-square)](https://boardify-xi.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![OpenAI](https://img.shields.io/badge/GPT--4o-AI%20features-412991?style=flat-square&logo=openai&logoColor=white)](https://platform.openai.com)
[![Tests](https://img.shields.io/badge/tests-97%20passing-22C55E?style=flat-square)](#testing)

---

## What is it?

Boardify is a browser-based whiteboard where multiple people can draw, add sticky notes, and collaborate in real time — like Miro or FigJam, but with built-in AI features powered by GPT-4o:

- **Type a prompt → get a diagram.** "Draw a user login flow with Google OAuth" generates shapes + arrows on your canvas.
- **Summarise the board.** AI reads your sticky notes and writes a 3-4 sentence executive summary.
- **Group notes by theme.** Select sticky notes, AI clusters them into themes and arranges them visually.
- **Read your handwriting.** Draw a rectangle around scribbled handwriting, AI extracts the text via vision.

Everything syncs across browsers in under 100ms via Socket.io — including cursors, strokes, sticky note edits, and AI-generated content.

## Try the live demo

Open [boardify-xi.vercel.app](https://boardify-xi.vercel.app) and sign in with:

| Email | Password |
|---|---|
| `demo@whiteboard.app` | `Demo123!` |
| `collab@whiteboard.app` | `Collab123!` |

Or click the **"Try the live demo →"** link on the landing page — credentials get autofilled.

**To test real-time collaboration:** open the same board in two browsers (or use incognito for the second one). You'll see each other's cursors, strokes, and sticky notes update live.

> Heads up: the backend is hosted on Render's free tier and sleeps after 15 minutes of inactivity. The very first request after a long idle takes ~30 seconds to wake the server. Subsequent requests are instant.

## Key features

### Drawing canvas (HTML5 Canvas)
- 10 tools: pen, eraser, line, arrow, rectangle, circle, text, sticky note, select, hand (pan)
- Quadratic Bézier curve smoothing for natural pen strokes
- DPR-aware retina rendering — crisp on high-density displays
- 10-color palette and 3 stroke widths
- 50-step undo/redo stack (Ctrl/Cmd+Z, Ctrl/Cmd+Y)
- Selection tool: click strokes to select, Delete to remove
- Selection rectangle for region-based actions (copy, delete, OCR)

### Infinite canvas + Figma-style navigation
- True world-space coordinates — draw anywhere, pan to discover later
- Pan via hand tool (H), spacebar + drag (any tool), middle-mouse drag, or wheel
- Zoom via buttons, Cmd/Ctrl + scroll (anchored on cursor)
- Reset viewport to 100% / origin with one click

### Real-time collaboration (Socket.io)
- Live cursor sync with throttled updates (50ms cap)
- Stroke + sticky note broadcasts under 100ms
- "User X is drawing..." indicator pills
- Participants panel with online presence and avatar colors
- Multi-tab safe (one socket dedupe per user)
- Reconnect handling with toast notifications

### Sticky notes
- Drag, resize, edit, recolor (6 colors)
- Slight random rotation for a physical feel
- Debounced text updates (500ms) to keep network traffic light
- All operations sync to other collaborators in real time

### AI features (OpenAI GPT-4o + GPT-4o-mini)
- **Diagram generator** — Natural-language prompts (or quick-start chips like "Login flow") generate connected shapes on the canvas with batched undo
- **Board summariser** — Reads all sticky notes + text strokes, writes a 3-4 sentence summary, optionally pasted back as a sticky
- **Theme organiser** — Cluster selected sticky notes by theme; AI assigns colors and arranges them spatially
- **Handwriting OCR** — Drag a selection around handwritten text, GPT-4o vision extracts it to plain text, optionally added as a sticky

### Sharing & permissions
- JWT auth with bcrypt password hashing
- Owner / Editor / Viewer roles with route- and component-level guards
- View-only mode with disabled toolbar and "View only" badge
- Public share links with three modes: No access, View only, Edit
- Invite collaborators by email with role assignment

### Export
- **PNG export** with live thumbnail preview, transparent/white/dark backgrounds, 1x/2x/4x scale, optional sticky inclusion
- **JSON export** for full board backup
- **Copy share link** to clipboard
- Cmd/Ctrl+E shortcut for instant PNG download

### Polish
- Dark theme throughout (Inter font, indigo accents)
- Skeleton loaders for dashboard
- Empty states with helpful CTAs
- Toast notifications for all user actions
- ErrorBoundary catches crashes with a graceful recovery card
- Mobile-responsive dashboard (1/2/3 column grid)

## Tech stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand for state management
- React Hook Form + Zod for validation
- React Router v7
- Axios + Socket.io-client
- Lucide React for icons

**Backend**
- Node.js + Express + TypeScript
- MongoDB Atlas with Mongoose (embedded subdocuments for strokes/stickies)
- Socket.io for real-time
- JWT (jsonwebtoken) + bcryptjs for auth
- OpenAI SDK (GPT-4o + GPT-4o-mini, JSON mode, vision API)
- Zod for request validation
- nanoid for share tokens

**Testing**
- Server: Jest + Supertest + mongodb-memory-server (60 integration tests)
- Client: Vitest + React Testing Library (37 unit tests)
- Mocked OpenAI client for AI route tests

**Deployment**
- Frontend on Vercel (auto-deploys on push to main)
- Backend on Render free tier (auto-deploys on push to main)
- Database on MongoDB Atlas M0
- Total monthly cost: $0 (excluding OpenAI usage)

## Architecture

```
┌─────────────────────────────────┐         ┌──────────────────────────────────┐
│  React SPA (Vercel)             │  HTTPS  │  Express API (Render)            │
│                                 │ ──────▶ │                                  │
│  - Pages: Landing / Auth /      │  WSS    │  /api/auth   - JWT register/login│
│    Dashboard / Whiteboard       │ ◀─────▶ │  /api/boards - CRUD + sharing    │
│                                 │         │  /api/ai     - diagram, summarise│
│  - Canvas: HTML5 with ctx-based │         │                organise, OCR     │
│    pan + zoom transform         │         │                                  │
│  - Zustand store: strokes,      │         │  Socket.io rooms (board:<id>)    │
│    sticky notes, cursors,       │         │  - cursor:move (throttled)       │
│    participants, viewport       │         │  - stroke:add/delete/start       │
│                                 │         │  - sticky:add/update/move/delete │
│  - Socket.io client with        │         │  - room:users, user:joined/left  │
│    optimistic UI updates        │         │                                  │
└─────────────────────────────────┘         └──────────────────────────────────┘
                                                         │
                                                         ▼
                                            ┌──────────────────────────┐
                                            │  MongoDB Atlas           │
                                            │  - User schema           │
                                            │  - Board schema with     │
                                            │    embedded Stroke[]     │
                                            │    + StickyNote[]        │
                                            └──────────────────────────┘
                                                         │
                                                         ▼
                                            ┌──────────────────────────┐
                                            │  OpenAI API              │
                                            │  - GPT-4o (diagram, OCR) │
                                            │  - GPT-4o-mini (summary, │
                                            │    organise)             │
                                            └──────────────────────────┘
```

### Coordinate system

Strokes are stored in **world coordinates** independent of the viewport. The canvas itself is always viewport-sized; pan and zoom are applied inside the drawing context (`ctx.translate(panX, panY); ctx.scale(zoom)`) before each redraw. HTML overlays (sticky notes, cursors) live in a separate CSS-transformed wrapper that mirrors the same transform. This means:

- The canvas pixel buffer stays at native resolution at every zoom level (no CSS-stretching pixelation)
- Strokes can be drawn at any world coordinate, pan/zoom is non-destructive
- Real-time cursor positions sync correctly across users regardless of each user's viewport

## Local development

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (free tier works) — connection string ready
- OpenAI API key with at least $5 credit on file
- A JWT secret (any random 32-byte base64 string)

### Setup

```bash
# Clone and install all workspaces (root, client, server)
git clone https://github.com/SURYAUDAY/boardify.git
cd boardify
npm run install:all
```

Create `server/.env`:

```
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/boardify
JWT_SECRET=<run: openssl rand -base64 32>
OPENAI_API_KEY=sk-proj-...
CLIENT_URL=http://localhost:5173
```

Create `client/.env`:

```
VITE_SERVER_URL=http://localhost:3001
```

(For local development, leave `VITE_SERVER_URL` empty if you want Vite to proxy `/api` and `/socket.io` to the local backend — useful when exposing the frontend through ngrok.)

### Seed the database

```bash
cd server && npm run seed
```

This creates 2 demo users (`demo@whiteboard.app` / `Demo123!` and `collab@whiteboard.app` / `Collab123!`) and 3 pre-populated boards.

### Start both dev servers

```bash
npm run dev
```

- Client at http://localhost:5173 (Vite, hot reload)
- Server at http://localhost:3001 (ts-node-dev, restart on changes)

You should see `MongoDB connected` and `Server running on port 3001` in the console.

## Testing

```bash
# All tests (server + client)
npm test

# Just one side
cd server && npm test       # Jest + Supertest + in-memory MongoDB
cd client && npm test       # Vitest + React Testing Library
```

| Suite | Count | Covers |
|---|---|---|
| Server: Auth routes | 11 | Register / login / me / JWT validation |
| Server: Board routes | 16 | CRUD + sharing routes + access control |
| Server: AI routes | 14 | Diagram / Summarise / Organise / OCR (mocked OpenAI) |
| Server: Models | 10 | User password hashing, Board schema validation |
| Server: Sharing | 9 | Invite, role change, remove, share-mode |
| Client: canvasUtils | 17 | Math helpers, drawing dispatch, screen↔world projection |
| Client: useHistory | 8 | Undo/redo, deep cloning, 50-step cap |
| Client: passwordStrength | 6 | Strength scoring 0-4 |

Total: **97 automated tests** (60 server + 37 client).

## Deployment

The project is set up for zero-config auto-deploy via GitHub:

1. **Backend on Render** — Connect your forked GitHub repo with root directory `server/`, set environment variables (`MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `CLIENT_URL`), and select the free instance type. Render auto-builds on every push to `main`.

2. **Frontend on Vercel** — Import the repo with root directory `client/`, set `VITE_SERVER_URL` to your Render URL, and deploy. Vercel auto-deploys on every push.

3. **MongoDB Atlas** — Create a free M0 cluster, add `0.0.0.0/0` to the network access list, and paste the connection string into Render's environment variables.

A `vercel.json` SPA fallback ensures deep links (`/login?demo=true`, `/board/<id>`) don't 404.

## Project structure

```
whiteboard/
├── client/                          # React + Vite + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/              # Canvas, toolbar, color panel, selection, OCR, cursors
│   │   │   ├── sticky/              # StickyNote, StickyNotesLayer
│   │   │   ├── panels/              # AI panel (with 3 tabs), Room, Share, Export
│   │   │   └── ui/                  # Reusable: EmptyState, skeletons, ErrorBoundary
│   │   ├── pages/                   # Landing, Login, Register, Dashboard, Whiteboard
│   │   ├── hooks/                   # useSocket, useHistory, useAutoSave
│   │   ├── lib/                     # api (axios), socket, canvasUtils, passwordStrength
│   │   └── store/                   # Zustand store (auth, canvas, realtime, viewport)
│   └── vercel.json                  # SPA fallback
│
├── server/                          # Express + TypeScript backend
│   └── src/
│       ├── routes/                  # auth.ts, boards.ts, ai.ts
│       ├── socket/                  # handlers.ts (Socket.io room logic)
│       ├── models/                  # User.ts, Board.ts (with embedded subdocs)
│       ├── middleware/              # auth.ts (requireAuth + optionalAuth)
│       ├── lib/                     # openai.ts (configured client)
│       ├── seed.ts                  # populate demo data
│       └── index.ts                 # Express app + Socket.io setup
│
├── shared/
│   └── types.ts                     # Shared TypeScript interfaces (User, Stroke, Board, etc.)
│
└── package.json                     # Root workspace, `npm run dev` runs both
```

## What I'd add next

- Google OAuth sign-in (currently email/password only)
- Forgot-password flow with magic-link email (Resend)
- Resizable image upload + paste-from-clipboard
- Frame / section grouping for organising large boards
- Comments / threads on canvas regions
- Real-time presence with idle detection (30s = yellow, 5min = grey)
- Per-stroke history (currently only stroke-add/delete is tracked; in-place edits aren't)

## License

MIT — see [LICENSE](LICENSE) if present.

---

Built by [Suryauday Prakash Mishra](https://github.com/SURYAUDAY).
Portfolio: [suryauday-portfolio.netlify.app](https://suryauday-portfolio.netlify.app)
