/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          950: '#1B0E2C',
          900: '#2E1A47',
          800: '#3D225E',
          700: '#4A2E6D',
          600: '#5E3B8B',
          500: '#754B9E',
          400: '#9466BF',
          300: '#B692DC',
          200: '#DAC2F2',
          100: '#F0E5FC',
          50: '#FAF7FD',
        },
        gold: {
          900: '#684F0E',
          800: '#8E6D15',
          700: '#B38F24',
          600: '#C79F2E',
          500: '#D4AF37',
          400: '#E2C35D',
          300: '#ECD587',
          200: '#F5E7B7',
          100: '#FAF3DC',
          50: '#FDFBF4',
        },
        lavender: {
          50: '#FCFAFD',
          100: '#F7F4FA',
          200: '#EFE9F5',
          300: '#E2D6ED',
          400: '#CDBBE0',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Outfit"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.35)',
        'purple-glow': '0 0 25px rgba(74, 46, 109, 0.35)',
      },
    },
  },
  plugins: [],
}
