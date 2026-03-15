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
        // YouTube colors - refined palette
        'yt-red': '#FF0000',
        'yt-red-subtle': '#FF3333', // Softer red
        'yt-blue': '#3EA6FF',
        'yt-blue-subtle': '#66B8FF', // Softer blue
        'yt-bg': '#FFFFFF',
        'yt-panel': '#FAFAFA',
        'yt-border': '#E5E5E5',
        'yt-text-primary': '#0F0F0F',
        'yt-text-secondary': '#606060',
        'yt-text-tertiary': '#909090',
        'yt-hover': '#F5F5F5',
        'yt-input': '#FFFFFF',
        'youtube-neon': '#3EA6FF',

        // Elegant accents
        'accent-primary': '#0F0F0F', // Dark for primary elements
        'accent-secondary': '#3EA6FF', // YouTube blue
        'accent-highlight': '#FF0000', // YouTube red for highlights
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'], // Same as sans for elegance
      },
      animation: {
        'upload': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 }
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}