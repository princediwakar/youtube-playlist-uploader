/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['googleapis', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg'],
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig