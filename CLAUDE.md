# CLAUDE.md

# SYSTEM DIRECTIVE: YOUTUBE PLAYLIST UPLOADER ARCHITECTURAL STANDARD

**CURRENT STATE MANDATE:** We are executing a strict Server-First, Next.js App Router architecture. Eradicate client-side waterfalls, heavy global state, and prop-drilling. Prioritize server components, URL-driven state, and strict decoupling. Do not generate code for new features unless explicitly overridden by the user.

---

## TIER 1: BEHAVIORAL CORE (How You Operate)

### 1. Think Like a Systems Architect
**Don't just write code; design the data flow.**
- State your assumptions explicitly. If uncertain, STOP and ask.
- Always ask: "Can this be done on the server instead of the client?"
- If a simpler, less abstract approach exists, push back and suggest it.

### 2. Simplicity & Deletion
**Code is a liability. The best PR is a negative line count.**
- No abstractions for single-use code.
- If you see `useEffect` being used to sync data or mirror state, delete it and refactor to a single source of truth.
- Match existing style perfectly, even if you disagree with it, but mercilessly delete dead code, unused imports, and orphaned functions that *your* changes create.

### 3. Goal-Driven Execution
**Define success criteria. Loop until verified.**
- Transform tasks into verifiable goals.
- For multi-step tasks, state a brief checklist before executing.

---

## TIER 2: ARCHITECTURE & DATA FLOW (The Hard Boundaries)
*Violating these rules introduces catastrophic performance degradation. Do not bypass them under any circumstances.*

### A. The Server-First Mandate
- **Pages are Server Components:** `page.tsx` files MUST NOT have `"use client"`. Pages are orchestrators. They fetch data securely on the server and pass minimal, serializable JSON down to client components.
- **Client Components are Leaves, Not Roots:** `"use client"` is strictly reserved for components that require interactivity (e.g., `onClick`, `useState`, Drag & Drop via `react-dropzone`, browser APIs like `window`). Push client boundaries as far down the component tree as possible.
- **No Client-Side Waterfalls:** Do not fetch initial data in `useEffect` unless explicitly required for polling or high-frequency updates (e.g., upload progress).

### B. Mutations via API Routes & Server Actions
- **No Direct Client-Side Third-Party Mutations:** Stop writing direct YouTube API or DeepSeek API calls in React client components.
- **Action Layer:** All mutations (YouTube uploads, playlist creation, AI metadata generation) must happen via Next.js API Routes (`app/api/`) or Server Actions. Client components should call these endpoints, which securely authenticate via NextAuth, handle the logic, and return typed results.

### C. State Management Hierarchy
- **Level 1: The URL (Single Source of Truth):** Filters, search queries, pagination, and active tabs MUST live in the URL (`searchParams`). Read them on the server or use `useSearchParams`.
- **Level 2: React State (`useState`):** Use for strictly local, ephemeral component state (e.g., open/close a specific dropdown).
- **Level 3: Custom Hooks & Context:** Use ONLY for complex, cross-component transient UI state that cannot live in the URL (e.g., upload queue orchestration). Rely on existing hooks like `useFileHandling`, `usePlaylistManager`, and `useVideoUpload`. Do not introduce external state management like Zustand or Redux.

---

## TIER 3: CODE QUALITY & ERROR HANDLING

### A. Component Design
- **Stop Prop Drilling:** If you are passing more than 4 props down multiple levels, stop. Use React Context, or better yet, use Component Composition (pass `<Child/>` as `children` to `<Parent/>`).
- **Hook Limits:** Maximum 5 `useState`/`useEffect` combinations per file. If larger, the component is doing too much. Split it.

### B. Type Safety (Strict Adherence)
- **Central Hub:** `app/types/` and `types/` are the master directories. Domain types like `Video`, `MediaFile`, `UploadSession`, and `YouTubePlaylist` live here.
- **No `any`:** The `@typescript-eslint/no-explicit-any` rule is enforced. Use `unknown` and narrow. No new `any` casts are allowed.

### C. Error & Loading UI Standardization
- **Error Visibility:** Do not swallow errors. Catch blocks in client code must display visible feedback to the user. Return standard error objects `{ error: string }` from API routes.
- **No Silent Failures:** Never use `.catch(() => ({}))`.

---

## TIER 4: THE PRE-FLIGHT PROTOCOL
Before outputting any code block modifying the system, you MUST output a brief, 3-point compliance check proving you have read the invariants. 

*Example format:*
`> Pre-flight Check: 1. Component moved to Server. 2. URL used as state instead of local state. 3. Mutation extracted to API Route.`

---

## PROJECT SPECIFICS & COMMANDS

### Commands
- `npm run dev` – Start Next.js development server
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint

### Core Stack
- **Framework**: Next.js 14 App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with custom refined luxury palette
- **Auth**: NextAuth.js with Google OAuth
- **APIs**: YouTube Data API v3 (`googleapis`), DeepSeek API (via OpenAI client)
- **Media**: FFmpeg (`fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg`) for video/audio processing

### Important Context
- **Media Handling**: The app processes both video and audio. Ensure FFmpeg wrappers in `app/utils/ffmpegWrapper.ts` are utilized properly.
- **API Quotas**: YouTube API upload consumes ~1,600 quota units per video (10,000 daily default). The codebase must respect session limits and avoid redundant API calls.
- **Large Uploads**: `/api/youtube/upload/route.ts` is configured for long durations in `vercel.json` (300 seconds).

### Directory Overview
- `app/api/` - Domain grouped APIs (`audio/`, `auth/`, `youtube/`)
- `app/components/` - React components including landing page and upload interfaces
- `app/hooks/` - Core upload/playlist state logic
- `app/services/` - `aiService.ts` and `youtubeApi.ts` business logic
- `app/utils/` - FFmpeg, media helpers, and audio workers