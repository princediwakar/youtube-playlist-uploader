# CLAUDE.md — 12-rule template

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

## Rule 1 — Think Before Coding
State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

## Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

## Rule 3 — Surgical Changes
Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

## Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

## Rule 5 — Use the model only for judgment calls
Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory
Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

## Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

## Rule 13 — Ruthless Architectural Constraints (YouTube Uploader)
These are non-negotiable project boundaries based on `PLAN.md`. DO NOT deviate from them.

1. **Zero-Egress Uploads:** Vercel NEVER touches media bytes. All uploads must go directly from the browser to YouTube using resumable URIs (via `ChunkedUploader`). Do not buffer files in server memory or serverless functions.
2. **Server Actions over API Routes:** Use Next.js Server Actions for all database mutations and state changes. Only use `app/api/...` routes for webhooks or direct-to-YouTube proxying.
3. **State Management:** The upload queue is governed by Zustand + IndexedDB. Do not create new React Contexts for global state. Do not rely on React state to survive a tab closure.
4. **Strict FFmpeg Isolation:** Do not attempt to run `ffmpeg.wasm` in the main application thread. It requires strict COOP/COEP headers that will kill Google OAuth popups. All FFmpeg processing must occur inside a dedicated, isolated `<iframe>` communicating only via `postMessage`.
5. **Authentication:** We use Auth.js v5. Do not use legacy NextAuth v4 patterns (e.g., `getServerSession`). Use `await auth()` everywhere on the server.