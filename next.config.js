/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['googleapis', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg'],
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
}

module.exports = nextConfig