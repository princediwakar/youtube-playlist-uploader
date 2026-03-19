# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` – Start Next.js development server
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint

## Requirements

- Node.js >= 18.0.0 (see `engines` in `package.json`)
- npm (or yarn/pnpm) for dependency management
- Google Cloud project with YouTube Data API v3 enabled and OAuth credentials
- (Optional) DeepSeek API key for AI features

## Architecture Overview

This is a **Next.js 14** application using the App Router. It enables batch uploading of videos/audio to YouTube with AI‑powered metadata and playlist organization.

### Key Technologies
- **Frontend**: React 19, TypeScript, Tailwind CSS with custom design system
- **Backend**: Next.js API routes (serverless functions)
- **Authentication**: NextAuth.js with Google OAuth
- **AI Integration**: DeepSeek API (via OpenAI client)
- **YouTube Integration**: YouTube Data API v3 (`googleapis`)
- **Media Processing**: FFmpeg (`fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg`)

### Directory Structure

```
app/
├── api/                    # API routes grouped by domain
│   ├── audio/             # Audio processing endpoints
│   ├── auth/              # NextAuth endpoints
│   └── youtube/           # YouTube upload, playlists, analysis
├── components/            # React components
│   ├── landing/           # Landing‑page sections (Hero, Features, CTA, etc.)
│   └── (upload‑related components)
├── hooks/                 # Custom React hooks
│   ├── useFileHandling.ts
│   ├── usePlaylistManager.ts
│   ├── useVideoProcessing.ts
│   └── useVideoUpload.ts
├── services/              # Business‑logic services
│   ├── aiService.ts       # DeepSeek AI calls
│   └── youtubeApi.ts      # YouTube API client
├── types/                 # TypeScript definitions (video, media, API)
├── utils/                 # Utilities (media helpers, audio workers, FFmpeg wrapper)
├── layout.tsx             # Root layout with session provider
├── page.tsx               # Home page (conditional rendering: landing or upload UI)
└── globals.css            # Global styles with Tailwind imports

lib/                       # Shared libraries
├── auth.ts               # NextAuth configuration
└── deepseek.ts           # AI service setup

types/                     # Global types (next‑auth.d.ts, etc.)
public/                    # Static assets
```

### Path Aliases
- `@/*` maps to the repository root (configured in `tsconfig.json`)

## Configuration Files

- `next.config.js` – Marks `googleapis`, `fluent‑ffmpeg`, and `@ffmpeg‑installer/ffmpeg` as external server packages.
- `tailwind.config.js` – Defines a refined luxury palette (charcoal, slate, pearl, yt‑red) with custom animations and fonts.
- `tsconfig.json` – Uses `@/*` alias, `strict: false`, and Next.js TypeScript plugin.
- `vercel.json` – Extends max duration of `/api/youtube/upload/route.ts` to 300 seconds for large uploads.
- `.env.example` – Template for required environment variables.

## Environment Variables

**Required:**
- `NEXTAUTH_URL` – Application URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET` – Random secret for NextAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – Google OAuth credentials

**Optional (AI features):**
- `DEEPSEEK_API_KEY` – DeepSeek API key for title/description/tag generation

## YouTube Integration Notes

- The app uses YouTube Data API v3 with OAuth 2.0.
- Upload endpoints consume significant quota (~1,600 units per video); daily default is 10,000 units.
- The UI includes session limits to help manage quota usage.
- API routes are in `app/api/youtube/`; the main upload logic is in `app/api/youtube/upload/route.ts`.

## Development Notes

### Media Handling
- The codebase supports both **video** and **audio** files (recent addition of audio support with waveform visualization).
- Media processing uses FFmpeg via `fluent‑ffmpeg` and a wrapper in `app/utils/ffmpegWrapper.ts`.
- Audio‑specific utilities live in `app/utils/audioHelpers.ts` and `app/utils/audioWorker.ts`.

### State Management
- Custom hooks (`useFileHandling`, `usePlaylistManager`, etc.) manage complex state for uploads, playlists, and processing.
- No external state‑management library; relies on React state and context.

### API Routes
- API endpoints are organized by domain under `app/api/`.
- YouTube‑related routes handle uploads, playlist creation, duplicate detection, and AI analysis.
- Authentication routes are under `app/api/auth/[...nextauth]`.

### Styling Conventions
- Uses Tailwind CSS with a custom design system defined in `tailwind.config.js`.
- Colors follow a refined luxury palette; legacy YouTube‑themed class names are preserved as aliases.
- Custom animations (`fade‑in`, `slide‑up`, `scale‑in`) are defined in the config.

### Type Safety
- TypeScript types are centralized in `app/types/` and root `types/`.
- Key interfaces: `Video`, `MediaFile`, `UploadSession`, `YouTubePlaylist`.

### Recent Focus
Recent commits emphasize audio support, waveform visualization, and media‑handling refactoring. The landing page has also been overhauled for improved UX.