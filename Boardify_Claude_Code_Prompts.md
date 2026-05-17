# Boardify — Claude Code Prompts (All Screens + Bootstrap)

> Direct Claude Code workflow. No Stitch. Each prompt combines UI spec + tech wiring + state + API into one paste-ready block. Open Claude Code in VS Code, paste the prompt for the screen you're working on, review the output, iterate inline.

---

## How to use this file

1. Open VS Code with Claude Code extension running
2. Start with the **Bootstrap Prompt** below — it scaffolds the whole project
3. Verify `npm run dev` works (both servers start without errors)
4. Then follow the build order table and paste each screen prompt into Claude Code as you get to that phase
5. After each generation: review, test in the browser, iterate with follow-up messages like "make the card wider" or "add a loading state"

### Tips for working with Claude Code
- **One component per prompt.** Don't ask it to build 3 screens at once — the output quality drops fast.
- **Review before moving on.** If the login page looks wrong, fix it now. Mistakes compound.
- **Reference the design system block.** If a generated component uses wrong colors, say "re-check the design system at the top of the project spec."
- **Let Claude Code run the terminal.** It can install packages, run migrations, and test builds. Let it.

### Prerequisites before the bootstrap prompt
- Node.js 20+ installed
- MongoDB Atlas connection string ready (free tier is fine)
- OpenAI API key ready (fund with $5–10)
- An empty folder to start in

### Design system (Claude Code references this throughout)
- **Primary:** `#6366F1` (indigo) — buttons, active states, accents
- **Dark bg:** `#0F172A` (landing/auth), `#1A1A2E` (canvas), `#1E293B` (panels/cards)
- **Borders:** `#334155` (dark), `#E5E7EB` (light)
- **Text:** `#FFFFFF` primary, `#94A3B8` secondary, `#1E293B` on light bg
- **Font:** Inter
- **Radius:** `rounded-lg` (inputs), `rounded-xl` (cards), `rounded-2xl` (modals), `rounded-full` (pills)

---
---

# 🚀 BOOTSTRAP PROMPT — Run this first in VS Code

> Paste this entire block into Claude Code. It will scaffold the monorepo, install all dependencies, configure Tailwind, set up Socket.io + MongoDB + Express, and get `npm run dev` working.

```
Scaffold a full-stack TypeScript monorepo called "whiteboard" for a real-time collaborative whiteboard app called Boardify. Build in my current directory.

STRUCTURE:
whiteboard/
├── client/          ← React + Vite + TypeScript
├── server/          ← Node.js + Express + TypeScript
├── shared/          ← shared types
├── package.json     ← root with concurrent dev script
└── .gitignore

CLIENT SETUP (client/):
1. Scaffold: npm create vite@latest client -- --template react-ts
2. Install: tailwindcss postcss autoprefixer socket.io-client zustand react-router-dom react-hook-form @hookform/resolvers zod axios react-hot-toast lucide-react
3. Initialize Tailwind with npx tailwindcss init -p
4. Configure tailwind.config.js:
   - darkMode: 'class'
   - content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']
   - theme.extend.colors: { primary: '#6366F1', 'bg-canvas': '#1A1A2E', 'bg-panel': '#1E293B', 'bg-landing': '#0F172A' }
   - theme.extend.fontFamily.sans: ['Inter', 'system-ui', 'sans-serif']
5. Add @tailwind base/components/utilities to src/index.css
6. Add Inter font import from Google Fonts in index.html

SERVER SETUP (server/):
1. Create server/ folder, cd into it, npm init -y
2. Install runtime deps: express socket.io mongoose jsonwebtoken bcryptjs cors dotenv openai nanoid
3. Install dev deps: typescript ts-node-dev @types/express @types/node @types/jsonwebtoken @types/bcryptjs @types/cors
4. Create tsconfig.json with: strict, target ES2022, module commonjs, outDir ./dist, rootDir ./src, esModuleInterop
5. Add package.json scripts:
   - "dev": "ts-node-dev --respawn --transpile-only src/index.ts"
   - "build": "tsc"
   - "start": "node dist/index.js"
   - "seed": "ts-node src/seed.ts"

CREATE server/src/index.ts:
- Load dotenv at the top
- Create Express app with cors({ origin: process.env.CLIENT_URL, credentials: true })
- Add express.json() middleware
- Create HTTP server and attach Socket.io with same CORS config
- Connect to MongoDB via mongoose.connect(process.env.MONGODB_URI!)
- Mount routes: /api/auth, /api/boards, /api/ai (import empty routers from ./routes/)
- On server start, log "✅ Server running on port PORT" and "✅ MongoDB connected"
- Handle uncaught errors gracefully

CREATE empty router stubs (export Router with no routes yet):
- server/src/routes/auth.ts
- server/src/routes/boards.ts
- server/src/routes/ai.ts

CREATE client/src/lib/socket.ts:
- Import io from socket.io-client
- Export singleton: const socket = io(import.meta.env.VITE_SERVER_URL, { autoConnect: false, auth: {} })
- Export helper: connectSocket(token: string) that sets socket.auth = { token } and calls socket.connect()

CREATE client/src/lib/api.ts:
- Axios instance with baseURL: import.meta.env.VITE_SERVER_URL + '/api'
- Request interceptor: attach Authorization: Bearer <token> from localStorage('wb_token')
- Response interceptor: on 401, clear token and redirect to /login

CREATE shared/types.ts with shared interfaces:
- User { id: string; name: string; email: string; avatar: string }
- Point { x: number; y: number }
- Tool = 'select' | 'pen' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'sticky' | 'pan'
- Stroke { id: string; tool: Tool; points: Point[]; color: string; strokeWidth: number; userId: string; timestamp: number; text?: string }
- StickyNote { id: string; text: string; x: number; y: number; width: number; height: number; color: string; userId: string; timestamp: number }
- Board { id: string; title: string; description?: string; owner: string; collaborators: Array<{ user: string; role: 'editor'|'viewer' }>; thumbnail?: string; isPublic: boolean; shareToken: string; strokes: Stroke[]; stickyNotes: StickyNote[]; createdAt: string; updatedAt: string }
- Configure both tsconfigs with paths so both client and server can import from @shared/types

CREATE .env files (with placeholder values, do NOT fill in real secrets):
- server/.env: PORT=3001, MONGODB_URI=, JWT_SECRET=, OPENAI_API_KEY=, CLIENT_URL=http://localhost:5173
- client/.env: VITE_SERVER_URL=http://localhost:3001
- Add .env to .gitignore at root

ROOT package.json:
- npm init -y at root
- Install concurrently as dev dependency
- Scripts:
  - "dev": "concurrently -n client,server -c blue,green \"cd client && npm run dev\" \"cd server && npm run dev\""
  - "install:all": "npm install && cd client && npm install && cd ../server && npm install"

CREATE root .gitignore with: node_modules, .env, dist, .DS_Store, *.log

CREATE README.md with project name, tech stack, and setup instructions (install:all, fill .env, run npm run dev).

After scaffolding, run `npm run install:all` then tell me to fill in my .env files before testing `npm run dev`.
```

**After Claude Code finishes bootstrapping:**
1. Fill in `server/.env` with your real MongoDB URI, a JWT secret (`openssl rand -base64 32`), and your OpenAI key
2. Run `npm run dev` at the root
3. You should see: `✅ Server running on port 3001`, `✅ MongoDB connected`, and Vite starting at localhost:5173
4. If both start cleanly, bootstrap is done — move to the next prompt below

---

## Next — Database Models (run before building auth UI)

