# YouTube Uploader — Final Build Plan

> **Synthesis of both blueprints.** Blueprint 1 wins on architecture (zero-egress pipeline, state resilience, FFmpeg sandbox). Blueprint 2 wins on precision (bug list, Auth.js migration, file-by-file scope). This plan takes both.


## Phase 1 — Critical Bug Fixes

> Fix the highest-impact bugs before touching architecture. Every phase after this builds on these foundations.

### `app/hooks/useVideoUpload.ts` — Broken upload stats (line 428)

- `updateStats` sets `uploadedBytes: completed` where `completed` is a count, not bytes
- `uploadSpeed` and `estimatedTimeRemaining` are therefore meaningless
- **Fix:** Track `video.file.size` after each successful upload for real byte-based stats

### `app/hooks/useFileHandling.ts` — Stale index race condition (line 96–118)

- `startAnalysisForFiles` computes `targetIndex` from `startIndex + relativeIndex`
- If videos are removed while async analysis is in-flight, the index points to the wrong video
- **Fix:** Match on `file.path` (stable identity) instead of array index

### `app/hooks/usePlaylistManager.ts` — Broken memoization (lines 10–14)

- `PLAYLIST_CACHE_KEY` and `PLAYLIST_CACHE_DURATION` are defined inside the hook body
- Every render creates new values, so every `useCallback` that lists them as deps gets a new identity every render
- **Fix:** Move constants to module scope

### `app/services/youtubeApi.ts` — Sync I/O on serverless (line 58)

- `fs.writeFileSync(tempFilePath, fileBuffer)` blocks the event loop
- **Fix:** Use `await fs.promises.writeFile(...)` (dynamic import `fs/promises`)

### `app/hooks/useVideoUpload.ts` — Dual retry logic (lines 300–416)

- `retryWithBackoff` inside chunk loop (up to 3 retries) + separate `failedItems` retry loop at end
- A file that exhausts per-chunk retries gets a second full retry, potentially doubling retry time
- **Fix:** Remove the `failedItems` second loop; add a manual "Retry All Failed" button instead

### `app/hooks/useFileHandling.ts` — Unknown type silently cast as video (line 53–54)

- `detectedType === 'unknown' ? 'video' : detectedType` silently coerces unknowns
- **Fix:** Return early on unknown types — don't create `MediaFile` entries for non-media files

### All API routes — No rate limiting

- Create `app/utils/rateLimit.ts` — token-bucket implementation
- 30 req/min for upload and playlist routes; 10 req/min for auth refresh

---

## Phase 2 — Auth.js v5 + Server Actions Migration

> Auth.js v4 is in maintenance mode. Server Actions are mandated by CLAUDE.md and blocked by v4. Unblock everything that follows.

### Auth.js v5

**Files to modify:**

- `lib/auth.ts` — Rewrite with v5 API. Exports `{ handlers, auth, signIn, signOut }`
- `app/api/auth/[...nextauth]/route.ts` — Collapse to `export const { GET, POST } = handlers`
- `app/providers.tsx` — Update `SessionProvider` import to v5
- `types/next-auth.d.ts` — Update module augmentation paths
- All 13 API route files — Replace `getServerSession(authOptions)` with `await auth()`
- `app/api/auth/refresh/route.ts` — Stop returning raw `accessToken` to client; return only `{ refreshed: true }`

### Server Actions (create these)

- `app/actions/playlist.ts` — `createPlaylist`, `getPlaylists`, `getPlaylistVideos`, `addVideoToPlaylist`
- `app/actions/upload.ts` — `initiateResumableUpload` (authenticates and returns the YouTube resumable URI)
- `app/actions/navigation.ts` — `addNavigationLinks`, `addNavigationLinksSingle`
- `app/actions/history.ts` — `recordUpload`, `getUploadHistory`, `getUploadStats` (used in Phase 7)

### API routes to delete (replaced by Server Actions)

- `app/api/youtube/playlist/route.ts`
- `app/api/youtube/playlist-videos/route.ts`
- `app/api/youtube/add-to-playlist/route.ts`
- `app/api/youtube/upload/complete/route.ts`
- `app/api/youtube/add-navigation/route.ts`
- `app/api/youtube/add-navigation-single/route.ts`
- `app/api/audio/analyze/route.ts`

