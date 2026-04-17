/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        secondary: {
          DEFAULT: "#52B788",
          600: "#40916C",
        },
        accent: {
          DEFAULT: "#F4A261",
          600: "#E76F51",
        },
        neutral: "#F1FAEE",
        'risk-critical': "#E63946",
        'risk-high': "#E76F51",
        'risk-medium': "#F4A261",
        'risk-low': "#40916C",
      },
      fontFamily: {
        mukta: ['Mukta', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'glow-red': '0 0 20px rgba(230, 57, 70, 0.4)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #081C15 0%, #1B4332 40%, #2D6A4F 70%, #40916C 100%)',
      }
    },
  },
  plugins: [],
}