```
Create three Mongoose models for Boardify in server/src/models/:

User.ts:
{ name: String required, email: String required unique lowercase,
  password: String required (bcrypt hashed), avatar: String (hex color from 8 predefined),
  createdAt: Date default now }
Export both the schema and a pre-save hook that bcrypt-hashes password.

Board.ts with embedded StrokeSchema and StickyNoteSchema:
Board: { title: String required, description: String, owner: ObjectId ref User required,
  collaborators: [{ user: ObjectId ref User, role: enum ['editor','viewer'] }],
  thumbnail: String, isPublic: Boolean default false,
  shareToken: String unique default () => nanoid(10),
  strokes: [StrokeSchema], stickyNotes: [StickyNoteSchema],
  timestamps: true }

StrokeSchema (embedded): { id, tool, points: [{x, y}], color, strokeWidth, userId, timestamp, text }
StickyNoteSchema (embedded): { id, text, x, y, width, height, color, userId, timestamp }

Then create server/src/seed.ts that:
- Clears existing users and boards
- Creates 2 users: demo@whiteboard.app (password: Demo123!) and collab@whiteboard.app (Collab123!)
  Assign each a random avatar color from: ['#EF4444','#F59E0B','#10B981','#3B82F6','#6366F1','#8B5CF6','#EC4899','#14B8A6']
- Creates 3 boards for demo user:
  'Product Roadmap Q1', 'Team Brainstorm Session', 'Login Flow Design'
- Seeds each board with 5–8 sample strokes (mix of pen/rect/circle) and 3–4 sticky notes with realistic text
- Logs "Seeding complete" on success

Run: cd server && npm run seed
Verify in MongoDB Compass/Atlas that 2 users and 3 boards exist with embedded data.
```

---

## Build order for UI screens

| # | Phase | Screen | Prerequisites |
|---|---|---|---|
| 1 | 3 | Login page | auth backend routes |
| 2 | 3 | Register page | auth backend routes |
| 3 | 4 | Landing page | none (public) |
| 4 | 4 | Boards dashboard | boards backend routes |
| 5 | 5 | Whiteboard canvas (shell + toolbar) | Zustand store set up |
| 6 | 7 | Sticky notes | Canvas working |
| 7 | 8 | Presence indicators (cursors + participants) | Socket.io handlers |
| 8 | 10 | AI panel — Diagram tab | AI backend routes |
| 9 | 11 | AI panel — Summarise + Organise tabs | AI backend routes |
| 10 | 12 | Selection tool + OCR result | AI backend routes |
| 11 | 13 | Export panel | Canvas working |
| 12 | 14 | Share modal | Boards backend + share routes |
| 13 | 15 | Empty states | Polish phase |
| 14 | 15 | Skeleton loaders | Polish phase |

> **Note:** Backend routes (auth, boards, ai, socket handlers) come from Phases 3, 4, 8, 10 of your build plan. Build the backend for a phase before building the UI for that phase. The prompts in the build plan are already specific — paste those into Claude Code as separate messages.

---
---

# 1. Login Page (Phase 3)

**File:** `client/src/pages/LoginPage.tsx`
**Backend needed first:** `POST /api/auth/login` route

```
Create client/src/pages/LoginPage.tsx for Boardify — a React TypeScript component.

DESIGN (follow exactly):
- Full screen. Background: dark gradient from #1A1A2E (top) to #16213E (bottom)
- Centered card: white bg, rounded-2xl, 400px wide, 40px padding, subtle shadow
- Top of card: app icon (indigo gradient square with rounded corners, white pencil+sparkle
  icon 32px) next to "Boardify" text 22px semibold #1E293B, centered
- "Sign in to your workspace" 18px medium #374151, centered, margin-top 8px
- 32px gap, then:
- "Continue with Google" button: full width, white bg, 1px #E5E7EB border, Google G icon,
  14px #374151 label, hover: bg-gray-50 (button is visual only, no handler)
- OR divider with "or" text in 13px #9CA3AF
- Email input: label "Email" 13px semibold #374151 above, 40px height, rounded-lg,
  1px #D1D5DB border, placeholder "you@company.com", focus: indigo ring
- Password input: label "Password", show/hide eye toggle, "Forgot password?" link
  right-aligned 13px indigo (link is visual only)
- "Sign in" button: full width, indigo #6366F1 bg, white 15px semibold, 42px height,
  rounded-xl, hover bg #4F46E5, disabled state during submit
- "Don't have an account? Create one" centered 13px, "Create one" is indigo link to /register
- Below card: "🔒 Your data is encrypted and secure" 12px #9CA3AF centered
- Use Inter font. WCAG AA contrast.

WIRING:
- React Hook Form with zodResolver
- Zod schema: { email: z.string().email('Invalid email'), password: z.string().min(8, 'Minimum 8 characters') }
- Show inline errors below each input in red-500 12px
- On submit: POST to /api/auth/login via the axios instance in client/src/lib/api.ts
  with { email, password }
- On 200 response: destructure { token, user }, save token to localStorage('wb_token'),
  store user in whiteboardStore (Zustand setUser action), call connectSocket(token)
  from lib/socket.ts, navigate to /dashboard using react-router-dom's useNavigate
- On 401: show red error banner above form "Invalid email or password"
- On network error: show "Something went wrong. Please try again."
- Button shows a lucide-react Loader2 spinning icon while submitting
- Include demo credentials helper text below the card in dev mode:
  "Demo: demo@whiteboard.app / Demo123!" (copy-on-click)

Also set up client/src/store/whiteboardStore.ts using Zustand if not already created —
include user, token, setUser(user, token), logout() — logout clears localStorage,
disconnects socket, navigates to /.
```

---

# 2. Register Page (Phase 3)

**File:** `client/src/pages/RegisterPage.tsx`
**Backend needed first:** `POST /api/auth/register` route

```
Create client/src/pages/RegisterPage.tsx for Boardify.

DESIGN:
- Same dark gradient bg as login (#1A1A2E → #16213E)
- White card, 400px wide, rounded-2xl, 40px padding
- Top: Boardify icon + name (same style as login)
- "Create your account" 18px medium #374151 centered
- 32px gap, then:
- Full name input: label "Your name" 13px semibold, placeholder "Alex Johnson", 40px rounded-lg
- Email input: label "Email address", placeholder "you@company.com"
- Password input with strength indicator:
  - Password field with show/hide eye toggle
  - Below input: 4-segment bar (each segment rounded, 4px height, 4px gap between)
  - Segment fills as password gets stronger: 1=red #EF4444, 2=orange #F59E0B,
    3=yellow #EAB308, 4=green #22C55E
  - Label beside bar: "Weak" / "Fair" / "Good" / "Strong" 12px, matching segment color
- Confirm password input: label "Confirm password"
- "Create account" button: full width indigo, 42px, rounded-xl, same style as login
- "By signing up you agree to our Terms and Privacy Policy" 12px #9CA3AF centered
- "Already have an account? Sign in" 13px centered, "Sign in" indigo link to /login
- Inter font, WCAG AA

WIRING:
- React Hook Form + Zod schema:
  name: z.string().min(2, 'Name must be at least 2 characters')
  email: z.string().email('Invalid email')
  password: z.string().min(8, 'At least 8 characters')
  confirmPassword: z.string()
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match', path: ['confirmPassword']
  })
- Password strength: calculate score 0–4 based on:
  +1 for length ≥ 8, +1 for having number, +1 for special char, +1 for uppercase
  Watch the password field with RHF's watch() and update strength live
- On submit: POST to /api/auth/register with { name, email, password }
- On 200: same as login (save token, set user in store, connect socket, navigate to /dashboard)
- On 409 (email exists): show inline error "Email already registered"
- On network error: show banner "Something went wrong"
- Button shows Loader2 while submitting
```

---

# 3. Landing Page (Phase 4)

