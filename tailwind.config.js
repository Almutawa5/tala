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
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        gold: {
          50: '#fbf8eb',
          100: '#f5eccd',
          200: '#ebd89f',
          300: '#dfbf6d',
          400: '#d4a746',
          500: '#c68e2d',
          600: '#aa6f22',
          700: '#88521e',
          800: '#70411e',
          900: '#5e361b',
        }
      }
    },
  },
  plugins: [],
}
