# Boardify — Claude Code Prompts with Phase Gates

> Pragmatic build workflow. Each phase has a clear gate (automated tests, manual checklist, or both) that must pass before moving on. Built for shipping a strong portfolio project in reasonable time.

---

## How testing works in this project

Not every part of a real-time canvas app is worth automated testing. The approach:

| Gate type | When used | What it means |
|---|---|---|
| 🟢 **Automated** | Backend routes, Zod schemas, canvas math, utility functions | `npm test` passes, listed assertions all green |
| 🟡 **Manual** | Canvas drawing, Socket.io sync, AI features, UI polish | Work through the checklist in the browser, every box ticked |
| 🔵 **Mixed** | Most phases — automated backend + manual frontend | Both the test command passes AND the checklist is done |

**Hard gate rule:** Do not start the next phase until the current phase's gate is green. This isn't about perfection — it's about not building on broken foundations. If a test fails, fix it or document why you're deferring it (and fix it before the phase after).

**Your resume story at the end:**
> "Wrote integration tests with Supertest covering all API routes (auth, boards, AI endpoints) and unit tests with Jest for canvas utilities and history stack. Real-time sync and canvas drawing verified via structured manual test plans documented in the README."

That's a strong, honest, senior-level answer.

---

## How to use this file

1. Open VS Code with Claude Code extension running
2. Start with the **Bootstrap Prompt** in Phase 1
3. After each Claude Code prompt, **run the gate** before moving on
4. When a phase is 100% green, say "Phase X done" and move to the next
5. Iterate inline — if something's wrong, fix it with a follow-up message instead of re-pasting the whole prompt

### Prerequisites
- Node.js 20+
- MongoDB Atlas connection string (free tier)
- OpenAI API key (fund with $5-10)
- An empty folder to start in

### Design system (referenced throughout)
- **Primary:** `#6366F1` indigo
- **Dark bg:** `#0F172A` (landing/auth), `#1A1A2E` (canvas), `#1E293B` (panels)
- **Borders:** `#334155` dark, `#E5E7EB` light
- **Text:** `#FFFFFF`, `#94A3B8` secondary, `#1E293B` on light bg
- **Font:** Inter
- **Radius:** `rounded-lg` inputs, `rounded-xl` cards, `rounded-2xl` modals, `rounded-full` pills

---
---

# PHASE 1 — Project Setup

**Goal:** Monorepo with client (Vite React TS) + server (Express TS) + shared types, both running on `npm run dev`, plus testing infrastructure configured.

## 1.1 Bootstrap prompt

Paste into Claude Code in an empty folder:

```
Scaffold a full-stack TypeScript monorepo called "whiteboard" for Boardify — a real-time collaborative whiteboard app.

STRUCTURE:
whiteboard/
├── client/     ← React + Vite + TypeScript
├── server/     ← Node.js + Express + TypeScript
├── shared/     ← shared types
├── package.json
└── .gitignore

CLIENT SETUP (client/):
1. Scaffold: npm create vite@latest client -- --template react-ts
2. Install runtime: tailwindcss postcss autoprefixer socket.io-client zustand react-router-dom react-hook-form @hookform/resolvers zod axios react-hot-toast lucide-react
3. Install dev (for testing): vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
4. Initialize Tailwind: npx tailwindcss init -p
5. Configure tailwind.config.js:
   - darkMode: 'class'
   - content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']
   - theme.extend.colors: { primary: '#6366F1', 'bg-canvas': '#1A1A2E', 'bg-panel': '#1E293B', 'bg-landing': '#0F172A' }
   - theme.extend.fontFamily.sans: ['Inter', 'system-ui', 'sans-serif']
6. Add @tailwind directives to src/index.css
7. Import Inter font in index.html
8. Configure vitest.config.ts with: jsdom environment, globals true, setupFiles ['./src/test/setup.ts']
9. Create client/src/test/setup.ts with: import '@testing-library/jest-dom'
10. Add scripts to client/package.json: "test": "vitest run", "test:watch": "vitest", "test:ui": "vitest --ui"

SERVER SETUP (server/):
1. cd server, npm init -y
2. Install runtime: express socket.io mongoose jsonwebtoken bcryptjs cors dotenv openai nanoid
3. Install dev: typescript ts-node-dev @types/express @types/node @types/jsonwebtoken @types/bcryptjs @types/cors jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server
4. Create tsconfig.json: strict, target ES2022, module commonjs, outDir ./dist, rootDir ./src, esModuleInterop
5. Create jest.config.js: preset ts-jest, testEnvironment node, setupFilesAfterEnv ['<rootDir>/src/test/setup.ts'], testMatch ['**/*.test.ts']
6. Create server/src/test/setup.ts that starts an in-memory MongoDB for tests (using mongodb-memory-server), connects mongoose before all tests, cleans between tests, disconnects after all
7. Package.json scripts:
   - "dev": "ts-node-dev --respawn --transpile-only src/index.ts"
   - "build": "tsc"
   - "start": "node dist/index.js"
   - "seed": "ts-node src/seed.ts"
   - "test": "jest"
   - "test:watch": "jest --watch"

CREATE server/src/index.ts:
- Load dotenv
- Express app with cors({ origin: process.env.CLIENT_URL, credentials: true })
- express.json() middleware
- HTTP server + Socket.io attached with same CORS
- mongoose.connect(process.env.MONGODB_URI!)
- Mount routes: /api/auth, /api/boards, /api/ai (empty stubs from ./routes/)
- Export app and server separately so Supertest can import app without starting the server
- Log "✅ Server running on port {PORT}" and "✅ MongoDB connected"

CREATE empty router stubs that just export an express.Router():
- server/src/routes/auth.ts
- server/src/routes/boards.ts
- server/src/routes/ai.ts

CREATE client/src/lib/socket.ts:
- Singleton io() instance, autoConnect: false
- connectSocket(token) helper that sets auth and calls socket.connect()

CREATE client/src/lib/api.ts:
- Axios instance, baseURL = import.meta.env.VITE_SERVER_URL + '/api'
- Request interceptor adds Authorization: Bearer <token from localStorage('wb_token')>
- Response interceptor: on 401, clear token, redirect to /login

CREATE shared/types.ts with: User, Point, Tool union, Stroke, StickyNote, Board interfaces. Configure both tsconfigs with path alias @shared/* pointing to ../shared/*

CREATE .env files with placeholders:
- server/.env: PORT=3001, MONGODB_URI=, JWT_SECRET=, OPENAI_API_KEY=, CLIENT_URL=http://localhost:5173
- client/.env: VITE_SERVER_URL=http://localhost:3001
- .env in .gitignore

ROOT:
- npm init -y
- Install concurrently as dev dep
- Scripts:
  - "dev": "concurrently -n client,server -c blue,green \"cd client && npm run dev\" \"cd server && npm run dev\""
  - "install:all": "npm install && cd client && npm install && cd ../server && npm install"
  - "test": "cd server && npm test && cd ../client && npm test"

.gitignore at root: node_modules, .env, dist, .DS_Store, *.log, coverage

Create README.md with setup instructions.

After scaffolding, run `npm run install:all` and tell me to fill in .env before running `npm run dev`.
```

## 1.2 Phase 1 Gate 🔵 (mixed)

**Automated (must pass):**
- [ ] `cd server && npm test` — runs Jest, reports "No tests found" gracefully (no errors)
- [ ] `cd client && npm test` — runs Vitest, reports "No tests found" gracefully

**Manual (must verify):**
- [ ] Fill in `server/.env` with real MongoDB URI, JWT secret (`openssl rand -base64 32`), OpenAI key
- [ ] `npm run dev` at root starts both without errors
- [ ] Server console shows `✅ Server running on port 3001` and `✅ MongoDB connected`
- [ ] Browser opens `http://localhost:5173` with default Vite page
- [ ] No CORS errors in browser console

> Don't move on until all 5 checkboxes are ticked.

---
---

# PHASE 2 — Database Models + Seed

**Goal:** User, Board (with embedded Stroke + StickyNote schemas) in MongoDB, plus seed script with 2 users and 3 populated boards.

## 2.1 Models prompt

```
Create three Mongoose models for Boardify in server/src/models/:

User.ts:
Schema fields: { name: String required, email: String required unique lowercase trim, password: String required, avatar: String (hex color), createdAt: Date default now }
Pre-save hook: bcrypt-hash password with cost 10 if modified
Instance method: comparePassword(candidate) returns boolean
Export the model as default.

Board.ts with StrokeSchema and StickyNoteSchema as embedded subdocuments:

StrokeSchema (not _id, no versionKey):
{ id: String required, tool: String enum ['pen','eraser','line','rect','circle','arrow','text'], points: [{ x: Number, y: Number, _id: false }], color: String, strokeWidth: Number, userId: String, timestamp: Number, text: String optional }

StickyNoteSchema (no _id, no versionKey):
{ id: String required, text: String, x: Number, y: Number, width: Number, height: Number, color: String, userId: String, timestamp: Number }

Board schema:
{ title: String required trim, description: String, owner: ObjectId ref 'User' required, collaborators: [{ user: ObjectId ref 'User', role: String enum ['editor','viewer'], _id: false }], thumbnail: String, isPublic: Boolean default false, shareToken: String unique default () => nanoid(10), shareMode: String enum ['none','view','edit'] default 'none', strokes: [StrokeSchema], stickyNotes: [StickyNoteSchema] }
With timestamps: true

Create server/src/seed.ts that:
- Connects via MONGODB_URI
- Clears existing users and boards
- Creates 2 users: demo@whiteboard.app / Demo123! and collab@whiteboard.app / Collab123!
- Assign avatar color randomly from: ['#EF4444','#F59E0B','#10B981','#3B82F6','#6366F1','#8B5CF6','#EC4899','#14B8A6']
- Creates 3 boards for the demo user with titles: 'Product Roadmap Q1', 'Team Brainstorm Session', 'Login Flow Design'
- Each board has 5-8 realistic sample strokes (mix of pen/rect/circle) and 3-4 sticky notes with sensible text
- Logs "✅ Seeding complete" and exits
```

