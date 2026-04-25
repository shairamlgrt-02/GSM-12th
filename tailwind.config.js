/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'gsm-emerald': '#1B4332',
        'gsm-gold': '#C5A021',
      },
    },
  },
  plugins: [],
};