**File:** `client/src/pages/LandingPage.tsx`
**Backend needed first:** none (public page)

```
Create client/src/pages/LandingPage.tsx for Boardify — a public marketing page.

DESIGN:
Full-width page. Dark bg #0F172A.

NAVBAR (fixed, full width, 64px, #0F172A bg, 1px bottom border #1E293B):
- Left: Boardify logo (indigo square icon + "Boardify" white 18px semibold)
- Right: "Sign in" ghost button (white text, 1px white border) +
  "Get started free" solid indigo #6366F1 button

HERO (centered, padding-top 120px):
- "Collaborate. Draw. Think." 56px bold white, text-center, line-height 1.2
  (the word "with" in indigo #6366F1 on its own line before "AI" — or use a single line
  "Collaborate, draw, and think with AI")
- Subhead: "The real-time whiteboard with built-in AI. Draw together, generate diagrams
  from text, and get instant insights." 20px #94A3B8, max-w 560px, centered
- 40px gap, then CTA row:
  - "Start for free →" solid indigo #6366F1, 48px tall, rounded-xl, 24px horizontal
    padding, 16px semibold white
  - "See how it works" ghost button, white border, same size
- Below: "No credit card required • Free forever" 13px #64748B centered

FEATURES STRIP (80px padding):
3 cards side by side (white/10% bg, rounded-2xl, 1px border white/10, 24px padding):
- Card 1: indigo circle icon with pencil (40px) + "Real-time collaboration" 16px semibold
  white + "Draw together with your team. See cursors, strokes, and edits live." 13px #94A3B8
- Card 2: purple circle icon with sparkles + "AI diagram generator" + "Type 'draw a login
  flow' and watch shapes appear on your canvas."
- Card 3: teal circle icon with users + "Multi-user rooms" + "Share a link. Anyone joins
  instantly. No signup required for guests."

CANVAS PREVIEW (80px padding, centered):
- Centered dark card, rounded-2xl, 800px wide, 400px tall, bg #1A1A2E
- Inside: "Live canvas preview" 13px #94A3B8 upper-left + simulate a fake whiteboard
  with some colored SVG shapes (rectangle outlined in indigo, curved line, yellow sticky
  note with "Ideas go here!") and 2 colored cursor dots with name pills ("Sarah K." red,
  "Alex M." blue) to suggest the product UI
- Below card: "Try the live demo →" link in indigo 14px

WIRING:
- Route: "/"  (public — no auth required)
- "Get started free" and "Start for free →" navigate to /register via useNavigate
- "Sign in" navigates to /login
- "See how it works" scrolls smoothly to #features section
- "Try the live demo →" navigates to /login with a ?demo=true query param
  (LoginPage can autofill demo credentials if this param is present)
- Responsive: hero text shrinks to 40px on mobile, feature cards stack vertically at 768px,
  canvas preview card shrinks with max-w-full
- Use lucide-react icons for the feature cards (Pencil, Sparkles, Users)
```

---

# 4. Boards Dashboard (Phase 4)

**File:** `client/src/pages/DashboardPage.tsx`
**Backend needed first:** `GET /api/boards`, `POST /api/boards`, `DELETE /api/boards/:id`

```
Create client/src/pages/DashboardPage.tsx for Boardify — the authenticated user's board list.

DESIGN:
Full viewport. Sidebar + content layout.

SIDEBAR (240px, #1E293B bg, full height):
- Top: Boardify logo (indigo icon + white text), 20px padding
- Nav items (44px tall, 12px padding, rounded-lg, white text, gap 4px):
  - "My Boards" (grid icon) — ACTIVE state = indigo-500/10 bg + indigo text
  - "Shared with me" (users icon)
  - "Recent" (clock icon)
  - "Starred" (star icon)
  - 1px #334155 divider
  - "Settings" (settings icon)
- Bottom: user avatar (32px circle, colored initials on user's avatar color) +
  user name 14px white + "Free plan" 12px #94A3B8 + logout icon button (right-aligned)

MAIN CONTENT (flex-grow, 32px padding):
- Page header row (flex between):
  Left: "My Boards" 24px semibold white
  Right: search input (dark #1E293B bg, white text, 240px, rounded-lg, search icon, placeholder "Search boards") + "New Board" solid indigo button (plus icon)
- Filter tabs row: "All" | "Recent" | "Shared" — active has indigo underline, inactive #94A3B8
- Boards grid (3 columns, gap 20px, responsive: 2 cols on tablet, 1 col on mobile):
  Each card (#1E293B bg, rounded-2xl, 1px #334155 border, hover: border-indigo-500 transition):
  - Thumbnail area (full width, 160px, rounded-t-2xl, #0F172A bg, with 3–4 thin gray
    squiggly SVG lines simulating strokes)
  - Card footer (20px padding):
    - Board title 14px semibold white (truncate overflow)
    - "Last edited {relative time}" 12px #94A3B8
  - Bottom row of card (flex between, margin-top 12px):
    Left: up to 3 small colored avatar circles (20px, overlapping -4px margin, collaborators)
    Right: share icon button + more options (...) icon that opens a small menu (Rename, Delete)

NEW BOARD MODAL (triggered by "New Board"):
- Centered on dimmed backdrop
- #1E293B bg, 440px wide, rounded-2xl, 32px padding, shadow-2xl
- "Create new board" 18px semibold white + X close (top right)
- Board name input (dark bg, white text, rounded-lg, placeholder "Untitled board")
- Description textarea (optional, 80px height, same styling)
- Privacy toggle row: "Private" / "Public" labels + toggle switch (indigo when public)
- Buttons row: "Cancel" ghost (left) + "Create board" indigo full width

WIRING:
- Protected route: if no token in localStorage, navigate to /login via useEffect
- On mount: GET /api/boards via axios, store boards in local useState
- Loading state: show 6 skeleton cards (import from components/ui/BoardCardSkeleton — create
  a placeholder if it doesn't exist yet: #1E293B bg matching card dimensions with
  animate-pulse gray-700 shapes inside)
- Board card click: navigate to /board/:id
- Search: client-side filter boards by title (case-insensitive, live as user types)
- Filter tabs: "All" shows all, "Recent" sorts by updatedAt desc, "Shared" filters where user is in collaborators but not owner
- New Board modal: useState for isOpen. On submit: POST /api/boards with { title, description, isPublic }. Prepend new board to boards array optimistically. Close modal. Show success toast "Board created".
- Delete from ... menu: show confirm dialog. DELETE /api/boards/:id. Remove from list. Toast "Board deleted".
- Logout button: clear token, clear Zustand user, disconnect socket, navigate to /
- Relative time: use a tiny helper like `timeAgo(date)` that returns "2 hours ago", "Yesterday", etc. (write it inline in the component — don't pull in a library for this)
- If boards array is empty after load: show empty state — centered in content area, easel SVG icon 64px indigo, "No boards yet" 22px white, "Create your first board and start collaborating" 15px #94A3B8, "Create first board" indigo button that opens the modal
```

---

# 5. Whiteboard Canvas — Shell + Toolbar (Phase 5)

**Files:** `client/src/pages/WhiteboardPage.tsx`, `client/src/components/canvas/CanvasToolbar.tsx`
**Backend needed first:** `GET /api/boards/:id`, Zustand store expanded

