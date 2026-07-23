# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
```

No test suite exists yet. After changes, at minimum run `npm run build` and `npm run lint`.

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 3. Hosted on Vercel with `@vercel/postgres`.

### State: Zustand + IndexedDB (thin context, fat store)

All global state lives in a single Zustand store (`app/store/index.ts`) persisted to IndexedDB via `idb-keyval`. The four React Contexts (`FileContext`, `PlaylistContext`, `UploadContext`, `SettingsContext`) are thin facades — they read from the Zustand store and expose domain-specific actions. Components should use contexts, not the raw store. The store persists `settings`, `uploadQueue` (with `file` references stripped), and upload state across tab closures.

### Upload pipeline: zero-egress, browser-to-YouTube

`ChunkedUploader` (`app/utils/chunkedUploader.ts`) is the core class. It never sends bytes through Vercel. Flow:

1. **Initiate:** `initiateResumableUpload()` Server Action (`app/actions/upload.ts`) calls `await auth()` and hits YouTube's resumable upload endpoint, returning only a resumable URI.
2. **Upload:** `ChunkedUploader.upload()` runs entirely in the browser — slices `File` objects (local) or `fetch()` with `Range` headers (Google Photos) into 5 MB chunks, PUTs directly to YouTube's URI.
3. **Resume:** After each chunk, saves byte offset + URI to `localStorage`. On network drop, queries YouTube via `Content-Range: bytes */<total>` to determine actual bytes received.

### Dual-read strategy

- **Local files:** `file.slice(start, end)` → 5 MB `Blob` in memory.
- **Google Photos:** `fetch(baseUrl, { Range })` → 5 MB ArrayBuffer directly from Google's servers.
- Never more than 5 MB in memory regardless of file size.

### FFmpeg sandbox (audio-to-video conversion)

`app/api/engine/route.ts` serves a static HTML page at `/api/engine` with strict COOP/COEP headers. `useFfmpegEngine` (`app/hooks/useFfmpegEngine.ts`) creates a singleton hidden `<iframe>` pointing to this endpoint. Audio files are sent via `postMessage` with transferable ArrayBuffers; the iframe runs `ffmpeg.wasm`, generates a waveform visualization video, and posts the resulting `Blob` back. The main thread never loads `ffmpeg.wasm` directly — this is mandatory because COOP/COEP headers kill Google OAuth popups.

### Auth: Auth.js v5

`lib/auth.ts` exports `{ handlers, auth, signIn, signOut }` via `NextAuth()` with the Google provider (YouTube + Photos Picker scopes). Server-side: use `await auth()` to get the session. Client-side: use `useSession()` from `next-auth/react`. The auth route at `app/api/auth/[...nextauth]/route.ts` is a one-liner re-export of `handlers`. Token refresh happens automatically in the JWT callback.

### Server Actions vs API Routes

- **Server Actions** (`app/actions/*.ts`): all DB mutations, playlist CRUD, upload initiation, navigation links, history recording. Use `'use server'` directive + `await auth()`.
- **API Routes** (`app/api/*/route.ts`): only for webhooks, the FFmpeg engine HTML endpoint, auth callbacks, token refresh, Google Photos session polling, and audio conversion. These exist only when Server Actions don't fit (streaming, cross-origin iframes, OAuth callbacks).

### Database: Vercel Postgres

Schema in `app/db/schema.ts` — a single `upload_history` table. Accessed via `@vercel/postgres` `sql` template tag. History page at `/history` is a client component with pagination and CSV export.

### Key types

- `app/types/video.ts` — `MediaFile`, `UploadSettings`, `PlaylistItem`
- `app/types/media.ts` — `BaseMediaFile`, media type detection
- `app/types/googlePhotos.ts` — Google Photos picker types
- `types/next-auth.d.ts` — Session type augmentation

## Architectural Constraints (non-negotiable)

1. **Zero-Egress Uploads:** Vercel never touches media bytes. All uploads go browser→YouTube via `ChunkedUploader`.
2. **Server Actions over API Routes:** Use Server Actions for DB writes and state changes. API routes only for webhooks, streaming, or cross-origin iframe endpoints.
3. **Zustand + IndexedDB:** No new React Contexts for global state. Queue must survive tab closures.
4. **FFmpeg isolation:** `ffmpeg.wasm` only runs inside the `/api/engine` iframe via `postMessage`. Never in the main thread — COOP/COEP breaks OAuth.
5. **Auth.js v5:** Use `await auth()` server-side, `useSession()` client-side. Never `getServerSession`.

## General Rules

1. **Think Before Coding:** State assumptions. Ask if uncertain. Push back when a simpler approach exists. Stop when confused.
2. **Simplicity First:** Minimum code to solve the problem. No speculative features. No abstractions for single-use code.
3. **Surgical Changes:** Touch only what you must. Don't "improve" adjacent code. Don't refactor what isn't broken. Match existing style.
4. **Goal-Driven Execution:** Define success criteria. Loop until verified.
5. **Use the model for judgment calls only:** Classification, drafting, summarization. NOT for routing, retries, or deterministic transforms.
6. **Read before you write:** Check exports, callers, shared utilities before adding code.
7. **Match codebase conventions:** Conformance > personal taste. If a convention is harmful, surface it — don't fork silently.
8. **Fail loud:** Never silently skip a step. Surface uncertainty instead of hiding it.

