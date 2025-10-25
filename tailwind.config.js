/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'e5-red': 'var(--color-e5-red)',
        'e5-black': 'var(--color-e5-black)',
        'e5-dark-gray': 'var(--color-e5-dark-gray)',
        'e5-separator': 'var(--color-e5-separator)',
      },
      fontFamily: {
        'franklin-heavy': ['Franklin Gothic Heavy', 'sans-serif'],
        'franklin-demi': ['Franklin Gothic Demi', 'sans-serif'],
        'franklin-medium': ['Franklin Gothic Medium', 'sans-serif'],
        'franklin-book': ['Franklin Gothic Book', 'sans-serif'],
        'excon': ['Excon Variable', 'sans-serif'],
      },
      fontSize: {
        '14': ['14px', { letterSpacing: '4.9px' }],
        '16': ['16px', { letterSpacing: '6.4px', lineHeight: '54px' }],
        '18': ['18px', { letterSpacing: '1.8px', lineHeight: '20px' }],
        '24': ['24px', { letterSpacing: '4.8px', lineHeight: '30px' }],
        '26': ['26px', { lineHeight: '30px' }],
        '48': ['48px', { letterSpacing: '9.6px', lineHeight: '20px' }],
        '65': ['65px', { lineHeight: '60px' }],
      },
      spacing: {
        '107': '107px',
        '783': '783px',
      },
      maxWidth: {
        'container': '1536px',
      },
    },
  },
  plugins: [],
}
