import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Vert Sénégal — couleur primaire (CTA, boutons, liens actifs) ──
        primary: {
          DEFAULT: '#009A44',
          light:   '#00C057',
          dark:    '#007A35',
          50:  '#E6F7EE',
          100: '#C3EDD5',
          200: '#8CDAAC',
          300: '#56C884',
          400: '#1FB55B',
          500: '#009A44',
          600: '#007A35',
          700: '#005C28',
          800: '#003D1C',
          900: '#001F0E',
        },
        // ── Rouge Sénégal — danger, soldes, alertes, panier badge ──
        secondary: {
          DEFAULT: '#E31B23',
          light:   '#F04E54',
          dark:    '#B81219',
          50:  '#FDEAEA',
          100: '#FABCBE',
          500: '#E31B23',
          600: '#B81219',
          700: '#8A0D13',
        },
        // ── Or Sénégal — accent, prix, promotions, highlights ──
        accent: {
          DEFAULT: '#FCD116',
          light:   '#FFE44D',
          dark:    '#CCB000',
          50:  '#FFFDE6',
          100: '#FFF9C0',
          200: '#FFF180',
          500: '#FCD116',
          600: '#CCB000',
          700: '#9A7A00',
        },
        // ── Teintes douces pour fonds carte ──
        cream: {
          DEFAULT: '#FFFDF0',
          dark:    '#FFF8CC',
        },
        // ── Texte principal sombre ──
        'ta-dark':   '#1A1A2E',
        'ta-dark-2': '#003D1C',
        // ── Fond application ──
        background: '#F8F9FA',
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        price:   ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card:  '8px',
        modal: '12px',
        pill:  '24px',
      },
      borderWidth: {
        '1.5': '1.5px',
      },
    },
  },
  plugins: [],
} satisfies Config
