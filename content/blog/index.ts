export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  category: string
  readingTime: string
  content: string
  published: boolean
}

import { ultimateYoutubeAutomationGuide } from './ultimate-youtube-automation-guide'
import { ultimateGuideYoutubeSeoSeriesPlaylists } from './ultimate-guide-youtube-seo-series-playlists'
import { reviveOldVideosPlaylists } from './revive-old-videos-playlists'
import { batchRecordingUploadingWorkflow } from './batch-recording-uploading-workflow'
import { stopBabysittingUploads } from './stop-babysitting-uploads'
import { channelStructureViewerRetention } from './channel-structure-viewer-retention'
import { youtubeAnalyticsPlaylists } from './youtube-analytics-playlists'
import { productivityToolsCreators } from './productivity-tools-creators'
import { aiChangingGameCreators } from './ai-changing-game-creators'
import { generatingSeoDescriptions } from './generating-seo-descriptions'
import { playlistsSkyrocketWatchTime } from './playlists-skyrocket-watch-time'
import { bingeWorthyContent2026 } from './binge-worthy-content-2026'
import { anatomyPerfectVideoDescription } from './anatomy-perfect-video-description'
import { algorithmPlaylistsRecommendations } from './algorithm-playlists-recommendations'
import { fiveYoutubeStudioFeatures } from './5-youtube-studio-features'
import { planVideoSeriesHooked } from './plan-video-series-hooked'
import { hiddenTimeSinkUploading } from './hidden-time-sink-uploading'
import { overcomeCreatorBurnout } from './overcome-creator-burnout'
import { editingBayToPublished } from './editing-bay-to-published'
import { batchCreateContent } from './batch-create-content'
import { managingMultipleChannels } from './managing-multiple-channels'
import { delegateUploadsVirtualAssistant } from './delegate-uploads-virtual-assistant'
import { hiddenCostsInefficientManagement } from './hidden-costs-inefficient-management'
import { writingDescriptionsAi } from './writing-descriptions-ai'
import { aiOptimizeVideoSeo } from './ai-optimize-video-seo'
import { aiGeneratedPlaylistsSmartMetadata } from './ai-generated-playlists-smart-metadata'
import { overcomingMetadataParalysis } from './overcoming-metadata-paralysis'
import { balancingAuthenticityAi } from './balancing-authenticity-ai'
import { trainAiBrandVoice } from './train-ai-brand-voice'
import { aiToolsSaveHours } from './ai-tools-save-hours'
import { ethicsAiContentCreation } from './ethics-ai-content-creation'
import { caseStudyAiMetadataDoubledSearchTraffic } from './case-study-ai-metadata-doubled-search-traffic'
import { educatorsCourseModulesYouTube } from './educators-course-modules-youtube'
import { gamersLetsPlaySeries } from './gamers-lets-play-series'
import { podcastersVideoPodcastBackCatalog } from './podcasters-video-podcast-back-catalog'
import { musiciansAlbumVisualizerPlaylist } from './musicians-album-visualizer-playlist'
import { eventOrganizersConferenceVods } from './event-organizers-conference-vods'
import { agenciesClientVideoUploads } from './agencies-client-video-uploads'
import { fitnessCoachesWorkoutPrograms } from './fitness-coaches-workout-programs'
import { saasCompaniesProductTutorials } from './saas-companies-product-tutorials'
import { realEstateNeighborhoodTourPlaylists } from './real-estate-neighborhood-tour-playlists'
import { nonProfitsArchivingEventFootage } from './non-profits-archiving-event-footage'
import { bulkUploadVideosYoutube } from './bulk-upload-videos-youtube'
import { introducingYoutubePlaylistUploader } from './introducing-youtube-playlist-uploader'
import { securityFirstDataProtection } from './security-first-data-protection'
import { originStoryBuiltBetterWay } from './origin-story-built-better-way'
import { vsNativeYouTubeStudioUploader } from './vs-native-youtube-studio-uploader'
import { featureSpotlightAutoQueuing } from './feature-spotlight-auto-queuing'
import { migrateTwitchVodsYoutube } from './migrate-twitch-vods-youtube'
import { customerSpotlightSaved20Hours } from './customer-spotlight-saved-20-hours'
import { whatsNextProductRoadmap } from './whats-next-product-roadmap'

export const blogPosts: BlogPost[] = [
  ultimateGuideYoutubeSeoSeriesPlaylists,
  ultimateYoutubeAutomationGuide,
  reviveOldVideosPlaylists,
  batchRecordingUploadingWorkflow,
  stopBabysittingUploads,
  channelStructureViewerRetention,
  youtubeAnalyticsPlaylists,
  productivityToolsCreators,
  aiChangingGameCreators,
  generatingSeoDescriptions,
  playlistsSkyrocketWatchTime,
  bingeWorthyContent2026,
  anatomyPerfectVideoDescription,
  algorithmPlaylistsRecommendations,
  fiveYoutubeStudioFeatures,
  planVideoSeriesHooked,
  hiddenTimeSinkUploading,
  overcomeCreatorBurnout,
  editingBayToPublished,
  batchCreateContent,
  managingMultipleChannels,
  delegateUploadsVirtualAssistant,
  hiddenCostsInefficientManagement,
  writingDescriptionsAi,
  aiOptimizeVideoSeo,
  aiGeneratedPlaylistsSmartMetadata,
  overcomingMetadataParalysis,
  balancingAuthenticityAi,
  trainAiBrandVoice,
  aiToolsSaveHours,
  ethicsAiContentCreation,
  caseStudyAiMetadataDoubledSearchTraffic,
  educatorsCourseModulesYouTube,
  gamersLetsPlaySeries,
  podcastersVideoPodcastBackCatalog,
  musiciansAlbumVisualizerPlaylist,
  eventOrganizersConferenceVods,
  agenciesClientVideoUploads,
  fitnessCoachesWorkoutPrograms,
  saasCompaniesProductTutorials,
  realEstateNeighborhoodTourPlaylists,
  nonProfitsArchivingEventFootage,
  bulkUploadVideosYoutube,
  introducingYoutubePlaylistUploader,
  securityFirstDataProtection,
  originStoryBuiltBetterWay,
  vsNativeYouTubeStudioUploader,
  featureSpotlightAutoQueuing,
  migrateTwitchVodsYoutube,
  customerSpotlightSaved20Hours,
  whatsNextProductRoadmap,
].filter((post) => post.published)

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category)
}