```
Create the main whiteboard canvas page for Boardify — the core product screen.
This prompt sets up the page shell and toolbar. Canvas drawing logic comes in a follow-up prompt.

FILES TO CREATE/UPDATE:
1. client/src/pages/WhiteboardPage.tsx
2. client/src/components/canvas/CanvasToolbar.tsx
3. Extend client/src/store/whiteboardStore.ts with canvas state

DESIGN — WhiteboardPage:
Full viewport, no page scroll. bg #1A1A2E.

TOP BAR (full width, 52px, #0F172A bg, 1px bottom border #1E293B, flex between, 16px horizontal padding):
- Left cluster (flex gap 12px):
  - Boardify small logo (24px indigo square icon, no text)
  - Back arrow icon button (lucide ArrowLeft, navigates to /dashboard)
  - Board title 15px semibold white — inline-editable on double-click (becomes input,
    blur/Enter saves via PATCH /api/boards/:id)
  - Unsaved state: yellow dot (8px circle) + "Saving..." 12px #94A3B8 (shows when a save
    is pending, hides when saved)
- Center: connection status pill (flex gap 8px, #1E293B bg, rounded-full, 6px 12px padding):
  - Green dot (6px) + "2 online" 12px white
  - Up to 3 small colored avatars (16px circles), then "+N more" if more
- Right cluster (flex gap 8px):
  - "Share" button (outline white, 32px, link icon, opens ShareModal — stub)
  - "Export" button (outline white, 32px, download icon, opens ExportPanel — stub)
  - "Ask AI" button: indigo bg, white text 13px, sparkle icon, rounded-full,
    opens AIPanel (stub for now)

CANVAS AREA (flex-grow, position relative):
- <canvas ref={canvasRef}> element, absolute inset-0, will handle drawing (stubbed here —
  mouse events set up but no actual drawing yet)
- Below canvas (position absolute, pointer-events none): CursorOverlay component (stub
  empty div for now — built in Phase 8)

TOOLBAR (CanvasToolbar component, floating pill, fixed bottom-center, 40px from bottom):
- White bg, rounded-full, shadow-xl, 8px padding, flex row gap 2px
- Tool buttons (each 36px square, hover: bg-gray-100, active: bg-indigo-50 + indigo icon):
  [Select MousePointer] | 1px vertical divider | [Pen PenLine] [Eraser Eraser] | divider |
  [Line Minus] [Arrow MoveRight] [Rect Square] [Circle Circle] | divider |
  [Text Type] [Sticky StickyNote] | divider | [Hand Hand]
- Active tool: bg #EEF2FF, icon color #6366F1
- Tooltip on hover (200ms delay): show tool name + keyboard shortcut e.g. "Pen (P)"
  — use a lightweight tooltip pattern (CSS ::before or a small utility)

FLOATING OPTIONS PANEL (appears when pen or shape tool is active, left side 48px from edge, top: 50% translateY -50%):
- White card, rounded-xl, shadow, 16px padding, 180px wide
- "Color" 11px uppercase #6B7280 tracking-wider
- Color grid: 5 cols × 2 rows of 20px circles with 1px ring hover:
  black, gray-600, red-500, orange-500, yellow-500, green-500, blue-500,
  purple-500, pink-500, white
- Selected color has 2px white ring + 1px indigo ring offset
- "Stroke width" label
- 3 horizontal lines (thin 1px, medium 3px, thick 6px) as clickable options in a row

ZOOM CONTROLS (fixed bottom-right, 24px from edges):
- White pill, rounded-full, shadow, flex row
- Minus button (32px) | "100%" 13px centered (60px) | Plus button (32px)

WIRING:
- Route: /board/:id (protected, redirect to /login if no token)
- On mount: GET /api/boards/:id, set board in store, load strokes + stickyNotes into store
- Keyboard shortcuts (attach to document, clean up on unmount):
  V=select, P=pen, E=eraser, L=line, A=arrow, R=rect, C=circle, T=text, S=sticky, H=pan
- Zustand store extension:
  activeTool: Tool (default 'pen')
  activeColor: string (default '#FFFFFF')
  strokeWidth: number (default 3)
  strokes: Stroke[]
  stickyNotes: StickyNote[]
  zoom: number (default 1)
  setActiveTool, setColor, setStrokeWidth, addStroke, removeStroke, setBoard, setZoom
- Canvas ref: on mount, set canvas.width = window.innerWidth * devicePixelRatio,
  canvas.height = window.innerHeight * devicePixelRatio, then scale context by devicePixelRatio
- Handle window resize: update canvas dimensions and trigger redraw (redraw logic stubbed)
- Cursor CSS: changes per tool — crosshair for shapes, pen for pen/eraser, grab for pan
- Show empty canvas hint (centered, very muted):
  pencil icon outline 40px #334155, "Start drawing" 16px #475569,
  "or use AI to generate a diagram" 13px #334155, sparkle + "Generate diagram →" indigo
  13px. Hint fades out (opacity 0 transition 300ms) once strokes.length > 0.

Export WhiteboardPage as default. Use lucide-react for all icons. Inter font.
```

**After this:** run a follow-up prompt asking Claude Code to implement the actual drawing logic in a new `Canvas.tsx` component — mouse events, quadratic bezier smoothing, stroke finalization, socket emission. The exact requirements are in Phase 5 of your build plan.

---

# 6. Sticky Note Component (Phase 7)

**File:** `client/src/components/sticky/StickyNote.tsx`
**Backend needed first:** Socket.io handlers for sticky events

```
Create client/src/components/sticky/StickyNote.tsx for Boardify.
Sticky notes are HTML div elements floating above the canvas (not drawn on canvas).

DESIGN:
- Absolutely positioned on a container that sits over <canvas>
- Default size 200×160, user-resizable
- Rounded-xl, shadow with warm color tint (shadow-lg with a custom box-shadow using note color)
- Slight rotation variation: each note can have a small random rotation (-2° to +2°) stored
  in state, applied via transform — makes it feel physical
- Top bar (28px, slightly darker than note bg, rounded-t-xl, flex between, 8px padding):
  - Left: drag handle (6-dot grid icon from lucide GripVertical, 14px, #6B7280)
  - Right: color picker trigger (small 16px circle showing current bg color) +
    delete button (X icon, 14px, #6B7280, hover: red-500)
- Content area (flex-grow, 12px padding):
  - contentEditable div, outline-none, bg-transparent
  - Placeholder "Add a note..." in #9CA3AF when empty
  - Text: 14px #374151, line-height 1.5
- Resize handle bottom-right corner: small diagonal lines indicator (12px, #9CA3AF)
- Color picker popover (opens on color trigger click): horizontal row of 6 color swatches
  in a small white card (yellow #FEF9C3, green #DCFCE7, pink #FCE7F3, blue #DBEAFE,
  purple #E9D5FF, orange #FED7AA)

PROPS:
{
  note: StickyNote
  onUpdate: (noteId: string, updates: Partial<StickyNote>) => void
  onDelete: (noteId: string) => void
  isSelected?: boolean
  currentUserId: string
}

WIRING:
- Drag: onMouseDown on top bar starts drag. Add mousemove + mouseup listeners on document.
  Update x, y in real-time locally (optimistic). On mouseup, call onUpdate and emit
  socket event 'sticky:move' with { noteId, x, y } — debounced handled by parent.
- Resize: onMouseDown on resize handle starts resize. Calculate width/height delta from
  mouse movement. Min size 120×80, max 600×600.
- Edit text: onInput on contentEditable div. Debounce 500ms then call onUpdate with new
  text, which parent uses to emit 'sticky:update' socket event.
- Color change: onClick on color swatch updates note.color via onUpdate, emits socket event.
- Delete: onClick X icon calls onDelete. Parent handles socket emission.
- Keep contentEditable cursor functional — don't break native text editing
- Use requestAnimationFrame during drag for smooth movement
- Use pointer-events: auto on the note container even though canvas underneath is drawable
  (so notes are always interactive)
- If note.userId !== currentUserId and another user is currently editing (pass an
  isBeingEditedBy prop optionally), show a small colored outline + "Sarah is editing"
  label above the note

Create the parent container: client/src/components/sticky/StickyNotesLayer.tsx
- Absolute inset-0, pointer-events: none (so canvas gets events)
- Individual StickyNote children have pointer-events: auto
- Renders all stickyNotes from Zustand store, passes onUpdate/onDelete
- onUpdate debounces API call (PATCH /api/boards/:id) and emits socket event immediately
- Handles incoming 'sticky:add' 'sticky:update' 'sticky:move' 'sticky:delete' socket events
  by updating the store

Double-click on canvas (when sticky tool active): handled in Canvas.tsx — creates a new
StickyNote at click position with yellow bg, empty text, default 200×160, emits 'sticky:add'.
```