## 2.2 Model test prompt

```
Create server/src/models/__tests__/User.test.ts and Board.test.ts using Jest + supertest + mongodb-memory-server (already set up in server/src/test/setup.ts).

User.test.ts tests:
1. Saves a new user with hashed password (password in DB !== original)
2. comparePassword returns true for correct password
3. comparePassword returns false for wrong password
4. Enforces unique email (second save with same email throws)
5. Requires name, email, password (throws ValidationError if missing)

Board.test.ts tests:
1. Creates a board with default shareToken (10 chars, unique)
2. Requires title and owner
3. Saves embedded strokes and stickyNotes correctly
4. Default shareMode is 'none', isPublic is false
5. timestamps auto-populate createdAt and updatedAt

All tests use the in-memory DB set up in src/test/setup.ts. Clean collections between tests with beforeEach.
```

## 2.3 Phase 2 Gate 🟢 (automated)

**Run:**
```
cd server && npm test
```

**Must pass:**
- [ ] All 5 User model tests green
- [ ] All 5 Board model tests green
- [ ] No warnings about deprecated mongoose options
- [ ] `npm run seed` succeeds, logs "✅ Seeding complete"
- [ ] MongoDB Compass shows 2 users and 3 boards with embedded data

---
---

# PHASE 3 — Authentication (JWT)

**Goal:** Register + Login endpoints working, JWT attached to every API call, Socket.io auth middleware, Login + Register UI pages.

## 3.1 Backend auth prompt

```
Build the auth system for Boardify server.

Create server/src/middleware/auth.ts:
- Express middleware named `requireAuth`
- Reads 'Authorization: Bearer <token>' header
- Verifies with JWT_SECRET via jsonwebtoken.verify
- Attaches decoded user { id, email } to req.user (extend Express Request type)
- Returns 401 { error: 'Unauthorized' } if missing or invalid

Create server/src/routes/auth.ts:

POST /api/auth/register
- Body: { name, email, password }
- Validate: name min 2, email valid format, password min 8 (use a Zod schema)
- Check email not already in use → 409 if exists
- Assign random avatar color from 8 predefined hex
- User.create() (pre-save hook hashes password)
- Sign JWT with { id, email }, expires 7d
- Return 201 { token, user: { id, name, email, avatar } } (never return password)

POST /api/auth/login
- Body: { email, password }
- Find user by email
- If not found OR comparePassword fails → 401 { error: 'Invalid email or password' }
- Return 200 { token, user } same shape

GET /api/auth/me (protected with requireAuth)
- Return current user from req.user.id (fetch fresh from DB, omit password)

In server/src/index.ts, add Socket.io auth middleware:
- io.use((socket, next) => ...) reads socket.handshake.auth.token
- jwt.verify, attach user to socket.data.user
- next(new Error('Unauthorized')) if invalid
```

## 3.2 Backend test prompt

```
Create server/src/routes/__tests__/auth.test.ts using Supertest against the Express app.

Import the app from ../../index (need to export `app` separately without calling listen in test env).

Tests to include:

POST /api/auth/register:
1. Registers a new user → 201, returns token + user with no password field
2. Rejects duplicate email → 409
3. Rejects invalid email format → 400
4. Rejects password under 8 chars → 400
5. Rejects missing name → 400

POST /api/auth/login:
6. Logs in with correct credentials → 200, returns token + user
7. Rejects wrong password → 401
8. Rejects non-existent email → 401

GET /api/auth/me:
9. Returns user data with valid Bearer token → 200
10. Returns 401 without token
11. Returns 401 with invalid token

Each test creates its own user via the /register endpoint or directly via User.create(). beforeEach cleans users collection.
```

## 3.3 Frontend auth UI prompt

```
Create client/src/pages/LoginPage.tsx and client/src/pages/RegisterPage.tsx for Boardify.

FIRST set up client/src/store/whiteboardStore.ts using Zustand if not already created:
- user: User | null
- token: string | null
- setUser(user, token): saves to localStorage('wb_token') + updates state
- logout(): clears localStorage, resets state, disconnects socket

LOGIN PAGE design:
- Full screen, background: gradient #1A1A2E → #16213E
- Centered card: white, rounded-2xl, 400px wide, 40px padding, subtle shadow
- Top: indigo gradient square icon (pencil+sparkle 32px) beside "Boardify" 22px semibold #1E293B, centered
- "Sign in to your workspace" 18px #374151 centered
- 32px gap
- "Continue with Google" button: full-width, white bg, 1px #E5E7EB border, Google G icon, 14px #374151 (visual only, no handler)
- OR divider (lines + "or" 13px #9CA3AF)
- Email input: label "Email" 13px semibold #374151 above, 40px tall, rounded-lg, #D1D5DB border, placeholder "you@company.com", indigo focus ring
- Password input: label "Password", show/hide eye toggle, "Forgot password?" right-aligned 13px indigo (visual only)
- "Sign in" button: full width, indigo #6366F1 bg, white 15px semibold, 42px, rounded-xl, hover #4F46E5, disabled during submit with Loader2 spin icon
- "Don't have an account? Create one" centered 13px, "Create one" indigo link to /register
- Below card: "🔒 Your data is encrypted and secure" 12px #9CA3AF centered

WIRING:
- React Hook Form + zodResolver
- Zod schema: email z.string().email('Invalid email'), password z.string().min(8, 'Minimum 8 characters')
- Inline red-500 12px errors under each field
- On submit: POST /api/auth/login via client/src/lib/api.ts with { email, password }
- On success: destructure { token, user }, call setUser(user, token), call connectSocket(token), navigate to /dashboard using react-router-dom's useNavigate
- On 401: red error banner above form "Invalid email or password"
- On network error: "Something went wrong. Please try again."
- In dev mode (import.meta.env.DEV), show below card: "Demo: demo@whiteboard.app / Demo123!" — click-to-copy

REGISTER PAGE design: same dark bg, white card, same icon/name top.
- "Create your account" 18px #374151 centered
- Full name input (label "Your name", placeholder "Alex Johnson")
- Email input
- Password input with strength indicator: 4-segment bar below (red/orange/yellow/green), label "Weak/Fair/Good/Strong" 12px beside
- Confirm password input
- "Create account" button same indigo style
- "By signing up you agree to our Terms and Privacy Policy" 12px #9CA3AF
- "Already have an account? Sign in" link

WIRING:
- Zod: name min 2, email valid, password min 8, confirmPassword .refine matches password with path ['confirmPassword']
- Password strength 0-4: +1 for length ≥ 8, +1 for number, +1 for special char, +1 for uppercase
- watch('password') from RHF to update strength live
- On submit: POST /api/auth/register with { name, email, password }
- On success: same flow as login (setUser, connectSocket, navigate /dashboard)
- On 409: inline error "Email already registered"

Set up basic React Router in client/src/App.tsx with routes /, /login, /register, /dashboard (placeholder), /board/:id (placeholder). No protected routes yet.
```

## 3.4 Pure logic test prompt

```
Create client/src/lib/__tests__/passwordStrength.test.ts.

First extract password strength calculation into client/src/lib/passwordStrength.ts:
export function calculateStrength(password: string): { score: 0|1|2|3|4, label: 'Weak'|'Fair'|'Good'|'Strong'|'' }
+1 for length ≥ 8, +1 for any digit, +1 for any special char (non-alphanumeric), +1 for any uppercase letter.
Empty password returns score 0, label ''.
Use this from RegisterPage.

Write tests:
1. Empty password → { score: 0, label: '' }
2. "abc" → score 0 (no rules matched)
3. "abcdefgh" → score 1 (length only) → "Weak"
4. "abcdefg1" → score 2 (length + digit) → "Fair"
5. "Abcdefg1" → score 3 → "Good"
6. "Abcdefg1!" → score 4 → "Strong"
```

## 3.5 Phase 3 Gate 🔵 (mixed)

**Automated (must pass):**
- [ ] `cd server && npm test` — all 11 auth route tests green
- [ ] `cd client && npm test` — all 6 passwordStrength tests green

**Manual (must verify in browser):**
- [ ] `/login` page matches design (dark gradient, white card, indigo button)
- [ ] Login with `demo@whiteboard.app / Demo123!` → redirects to /dashboard
- [ ] Login with wrong password → inline error appears
- [ ] `/register` page password strength bar updates as you type
- [ ] Register with mismatched confirm password → inline error
- [ ] Register with existing email → "Email already registered"
- [ ] After login, refresh page → still logged in (check localStorage has `wb_token`)
- [ ] Open DevTools Network tab on any API call → Authorization header present
- [ ] Logout button clears token and redirects

> All 8 checkboxes + both test suites green. Then move to Phase 4.

---
---

# PHASE 4 — Landing Page + Boards Dashboard

**Goal:** Public landing, authenticated boards dashboard, CRUD on boards via API.

## 4.1 Backend boards prompt

```
Create server/src/routes/boards.ts with all routes protected by requireAuth middleware:

GET /api/boards
- Find boards where owner = req.user.id OR collaborators.user includes req.user.id
- Populate owner's name
- Sort by updatedAt desc
- Return 200 [boards]

POST /api/boards
- Body: { title, description?, isPublic? }
- Zod validate: title min 1 required, description optional string, isPublic optional boolean
- Create board with owner = req.user.id, auto-generates shareToken via nanoid
- Return 201 board

GET /api/boards/:id
- Find board by id
- Check user is owner OR in collaborators OR board.shareMode !== 'none'
- Otherwise 403
- Return full board with strokes + stickyNotes

PATCH /api/boards/:id
- Body: { title?, description?, isPublic?, strokes?, stickyNotes? } — partial
- Owner or editor collaborator only, else 403
- Update and return updated board

DELETE /api/boards/:id
- Owner only, else 403
- Hard delete for now
- Return 204

Mount router in server/src/index.ts under /api/boards.
```

## 4.2 Backend boards test prompt

