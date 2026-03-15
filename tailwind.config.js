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
        // Refined Luxury Palette - 5 colors total
        'charcoal': '#1A1A1A', // Primary text, buttons
        'slate': '#4A5568', // Secondary text, borders
        'pearl': '#F8FAFC', // Background, panels
        'yt-red': '#FF0000', // Single accent color (YouTube red)
        'white': '#FFFFFF', // Pure white for contrast

        // Legacy aliases for backward compatibility during transition
        'yt-bg': '#F8FAFC', // Alias for pearl
        'yt-panel': '#FFFFFF', // Alias for white
        'yt-border': '#E5E5E5', // Light border (between slate and pearl)
        'yt-text-primary': '#1A1A1A', // Alias for charcoal
        'yt-text-secondary': '#4A5568', // Alias for slate
        'yt-text-tertiary': '#718096', // Lighter slate variant
        'yt-hover': '#EDF2F7', // Light hover state
        'yt-input': '#FFFFFF', // Alias for white
        'youtube-neon': '#FF0000', // Alias for yt-red
        'accent-primary': '#1A1A1A', // Alias for charcoal
        'accent-secondary': '#FF0000', // Alias for yt-red
        // Deprecated YouTube blue colors (kept for compatibility)
        'yt-blue': '#3EA6FF',
        'yt-blue-subtle': '#66B8FF',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
      },
      animation: {
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