---

# 7. Presence Indicators — Cursors + Participants (Phase 8)

**Files:** `client/src/components/canvas/CursorOverlay.tsx`, `client/src/components/panels/RoomPanel.tsx`
**Backend needed first:** Socket.io handlers with cursor + user events

```
Create two components for real-time presence in Boardify.

FILE 1: client/src/components/canvas/CursorOverlay.tsx

DESIGN:
- Absolute inset-0, pointer-events: none (non-interactive overlay)
- For each active remote cursor in store (object keyed by userId):
  - Arrow cursor SVG (14×14px) rotated pointing up-left, filled with user's color
  - Name tag pill beside cursor: user's color bg, white 12px text, rounded-full,
    24px tall, 8px horizontal padding, 4px gap from cursor, translateY(4px)
- Each cursor wraps in a transform: translate(x, y) with CSS transition transform 50ms linear
  for smooth interpolation between socket updates
- Cursor fades out if not updated for 5 seconds (set a per-cursor timeout that removes
  it from the active cursors state)

WIRING:
- Read cursors object from Zustand store: { [userId]: { x, y, color, name, lastSeen } }
- In a useEffect, set up an interval that removes stale cursors (lastSeen > 5s ago)
- Does not emit anything — purely rendering

FILE 2: client/src/components/panels/RoomPanel.tsx

DESIGN:
- Slide-in panel from right, 280px wide, positioned below top bar
- #1E293B bg, 1px left border #334155, rounded-l-xl, shadow-xl
- Opens/closes with slide transition (translate-x-full when closed)

CONTENT:
- Header (52px, border-bottom #334155, flex between, 16px padding):
  "In this board" 14px semibold white + X close button
- Participant rows (each 52px, hover bg-white/5, 12px padding, flex gap 12px):
  - Colored circle avatar (36px) with initials in white 13px semibold —
    bg color from user's avatar field
  - Name column (flex-grow): name 14px white + if current user, "You" gray-600 badge
    11px beside it
  - Status dot (8px circle): green #10B981 if online, yellow #F59E0B if idle (no mouse
    movement for 30s), gray #6B7280 if offline
- 1px divider #334155
- Invite section (16px padding):
  - "Invite others" 13px semibold white
  - Flex row: read-only input (dark bg, 13px #94A3B8 truncated URL) + "Copy" button
    (indigo, small)

REAL-TIME DRAWING INDICATOR (rendered separately, fixed bottom-left of canvas):
- Small toast-like pill, #1E293B bg, rounded-lg, shadow-lg, 12px padding
- Colored dot (matches user color) + "Sarah is drawing..." 13px white
- Appears when receiving 'stroke:start' socket event from another user
- Auto-dismisses 2s after last stroke:update event from that user
- Multiple indicators stack vertically with 8px gap

WIRING:
- RoomPanel gets isOpen + onClose as props from WhiteboardPage
- Reads participants array from Zustand store: Array<{ userId, name, avatar, status: 'online'|'idle'|'offline', isCurrentUser }>
- useSocket hook populates participants from 'room:users' event (initial) and
  'user:joined' / 'user:left' events (delta)
- "Copy" button copies window.location.origin + '/board/' + board.shareToken
  to clipboard via navigator.clipboard.writeText, shows react-hot-toast "Link copied!"
- Also create client/src/hooks/useSocket.ts:
  - On mount: socket.emit('board:join', { boardId })
  - Throttle mousemove on canvas to emit 'cursor:move' at max 50ms intervals
    (use lodash throttle OR a manual setTimeout-based throttle)
  - Subscribe to: 'cursor:move', 'stroke:add', 'stroke:delete', 'sticky:add',
    'sticky:update', 'sticky:move', 'sticky:delete', 'user:joined', 'user:left',
    'room:users', 'stroke:start'
  - Each handler updates the corresponding Zustand state slice
  - Filter out own events (don't re-apply strokes from current user)
  - On unmount: emit 'board:leave' and unsubscribe all listeners
```

---

# 8. AI Panel — Diagram Tab (Phase 10)

**File:** `client/src/components/panels/AIPanel.tsx`
**Backend needed first:** `POST /api/ai/diagram`

```
Create client/src/components/panels/AIPanel.tsx for Boardify.
Slide-in panel from right, 360px wide, below top bar (top: 52px).

DESIGN:
- #1E293B bg, 1px left border #334155, rounded-l-xl, shadow-2xl, full height minus top bar
- Slide-in animation: translate-x-full when closed, translate-x-0 when open, transition 300ms

HEADER (52px, border-b #334155, flex between, 16px padding):
- Left: lucide Sparkles icon (indigo, 20px) + "Boardify AI" 15px semibold white
- Right: X close button (gray-400)

TABS ROW (below header, height 44px, flex, border-b #334155):
- 3 equal-width tabs: "Diagram" | "Summarise" | "Organise"
- Active: indigo text + 2px indigo bottom border (replaces the gray border)
- Inactive: #94A3B8 text, hover: white

DIAGRAM TAB CONTENT (16px padding):

INPUT SECTION (white/5 bg, rounded-xl, 16px padding):
- Label "Describe a diagram" 11px uppercase #94A3B8 tracking-wider
- Textarea (4 rows, resize-none, rounded-xl, 1px #334155 border, dark input bg, white text
  14px, placeholder "e.g. Draw a user login flow with Google OAuth option...")
- EXAMPLE CHIPS row below (8px gap, flex-wrap):
  3 chips: "Login flow" | "CRUD API flow" | "User onboarding"
  Style: gray-700 bg, white 12px, rounded-full, 6px 12px padding, hover: gray-600
  Click chip: fills textarea with the suggestion and focuses it
- "Generate diagram →" button: full width, indigo #6366F1 bg, white 14px semibold,
  40px tall, rounded-xl, lucide Sparkles icon left. Disabled when textarea empty.

LOADING STATE (replaces the input section during generation):
- Indigo progress bar animating across the top of the panel (2px tall, shimmer effect)
- Centered content in the section:
  - lucide Sparkles icon 32px indigo with slow spin animation
  - "Generating diagram..." 14px white semibold
  - "Placing shapes on your canvas" 12px #94A3B8

SUCCESS RESULT (replaces loading after completion):
- lucide CheckCircle green-500 32px centered
- "Diagram added to canvas!" 14px semibold white
- "Login Flow — {shapeCount} shapes" 12px #94A3B8
- Action buttons row (flex gap 8px, margin-top 16px):
  - "Undo diagram" outline white button, small (13px, 32px tall)
  - "Ask follow-up" solid indigo button, small

ERROR STATE:
- Red circle with X 32px
- "Couldn't generate a diagram" 14px semibold white
- Error message 12px #94A3B8
- "Try again" button

WIRING:
- Props: { isOpen: boolean, onClose: () => void, boardId: string }
- Tab state: activeTab = 'diagram' | 'summarise' | 'organise' (default 'diagram')
- Diagram tab local state:
  - prompt: string
  - status: 'idle' | 'loading' | 'success' | 'error'
  - result: { shapeCount: number, generationId: string } | null
  - error: string | null
- "Generate diagram" handler:
  - Set status = 'loading'
  - POST /api/ai/diagram with { prompt, boardId }
  - Server returns { shapes: [...], connections: [...], generationId: string }
  - For each shape in response, create a Stroke and call addStroke in Zustand store
  - For each connection, create an arrow Stroke
  - Tag each with generationId in a custom field so we can undo them as a batch
  - Emit 'stroke:add' socket event for each so other users see them
  - Call redrawAll() on canvas
  - Set status = 'success', store shapeCount
  - On error: status = 'error', set error message
- "Undo diagram" handler: iterate strokes, remove all with matching generationId,
  emit 'stroke:delete' for each, reset status to 'idle'
- "Ask follow-up" handler: reset status to 'idle' but keep prompt, focus textarea
- Example chip click: setPrompt(chipText), focus textarea

Import Summarise and Organise tab components as placeholders for now (build in next prompt).
Use lucide-react icons. Keep AIPanel self-contained — it reads boardId from props.
```