```
Create server/src/routes/__tests__/boards.test.ts using Supertest.

Helper: create a test user + return auth header. Reuse across tests.

Tests:

GET /api/boards:
1. Returns empty array for new user
2. Returns user's own boards
3. Returns boards where user is collaborator
4. Does not return other users' private boards
5. Requires auth → 401 without token

POST /api/boards:
6. Creates board with title → 201, has auto shareToken
7. Rejects empty title → 400
8. Requires auth → 401

GET /api/boards/:id:
9. Owner gets full board
10. Non-collaborator on private board → 403
11. Non-existent id → 404

PATCH /api/boards/:id:
12. Owner updates title
13. Viewer collaborator cannot update → 403
14. Editor collaborator can update

DELETE /api/boards/:id:
15. Owner deletes → 204
16. Non-owner cannot delete → 403
```

## 4.3 Frontend landing + dashboard prompt

```
Build two pages for Boardify.

FILE 1: client/src/pages/LandingPage.tsx — public page at "/"

Full width, bg #0F172A.

NAVBAR (fixed, 64px, #0F172A, 1px bottom border #1E293B):
- Left: Boardify logo (indigo square icon + "Boardify" white 18px semibold)
- Right: "Sign in" ghost button (white text, white border) + "Get started free" solid indigo

HERO (centered, padding-top 120px):
- "Collaborate, draw, and think with AI" 56px bold white (word "AI" in indigo #6366F1), line-height 1.2, text-center
- Subhead: "The real-time whiteboard with built-in AI. Draw together, generate diagrams from text, and get instant insights." 20px #94A3B8 max-w 560px centered
- 40px gap
- CTA buttons centered: "Start for free →" solid indigo 48px rounded-xl + "See how it works" ghost white border same size
- "No credit card required • Free forever" 13px #64748B centered

FEATURES STRIP (80px padding, id="features"):
3 cards (white/10 bg, rounded-2xl, 1px border white/10, 24px padding), side by side:
- Card 1: indigo circle with Pencil icon + "Real-time collaboration" 16px white + "Draw together with your team. See cursors, strokes, and edits live." 13px #94A3B8
- Card 2: purple circle with Sparkles + "AI diagram generator" + "Type 'draw a login flow' and watch shapes appear on your canvas."
- Card 3: teal circle with Users + "Multi-user rooms" + "Share a link. Anyone joins instantly. No signup required for guests."

CANVAS PREVIEW (80px padding, centered):
- Dark card, rounded-2xl, 800px wide, 400px tall, bg #1A1A2E
- Inside: fake whiteboard content (SVG rectangle indigo outline, curved line, yellow sticky with "Ideas go here!") + 2 cursor dots with name pills ("Sarah K." red, "Alex M." blue)
- "Try the live demo →" 14px indigo link below card

WIRING:
- "Get started free" and "Start for free →" → navigate('/register')
- "Sign in" → navigate('/login')
- "See how it works" → smooth scroll to #features
- Responsive: hero 40px on mobile, feature cards stack at 768px
- Use lucide-react: Pencil, Sparkles, Users

FILE 2: client/src/pages/DashboardPage.tsx — protected route at "/dashboard"

Full viewport, sidebar + content layout.

SIDEBAR (240px, #1E293B, full height):
- Top: Boardify logo + text, 20px padding
- Nav items (44px tall, 12px padding, rounded-lg, 4px gap):
  - "My Boards" (Grid icon) ACTIVE = indigo-500/10 bg + indigo text
  - "Shared with me" (Users icon)
  - "Recent" (Clock icon)
  - "Starred" (Star icon)
  - 1px #334155 divider
  - "Settings" (Settings icon)
- Bottom: user avatar circle 32px (colored initials on avatar color) + name 14px white + "Free plan" 12px #94A3B8 + logout icon button

MAIN CONTENT (flex-grow, 32px padding):
- Header row: "My Boards" 24px semibold white | search input (dark bg, 240px, rounded-lg, Search icon, placeholder "Search boards") + "New Board" solid indigo (Plus icon)
- Filter tabs: "All" | "Recent" | "Shared" — active indigo underline, inactive #94A3B8
- Boards grid (3 cols, gap 20px; 2 cols tablet; 1 col mobile):
  Each card (#1E293B, rounded-2xl, 1px #334155 border, hover: border-indigo-500):
  - Thumbnail area (160px tall, rounded-t-2xl, #0F172A bg, 3-4 thin gray squiggly SVG lines)
  - Footer (20px padding): title 14px semibold white truncate + "Last edited {timeAgo}" 12px #94A3B8
  - Bottom row: 3 overlapping avatar circles (20px, -4px overlap) | Share icon + ... menu (Rename, Delete)

NEW BOARD MODAL (triggered by "New Board"):
- Centered on dimmed backdrop
- #1E293B, 440px, rounded-2xl, 32px padding
- "Create new board" 18px white + X close
- Name input (dark bg, rounded-lg, placeholder "Untitled board")
- Description textarea (optional, 80px tall)
- Privacy toggle row: "Private" / "Public" + switch (indigo when public)
- "Cancel" ghost + "Create board" full-width indigo

WIRING:
- Protected route: if no token in store, useEffect navigate to /login
- On mount: GET /api/boards via axios, store in local useState
- Loading: show 6 skeleton cards (create placeholder BoardCardSkeleton inline if needed — #1E293B with animate-pulse gray-700 blocks)
- Card click → navigate(`/board/${board._id}`)
- Search: client-side filter by title.toLowerCase().includes(query)
- Filter tabs: All = all, Recent = sort updatedAt desc, Shared = user in collaborators but not owner
- New Board modal state + submit: POST /api/boards → optimistic prepend to list + toast.success
- Delete from ... menu: confirm dialog → DELETE /api/boards/:id → remove + toast
- Logout: call logout() from Zustand + navigate('/')
- Inline timeAgo helper: returns "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago", "Oct 12" for older
- Empty state if boards.length === 0: centered, easel SVG 64px indigo, "No boards yet" 22px white, "Create your first board and start collaborating" 15px #94A3B8, "Create first board" indigo button

Update client/src/App.tsx routes: /, /login, /register, /dashboard (wrap in auth check), /board/:id (placeholder).
```

## 4.4 Phase 4 Gate 🔵 (mixed)

**Automated:**
- [ ] `cd server && npm test` — all 16 boards route tests green (plus all previous)

**Manual:**
- [ ] Landing page loads at `/` without auth, matches design
- [ ] "Get started free" navigates to /register
- [ ] Dashboard shows 3 seeded boards as cards
- [ ] Search filters boards live as you type
- [ ] Click a board card → navigates to `/board/:id` (placeholder page OK)
- [ ] "New Board" modal creates a board + it appears in grid immediately
- [ ] Delete from ... menu removes card after confirm
- [ ] Logout clears session + redirects to `/`
- [ ] Dashboard is responsive (resize window, grid adjusts)

---
---

# PHASE 5 — Canvas Core (Drawing)

**Goal:** HTML5 Canvas with freehand pen drawing using smooth bezier curves. Color + stroke width picker. Keyboard shortcuts.

> **Note:** This is the most complex phase. Build the toolbar + page shell first, then add drawing logic as a follow-up.

## 5.1 Canvas utilities prompt (pure functions — easy to test)

```
Create client/src/lib/canvasUtils.ts with pure drawing functions (no component state, no DOM refs outside the ctx parameter):

drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void
- For 'pen': use quadraticCurveTo — for each consecutive pair of points, use midpoint as control point for smoothness
- For 'line': straight moveTo + lineTo from first to last point
- For 'rect': strokeRect from points[0] to points[1] as topLeft + bottomRight
- For 'circle': compute center + radius from points[0] (center) and points[1] (edge), use arc
- For 'arrow': line + arrowhead (two lines at ±30° from line angle, length 12px)
- Apply stroke.color and stroke.strokeWidth
- For 'text': ctx.fillText with stroke.text at points[0]

drawArrowhead(ctx, from: Point, to: Point, size: number): void
- Helper used by drawStroke for arrow tool

redrawAll(ctx, strokes: Stroke[], width: number, height: number): void
- Clear the canvas (clearRect 0, 0, width, height)
- For each stroke, call drawStroke

distanceBetween(p1: Point, p2: Point): number
- Simple hypotenuse helper

getMidpoint(p1: Point, p2: Point): Point
- Returns { x: (p1.x+p2.x)/2, y: (p1.y+p2.y)/2 }

calculateArrowAngle(from: Point, to: Point): number
- Math.atan2(to.y - from.y, to.x - from.x)

isPointInRect(point: Point, rect: { x, y, width, height }): boolean
- Used later for selection

All functions are synchronous, pure, no side effects outside the ctx param.
```

## 5.2 Canvas utilities test prompt

```
Create client/src/lib/__tests__/canvasUtils.test.ts using Vitest.

Tests for pure functions (no canvas rendering needed):

distanceBetween:
1. Same point → 0
2. (0,0) to (3,4) → 5
3. (0,0) to (0,0) → 0

getMidpoint:
4. (0,0) and (10,10) → { x: 5, y: 5 }
5. Negative coords: (-10,-10) and (10,10) → { x: 0, y: 0 }

calculateArrowAngle:
6. Point to the right: from (0,0) to (10,0) → 0
7. Point up: from (0,0) to (0,-10) → -Math.PI/2
8. Point left: from (0,0) to (-10,0) → Math.PI

isPointInRect:
9. Point inside → true
10. Point outside → false
11. Point on edge → true (inclusive)

For drawStroke / redrawAll / drawArrowhead: create a mock ctx object with spies on moveTo, lineTo, arc, quadraticCurveTo, strokeRect, stroke, fillText, beginPath, clearRect. Assert the right methods get called in the right order.

drawStroke tests:
12. Pen stroke with 3 points → beginPath called, moveTo to first point, quadraticCurveTo called
13. Rect stroke → strokeRect called with width/height derived from two points
14. Line stroke → moveTo + lineTo called
15. Sets ctx.strokeStyle to stroke.color and ctx.lineWidth to stroke.strokeWidth

redrawAll:
16. Empty strokes array → clearRect called, no stroke methods
17. 3 strokes → drawStroke-equivalent methods called 3 times worth
```

