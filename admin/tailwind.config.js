/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0F14',
          900: '#121922',
          850: '#161E27',
          800: '#1A222C',
          750: '#1E2732',
          700: '#222C38',
          600: '#2B3645',
        },
        brand: {
          DEFAULT: '#34D399',
          400: '#34D399',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
