import { batch1 } from './seo-data-batch-1'
import { batch2 } from './seo-data-batch-2'
import { batch3 } from './seo-data-batch-3'

export const useCases = [
  ...batch1,
  ...batch2,
  ...batch3,
]

export const alternatives = [
  {
    slug: 'youtube-studio',
    competitor: 'Native YouTube Studio',
    title: 'YouTube Playlist Uploader vs. Native YouTube Studio',
    description: 'Why you should stop using the native YouTube Studio for bulk uploading, and switch to a dedicated tool that saves you hours.',
    comparisonPoints: [
      { feature: 'Batch Upload Limit', us: 'Unlimited (Folder-based)', them: '15 at a time' },
      { feature: 'Automatic Playlists', us: 'Yes, based on folder names', them: 'Manual only' },
      { feature: 'AI Descriptions', us: 'Built-in generation for 50+ videos at once', them: 'Manual only' },
    ]
  },
  {
    slug: 'hootsuite',
    competitor: 'Hootsuite',
    title: 'YouTube Playlist Uploader vs. Hootsuite for YouTube',
    description: "If you only care about YouTube, you don't need a bloated social media manager. See why our dedicated uploader is better and faster than Hootsuite.",
    comparisonPoints: [
      { feature: 'Primary Focus', us: 'YouTube Optimization & Playlists', them: 'All social media (Jack of all trades)' },
      { feature: 'Bulk File Handling', us: 'Optimized for massive video files', them: 'Standard social video limits' },
      { feature: 'Cost', us: 'One-time or low monthly', them: 'Expensive enterprise pricing' },
    ]
  }
]