## 5.3 Canvas page + toolbar prompt

```
Build the whiteboard canvas page for Boardify.

FILES TO CREATE:
1. client/src/pages/WhiteboardPage.tsx (the page shell)
2. client/src/components/canvas/Canvas.tsx (the drawing canvas)
3. client/src/components/canvas/CanvasToolbar.tsx (floating toolbar)
4. Extend client/src/store/whiteboardStore.ts with canvas state

STORE EXTENSION:
Add to whiteboardStore:
- board: Board | null
- activeTool: Tool (default 'pen')
- activeColor: string (default '#FFFFFF')
- strokeWidth: number (default 3)
- strokes: Stroke[] (default [])
- stickyNotes: StickyNote[] (default [])
- zoom: number (default 1)
- setBoard, setActiveTool, setColor, setStrokeWidth, addStroke, removeStroke, updateStrokes (replace all), setZoom

WhiteboardPage design:
Full viewport, no scroll, bg #1A1A2E.

TOP BAR (52px, #0F172A, 1px bottom border #1E293B, flex between, 16px padding):
- Left: small indigo logo 24px + back ArrowLeft icon (navigate /dashboard) + board title 15px semibold white (dblclick → input → PATCH save on blur/Enter) + unsaved indicator (yellow dot 8px + "Saving..." 12px when pending)
- Center: connection pill (#1E293B bg, rounded-full, 6px 12px): green dot + "N online" + up to 3 mini avatars (16px), "+N more" if more
- Right: Share button (outline white 32px, link icon) + Export button (outline white, download icon) + "Ask AI" indigo rounded-full with Sparkles icon

CANVAS AREA (flex-grow, position relative):
- <Canvas /> component (handles drawing)
- Below it in z-stack: CursorOverlay + StickyNotesLayer (stubs if not built yet)

TOOLBAR (floating pill, fixed bottom-center, 40px from bottom):
- White, rounded-full, shadow-xl, 8px padding, flex row gap 2px
- Groups with 1px vertical dividers between:
  [MousePointer Select] | [PenLine Pen] [Eraser] | [Minus Line] [MoveRight Arrow] [Square Rect] [Circle] | [Type Text] [StickyNote Sticky] | [Hand Pan]
- Each button 36px square, hover bg-gray-100, active bg-indigo-50 with indigo icon
- Tooltip on 200ms hover: "Pen (P)", "Eraser (E)" etc. (CSS ::before or lightweight utility)

FLOATING OPTIONS PANEL (left, 48px from edge, vertically centered, when pen/shape tool active):
- White card, rounded-xl, shadow, 16px padding, 180px
- "Color" 11px uppercase #6B7280
- 5x2 grid of 20px color circles: black, gray-600, red-500, orange-500, yellow-500, green-500, blue-500, purple-500, pink-500, white
- Selected: 2px white ring + 1px indigo outer ring
- "Stroke width": 3 line options (1px, 3px, 6px) inline

ZOOM CONTROLS (fixed bottom-right, 24px from edges):
- White pill rounded-full: Minus button 32px | "100%" 13px 60px | Plus button 32px

EMPTY CANVAS HINT (centered absolute when strokes.length === 0):
- Pencil outline 40px #334155
- "Start drawing" 16px #475569
- "or use AI to generate a diagram" 13px #334155
- Sparkles + "Generate diagram →" indigo 13px
- Fades out (transition opacity 300ms) once strokes exist

Canvas.tsx:
- Ref to <canvas> element
- On mount: set canvas.width = window.innerWidth * devicePixelRatio, height similarly, scale ctx
- Handle resize: update dimensions + call redrawAll from canvasUtils
- Mouse events (and touch equivalents):
  - onMouseDown: if activeTool is 'pen', start new stroke: currentPath = [point], isDrawing = true
  - onMouseMove + isDrawing: push point, redraw canvas with current strokes + in-progress path
  - onMouseUp: finalize stroke, generate unique id, addStroke to Zustand store, reset isDrawing
- Use canvasUtils.redrawAll inside a useEffect watching strokes

Wire WhiteboardPage:
- Protected route: redirect to /login if no token
- On mount: GET /api/boards/:id, setBoard, load strokes into store
- Keyboard shortcuts (attach to document, cleanup on unmount):
  V=select, P=pen, E=eraser, L=line, A=arrow, R=rect, C=circle, T=text, S=sticky, H=pan
- Cursor CSS changes per tool: crosshair, pen, grab etc.
```

## 5.4 Phase 5 Gate 🟡 (manual — canvas is hard to automate)

**Automated:**
- [ ] `cd client && npm test` — all 17 canvasUtils tests green

**Manual:**
- [ ] Open `/board/:id` from dashboard, canvas renders full screen on dark bg
- [ ] Pen tool selected, draw with mouse → smooth curve appears (not jagged straight lines)
- [ ] Change color via left panel → new strokes use new color
- [ ] Change stroke width → visibly different thickness
- [ ] Draw something, resize window → strokes remain in correct position
- [ ] Press `P` → pen tool activates, cursor is pen/crosshair
- [ ] Press `V` → select tool activates
- [ ] Toolbar tooltips show on hover after 200ms delay
- [ ] Canvas is NOT blurry on retina display (pixel ratio scaling working)
- [ ] Empty canvas hint shows, disappears once you draw
- [ ] Tested on mobile/tablet: touch drag draws strokes (use DevTools device mode)

---
---

# PHASE 6 — Shape + Text Tools

**Goal:** Rectangle, circle, line, arrow tools with live drag preview. Text tool that places text on canvas. Eraser.

## 6.1 Shape tools prompt

```
Extend client/src/components/canvas/Canvas.tsx to support rect, circle, line, arrow, and text tools.

SHAPE DRAWING PATTERN (rect, circle, line, arrow):
- onMouseDown saves startPoint
- onMouseMove draws a LIVE PREVIEW:
  1. Clear canvas
  2. redrawAll with committed strokes
  3. Draw the in-progress shape with current color/strokeWidth using canvasUtils.drawStroke with a temp stroke object
- onMouseUp finalizes the stroke and calls addStroke
  - Rect: points = [topLeft, bottomRight]
  - Circle: points = [center, edgePoint]
  - Line: points = [start, end]
  - Arrow: points = [start, end]

TEXT TOOL:
- activeTool === 'text': on canvas click (mousedown), create a native HTML <textarea> overlay positioned absolutely at click coords
- Style: transparent bg, no border, outline, white text, current font size (16px Inter), autofocus
- On blur or Enter (without shift): convert textarea content to a text stroke via ctx.fillText in canvasUtils (tool='text', points=[{x,y}], text=textContent)
- Remove the overlay, addStroke to store
- Esc cancels without saving

ERASER TOOL:
- activeTool === 'eraser': on mousedown/mousemove while pressed, draw a white circle at cursor using composite operation 'destination-out' (erases underlying pixels)
- Alternatively, mark any stroke within 10px of cursor for removal and emit removeStroke
- Cursor CSS: circle outline matching eraser width

Update canvasUtils.drawStroke if needed to handle new shape cases properly (most are already there from Phase 5).

On Delete/Backspace key: if activeTool is 'select' and a stroke is selected (store selectedStrokeId), remove it.
```

## 6.2 Phase 6 Gate 🟡 (manual)

**Automated:**
- [ ] `cd client && npm test` — existing canvasUtils tests still pass (add any new ones if drawStroke got extended)

