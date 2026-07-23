export const useCases = [
  {
    slug: 'gamers-batch-upload-youtube',
    niche: 'Gamers',
    title: 'Batch Upload Let\\'s Plays to YouTube Fast',
    description: 'Stop wasting hours uploading your Twitch VODs and Let\\'s Plays one by one. The YouTube Playlist Uploader lets gamers batch upload entire folders in a single click.',
    painPoint: 'Uploading 50-part Let\\'s Play series manually takes away from your gaming time.',
    solution: 'Our tool automatically extracts series numbers, generates AI descriptions, and puts them into a chronological playlist.',
  },
  {
    slug: 'podcasters-batch-upload-youtube',
    niche: 'Podcasters',
    title: 'Bulk Upload Podcast Episodes to YouTube',
    description: 'Easily upload your entire back-catalog of video podcasts to YouTube. Organize them into perfect, bingeable playlists automatically.',
    painPoint: 'You have hundreds of old podcast episodes that aren\\'t on YouTube because uploading them takes too long.',
    solution: 'Select your entire podcast archive and let our tool upload, tag, and playlist them in the background.',
  },
  {
    slug: 'educators-batch-upload-youtube',
    niche: 'Educators',
    title: 'Batch Upload Course Videos to YouTube',
    description: 'Teachers and course creators can instantly bulk upload modules and lessons to YouTube, organized perfectly into playlists.',
    painPoint: 'Structuring a 30-module course on YouTube requires tedious manual data entry for every single video.',
    solution: 'Upload the entire folder structure and let the app build your course playlist automatically.',
  }
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
    description: 'If you only care about YouTube, you don\\'t need a bloated social media manager. See why our dedicated uploader is better and faster than Hootsuite.',
    comparisonPoints: [
      { feature: 'Primary Focus', us: 'YouTube Optimization & Playlists', them: 'All social media (Jack of all trades)' },
      { feature: 'Bulk File Handling', us: 'Optimized for massive video files', them: 'Standard social video limits' },
      { feature: 'Cost', us: 'One-time or low monthly', them: 'Expensive enterprise pricing' },
    ]
  }
]
