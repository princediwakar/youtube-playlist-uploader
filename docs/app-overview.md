# Product Overview: YouTube Playlist Uploader

## 1. The Vision
**Tagline:** The fastest way to upload, optimize, and organize bulk video content on YouTube.

The YouTube Playlist Uploader is a specialized SaaS application designed to fix the most tedious part of a content creator's workflow: the upload process. It transforms hours of manual data entry and progress-bar babysitting into a simple, automated, "set it and forget it" experience.

## 2. The Core Problem
The native YouTube Studio is built primarily for uploading one video at a time. For creators who produce bulk content (like a 50-part educational course, a backlog of podcast episodes, or a long gaming series), the native tool causes immense friction:
*   **Time Drain:** Creators must wait for one video to process before they can fully configure the next one.
*   **Metadata Paralysis:** The mental fatigue of writing dozens of unique, SEO-optimized descriptions and tags in a row is exhausting.
*   **Inconsistency:** Rushing through bulk uploads often leads to poor SEO, forgotten links, and messy playlist organization.

## 3. The Solution & Value Proposition
Our application acts as a high-powered intermediary between the creator's local files and their YouTube channel. 
**Value Proposition:** Give creators back 20 hours a month, eliminate writer's block with AI, and ensure every single video is perfectly optimized for the YouTube algorithm.

## 4. Target Audience
*   **Educators & Course Creators:** Uploading entire curriculum modules at once.
*   **Podcasters:** Archiving massive back-catalogs of video episodes.
*   **Gamers & Streamers:** Managing multi-part "Let's Play" series or migrating Twitch VODs.
*   **Agencies & Social Media Managers:** Handling content pipelines for multiple clients simultaneously.
*   **Musicians/Labels:** Releasing entire albums as lyric videos or visualizer playlists.

## 5. Core Features

### 🚀 Bulk Drag-and-Drop Queue
*   Select dozens of video files at once.
*   The system creates a local queue and uploads them sequentially in the background.
*   **Auto-Retry Logic:** If the internet connection drops, the app pauses and resumes the upload automatically without failing the whole batch.

### 🤖 AI-Powered Metadata Engine
*   **Auto-Titles & Descriptions:** Generate highly clickable, SEO-rich titles and descriptions based on a short context prompt or the raw video file name.
*   **Smart Tagging:** AI generates the best YouTube tags for discoverability based on the niche.
*   **Spreadsheet View:** Review and tweak the AI-generated metadata for all 50 videos in a fast, spreadsheet-like interface before hitting "Publish to YouTube".

### 📂 Instant Playlist Routing
*   Create a new playlist directly from the app interface, or select an existing one.
*   All videos in the current batch upload are automatically routed and ordered correctly within that specific playlist, bypassing the need to organize them later in YouTube Studio.

### 📝 Default Templates & Presets
*   Create "Upload Profiles" (e.g., one for "Podcasts", one for "Vlogs").
*   Automatically append standard boilerplate text to all AI-generated descriptions (like social media links, Patreon links, or affiliate gear lists).

## 6. Technical Foundation
*   **Framework:** Built on **Next.js (App Router)** for a fast, responsive user interface and secure server-side API handling.
*   **Core Integration:** Relies heavily on the **YouTube Data API v3** for user authentication (OAuth), video chunk uploading, playlist management, and metadata updates.
*   **AI Integration:** Utilizes OpenAI (or similar LLM APIs) to power the intelligent metadata generation engine.