**Manual:**
- [ ] Rect tool: click-drag shows live rectangle preview → release creates rect
- [ ] Circle tool: drag from center outward → ellipse appears
- [ ] Line tool: straight line from click to release
- [ ] Arrow tool: line + arrowhead pointing in correct direction
- [ ] Text tool: click → textarea appears → type → Enter/blur → text on canvas
- [ ] Text tool: Esc cancels without saving
- [ ] Eraser removes strokes it passes over
- [ ] Select + Delete key removes selected stroke
- [ ] Switching tools during shape draw cancels the in-progress shape cleanly
- [ ] No visual flicker during live preview (canvas doesn't "blink")

---
---

# PHASE 7 — Sticky Notes

**Goal:** Draggable, resizable, editable sticky notes with color picker.

## 7.1 Sticky notes prompt

```
Create client/src/components/sticky/StickyNote.tsx and client/src/components/sticky/StickyNotesLayer.tsx for Boardify.

Sticky notes are HTML div elements floating above the canvas (NOT drawn on canvas).

StickyNote.tsx design:
- Absolutely positioned on parent (StickyNotesLayer)
- Default 200×160, user-resizable
- rounded-xl, shadow with warm tint (custom box-shadow using note color at low opacity)
- Slight rotation stored in state (random -2° to +2° when created), applied via transform
- Top bar (28px, slightly darker than note bg, rounded-t-xl, 8px padding):
  - Left: GripVertical drag handle 14px #6B7280
  - Right: color picker trigger (16px circle of current color) + X delete 14px #6B7280 hover red-500
- Content area (flex-grow, 12px padding):
  - contentEditable div, outline-none, bg-transparent
  - Placeholder "Add a note..." in #9CA3AF when empty
  - Text 14px #374151 line-height 1.5
- Bottom-right resize handle: small diagonal indicator 12px #9CA3AF
- Color popover (on color trigger click): horizontal row of 6 swatches in white card — yellow #FEF9C3, green #DCFCE7, pink #FCE7F3, blue #DBEAFE, purple #E9D5FF, orange #FED7AA

Props:
{ note: StickyNote, onUpdate: (id, partial) => void, onDelete: (id) => void, currentUserId: string }

Wiring:
- Drag: onMouseDown on top bar → save offset. Document mousemove/mouseup listeners update x, y optimistically. On mouseup, onUpdate({x, y}).
- Resize: onMouseDown on bottom-right corner → track delta → update width, height (min 120×80, max 600×600)
- Edit text: onInput on contentEditable, debounce 500ms, call onUpdate({text})
- Color change: onClick on swatch → onUpdate({color}) + close popover
- Delete: X icon → onDelete(id)
- Use requestAnimationFrame in drag handler for smooth movement

StickyNotesLayer.tsx:
- Absolute inset-0, pointer-events: none (canvas gets events through)
- Each StickyNote child has pointer-events: auto
- Renders store.stickyNotes.map → StickyNote
- onUpdate: updates store locally + PATCH /api/boards/:id with stickyNotes (debounce 500ms)
- onDelete: removes from store + PATCH

Double-click on canvas when activeTool === 'sticky' (handle in Canvas.tsx):
- Create new StickyNote at click coords, yellow bg #FEF9C3, empty text, default 200×160, add to store
```

## 7.2 Phase 7 Gate 🟡 (manual)

**Manual:**
- [ ] Sticky tool + double-click on canvas → new yellow note appears
- [ ] Click inside note → type → text appears immediately
- [ ] Drag top bar → note moves smoothly (no jitter)
- [ ] Drag bottom-right handle → note resizes (min/max limits work)
- [ ] Click color swatch → background changes
- [ ] Click X → note deletes
- [ ] Refresh page → notes persist (from database)
- [ ] Create 4+ notes at different positions, move them around → no lag

---
---

# PHASE 8 — Socket.io Real-Time Sync

**Goal:** Two browsers in the same board see each other's strokes, cursors, and sticky notes in real time.

## 8.1 Socket handlers prompt

```
Create server/src/socket/handlers.ts with all Socket.io event handlers.

Server-side setup (in server/src/index.ts, after io auth middleware):
Import and invoke registerSocketHandlers(io) that wires up:

On connection:
- Read boardId from socket.handshake.query.boardId
- Verify user has access to board (owner/collaborator/public)
- socket.join(`board:${boardId}`)
- Fetch list of connected users in this room (from a module-level Map<boardId, Set<{userId, socketId, name, avatar}>>)
- Emit to new socket: 'room:users' with the current list
- Broadcast to room (excluding sender): 'user:joined' with { userId, name, avatar }

Handlers (all scoped to the board room):

socket.on('cursor:move', ({ x, y }) → broadcast 'cursor:move' to room except sender with { userId, name, avatar, x, y, timestamp: Date.now() })

socket.on('stroke:add', (stroke) → validate stroke shape → save to Board.strokes in MongoDB (findByIdAndUpdate $push) → broadcast 'stroke:add' to room except sender)

socket.on('stroke:delete', ({ strokeId }) → remove from DB ($pull) → broadcast 'stroke:delete' except sender)

socket.on('stroke:start', () → broadcast 'stroke:start' with { userId, name } — used for "Sarah is drawing" indicator)

socket.on('sticky:add' / 'sticky:update' / 'sticky:move' / 'sticky:delete', (data) → update DB accordingly → broadcast except sender)

socket.on('board:leave', () → leave room, remove from connected users map)

On disconnect:
- Remove from connected users map
- Broadcast 'user:left' with { userId } to room

Error handling: wrap all handlers in try/catch, on error emit 'error' event to the sender with a message.
```

## 8.2 Frontend useSocket hook + UI prompt

```
Create:
1. client/src/hooks/useSocket.ts — manages all socket event subscriptions
2. client/src/components/canvas/CursorOverlay.tsx — renders other users' cursors
3. client/src/components/panels/RoomPanel.tsx — participants panel

useSocket.ts:
- Input: { boardId, currentUserId }
- On mount: socket.emit('board:join') by passing boardId in connection auth. If socket isn't connected yet, connect first.
- Subscribe to:
  - 'room:users': set participants list in Zustand
  - 'user:joined': append to participants
  - 'user:left': remove from participants
  - 'cursor:move': update cursors map in store { [userId]: { x, y, color, name, lastSeen: Date.now() } }
  - 'stroke:add': addStroke to store (filter out own events by comparing userId)
  - 'stroke:delete': removeStroke
  - 'sticky:add'/'update'/'move'/'delete': update stickyNotes in store
  - 'stroke:start': set "drawing" indicator for that user (auto-clear after 2s with no follow-up event)
- Throttle mousemove on canvas: emit 'cursor:move' max once per 50ms (simple setTimeout-based throttle)
- On unmount: socket.emit('board:leave'), unsubscribe all listeners
- Handle disconnect: toast.loading('Connection lost — trying to reconnect...', { id: 'reconnect' })
- Handle reconnect: toast.dismiss('reconnect'), toast.success('Reconnected')

CursorOverlay.tsx design:
- Absolute inset-0, pointer-events: none
- For each cursor in store.cursors:
  - Arrow cursor SVG 14×14 filled with user's color, rotated pointing up-left
  - Name pill beside: user's color bg, white 12px, rounded-full, 24px tall, 8px padding (text = user's name)
- Wrap in transform: translate(x, y) with CSS transition transform 50ms linear
- useEffect with interval (every 1s): remove cursors with lastSeen > 5s ago

RoomPanel.tsx design:
- Slide-in from right, 280px wide, below top bar (top: 52px, right: 0)
- #1E293B bg, 1px left border #334155, rounded-l-xl, shadow-xl
- translate-x-full when closed, translate-x-0 when open, transition 300ms
- Header (52px, border-b #334155, flex between, 16px padding): "In this board" 14px semibold white + X close
- Participant rows (each 52px, hover bg-white/5, 12px padding, flex gap 12px):
  - Colored avatar 36px (initials 13px semibold white on user's avatar color)
  - Name 14px white + if isCurrentUser, "You" badge gray-600 11px
  - Status dot 8px: green online / yellow idle (no movement 30s) / gray offline
- Invite section (16px padding, border-t #334155): "Invite others" 13px semibold white + flex row: read-only URL input (dark bg, truncated) + "Copy" indigo button

REAL-TIME DRAWING INDICATOR (separate floating component, fixed bottom-left):
- Small pill #1E293B bg rounded-lg shadow-lg 12px padding
- Colored dot + "Sarah is drawing..." 13px white
- Appears on 'stroke:start' event, auto-dismisses 2s after last activity
- Stack multiple with 8px gap

Wire into WhiteboardPage:
- Use useSocket(boardId, currentUserId) inside WhiteboardPage
- Throttled cursor emit on Canvas's onMouseMove
- Toggle RoomPanel open/closed via state or button in top bar
```

## 8.3 Phase 8 Gate 🟡 (manual — real-time is hard to automate, the manual test IS the test)

> This is your showcase feature. Test it thoroughly.

**Setup:**
- Open two browsers (Chrome + Firefox, or two Chrome profiles)
- Log in as `demo@whiteboard.app` in one, `collab@whiteboard.app` in the other (add collab as a collaborator to one of demo's boards first via MongoDB Compass or an invite route)
- Open the same board in both

**Manual checks:**
- [ ] Both users see each other in the participants panel
- [ ] Draw in Browser 1 → stroke appears in Browser 2 within 100ms
- [ ] Move cursor in Browser 1 → colored cursor + name appears in Browser 2
- [ ] Stop moving cursor in Browser 1 for 5 seconds → cursor fades in Browser 2
- [ ] Create sticky note in Browser 1 → appears in Browser 2 immediately
- [ ] Drag sticky in Browser 1 → moves smoothly in Browser 2
- [ ] Edit sticky text in Browser 1 → updates in Browser 2 (with slight debounce)
- [ ] Delete stroke in Browser 1 → disappears in Browser 2
- [ ] Close Browser 1's tab → Browser 2 shows user left (participant removed after brief delay)
- [ ] Disconnect internet briefly in Browser 1 → "Connection lost" toast appears
- [ ] Reconnect internet → "Reconnected" toast + board state syncs back
- [ ] Open browser DevTools Network tab → WebSocket shows as persistent connection (101 Switching Protocols)

---
---

# PHASE 9 — Undo/Redo + Autosave

**Goal:** Ctrl+Z / Ctrl+Y work on strokes. Board saves to MongoDB automatically 2s after last change.

## 9.1 History hook prompt

```
Create client/src/hooks/useHistory.ts for undo/redo.

State:
- history: Stroke[][] — stack of stroke array snapshots
- historyIndex: number — current position

Functions:
- addToHistory(strokes: Stroke[]): push deep copy to history (JSON.parse(JSON.stringify(strokes))), increment index, truncate anything after new index, cap at 50 entries (pop oldest)
- undo(): if historyIndex > 0, decrement, return history[historyIndex]
- redo(): if historyIndex < history.length - 1, increment, return history[historyIndex]
- canUndo: historyIndex > 0
- canRedo: historyIndex < history.length - 1

Attach keyboard listeners in useEffect:
- Ctrl/Cmd+Z → undo → updateStrokes in Zustand + emit 'stroke:delete' or 'stroke:add' for each diff (or just emit a 'board:restore' event with full state)
- Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z → redo

Trigger addToHistory whenever a new stroke is added or removed (not on mouse movement mid-stroke — only on finalized strokes).

Create client/src/hooks/useAutoSave.ts:
- Watch strokes and stickyNotes from Zustand
- On change, debounce 2000ms, then PATCH /api/boards/:id with { strokes, stickyNotes }
- Expose isSaving state + lastSavedAt timestamp
- WhiteboardPage uses this: shows yellow dot + "Saving..." when isSaving, nothing when saved

On board load (WhiteboardPage mount):
- After GET /api/boards/:id, load strokes + stickyNotes into store
- Initialize history with current state as index 0
```

## 9.2 History hook test prompt

```
Create client/src/hooks/__tests__/useHistory.test.tsx using Vitest + React Testing Library renderHook.

Tests:
1. Initial state: history has 1 empty snapshot, canUndo false, canRedo false
2. addToHistory with 1 stroke: history length 2, index 1, canUndo true, canRedo false
3. addToHistory twice then undo: returns previous state, canRedo becomes true
4. undo then redo: returns to latest state
5. undo then addToHistory: truncates future (canRedo false)
6. addToHistory 51 times: history capped at 50 (oldest popped)
7. Deep copy: modifying original strokes array does NOT mutate history
8. canUndo/canRedo flags correct in all positions

Mock keyboard events to verify Ctrl+Z / Ctrl+Y trigger undo/redo.
```

## 9.3 Phase 9 Gate 🔵 (mixed)

**Automated:**
- [ ] `cd client && npm test` — all 8 useHistory tests green

**Manual:**
- [ ] Draw 3 strokes → press Ctrl+Z → last stroke disappears
- [ ] Ctrl+Z again → next stroke disappears
- [ ] Ctrl+Y → stroke comes back
- [ ] Draw stroke → Ctrl+Z 60 times → no error (graceful limit)
- [ ] "Saving..." indicator appears 2s after drawing
- [ ] Indicator goes away after save completes
- [ ] Refresh page → all strokes + sticky notes restored
- [ ] In Browser 2: Undo in Browser 1 is reflected in Browser 2 (this requires emitting on undo — confirm it syncs)

---
---

# PHASE 10 — AI: Diagram Generator

**Goal:** Type "draw a login flow" → GPT-4o returns JSON → shapes + arrows appear on canvas.

## 10.1 AI diagram backend prompt

```
Create server/src/lib/openai.ts:
- Export a configured OpenAI client using process.env.OPENAI_API_KEY

Create server/src/routes/ai.ts (protected with requireAuth):

POST /api/ai/diagram
- Body: { prompt: string, boardId: string }
- Validate: prompt min 3 chars, max 500, boardId valid ObjectId
- Call openai.chat.completions.create:
  model: 'gpt-4o'
  response_format: { type: 'json_object' }
  messages: [
    { role: 'system', content: [system prompt below] },
    { role: 'user', content: prompt }
  ]
- Parse the JSON response (try/catch — on parse error return 502 with 'AI returned invalid format')
- Return 200 { shapes, connections, generationId: nanoid() }

System prompt:
'You are a diagram generator for a whiteboard app. The user describes a flow or process. Return ONLY a JSON object with this exact shape:
{
  "shapes": [{ "id": string, "type": "rect"|"diamond"|"circle", "x": number, "y": number, "width": number, "height": number, "label": string (max 4 words), "color": string (hex), "borderColor": string (hex) }],
  "connections": [{ "from": string (shape id), "to": string (shape id), "label": string (optional, max 2 words) }]
}
Layout rules:
- Start at x=300, y=100
- Each subsequent node y+=140
- Decision diamonds branch: Yes path x-=200, No path x+=200
- Max 10 shapes
- All shape IDs are unique
- Default color: "#FFFFFF", default borderColor: "#6366F1"
- Success states: green #10B981 border; error states: red #EF4444 border; decisions: yellow #F59E0B border
Return ONLY the JSON object. No preamble, no markdown fences.'
```

## 10.2 AI diagram test prompt

```
Create server/src/routes/__tests__/ai.test.ts.

Mock the openai module using jest.mock:
- Mock openai.chat.completions.create to return a predetermined response

Tests:

POST /api/ai/diagram:
1. Valid prompt → 200 with { shapes, connections, generationId }
2. Mock OpenAI returning invalid JSON → 502 'AI returned invalid format'
3. Missing prompt → 400
4. prompt > 500 chars → 400
5. Missing boardId → 400
6. Invalid boardId format → 400
7. Unauthenticated → 401
8. Mock OpenAI throwing rate limit error → 502 with friendly error

Since we're mocking, we don't actually call OpenAI (saves money, makes tests deterministic).
```

## 10.3 AI panel frontend prompt

```
Create client/src/components/panels/AIPanel.tsx for Boardify.

Slide-in panel from right, 360px wide, top 52px to bottom.
#1E293B bg, 1px left border #334155, rounded-l-xl, shadow-2xl.
translate-x-full / 0 transition 300ms.

HEADER (52px, border-b #334155, flex between, 16px padding):
- Sparkles icon indigo 20px + "Boardify AI" 15px semibold white
- X close button gray-400

TABS (44px tall, flex, border-b #334155, equal-width):
- "Diagram" | "Summarise" | "Organise"
- Active: indigo text + 2px indigo bottom border
- Inactive: #94A3B8, hover white

DIAGRAM TAB CONTENT (16px padding):

INPUT SECTION (white/5 bg, rounded-xl, 16px padding):
- Label "Describe a diagram" 11px uppercase #94A3B8 tracking-wider
- Textarea 4 rows, resize-none, rounded-xl, 1px #334155 border, dark bg, white 14px, placeholder "e.g. Draw a user login flow with Google OAuth option..."
- Example chips row (3 chips, flex-wrap gap 8px): gray-700 bg, white 12px, rounded-full, 6px 12px padding, hover gray-600
  "Login flow" | "CRUD API flow" | "User onboarding" — click fills textarea
- "Generate diagram →" button: full-width indigo, white 14px semibold, 40px, rounded-xl, Sparkles icon. Disabled when prompt empty.

LOADING STATE (replaces input during generation):
- Indigo progress bar animating across top (2px shimmer)
- Centered: Sparkles icon 32px indigo slow spin + "Generating diagram..." 14px white + "Placing shapes on your canvas" 12px #94A3B8

SUCCESS STATE:
- CheckCircle green-500 32px centered
- "Diagram added to canvas!" 14px semibold white
- "{count} shapes" 12px #94A3B8
- Buttons row gap 8px: "Undo diagram" outline white 32px + "Ask follow-up" solid indigo 32px

ERROR STATE:
- Red X circle 32px
- "Couldn't generate a diagram" 14px white
- error message 12px #94A3B8
- "Try again" outline button

WIRING:
Props: { isOpen, onClose, boardId }
State: activeTab, prompt, status ('idle'|'loading'|'success'|'error'), result, error

Generate handler:
1. setStatus('loading')
2. POST /api/ai/diagram { prompt, boardId }
3. Server returns { shapes, connections, generationId }
4. Convert shapes to Stroke format (tool='rect' for rect/diamond, 'circle' for circle) — for diamonds, set a custom marker so drawStroke renders a diamond instead of rect (extend canvasUtils with drawDiamond as a new shape variant)
5. Convert connections to arrow strokes between shape midpoints
6. Tag every stroke with generationId in a new field (add to Stroke type if not present)
7. For each stroke: addStroke to store + emit 'stroke:add' socket
8. setStatus('success'), save result { shapeCount, generationId }

Undo handler: iterate strokes, remove all with stroke.generationId === result.generationId, emit 'stroke:delete' for each, setStatus('idle')

Ask follow-up: setStatus('idle'), keep prompt, focus textarea

Chip click: setPrompt(chipText), focus textarea

IMPORTANT: extend canvasUtils.drawStroke to render diamond shape when stroke has a shapeVariant='diamond' field. Diamond = polygon with 4 points at (x+w/2, y), (x+w, y+h/2), (x+w/2, y+h), (x, y+h/2). Also draw the label centered inside shape.

Wire to WhiteboardPage: "Ask AI" button in top bar opens AIPanel.
```

## 10.4 Phase 10 Gate 🔵 (mixed)

**Automated:**
- [ ] `cd server && npm test` — all 8 AI route tests green

**Manual (the showcase demo — practice this):**
- [ ] Open AI panel → Diagram tab
- [ ] Type "draw a user login flow with Google OAuth option" → Generate
- [ ] Within 5-15 seconds, shapes + arrows appear on canvas in a logical flow
- [ ] Shapes are connected with arrows (not floating independently)
- [ ] Labels are readable inside shapes (text fits, not overflowing)
- [ ] Try "CRUD API flow" chip → reasonable flow generated
- [ ] Try nonsense input like "asdfasdf" → friendly error appears
- [ ] Try empty input → Generate button is disabled
- [ ] "Undo diagram" removes all generated shapes at once
- [ ] Open Browser 2 on same board → generated diagram appears there too (socket sync)

---
---

# PHASE 11 — AI: Summariser + Organiser

**Goal:** Summarise board content into a paragraph. Cluster sticky notes by theme.

## 11.1 Backend summarise + organise prompt

```
Extend server/src/routes/ai.ts with two new routes (protected with requireAuth):

POST /api/ai/summarise
- Body: { boardId }
- Load board, extract all sticky note texts + text strokes
- If total text items < 3: return 200 { summary: null, reason: 'Not enough content' }
- Call openai.chat.completions.create:
  model: 'gpt-4o-mini'
  messages: [
    { role: 'system', content: 'You are a whiteboard analyst. Given the text content from a collaborative whiteboard, write a 3-4 sentence plain English summary of what this board is about and what the team is working on. Be specific about topics. Professional tone.' },
    { role: 'user', content: 'Board content:\n' + allTextItems.join('\n') }
  ]
- Return 200 { summary: response.choices[0].message.content }

POST /api/ai/organise
- Body: { notes: StickyNote[] }
- Validate: notes array min 2
- Call openai.chat.completions.create:
  model: 'gpt-4o-mini'
  response_format: { type: 'json_object' }
  messages: [
    { role: 'system', content: 'Group these sticky notes by theme. Return ONLY JSON: { "themes": [{ "name": string, "color": string (hex), "noteIds": string[] }] }. Max 4 themes. Use distinct background colors: #FEF9C3, #DCFCE7, #FCE7F3, #DBEAFE.' },
    { role: 'user', content: JSON.stringify(notes.map(n => ({ id: n.id, text: n.text }))) }
  ]
- Parse JSON, return 200 { themes }
- On parse error: 502

Add tests in server/src/routes/__tests__/ai.test.ts (mock openai):
- Summarise with >3 items → summary returned
- Summarise with <3 items → { summary: null, reason }
- Organise with valid notes → themes returned
- Organise with <2 notes → 400
```

## 11.2 Summarise + Organise tabs prompt

```
Add two tab components inside AIPanel for Boardify.

FILE: client/src/components/panels/AISummariseTab.tsx

Design:
- "AI reads all sticky notes and text on the board and writes a summary." 12px #94A3B8
- "Summarise board" button: full-width indigo, FileText icon, 40px
- Result card (white/8 bg, rounded-xl, 14px padding): "Board Summary" 11px uppercase #94A3B8 label + summary text 13px white line-height 1.7
- Buttons under card: "Copy summary" ghost (copy icon) + "Add to board as sticky" ghost
- Empty state if < 3 items: centered muted text "Not enough content to summarise yet..."

Wiring:
- POST /api/ai/summarise { boardId }
- If summary === null, show empty state
- "Copy summary": navigator.clipboard.writeText(summary) + toast 'Copied'
- "Add to board as sticky": create new StickyNote at top-center with yellow bg, text = summary, addStickyNote + emit socket event

FILE: client/src/components/panels/AIOrganiseTab.tsx

Design:
- "Select sticky notes to group by theme." 12px #94A3B8
- "Select all stickies" outline white toggle
- Scrollable list max-h-60: each row (checkbox + color swatch + truncated text 13px white)
- "Organise by theme →" full-width indigo, Sparkles icon (disabled if none selected)
- Results: "Found {N} themes:" label + theme cards stacked (rounded-xl, white/5 bg, 12px padding, color swatch + name + count)
- "Apply grouping to board" indigo full-width

Wiring:
- State: selectedIds Set<string>, themes
- POST /api/ai/organise { notes: filtered by selectedIds }
- Apply grouping: for each theme, update notes' color in store + reposition in cluster layout
  (theme 1 cluster starts at x=300 y=200, theme 2 at x=800 y=200 etc.; 2-col grid per theme, 220px × 180px spacing)
- Emit 'sticky:update' for each changed note
- Toast 'Notes organised by theme'
```

## 11.3 Phase 11 Gate 🔵 (mixed)

**Automated:**
- [ ] `cd server && npm test` — all AI tests including 4 new ones green

**Manual:**
- [ ] Open board with 4+ sticky notes → Summarise → paragraph references actual note content
- [ ] Empty board → Summarise → shows "Not enough content" state
- [ ] "Add as sticky" creates new sticky with summary text on canvas
- [ ] Organise tab: select 4 notes → Organise → 2-3 themes identified
- [ ] Apply grouping → notes recolored + repositioned into visual clusters
- [ ] Browser 2 sees the reorganisation via socket

---
---

# PHASE 12 — AI: Handwriting OCR

**Goal:** Select region of handwriting → GPT-4o vision reads it → text appears as sticky note.

## 12.1 OCR backend + frontend prompt (combined — tightly coupled)

```
BACKEND — extend server/src/routes/ai.ts:

POST /api/ai/ocr (protected)
- Body: { imageBase64: string, boardId: string }
- Validate imageBase64 is a valid data URL (starts with "data:image/png;base64,")
- Call openai.chat.completions.create:
  model: 'gpt-4o'  // NOT mini — needs vision
  messages: [{
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: imageBase64 } },
      { type: 'text', text: 'This is a region of a whiteboard. Read any handwritten text visible. Return ONLY the extracted text. If no text visible, return empty string. Do not add commentary or prefixes.' }
    ]
  }]
- Return 200 { text: response.choices[0].message.content.trim(), confidence: 0.9 }
  (GPT-4o doesn't return real confidence — hardcode 0.9 or estimate from response length vs image complexity)

Add test: mock openai, test OCR returns text + 200; invalid image → 400.

FRONTEND:

Create client/src/components/canvas/SelectionOverlay.tsx:
- Renders when activeTool === 'select' and user has drawn a selection bounds
- 2px dashed indigo border, #6366F1 at 8% opacity fill
- 4 corner handles (8px white squares, 2px indigo border)
- Floating toolbar above: white pill rounded-full shadow-lg 8px padding:
  Sparkles + "Extract text" indigo 13px semibold | divider | Copy icon gray | divider | Trash red hover
- Processing state: overlay #1A1A2E at 70% inside selection + spinner + "Reading handwriting..." 12px white

Mouse events in Canvas.tsx when activeTool === 'select':
- onMouseDown: startSelection = point
- onMouseMove: update selection bounds
- onMouseUp: finalize selection (min 50×50, else discard)
- Pass selection to SelectionOverlay via prop or Zustand

Extract text handler:
1. Create offscreen canvas width = selection.width × dpr, height = selection.height × dpr
2. Draw only strokes that intersect the selection bounds (translate by -selection.x, -selection.y)
3. offscreen.toDataURL('image/png')
4. POST /api/ai/ocr { imageBase64, boardId }
5. On response → render OCRResult popup

Create client/src/components/canvas/OCRResult.tsx:
- White card rounded-xl shadow-xl 280px 16px padding, positioned 12px below selection
- Header: Sparkles indigo 16px + "Extracted text" 14px semibold #1E293B
- Text box: gray-50 bg rounded-lg 12px padding 13px #374151 line-height 1.5
- "Confidence: N%" 12px green-600 (>90) / yellow-600 (70-90) / red-600 (<70)
- Buttons: "Add as sticky note" solid indigo small + "Copy text" outline + "Dismiss" ghost

Handlers:
- Add as sticky: create StickyNote at selection.x, selection.y with text = result.text, yellow bg → addStickyNote + emit 'sticky:add'
- Copy: navigator.clipboard.writeText(result.text) + toast
- Dismiss: close popup, clear selection

If result.text is empty: show "No text found. Try clearer writing or larger selection." + only Dismiss button.
```

## 12.2 Phase 12 Gate 🔵 (mixed)

**Automated:**
- [ ] `cd server && npm test` — OCR route tests green

**Manual:**
- [ ] Draw "hello" on canvas with pen
- [ ] Switch to Select tool → draw rectangle around "hello"
- [ ] Selection toolbar appears → click "Extract text"
- [ ] Loading state shows → result popup appears within 5-10s
- [ ] Result text reads "hello" (or close)
- [ ] "Add as sticky note" creates yellow sticky with that text
- [ ] Try shapes/arrows (no text) → empty result + "No text found"
- [ ] Try selection smaller than 50×50 → button disabled or error

---
---

# PHASE 13 — Export (PNG + JSON)

**Goal:** Export canvas as PNG image or JSON data. Copy share link.

## 13.1 Export panel prompt

```
Create client/src/components/panels/ExportPanel.tsx for Boardify.

Triggered by Export button in top bar. Two UIs:

DROPDOWN MENU (appears below Export button):
- White rounded-xl shadow-xl 240px 8px padding
- Title "Export board" 13px semibold #374151
- 3 option rows (12px padding, rounded-lg, hover bg-gray-50, flex gap 12px):
  Row 1: Image icon indigo 20px | "Export as PNG" 14px + "Current viewport as image" 12px #9CA3AF | "⌘E" gray pill badge
  Row 2: Code icon gray 20px | "Export as JSON" 14px + "Full board data for backup"
  Row 3: Link icon indigo 20px | "Copy share link" 14px + "Anyone with link can view"
- 1px #F3F4F6 dividers between rows

PNG EXPORT MODAL (after clicking Export as PNG):
- Centered on black/50 backdrop
- White rounded-2xl shadow-2xl 480px 24px padding
- "Export as PNG" 18px semibold + X close
- Preview area (gray-100 bg rounded-xl 200px tall): live thumbnail
- Options gap 14px:
  - "Background" label + segmented toggle [Transparent] [White] [Dark] 36px rounded-lg (active = indigo bg white text)
  - Checkbox "Include sticky notes" (checked default)
  - "Scale" label + select 1x/2x/4x (2x default)
- Buttons: Cancel ghost + "Download PNG" solid indigo with Download icon

Download PNG logic:
1. Create offscreen canvas: width = window.innerWidth × scale, height × scale
2. Fill bg based on bgMode (none for transparent, fillRect with #FFFFFF / #1A1A2E)
3. Scale context
4. redrawAll from canvasUtils with current strokes
5. If includeStickies: for each StickyNote, fillRect with note color + fillText (manual word wrap at note width)
6. canvas.toBlob('image/png')
7. URL.createObjectURL → trigger <a download="{title-slug}-{date}.png"> click
8. revokeObjectURL, toast 'PNG exported', close modal

Export JSON:
1. GET /api/boards/:id → full board
2. JSON.stringify(board, null, 2)
3. Blob 'application/json' → download as '{title}.json'
4. Toast 'JSON exported'

Copy share link:
1. url = window.location.origin + '/board/' + board.shareToken
2. navigator.clipboard.writeText(url)
3. Toast 'Link copied'

Keyboard shortcut in WhiteboardPage: Cmd/Ctrl+E → trigger PNG download with defaults (white bg, 2x, includeStickies) — bypasses modal.
```

## 13.2 Phase 13 Gate 🟡 (manual)

**Manual:**
- [ ] Click Export → dropdown shows 3 options
- [ ] Export as PNG → modal opens with live thumbnail
- [ ] Switch between Transparent / White / Dark bg → thumbnail updates
- [ ] Click Download PNG → file downloads with readable filename
- [ ] Open PNG → all strokes visible + sticky notes rendered (if included)
- [ ] 2x scale → image is double resolution (not blurry)
- [ ] Export as JSON → file downloads, opens in text editor, valid parseable JSON
- [ ] Copy share link → toast appears, link in clipboard is working URL
- [ ] Cmd/Ctrl+E → PNG downloads immediately without modal

---
---

# PHASE 14 — Rooms + Sharing

**Goal:** Invite collaborators by email. Share link with view/edit modes. Viewers see disabled toolbar.

## 14.1 Backend share routes prompt

```
Extend server/src/routes/boards.ts:

POST /api/boards/:id/invite (requireAuth, owner only)
- Body: { email, role: 'editor'|'viewer' }
- Find target user by email. If not found → 404 'User not found'
- If already collaborator → 409 'Already a collaborator'
- Push to board.collaborators. Return 200 { collaborator: { user, role } }

PATCH /api/boards/:id/collaborators/:userId (requireAuth, owner only)
- Body: { role }
- Update collaborator's role in the array
- Return 200 { updated }

DELETE /api/boards/:id/collaborators/:userId (requireAuth, owner only)
- Pull from collaborators
- Return 204

PATCH /api/boards/:id/share (requireAuth, owner only)
- Body: { shareMode: 'none'|'view'|'edit' }
- Update board.shareMode
- Return 200 { shareMode }

Update GET /api/boards/:id: if user has no auth token but board.shareMode is 'view' or 'edit', allow read-only access. Return shareMode in response so client knows.

Update PATCH /api/boards/:id: allow if shareMode === 'edit' (even without auth) OR owner OR editor collaborator. Reject if viewer.

Add tests for all 4 new routes.
```

## 14.2 Share modal prompt

```
Create client/src/components/panels/ShareModal.tsx for Boardify.

Centered modal on black/50 backdrop.
White rounded-2xl shadow-2xl 480px 32px padding.

Header: "Share '{boardTitle}'" 18px semibold #1E293B (truncate) + X close

INVITE SECTION:
- "Invite people" 13px semibold #374151
- Flex row gap 8px: email input (flex-grow, 40px, rounded-lg, placeholder "Add people by email...") + role select (120px, "Can edit"/"Can view") + "Send invite" indigo 40px
- Below: pending invites list with "Pending" gray badge + X

COLLABORATORS LIST (below divider, 20px top margin):
- "People with access" 13px semibold #374151
- Rows 48px, rounded-lg, hover bg-gray-50, 8px padding:
  - Avatar circle 32px with user's avatar color + initials
  - Name 14px #1E293B + email 12px #6B7280 below
  - Right side:
    - Owner: "Owner" gray pill + Crown icon
    - Editor/viewer: role select dropdown small 80px
    - Pending: "Pending invite" italic 12px + X

SHARE LINK SECTION (below divider, 20px top margin):
- "Share link" 13px semibold
- Toggle row: "Anyone with the link can..." + select "view only" / "edit" / "No access"
- Link box (1px border #E5E7EB, rounded-lg, bg-gray-50, 12px padding):
  URL truncated 13px #6B7280 (flex-grow) + "Copy" indigo button
- After copy: green "Copied!" inline (fades 2s)

Footer: "Changes are saved automatically" 12px #9CA3AF centered, margin-top 24px

Wiring:
- Props: isOpen, onClose, boardId
- On open: GET /api/boards/:id for collaborators/shareToken/shareMode
- Send invite: POST /api/boards/:id/invite { email, role } — optimistic add + rollback on error, inline errors for 404/409
- Role change: PATCH /api/boards/:id/collaborators/:userId
- Remove: DELETE + optimistic remove
- Share mode change: PATCH /api/boards/:id/share
- Copy: clipboard + toast

In WhiteboardPage:
- If current user is viewer collaborator OR accessing via view-only share link:
  - Show "View only" badge in top bar (gray pill)
  - Disable all drawing tools (opacity-50, cursor-not-allowed, click shows toast "View only — cannot edit")
  - Canvas is still pannable/zoomable but not drawable
```

## 14.3 Phase 14 Gate 🔵 (mixed)

**Automated:**
- [ ] `cd server && npm test` — new share routes tests green

**Manual:**
- [ ] Share modal opens, shows owner + collaborators
- [ ] Invite collab@whiteboard.app as editor → appears in list
- [ ] Log in as collab in another browser → see the board in "Shared with me"
- [ ] Change role to viewer → collab's toolbar becomes disabled
- [ ] Remove collab → collab loses access (refresh forces logout from board)
- [ ] Set share link to "view only", copy URL, open in incognito → can view but not draw
- [ ] "View only" badge visible on top bar in incognito
- [ ] Set share link to "edit", open in incognito → can draw

---
---

# PHASE 15 — Polish

**Goal:** Empty states, skeleton loaders, toast notifications, error boundary.

## 15.1 Polish prompt

```
Finish polish for Boardify.

FILE 1: client/src/components/ui/EmptyState.tsx (reusable)

Props: { icon, title, description?, action?: { label, onClick, variant?: 'primary'|'subtle' }, size?: 'large'|'subtle' }

Design:
- Flex column, items-center, text-center, gap 12px
- size='large': icon wrapper 64px + title 22px white + desc 15px #94A3B8 max-w 340px + solid indigo 48px button
- size='subtle': icon 40px #334155 + title 16px #475569 + desc 13px #334155 + inline text link indigo 13px

Use in 3 places:
1. DashboardPage empty: icon Presentation + "No boards yet" + "Create first board" primary action
2. WhiteboardPage empty canvas (fade opacity 0 when strokes.length > 0): icon Pencil + "Start drawing" + "Generate diagram →" subtle
3. AI panel empty state: icon Sparkles + "What would you like to create?" + 3 suggestion chips (stacked gap 8px):
   "Draw a flowchart" → switch to Diagram tab, prefill prompt
   "Summarise this board" → switch to Summarise tab
   "Extract text from drawing" → switch to select tool, close panel

FILE 2: client/src/components/ui/BoardCardSkeleton.tsx

Matches real board card dimensions.
- #1E293B bg, rounded-2xl, 1px border #334155
- Thumbnail skeleton: 160px tall bg-slate-800 animate-pulse rounded-t-2xl
- Footer 20px padding: title skeleton bg-slate-700 rounded w-3/5 h-3.5 animate-pulse + date bg-slate-700 w-2/5 h-2.5 mt-1.5 + 3 overlapping circles 20px bg-slate-700

Use in DashboardPage while boards are loading — render 6 in the grid.

Never use pure white skeletons on dark theme.

FILE 3: client/src/components/ui/CanvasLoadingState.tsx

Full-screen dark #1A1A2E absolute inset-0.
Centered: Boardify logo indigo 32px animate-pulse + "Loading board..." 14px gray-400 mt-3.

Use in WhiteboardPage while GET /api/boards/:id is pending.

TOAST CONFIG in client/src/main.tsx:
import { Toaster } from 'react-hot-toast'
<Toaster
  position="bottom-right"
  toastOptions={{
    style: { background: '#1E293B', color: '#fff', border: '1px solid #334155' },
    success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
    error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } }
  }}
/>

Add toast.success for: board created, stroke saved, sticky saved, OCR extracted, diagram generated, export downloaded, link copied.
Add toast.error for: socket disconnected, AI error, save failed.

FILE 4: client/src/components/ErrorBoundary.tsx

Class component that catches errors in children. On error:
- Render centered card (white rounded-2xl 32px padding): AlertTriangle icon red + "Something went wrong — your work is saved" 18px + error message 13px + "Reload board" indigo button (window.location.reload)
- Log error to console

Wrap WhiteboardPage and DashboardPage with <ErrorBoundary>.

Socket disconnect toasts — in useSocket.ts:
- On 'disconnect': toast.loading('Connection lost — trying to reconnect...', { id: 'sock' })
- On 'connect' (after first connect): toast.dismiss('sock') + toast.success('Reconnected')
- On 'reconnect_failed': toast.error('Could not reconnect — refresh the page', { id: 'sock' })
```

## 15.2 Phase 15 Gate 🟡 (manual)

**Manual:**
- [ ] Dashboard shows 6 skeletons briefly while loading
- [ ] New user's empty dashboard shows "No boards yet" empty state with Create button
- [ ] Empty canvas shows "Start drawing" subtle hint (fades out once you draw)
- [ ] AI panel with no input shows "What would you like to create?" + suggestion chips
- [ ] Click "Draw a flowchart" chip → switches to Diagram tab with prompt prefilled
- [ ] Create board → success toast appears (dark theme styled)
- [ ] Save fails (disable server briefly) → error toast
- [ ] Disconnect internet → "Connection lost" loading toast persists
- [ ] Reconnect → toast dismissed + "Reconnected" success toast
- [ ] Trigger a canvas error (e.g. pass bad data in DevTools) → Error Boundary shows instead of white screen

---
---

# PHASE 16 — Deploy

**Goal:** Frontend on Vercel, Backend on Railway, both live.

## 16.1 Deploy steps

This phase is all manual — no code generation.

**Backend to Railway:**
1. Push code to GitHub (one repo)
2. railway.app → New Project → Deploy from GitHub → select repo
3. In Railway settings, set root directory to `server/`
4. Add environment variables:
   - `MONGODB_URI` (your Atlas string)
   - `JWT_SECRET` (`openssl rand -base64 32`)
   - `OPENAI_API_KEY`
   - `CLIENT_URL` — leave empty for now, will fill after Vercel deploy
5. Railway gives you a URL like `https://whiteboard-server.up.railway.app`
6. Via Railway shell, run `npx ts-node src/seed.ts` to seed production DB

**Frontend to Vercel:**
1. vercel.com → New Project → Import repo
2. Set root directory to `client/`
3. Add env var: `VITE_SERVER_URL` = your Railway URL
4. Deploy
5. Vercel gives you a URL like `https://boardify.vercel.app`

**Post-deploy:**
1. Update Railway `CLIENT_URL` to your Vercel URL, redeploy
2. Update README with live URLs + demo credentials

## 16.2 Phase 16 Gate 🟡 (manual)

**Manual (all on production URLs):**
- [ ] Frontend loads at Vercel URL
- [ ] Login with `demo@whiteboard.app / Demo123!` works
- [ ] Can view seeded boards
- [ ] Can draw on canvas
- [ ] Open board in 2 tabs → strokes sync in real time
- [ ] AI diagram generation works
- [ ] OCR works
- [ ] Network tab shows WebSocket (101 Switching Protocols), not polling
- [ ] Demo credentials shown on login page
- [ ] README has live URLs + screenshot/GIF of real-time sync

---
---

# Final Resume Statement

After all phases green:

> "Built Boardify, a real-time collaborative whiteboard using MERN stack with Socket.io for live multi-user sync. Implemented JWT authentication, HTML5 Canvas with bezier curve smoothing for freehand drawing, and Zustand for state management. AI features powered by GPT-4o: diagram generation from natural language, board summarisation, sticky note theme clustering, and handwriting OCR via vision. Backend tested with Supertest (16+ API integration tests) and Jest (pure logic unit tests). Deployed frontend on Vercel and Socket.io backend on Railway."

---

*Boardify Build Plan v3 — pragmatic testing, hard gates, shippable.*