---

# 9. AI Panel — Summarise + Organise Tabs (Phase 11)

**Files:** `client/src/components/panels/AISummariseTab.tsx`, `client/src/components/panels/AIOrganiseTab.tsx`
**Backend needed first:** `POST /api/ai/summarise`, `POST /api/ai/organise`

```
Create two tab components for the Boardify AI panel. Both live inside the same 360px
panel (AIPanel.tsx) with identical padding (16px) and dark #1E293B bg.

FILE 1: client/src/components/panels/AISummariseTab.tsx

DESIGN:
- Description text: "AI reads all sticky notes and text on the board and writes a summary."
  12px #94A3B8, margin-bottom 12px
- "Summarise board" button: full width, indigo bg, white 14px semibold, 40px tall,
  rounded-xl, lucide FileText icon left
- Result state (shown after summary generated):
  - Label "Board Summary" 11px uppercase #94A3B8 tracking-wider
  - Card (white/8 bg, rounded-xl, 14px padding):
    Summary text 13px white, line-height 1.7
  - Below card, action buttons row (flex gap 8px, margin-top 8px):
    - "Copy summary" ghost button with copy icon, small
    - "Add to board as sticky" ghost button with sticky icon, small
- Empty state (if <3 text items on board): centered, muted icon + "Not enough content
  to summarise yet. Add some sticky notes or text first." 12px #94A3B8

WIRING:
- Props: { boardId: string }
- Local state: status ('idle'|'loading'|'success'|'empty'), summary: string | null
- Read stickyNotes + strokes (filtered to text) from Zustand store on mount
- If combined text items < 3: show empty state, disable button
- "Summarise board" handler: POST /api/ai/summarise with { boardId }
  Server returns { summary: string }. Set summary state, status = 'success'.
- "Copy summary": navigator.clipboard.writeText(summary), toast "Copied to clipboard"
- "Add to board as sticky": create a new StickyNote at top-center of canvas viewport
  with text = summary, color = yellow #FEF9C3, default size. Call addStickyNote in
  store, emit 'sticky:add' socket event. Toast "Added to board".

FILE 2: client/src/components/panels/AIOrganiseTab.tsx

DESIGN:
- Description: "Select sticky notes to group by theme. AI assigns colors and organises
  them visually." 12px #94A3B8, margin-bottom 12px
- "Select all stickies" toggle button (outline white, full width, small): toggles all
  checkboxes on/off
- Sticky note list (scrollable, max-h-60, margin-top 12px):
  Each row (flex gap 10px, 10px padding, rounded-lg, hover bg-white/5):
  - Checkbox (custom styled, 16px, indigo when checked)
  - Color swatch (12px circle showing note's current color)
  - Note text preview (13px white, truncate, flex-grow)
- "Organise by theme →" button: full width, indigo, 40px, rounded-xl, sparkle icon
  (disabled if no notes selected)
- Loading state: spinner + "Analysing themes..." 14px white
- Result state: "Found {N} themes:" label 12px #94A3B8
  Then theme cards stacked (gap 8px):
  Each theme (rounded-xl, white/5 bg, 12px padding, flex items-center gap 10px):
  - Color swatch (16px square, rounded-md, theme's assigned hex)
  - Text: theme name 13px semibold white + "{count} sticky notes" 11px #94A3B8
- "Apply grouping to board" button: full width, indigo, rounded-xl, 40px

WIRING:
- Props: { boardId: string }
- Local state: selectedIds: Set<string>, status, themes: Array<{name, color, noteIds}>
- Read stickyNotes from Zustand
- Checkbox toggle: add/remove from selectedIds set
- "Select all stickies": if all selected → clear; else → select all note IDs
- "Organise by theme": POST /api/ai/organise with { notes: stickyNotes.filter(n => selectedIds.has(n.id)) }
  Server returns { themes: [{ name, color (hex), noteIds: string[] }] }
  Set themes state, status = 'success'
- "Apply grouping to board":
  - For each theme, iterate noteIds and update each note's color in Zustand
  - Spatial layout: position each theme cluster at a different region of the canvas
    (e.g. theme 1 at x=300 y=200, theme 2 at x=800 y=200, theme 3 at x=300 y=700 etc.)
    Lay out notes in each cluster as a 2-column grid with 220px horizontal + 180px vertical spacing
  - For each changed note, emit 'sticky:update' socket event
  - Toast "Notes organised by theme"
```

---

# 10. Selection Tool + OCR Result (Phase 12)

**Files:** `client/src/components/canvas/SelectionOverlay.tsx`, `client/src/components/canvas/OCRResult.tsx`
**Backend needed first:** `POST /api/ai/ocr`