### API routes to keep (large payloads or direct-to-YouTube proxying)

- `app/api/youtube/upload/route.ts`
- `app/api/audio/convert/route.ts`
- `app/api/photos/create-session/route.ts`
- `app/api/photos/session/route.ts`
- `app/api/auth/refresh/route.ts`

---

## Phase 3 — Unbreakable State Engine

> Queue must survive closed tabs, browser crashes, and power outages. Build the state architecture and context split together — they are the same problem.

### Zustand + IndexedDB persistence

- Install `zustand` and `idb-keyval`
- Replace all upload queue `useState` with a single global Zustand store
- Persist every queue mutation to IndexedDB via `idb-keyval`

### Context architecture split (from Blueprint 2, Phase 4)

Do this here, not as a separate phase. These four contexts replace the monolithic 53-prop `UploadContext`:

| Context | Owns |
|---|---|
| `FileContext` | `videos`, `addVideos`, `replaceVideos`, `removeVideo` |
| `PlaylistContext` | `availablePlaylists`, `fetchUserPlaylists` |
| `UploadContext` | `isUploading`, `isPaused`, `uploadQueue`, `uploadStats`, pause/resume/cancel |
| `SettingsContext` | `uploadSettings`, `showAdvancedSettings`, `authError` |

`UploadScreen` drops from 12+ `useState` hooks to 3. Delete `app/hooks/UploadContext.tsx`.

### File handle vault — Chromium

- When a user drops local files, store the `FileSystemFileHandle` objects in IndexedDB
- On fresh load, check IndexedDB — if handles exist, show a **"Restore Session"** button
- One click re-grants access to the original files without re-selection

### Safari / Firefox fallback

- Detect if `window.showOpenFilePicker` is absent
- If so, store only file metadata (name, size) in IndexedDB
- On reload, prompt the user to manually re-select files to rebind them to the stored metadata

---

## Phase 4 — Zero-Egress Chunked Upload Pipeline

> Vercel never touches the bytes. No memory blowouts. No per-GB egress charges. Direct browser-to-YouTube.

### How it works

1. Call the `initiateResumableUpload` Server Action — it authenticates and returns the YouTube resumable URI. That is the only server roundtrip.
2. The `ChunkedUploader` class runs entirely in the browser, slicing and streaming 5 MB chunks directly to YouTube.

### Dual-read strategy

**For local files:**

```
file.slice(start, end) → 5 MB chunk in memory → PUT to YouTube URI → flush → next chunk
```

**For Google Photos files:**

```
fetch(baseUrl, { headers: { Range: 'bytes=start-end' } }) → 5 MB from Google's servers → PUT to YouTube URI → flush → next chunk
```

Never more than 5 MB in memory at once regardless of file size.

### Byte-range resumption

- On network drop, ping the YouTube URI to get the exact byte offset received
- Resume slicing or fetching from that exact byte
- Store the resumable URI in `sessionStorage` keyed by file identity so resumption survives a refresh

### Google Photos URL expiry

- Store a timestamp alongside each `RemoteGoogleMedia` item
- `baseUrl` values expire after 60 minutes
- If a session resumes after expiry, silently re-fetch the session for fresh URLs before continuing

> **This replaces Blueprint 2's "unified upload pipeline" (Phase 6).** The Strategy pattern refactor is unnecessary once both local and remote paths share one `ChunkedUploader`. The dual-path problem is solved architecturally.

---

## Phase 5 — Google Photos Picker

> The picker must open without killing Zustand state. The solution is a detached popup — the main app never navigates away.

### Implementation

1. `createPhotosSession` Server Action — hits Google Photos API, returns a `pickerUri`
2. Open `pickerUri` in a **popup window**. Main Next.js app stays focused and running.
3. Main thread runs `setInterval` calling `pollPhotosSession` Server Action
4. When polling returns `mediaItemsSet: true` — close the popup, fetch `mediaItems`, extract `id` and `baseUrl`, inject as `RemoteGoogleMedia` items into the Zustand queue

---

## Phase 6 — FFmpeg Audio Engine (Isolated Sandbox)

> `ffmpeg.wasm` requires `COOP`/`COEP` headers. Those headers kill Google OAuth popups. They cannot share an origin. This is not negotiable.

