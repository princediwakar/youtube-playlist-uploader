UI/UX Improvement Plan
Current State Analysis
After reviewing the codebase, I identified the following improvement areas:
1. Progress Status Issues
- No per-file progress bars (only overall percentage)
- Upload speed/ETA cramped in a single line
- No clear bytes uploaded / total display
- Failed uploads show minimal error info
- No visual indicator for audio conversion status (FFmpeg processing)
2. Button/Action Issues
- Pause/Resume/Cancel buttons are tiny and unlabeled
- No "Retry Failed" button visible in UI
- "Clear all" lacks confirmation
- Upload button disabled state not obvious enough
3. Settings Panel Issues
- Advanced settings buried in collapsible section
- "Clear specific cache" is confusing UI
- Missing tooltips on technical settings
- No search/filter for settings
- Batch limit warning is subtle
4. General UX Gaps
- Session restore banner could be more prominent
- Duplicate detection status unclear
- History page has generic styling
- Mobile bottom bar overlaps content on small devices
---
Proposed Improvements (Priority Order)
Phase 1: Progress Status (High Impact)
Task	Description
1.1	Add per-file progress bars in MediaList.tsx - show % for uploading files
1.2	Expand upload stats display - show uploadedBytes / totalBytes with formatted sizes (e.g., "1.2 GB / 5.4 GB")
1.3	Make speed/ETA more prominent - use larger text, position above queue
1.4	Add conversion status indicator - show "Converting audio..." with spinner for FFmpeg processing
1.5	Improve failed file display - show error message inline, add retry button per-file
Phase 2: Button & Action Improvements
Task	Description
2.1	Replace icon-only controls with labeled buttons in UploadProgress.tsx
2.2	Add "Retry Failed" prominent button in progress header
2.3	Add confirmation dialog for "Clear all" - use native confirm() or custom modal
2.4	Make upload button show estimated duration when disabled
2.5	Add loading spinner to Google Photos picker import button
Phase 3: Settings Panel Improvements
Task	Description
3.1	Move key advanced settings outside collapsible (batch size, category)
3.2	Rename "Clear specific cache" to "Clear playlist cache" with clearer action
3.3	Add info tooltips (ℹ️ icon) to settings like title format, privacy
3.4	Add setting search/filter input
3.5	Group settings logically: Upload Mode → Playlist → Video Details → Advanced
Phase 4: General UX Polish
Task	Description
4.1	Style history page to match upload screen theme
4.2	Improve mobile bottom bar - add bottom padding to main content
4.3	Add empty states with illustrations for no files, no history
4.4	Show YouTube quota usage indicator in settings
4.5	Improve error banners - add icon, more prominent styling
---
### Implementation Files
Most changes will target:
- `app/components/UploadProgress.tsx` - progress display
- `app/components/MediaList.tsx` - queue items with per-file progress
- `app/components/UploadSettingsPanel.tsx` - settings organization
- `app/components/CompactFileBar.tsx` - mobile bar improvements
- `app/globals.css` - new utility classes if needed
---