```
Create the handwriting-to-text selection UI for Boardify.

FILE 1: client/src/components/canvas/SelectionOverlay.tsx

DESIGN:
- Absolute positioned div overlaid on canvas area
- Active when store.activeTool === 'select' and user has drawn a selection
- Selection rectangle:
  - 2px dashed border #6366F1 (use CSS border-style: dashed)
  - Semi-transparent fill: bg #6366F1 at 8% opacity
  - Corner handles: 8px white squares with 2px #6366F1 border, positioned at 4 corners
    with translate(-50%, -50%)
  - Midpoint edge handles: 6px white circles with 2px #6366F1 border at each edge midpoint
- Selection toolbar (floating white pill, positioned above the selection,
  12px gap above top edge, rounded-full, shadow-lg, 8px padding, flex row):
  - "Extract text" button: lucide Sparkles icon + "Extract text" 13px indigo semibold
  - 1px vertical divider #E5E7EB
  - Copy icon button (gray-500, hover gray-700, "Copy region")
  - 1px vertical divider
  - Trash icon button (gray-400, hover red-500, "Delete selection")

PROCESSING STATE (shown inside the selection rectangle during OCR):
- Semi-transparent overlay inside the selection rect (#1A1A2E at 70%)
- Centered: indigo spinner 24px + "Reading handwriting..." 12px white

WIRING:
- Props: { selection: { x, y, width, height } | null, onClear: () => void,
  onExtract: () => Promise<{ text: string, confidence: number }> }
- Mouse events are handled in Canvas.tsx when activeTool === 'select':
  onMouseDown: set startPoint, initialize selection
  onMouseMove: update width/height based on mouse position
  onMouseUp: finalize selection
  Passes the final selection to SelectionOverlay via props
- "Extract text" click: disabled if selection < 50×50px. Otherwise:
  - Set local loading state
  - Create an offscreen <canvas> with width = selection.width * dpr, height = selection.height * dpr
  - Draw only strokes whose bounding box intersects selection onto offscreen canvas
    (translate offset by -selection.x, -selection.y)
  - Get dataURL: offscreen.toDataURL('image/png')
  - Call onExtract passing the base64 data
  - Parent posts to /api/ai/ocr with { imageBase64: dataURL, boardId }
  - On result: pass result up to render OCRResult component
- "Copy region": copy the dataURL to clipboard (or if navigator.clipboard supports
  ClipboardItem with image/png, copy as image)
- "Delete selection": remove all strokes within selection bounds, emit 'stroke:delete'
  for each, call onClear
- Esc key clears selection

FILE 2: client/src/components/canvas/OCRResult.tsx

DESIGN:
- Absolute positioned card (white, rounded-xl, shadow-xl, 280px wide, 16px padding)
- Positioned 12px below the selection rectangle
- Header (flex gap 8px, margin-bottom 10px):
  - lucide Sparkles icon indigo 16px
  - "Extracted text" 14px semibold #1E293B
- Extracted text box (gray-50 bg, rounded-lg, 12px padding, 13px #374151, line-height 1.5)
- Confidence row: "Confidence: {N}%" 12px green-600 (if >90%) / yellow-600 (70-90) / red-600 (<70)
- Action buttons row (flex gap 8px, margin-top 12px):
  - "Add as sticky note" solid indigo, small (32px tall, 13px)
  - "Copy text" outline button, small
  - "Dismiss" ghost button, small

WIRING:
- Props: { result: { text: string, confidence: number }, selectionBounds: Bounds,
  onClose: () => void, onAddAsSticky: (text: string, pos: Point) => void }
- "Add as sticky note": create new StickyNote at selection.x, selection.y with text = result.text,
  color yellow, default size. Add via Zustand addStickyNote. Emit 'sticky:add' socket event.
  Close popup, clear selection.
- "Copy text": navigator.clipboard.writeText(result.text), toast "Copied"
- "Dismiss": call onClose, clear selection

If result.text is empty string: show "No text found in that region. Try a clearer drawing
or a larger selection." in #6B7280 instead of the text box, hide action buttons except Dismiss.
```

---

# 11. Export Panel (Phase 13)

**File:** `client/src/components/panels/ExportPanel.tsx`

