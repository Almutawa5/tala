/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"IBM Plex Sans Arabic"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        heading: ['"Plus Jakarta Sans"', '"IBM Plex Sans Arabic"', 'sans-serif'],
      },
      colors: {
        gold: {
          50: '#FDF8EC',
          100: '#F9EED2',
          200: '#F3DBA4',
          300: '#ECC36E',
          400: '#E5A93B',
          500: '#C68A1E',
          600: '#A66F15',
          700: '#855513',
          800: '#6D4415',
          900: '#5A3816',
        }
      }
    },
  },
  plugins: [],
}