### Architecture

```
Main app (no COOP/COEP)
  └── hidden <iframe> → engine.yourdomain.com (strict COOP/COEP)
        └── ffmpeg.wasm
```

### Implementation

1. Create a static HTML file served from a subdomain (`engine.yourdomain.com`) with strict `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers
2. Load it in a hidden `<iframe>` on the main app
3. When an audio file is queued:
   - Pass the `File` object or `FileSystemFileHandle` to the iframe via `postMessage`
   - Iframe runs `ffmpeg.wasm`, converts to a video `Blob`
   - Iframe passes the `Blob` back to the main thread via `postMessage`
   - Main thread's Zustand queue receives the output `Blob`

> **Build this last among the engine phases.** It is the highest technical risk and does not block the upload pipeline. Blueprint 1's execution order is correct here.

---

## Phase 7 — Upload History

> After a successful upload, record it. Build the history page the user will return to.

### Vercel Postgres

- After each successful upload, call `recordUpload` Server Action
- Schema: `videoId`, `title`, `playlistId`, `fileName`, `fileSize`, `mediaType`, `uploadedAt`

### Files to create

- `app/db/schema.ts` — SQL schema for `upload_history` table
- `app/history/page.tsx` — React Server Component with paginated, filterable history and CSV export
- Add `idb` and `@vercel/postgres` to `package.json`
- Add nav link to `/history` in `app/components/AppShell.tsx`

---
<!-- TODO: NOT IMPLEMENTED YET
## Phase 8 — Heavy-User Features

> Build the workflow features that make the app indispensable.

### Batch operations — `app/components/BatchOperations.tsx`

- Select multiple queue items
- Apply prefix, suffix, tags, category, or privacy setting simultaneously

### Error dashboard — `app/components/ErrorDashboard.tsx`

- Collapsible panel aggregating every failed upload
- Categorized by error type: `YouTube Quota Reached`, `Network Timeout`, `Auth Expired`, etc.
- "Retry All Failed" button re-invokes `ChunkedUploader` from the last known byte offset
- Replaces all inline error text throughout the app

### Per-video metadata editor — `app/components/MetadataEditor.tsx`

- Slide-out panel for editing title, description, and tags per video
- Custom metadata stored on the `MediaFile` object in Zustand

### Upload scheduling — `app/components/ScheduleUpload.tsx`

- Date/time picker to defer upload start
- Browser must stay open — make this explicit in the UI

---

## Phase 9 — Polish

> Amplifies what is already correct. Do this last.

- `next.config.js` — Enable `reactCompiler: true` and `ppr: true`
- Wrap `/history` page in `<Suspense>` with a skeleton for streaming
- Remove `uuid` package — use `crypto.randomUUID()` everywhere
- Add `server-only` imports to all Server Action files

---

## Execution Order

```
Phase 1 — Bug fixes
    ↓
Phase 2 — Auth.js v5 + Server Actions
    ↓
Phase 3 — Zustand + IndexedDB + Context split   ←→   (Parallel) Phase 4 — ChunkedUploader
    ↓                                                               ↓
                        Wire Phase 3 + Phase 4 together
                                    ↓
                          Phase 5 — Google Photos picker
                                    ↓
                          Phase 6 — FFmpeg sandbox
                                    ↓
                          Phase 7 — Upload history
                                    ↓
                          Phase 8 — Heavy-user features
                                    ↓
                             Phase 9 — Polish
```

> **Note:** Phases 3 and 4 can be developed on separate branches simultaneously. The Zustand store and the `ChunkedUploader` are independent until you wire them together at the end of Phase 4.

---

## Verification

### After each phase

- `npm run build` succeeds
- `npm run lint` passes
- Manual smoke test: sign in → drag 3 files → upload → verify on YouTube

### End-to-end after all phases

1. Sign in with Google OAuth
2. Drag-drop 5 video files + 3 audio files
3. Import 2 videos from Google Photos
4. Create new playlist, set to Private
5. Edit one video title via metadata editor
6. Start upload — verify progress, speed, and ETA are accurate
7. Kill the tab mid-upload, reopen — verify session restore and byte-range resumption
8. Visit `/history` — verify all uploads recorded with correct metadata
9. Open YouTube playlist — verify all videos present in correct order -->