```
Create client/src/components/panels/ExportPanel.tsx for Boardify.

DESIGN — Export dropdown (triggered by Export button in top bar):
- Absolute positioned below Export button, white bg, rounded-xl, shadow-xl, 240px wide, 8px padding
- Small title row: "Export board" 13px semibold #374151, 8px horizontal padding, 6px bottom margin
- Option rows (each 12px padding, rounded-lg, hover bg-gray-50, flex items-start gap 12px):
  Row 1: Image icon (indigo 20px) | text block: "Export as PNG" 14px #374151 +
    "Current viewport as image" 12px #9CA3AF | keyboard badge on far right: "⌘E"
    (gray-100 bg, rounded, 11px #6B7280, 4px 6px padding)
  Row 2: Code icon (gray 20px) | "Export as JSON" 14px + "Full board data for backup"
  Row 3: Link icon (indigo 20px) | "Copy share link" 14px + "Anyone with link can view"
- 1px #F3F4F6 dividers between rows

DESIGN — PNG Export Modal (after clicking "Export as PNG"):
- Centered modal on dimmed backdrop (black/50)
- White bg, rounded-2xl, shadow-2xl, 480px wide, 24px padding
- Header: "Export as PNG" 18px semibold #1E293B + X close right
- Preview area (gray-100 bg, rounded-xl, full width, 200px tall): shows live canvas
  thumbnail (generated by drawing current state to a smaller offscreen canvas)
- Options section (gap 14px):
  - "Background" label 13px semibold #374151 +
    segmented toggle: [Transparent] [White] [Dark] — active = indigo bg white text,
    inactive = gray-100 bg #374151 text, 36px tall, rounded-lg
  - Checkbox row: "Include sticky notes" + custom indigo checkbox (checked default)
  - "Scale" label + select dropdown: "1x" / "2x" / "4x" (2x default), dark-on-light
- Buttons row (flex justify-end gap 8px):
  - "Cancel" ghost button
  - "Download PNG" solid indigo button (Download icon)

WIRING:
- Props: { isOpen, onClose, boardId, boardTitle }
- State: showPngModal, bgMode ('transparent'|'white'|'dark'), includeStickies, scale (1|2|4)
- "Export as PNG" click: opens PNG modal
- Download PNG handler:
  1. Create offscreen canvas: width = window.innerWidth * scale, height = window.innerHeight * scale
  2. Fill background based on bgMode (nothing for transparent, fillRect white #FFFFFF for white, #1A1A2E for dark)
  3. Scale context by scale factor
  4. Call drawStroke for each stroke in store (reuse canvasUtils)
  5. If includeStickies: draw each StickyNote as fillRect (with note's color) + text
     (ctx.fillText with note text, wrap at note width)
  6. canvas.toBlob with type 'image/png'
  7. Create URL via URL.createObjectURL, trigger <a> download with filename:
     `${boardTitle.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`
  8. Revoke blob URL after download
  9. Toast "PNG exported", close modal
- "Export as JSON" handler:
  - GET /api/boards/:id to fetch full board data (strokes + stickyNotes)
  - JSON.stringify(board, null, 2)
  - Download as Blob with type 'application/json', filename `${boardTitle}.json`
  - Toast "JSON exported"
- "Copy share link" handler:
  - Build URL: window.location.origin + '/board/' + board.shareToken
  - navigator.clipboard.writeText(url)
  - Toast "Link copied to clipboard"
- Keyboard shortcut (attached at WhiteboardPage level): Cmd/Ctrl+E triggers PNG download
  with default settings (white bg, 2x scale, includeStickies) — bypasses modal entirely
```

---

# 12. Share Modal (Phase 14)

**File:** `client/src/components/panels/ShareModal.tsx`
**Backend needed first:** invite, collaborator, share-mode routes

```
Create client/src/components/panels/ShareModal.tsx for Boardify.

DESIGN:
- Centered modal on dimmed backdrop (black/50)
- White bg, rounded-2xl, shadow-2xl, 480px wide, 32px padding
- Header (flex between, margin-bottom 20px):
  "Share '{boardTitle}'" 18px semibold #1E293B (truncate long titles) + X close

INVITE BY EMAIL SECTION:
- "Invite people" 13px semibold #374151, margin-bottom 8px
- Input row (flex gap 8px):
  - Email input (flex-grow, 40px, rounded-lg, 1px #D1D5DB border,
    placeholder "Add people by email...")
  - Role select: "Can edit" / "Can view" (120px, same height, dropdown arrow)
  - "Send invite" solid indigo button, 40px tall
- Below: pending invites list (if any):
  Row per invite: email 13px #374151 + "Pending" gray-100 badge 11px + X remove button

COLLABORATORS LIST (below 1px #E5E7EB divider, 20px top margin):
- "People with access" 13px semibold #374151, margin-bottom 12px
- Rows (each 48px, rounded-lg, hover bg-gray-50, 8px padding, flex gap 12px items-center):
  - Avatar circle (32px, user's avatar color, initials in white 13px semibold)
  - Info block (flex-grow):
    Name 14px #1E293B + email 12px #6B7280 below
  - Right side:
    - If owner: "Owner" badge (gray-100 bg, 11px #6B7280) + lucide Crown icon gray-400
    - If editor/viewer: role select dropdown "Can edit" / "Can view" (small, 80px)
    - If pending: italic "Pending invite" 12px #6B7280 + X cancel button

SHARE LINK SECTION (below 1px divider, 20px top margin):
- "Share link" 13px semibold #374151, margin-bottom 8px
- Toggle row (flex justify-between items-center):
  "Anyone with the link can..." 13px #374151 +
  select dropdown: "view only" / "edit" / "No access"
- Link box (margin-top 8px, flex items-center, 1px border #E5E7EB, rounded-lg,
  bg-gray-50, 12px padding):
  URL text 13px #6B7280 truncate (flex-grow) + "Copy" button indigo 13px semibold
- After copy: inline green "Copied!" with checkmark (fades after 2s)

Footer: "Changes are saved automatically" 12px #9CA3AF centered, margin-top 24px

WIRING:
- Props: { isOpen, onClose, boardId }
- On open: GET /api/boards/:id to fetch board (contains collaborators, shareToken, shareMode)
- Local state: inviteEmail, inviteRole ('editor'|'viewer'), board data
- Send invite: POST /api/boards/:id/invite { email, role }
  - On 200: prepend to collaborators list with status 'pending', clear inviteEmail
  - On 404: inline error "No user found with that email"
  - On 409: "User is already a collaborator"
- Role change (collaborator dropdown): PATCH /api/boards/:id/collaborators/:userId { role }
- Remove collaborator: DELETE /api/boards/:id/collaborators/:userId, optimistic remove
- Share mode dropdown: PATCH /api/boards/:id/share { shareMode }
- "Copy" button: copies window.location.origin + '/board/' + board.shareToken,
  toast "Link copied"
- All mutations optimistically update local state, rollback on error
- Owner row never shows role dropdown — just Owner badge
- Current user cannot remove themselves if owner
```

---

# 13. Empty States (Phase 15)

**Files:** `client/src/components/ui/EmptyState.tsx` + 3 usage sites

```
Create a reusable empty state component and wire it into 3 places in Boardify.

FILE: client/src/components/ui/EmptyState.tsx

Props:
{
  icon: ReactNode
  title: string
  description?: string
  action?: { label: string, onClick: () => void, variant?: 'primary' | 'subtle' }
  size?: 'large' | 'subtle'  // large = dashboard-style, subtle = on-canvas-style
}

DESIGN:
- Flex column, items-center, text-center, gap 12px
- If size='large':
  - Icon wrapper 64px square, centered
  - Title 22px semibold white
  - Description 15px #94A3B8, max-w 340px
  - Action button: solid indigo 48px rounded-xl (if variant primary) OR ghost (if subtle)
- If size='subtle':
  - Icon 40px #334155 (very muted)
  - Title 16px #475569
  - Description 13px #334155
  - Action: inline text link indigo 13px

USE CASES:

Case 1 — Dashboard no boards (DashboardPage.tsx):
<EmptyState
  size="large"
  icon={<Presentation className="w-16 h-16 text-indigo-500" />}
  title="No boards yet"
  description="Create your first board and start collaborating with your team."
  action={{ label: "Create first board", onClick: openNewBoardModal, variant: 'primary' }}
/>

Case 2 — Empty canvas (WhiteboardPage.tsx):
Position absolute centered on canvas. Fades out (opacity 0 transition 300ms) once strokes.length > 0.
<EmptyState
  size="subtle"
  icon={<Pencil className="w-10 h-10 text-slate-700" />}
  title="Start drawing"
  description="or use AI to generate a diagram"
  action={{ label: "Generate diagram →", onClick: openAIPanel, variant: 'subtle' }}
/>

Case 3 — AI panel no content (used in AIPanel tabs when applicable):
<EmptyState
  size="subtle"
  icon={<Sparkles className="w-10 h-10 text-indigo-500 opacity-60" />}
  title="What would you like to create?"
/>
Plus below it: 3 suggestion chips (stacked, gap 8px):
"Draw a flowchart" — on click: switch to Diagram tab, prefill prompt
"Summarise this board" — on click: switch to Summarise tab
"Extract text from drawing" — on click: switch to select tool, close panel

Use lucide-react for icons. Ensure component has no layout shift (reserve min-height).
```

---

# 14. Skeleton Loaders (Phase 15)

**Files:** `client/src/components/ui/BoardCardSkeleton.tsx`, `client/src/components/ui/CanvasLoadingState.tsx`

```
Create two skeleton/loading components for Boardify dark theme.

FILE 1: client/src/components/ui/BoardCardSkeleton.tsx

Matches the real board card dimensions exactly:
- #1E293B bg, rounded-2xl, 1px border #334155
- Thumbnail skeleton: full width 160px tall, rounded-t-2xl, bg-slate-800,
  with animate-pulse
- Footer (20px padding):
  - Title bar: bg-slate-700 rounded, w-3/5 h-3.5, animate-pulse
  - Date bar: bg-slate-700 rounded, w-2/5 h-2.5, margin-top 6px, animate-pulse
  - Bottom row: 3 overlapping circles (20px, bg-slate-700, -ml-2 on 2nd and 3rd)

USAGE in DashboardPage: show 6 skeletons in grid while boards are loading.

NEVER use pure white skeletons — they look wrong on dark theme.
Use gray-700 and gray-800 at most.

FILE 2: client/src/components/ui/CanvasLoadingState.tsx

Full-screen dark #1A1A2E bg, absolute inset-0.
Centered:
- Boardify logo icon (indigo 32px) with subtle pulse animation (animate-pulse)
- "Loading board..." 14px gray-400 below, margin-top 12px

Used in WhiteboardPage while GET /api/boards/:id is in flight.

TOAST CONFIG (add to client/src/main.tsx):
import { Toaster } from 'react-hot-toast'
<Toaster
  position="bottom-right"
  toastOptions={{
    style: { background: '#1E293B', color: '#fff', border: '1px solid #334155' },
    success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
    error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } }
  }}
/>

SOCKET DISCONNECT TOAST (add to useSocket.ts):
- On 'disconnect' event: toast.loading('Connection lost — trying to reconnect...',
  { id: 'socket-reconnect' })
- On 'connect' after disconnect: toast.dismiss('socket-reconnect'),
  toast.success('Reconnected')
- On 'reconnect_failed': toast.error('Could not reconnect. Please refresh.',
  { id: 'socket-reconnect' })

ERROR BOUNDARY (create client/src/components/ErrorBoundary.tsx):
- Wraps WhiteboardPage
- On error: show centered card "Something went wrong — your work is saved"
  with "Reload board" button that calls window.location.reload()
- Log error to console + send to server for tracking (optional)
```

---

## Backend routes — build alongside the UI

Each UI phase depends on backend routes. The exact prompts are already in your build plan under "Claude Code prompts" and "Backend Claude Code prompts" sections per phase. Paste those into Claude Code as separate messages:

- **Phase 3 auth routes:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, JWT middleware, Socket.io auth middleware
- **Phase 4 boards routes:** `GET /api/boards`, `POST /api/boards`, `GET /api/boards/:id`, `DELETE /api/boards/:id`
- **Phase 8 socket handlers:** `board:join`, `cursor:move`, `stroke:add`, `stroke:delete`, `sticky:*` events
- **Phase 9 persistence:** `PATCH /api/boards/:id` for autosave
- **Phase 10 AI diagram:** `POST /api/ai/diagram`
- **Phase 11 AI summarise + organise:** `POST /api/ai/summarise`, `POST /api/ai/organise`
- **Phase 12 AI OCR:** `POST /api/ai/ocr` (uses gpt-4o vision)
- **Phase 14 sharing:** `POST /api/boards/:id/invite`, `PATCH /api/boards/:id/collaborators/:userId`, `DELETE /api/boards/:id/collaborators/:userId`, `PATCH /api/boards/:id/share`

---

*Boardify Claude Code Prompts v2 — direct workflow, no design tool in the middle.*
