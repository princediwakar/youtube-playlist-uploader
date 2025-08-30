# YouTube Playlist Uploader

A modern web application that allows users to batch upload multiple videos to their YouTube channels with intelligent playlist organization, AI-powered descriptions, and smart content detection.

## ✨ Features

- 🔐 **Google OAuth Authentication** - Users sign in with their own Google/YouTube accounts
- 📁 **Drag & Drop Upload** - Easy file selection with support for multiple video formats
- 🎯 **Smart Batch Upload** - Upload multiple videos efficiently with session limits
- 📋 **Intelligent Playlists** - Automatic playlist creation with smart organization
- 🧠 **AI-Powered Content Analysis** - Automatic titles, descriptions, and tags generation
- 🏷️ **Category Suggestions** - AI-based YouTube category recommendations
- 📊 **Real-time Progress** - Live upload progress tracking with detailed status updates
- 🎬 **YouTube Shorts Detection** - Automatic detection and optimized handling of short-form content
- 🔄 **Duplicate Detection** - Smart duplicate video detection when adding to existing playlists
- 🔗 **Navigation Links** - Automatic playlist navigation links between videos
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🔒 **Privacy Controls** - Full control over video privacy settings (Private/Unlisted/Public)

## 🚀 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Backend**: Next.js API routes
- **AI Integration**: DeepSeek API for content analysis
- **YouTube Integration**: Google APIs (YouTube Data API v3)
- **Deployment**: Vercel

## 🛠️ Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/youtube-playlist-uploader.git
cd youtube-playlist-uploader
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Go to **APIs & Services > Credentials**
5. Create **OAuth 2.0 Client ID** credentials
6. Add your domain to authorized origins:
   - For development: `http://localhost:3000`
   - For production: `https://your-app.vercel.app`
7. Add redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-app.vercel.app/api/auth/callback/google`

### 4. DeepSeek API Setup (Optional)

For AI-powered content analysis:

1. Sign up at [DeepSeek](https://platform.deepseek.com/)
2. Get your API key from the dashboard
3. Add it to your environment variables

### 5. Environment Variables

Create a `.env.local` file:

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-string

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# DeepSeek API (Optional - for AI features)
DEEPSEEK_API_KEY=your-deepseek-api-key
```

For production (Vercel), set these environment variables in your Vercel dashboard.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment to Vercel

### 1. Connect to Vercel

```bash
npm install -g vercel
vercel
```

### 2. Set Environment Variables

In your Vercel dashboard, add the following environment variables:

- `NEXTAUTH_URL`: `https://your-app.vercel.app`
- `NEXTAUTH_SECRET`: A random secret string
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `DEEPSEEK_API_KEY`: Your DeepSeek API key (optional)

### 3. Update Google Cloud Console

Add your Vercel domain to:
- Authorized JavaScript origins: `https://your-app.vercel.app`
- Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

### 4. Deploy

```bash
vercel --prod
```

## 📖 How to Use

### Basic Upload Flow

1. **Sign In**: Click "Sign In with Google" and authorize YouTube access
2. **Select Videos**: 
   - Drag and drop video files or folders
   - Click to select from your file system
   - Support for batch folder uploads with preserved structure
3. **Choose Upload Mode**:
   - **Playlist Mode**: Organize videos into playlists (great for courses/series)
   - **Individual Mode**: Upload as standalone videos (perfect for Shorts)
4. **Configure Settings**:
   - Set playlist name (for playlist mode)
   - Choose privacy level (Private/Unlisted/Public)
   - Select content type for smart descriptions
   - Set upload limit for quota management
   - Enable AI-powered descriptions and tags
5. **Advanced Options**:
   - Custom title formatting
   - Category suggestions
   - Playlist navigation links
   - Made for Kids setting
6. **Upload**: Click "Start Upload" and monitor real-time progress
7. **Access Videos**: Click the play icon next to completed uploads to view on YouTube

### Smart Features

- **YouTube Shorts Detection**: Automatically detects vertical videos ≤60 seconds
- **Duplicate Prevention**: Checks existing playlist videos to avoid duplicates
- **AI Content Analysis**: Generates optimized titles, descriptions, and tags
- **Category Intelligence**: Suggests appropriate YouTube categories based on content
- **Playlist Navigation**: Adds "Previous/Next" links between playlist videos

