/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'yt-red': '#FF0000',
        'yt-blue': '#3EA6FF',
        'yt-bg': '#FFFFFF',
        'yt-panel': '#F9F9F9',
        'yt-border': '#E0E0E0',
        'yt-text-primary': '#0F0F0F',
        'yt-text-secondary': '#606060',
        'yt-hover': '#F0F0F0',
        'yt-input': '#FFFFFF',
        'youtube-neon': '#3EA6FF',
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'upload': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 42, 42, 0.4)' },
          '100%': { boxShadow: '0 0 20px 5px rgba(255, 42, 42, 0)' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}