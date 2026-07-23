import type { BlogPost } from './index'

export const originStoryBuiltBetterWay: BlogPost = {
  slug: 'origin-story-built-better-way',
  title: 'The Origin Story: Why We Built a Better Way to Upload to YouTube',
  description:
    'How we went from batch-upload frustration to building a browser-native tool that does not need a server to handle your video bytes.',
  date: '2026-07-23',
  category: 'Product-Led & How-To',
  readingTime: '8 min read',
  published: true,
  content: `
Every single time, the same sinking feeling. You just trimmed and exported 20 videos. Each is two to three minutes long. Together they represent perhaps 40 hours of work -- scripting, recording, editing, color grading, audio sweetening. They are finally done. All that remains is to upload them to YouTube.

That should be the easy part. It is not.

You open YouTube Studio. You click the upload button. You select one video. You fill in the title, the description, the tags, the thumbnail. You pick a playlist. You submit. Fifteen seconds. Then you start over for the second video. Fifteen more seconds, this time with duplicate settings. Then a third. Fourth.

Somewhere around video eight, your wrist aches from clicking the same buttons. Around video 12, you start cutting corners on metadata because you are no longer filling forms intentionally -- you are rushing. By video 17, you are angry that a platform handling billions of dollars in creator revenue each year does not have a batch upload feature.

You paste the same description twenty times, and your channel gets penalized for duplicate content.

That frustration is the entire reason this app exists. Not because building it was easy. Because the alternative was doing it the old way.

## The Team Background

We are a pair of creators who got into this over a decade ago making coding tutorials. Early on, uploads were a non-issue. One or two videos a week, plenty of time to polish titles, craft descriptions, and arrange our playlists by hand. But then the channel grew. Producing content became a process, not a hobby. We went from two videos a week to three to five to seven. Editing workflows were eventually optimized, rendering times came down, thumbnail designers were onboarded.

Uploading stayed exactly the same.

We tried everything to make it better. We looked for dedicated upload tools, explored YouTube API possibilities, spent money on solutions that promised to automate the process. Nothing worked durably. Tools would either become abandonware, hike prices after we committed, or require engineering resources we did not want to allocate.

Over time, the frustration ossified into acceptance. This is just what YouTube uploading is like. Until one of our teammates said something that snapped us out of it: "Why do we keep paying companies for solutions that their own creators asked for years ago?"

We started thinking about what a tool purpose-built for batch uploading YouTube videos would look like. Not a general file transfer utility, not a social media scheduler. A tool that knows what YouTube expects from metadata, playlist structure, and upload behavior. A tool that treats the upload process as a workflow, not a forms-based chore.

## The Pain Points

Digging into the problem deeper, we identified four specific pain points that none of the available tools addressed.

**Batch uploads without batch UX.** YouTube's web interface, YouTube Studio apps, and their APIs all treat each upload as a discrete operation. You can send a POST request to their servers and include one media file. Some commercial tools try to parallelize multiple upload calls, but they do nothing to reduce the transaction overhead. You still have to set the title, the description, the playlist destination, and the publishing settings for each video individually. Our goal was to make batch uploading a first-class operation: define everything once, apply it to twenty videos.

**Playlist-first thinking.** The default state of mind when you start uploading should be, "I have five videos due this week," not "I have five individual videos." Uploading five videos has fundamentally different constraints than uploading one. You care about playlist ordering. You care about metadata consistency. You care about ensuring that no single video is published before the whole batch is ready. Yet all existing tools treat the single video as the atomic unit. We needed a tool that would treat a playlist as the atomic unit.

**Privacy and security that does not cut corners.** Running a SaaS service for video upload introduces a massive liability: the host service sees every video you upload. Some creators are fine with this. Others are not. The medical educators, the enterprise trainers, the folks who develop proprietary software, the ones who need to adhere to SOC 2 or HIPAA requirements. When you upload through a third-party service, that service owns a copy of your content, sits on your metadata, and generally holds the keys to your work. The only way to maintain true control is to ensure that the tools which process your videos never have ownership over your videos to begin with. Our architecture guarantees that outcome.

**Too expensive or too complex.** The commercial solutions that do bulk upload are priced for marketing teams with seven-figure budgets. Monthly subscriptions equal to a car payment. Enterprise tiers that require a sales call. Implementation that takes weeks. Individual solo creators cannot justify these expenses, and frankly neither should they.

## The False Starts

Before we settled on the approach, we tried a few other directions.

We explored building a simple wrapper around the YouTube API. Deploy a server that would handle both the web app and the upload process. Give it a nice UI and some basic queue logic. That would have taken maybe a month. We discarded it for two reasons. First, it would have duplicated every byte through our own infrastructure. Second, it would have placed all the secrets, including tokens, on our servers. That violates the principle of never unnecessarily handling a user's files.

We also considered whether to fork one of the existing open-source upload tools, add features like resume and playlist grouping. The problem is that these tools are designed for one paradigm: desktop, single-user, CLI-only. Adapting them would have required rewriting the UX layer anyway.

We looked at whether existing scheduling tools would suffice. They allow you to set a publishing time and automate triggers, but what about uploading itself? Not addressed. Their metadata handling is weak. Nothing about playlist ordering.

It became clear that the solution needed to be built from scratch.

## Design Philosophy Decisions

The first decision we made was to never touch the user's video bytes. Our server should never receive a single byte of a video. Not ever. That led us to zero-egress architecture, also known as the browser-native approach. All uploads travel directly to YouTube via the user's browser. The app acts as a workflow orchestration tool: it routes metadata, captures state preferences, handles error recovery, and sequences uploads without ever acting as a conduit. This approach also means you do not need to trust us with your content -- the videos never pass through our infrastructure.

The second decision was playlist-first. Every interaction starts with the playlist. You define the destination first. You then assign videos to that playlist. The upload process is a single pipeline: select playlist, add videos, assign metadata templates, upload. No stepping back and re-selecting from scratch each time.

Third, resume support. Network failures happen. Laptops run out of battery. Browser tabs crash. An upload interrupted near the end of a two-hour video is salt in a wound. The uploader needed to remember where it left off and resume from the exact spot. It needed to be able to do so after a browser restart, which meant it needed to be persistent. You can close the laptop, go to a meeting, come back, reopen the browser, and see exactly where you stood.

Fourth, offline defaults. The app loads its core UI without requiring a network connection. Upload state is synced locally, then to a server when available. Metadata edits are instantaneous. Users should never wait on a spinner to finish, even if they are offline.

Fifth, privacy and security are not optional. All tokens and credentials stay with you. The server may see encrypted tokens but never raw. Secrets never leave the browser memory space when not needed. This aligns with that non-negotiable principle of no unnecessary handling.

## Building in Public

We built the first prototype in Rust, then realized maintainability mattered more. Rust is fast, but finding Rust developers familiar with frontend is near impossible. We rewrote it in JavaScript using React and TypeScript. The first version was ugly but functional.

We put it on GitHub from day one. Anyone could see the code, the issues, the roadmap. Patch notes were always public. Feature requests were a PR away. Publishing to a wide audience early forced us to clarify our priorities and commit to a clear vision.

We received feedback from early adopters within days. Users asking for Google Photos support. Others requesting audio-to-video conversion. Different ones asking whether we could handle playlists with hundreds of entries. We prioritized each request by how many people asked and how aligned it was with the core mission. Audio-to-video conversion moved up because it turned out to be needed by more than half of our early users.

## Lessons from Early Users

Early adopters taught us as much about our product as we taught them. A few surprises stand out.

We expected creators to primarily upload finished videos. Instead, we learned that many creators, particularly those making tutorial content, have workflows where videos are edited sequentially. They want to upload as they finish each sibling lesson, not batch them all at once. This pushed us to improve resume and state management beyond what we originally had.

We learned that people think about their content in terms of seasons, not playlists. Users wanted to manage their YouTube presence with project structures. Season tags should roll up into a project with its own header, metadata, and visual identity.

The most surprising request: CSV import. People increasingly manage their catalogs in spreadsheets. They format titles, tags, descriptions, and timestamps in columns. Why should they have to type everything twice? It seems obvious in retrospect.

We also discovered that users cared deeply about upload guarantees. Knowing that even if their app closed mid-upload, their progress was saved mattered to them. It was not just about convenience; it was about the overwhelming anxiety of potentially losing their work. That realization cemented resume and state preservation as our highest priority feature.

## Where the Product Is Going Next

The roadmap splits into three tracks.

**Track one: smarter metadata generation.** Our users currently craft metadata manually. Template support will streamline that. Then we want to add AI-powered metadata generation integrated directly into the upload workflow. This is not a standalone feature; it will be tied to upload events. When a user selects a batch of videos, a generate button appears. Choosing that option triggers the system to build metadata descriptions, titles, and suggested tags. The user reviews and approves before anything goes live. For more on this approach, read our guide on generating SEO descriptions for 50 videos at once.

**Track two: more sources.** Google Photos is currently supported. WebDAV is next. Dropbox, Box, and OneDrive integration will follow. Eventually we want to be agnostic to where videos live.

**Track three: deeper collaboration.** Currently, this is a single-user tool. Multiple team members will be able to contribute to a playlist that rolls up into a single channel. User permissions per resource, invite flows, role management.

We expect track three to enable entirely new use cases. Right now it is impossible for a distributed team to jointly prepare a playlist. But imagine a marketing team where one person uploads the video, a teammate defines the description, and another teammate approves before publishing.

## The Mission

The mission statement is straightforward: we want to make YouTube content management effortless for solo creators and small teams.

Effortless means two things. It means the mechanical process of uploading, naming, and organizing videos requires zero unnecessary steps. It also means the mental process of scheduling and strategizing around content can happen right inside the same tool.

YouTube is the world's second-largest search engine and the most powerful distribution platform for video. It deserves a creator-first upload experience. Not a tacked-on scheduler, not a CSV export from Excel then manually paste into Studio. A dedicated tool purposefully designed for the constraints of creators who wake up knowing exactly which videos need to go live, exactly what metadata they want attached, and exactly how those videos should be sequenced.

If you are that kind of creator, you already know why this tool solves your problem. You would not believe how many others there are out there who feel exactly the same way. Welcome to the new standard for YouTube uploading.`,
}