## 🔧 Configuration

### Content Types

The app supports different content types for optimized descriptions:

- **Auto-Detect**: Automatically determines the best content type
- **Educational Course**: Learning-focused descriptions with educational tags
- **Business Content**: Professional content for career growth
- **Technical/Programming**: Developer-focused content with tech tags
- **Creative/Design**: Artistic content with creative tags
- **Health/Fitness**: Wellness-focused descriptions

### Upload Limits

- **Default**: 10 videos per session
- **Maximum**: 50 videos per session
- Helps manage YouTube API quota limits
- Users can run multiple sessions

### AI Features

When enabled, the AI system provides:
- **Smart Titles**: Cleaned and optimized video titles
- **Rich Descriptions**: Context-aware descriptions with proper formatting
- **Relevant Tags**: SEO-optimized tags based on content analysis
- **Category Suggestions**: Intelligent YouTube category recommendations
- **Playlist Descriptions**: Comprehensive playlist overviews

## 🔒 Security & Privacy

- ✅ Users authenticate with their own Google accounts
- ✅ Videos upload directly to user's YouTube channel
- ✅ No video content stored on our servers
- ✅ Secure OAuth token handling with NextAuth.js
- ✅ Environment variable protection for API keys
- ✅ Client-side video analysis for thumbnails and metadata

## 🚨 YouTube API Quota Management

YouTube API has daily quota limits:
- **Default quota**: 10,000 units per day
- **Video upload**: ~1,600 units per video
- **Playlist operations**: ~50-100 units
- **Estimated capacity**: ~6 video uploads per day per user

The app helps manage quotas through:
- Session upload limits
- Clear quota messaging
- Efficient API usage patterns
- Caching for playlist data

## 🛠️ Development

### Project Structure

```
youtube-playlist-uploader/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth configuration
│   │   └── youtube/        # YouTube API integration
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx           # Main upload interface
│   └── providers.tsx       # Session provider
├── lib/                    # Utility libraries
│   ├── auth.ts            # Authentication configuration
│   └── deepseek.ts        # AI integration
├── public/                 # Static assets
├── types/                  # TypeScript type definitions
└── ...
```

### Key API Routes

- `POST /api/youtube/upload` - Upload video to YouTube
- `POST /api/youtube/playlist` - Create YouTube playlist
- `GET /api/youtube/playlist` - Get user's playlists
- `GET /api/youtube/playlist-videos` - Get playlist videos
- `POST /api/youtube/analyze-video` - AI video analysis
- `POST /api/youtube/analyze-playlist` - AI playlist analysis
- `POST /api/youtube/suggest-category` - AI category suggestion
- `POST /api/youtube/add-navigation` - Add playlist navigation
- `/api/auth/[...nextauth]` - NextAuth.js authentication

## 🎯 Use Cases

- **Educational Content Creators**: Batch upload course videos with automatic playlist organization
- **Business Professionals**: Upload training materials and presentations
- **Content Creators**: Efficiently manage large video libraries
- **YouTubers**: Streamline content publishing workflow
- **Educators**: Organize lessons and educational resources
- **Marketers**: Manage video marketing campaigns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify Google Cloud OAuth setup and domain configuration
2. **Upload Failures**: Check YouTube API quotas and video file formats
3. **AI Features Not Working**: Ensure DeepSeek API key is properly configured
4. **Build Issues**: Run `npm run build` to check for TypeScript errors

### Getting Help

- Check the [Issues](https://github.com/yourusername/youtube-playlist-uploader/issues) page
- Ensure all environment variables are properly set
- Verify Google Cloud API settings and quotas
- Check browser console for detailed error messages

## 🙏 Acknowledgments

- [YouTube Data API v3](https://developers.google.com/youtube/v3) for video management
- [Next.js](https://nextjs.org/) for the incredible framework
- [NextAuth.js](https://next-auth.js.org/) for seamless authentication
- [DeepSeek](https://platform.deepseek.com/) for AI-powered content analysis
- [Vercel](https://vercel.com/) for reliable hosting platform
- [Tailwind CSS](https://tailwindcss.com/) for beautiful, responsive design

---

Made with ❤️ for content creators who want to streamline their YouTube workflow.